// The ONE shared module for every sampling calculation in the app.
// Every display imports from here, so a chart can never silently change an estimator.
//
// Contents: seedable random numbers, true mean, sample mean, the three samplers
// (simple random, systematic, stratified) with their estimators, and group shares.
// Stage 4 adds repeated-sampling summaries.

/** Seedable pseudo-random number generator (mulberry32). Returns a function giving numbers in [0, 1). */
export function makeRng(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
    throw new Error("Seed must be a whole number from 0 to 4294967295");
  }
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mean of `target` over a list of rows. */
function mean(rows, target) {
  if (rows.length === 0) throw new Error("Cannot take the mean of zero rows");
  let sum = 0;
  for (const r of rows) sum += r[target];
  return sum / rows.length;
}

/** True population mean: mean of the target over ALL N rows of the population. */
export function trueMean(population, target) {
  return mean(population, target);
}

/** Sample mean: the estimate from one sample (plain mean of the sampled rows). */
export function sampleMean(sampleRows, target) {
  return mean(sampleRows, target);
}

/**
 * Simple random sample WITHOUT replacement: n distinct rows, every set of n rows equally likely.
 * Uses a partial Fisher–Yates shuffle driven by the seeded `rng`.
 * Returns the selected rows in the population's row order.
 */
export function srs(population, n, rng) {
  const N = population.length;
  checkN(n, N);
  const idx = Array.from({ length: N }, (_, i) => i);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (N - i));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx
    .slice(0, n)
    .sort((a, b) => a - b)
    .map((i) => population[i]);
}

/** Throws unless n is a whole number from 1 to N. */
function checkN(n, N) {
  if (!Number.isInteger(n) || n < 1 || n > N) {
    throw new Error(`Sample size n must be a whole number from 1 to ${N}`);
  }
}

/**
 * Systematic sampling with a random start, in the population's row order.
 * - If N/n is a whole number k: start r uniform on 1..k, rows r, r+k, r+2k, ... (n rows).
 * - Otherwise (fractional interval): k = N/n, start u uniform on (0, k], rows ceil(u + j*k), j = 0..n-1.
 * Both designs give exactly n distinct rows and inclusion probability n/N for every row.
 * Returns { rows, positions (1-based row numbers), design, k, start }.
 */
export function systematic(population, n, rng) {
  const N = population.length;
  checkN(n, N);
  if (N % n === 0) {
    const k = N / n;
    const r = 1 + Math.floor(rng() * k); // 1..k, each equally likely
    const positions = Array.from({ length: n }, (_, j) => r + j * k);
    return { rows: positions.map((p) => population[p - 1]), positions, design: "whole-number interval", k, start: r };
  }
  const k = N / n;
  const v = 1 - rng(); // uniform on (0, 1]
  const u = v * k; // uniform on (0, k]
  const positions = Array.from({ length: n }, (_, j) => {
    // u + j*k = N*(v + j)/n. Subtracting a tiny tolerance stops floating-point rounding from
    // pushing an exact whole number up by one; the clamp guarantees no index exceeds N.
    const x = (N * (v + j)) / n;
    return Math.min(N, Math.max(1, Math.ceil(x - 1e-9)));
  });
  return { rows: positions.map((p) => population[p - 1]), positions, design: "fractional interval", k, start: u };
}

/**
 * Proportional allocation with largest-remainder rounding: at least 1 per stratum,
 * never more than the stratum size, whole numbers that total exactly n.
 * Throws if n is smaller than the number of strata (the rule cannot be met).
 * Returns [{ group, Nh, weight (= Nh/N), quota (= n*Nh/N), nh }].
 */
export function stratifiedAllocation(population, column, n, levels) {
  const N = population.length;
  checkN(n, N);
  const groups = levels ?? [...new Set(population.map((r) => r[column]))].sort();
  const sizes = groups.map((g) => population.filter((r) => r[column] === g).length);
  if (n < groups.length) {
    throw new Error(
      `Stratified sampling by ${column} needs n of at least ${groups.length} (one person per group)`
    );
  }
  const quotas = sizes.map((Nh) => (n * Nh) / N);
  const nh = quotas.map((q, h) => Math.min(sizes[h], Math.max(1, Math.floor(q))));
  let total = nh.reduce((a, b) => a + b, 0);
  // Too few: add one at a time to the stratum with the largest remaining shortfall (largest remainder).
  while (total < n) {
    let best = -1;
    for (let h = 0; h < groups.length; h++) {
      if (nh[h] < sizes[h] && (best < 0 || quotas[h] - nh[h] > quotas[best] - nh[best])) best = h;
    }
    nh[best]++;
    total++;
  }
  // Too many (only possible after the at-least-1 rule): remove from the most over-allocated stratum.
  while (total > n) {
    let best = -1;
    for (let h = 0; h < groups.length; h++) {
      if (nh[h] > 1 && (best < 0 || quotas[h] - nh[h] < quotas[best] - nh[best])) best = h;
    }
    nh[best]--;
    total--;
  }
  return groups.map((g, h) => ({ group: g, Nh: sizes[h], weight: sizes[h] / N, quota: quotas[h], nh: nh[h] }));
}

/** Population-weighted stratified estimate: sum over strata of (Nh/N) x (sample mean in stratum h). */
export function stratifiedEstimate(strata) {
  return strata.reduce((t, s) => t + s.weight * s.mean, 0);
}

/**
 * Stratified sampling: simple random sampling without replacement inside each stratum,
 * using the allocation above. Returns { rows (in row order), strata, estimate }.
 */
export function stratified(population, column, n, rng, target, levels) {
  const allocation = stratifiedAllocation(population, column, n, levels);
  const strata = allocation.map((a) => {
    const members = population.filter((r) => r[column] === a.group);
    const rows = srs(members, a.nh, rng);
    return { ...a, rows, mean: sampleMean(rows, target) };
  });
  const order = new Map(population.map((r, i) => [r, i]));
  const rows = strata.flatMap((s) => s.rows).sort((a, b) => order.get(a) - order.get(b));
  return { rows, strata, estimate: stratifiedEstimate(strata) };
}

/**
 * For one group column: how many rows (and what share) of the population and of the sample
 * fall in each group. `levels` fixes the group order; groups absent from the sample show 0.
 */
export function groupShares(population, sampleRows, column, levels) {
  const groups = levels ?? [...new Set(population.map((r) => r[column]))].sort();
  const count = (rows, g) => rows.filter((r) => r[column] === g).length;
  return groups.map((g) => {
    const popCount = count(population, g);
    const sampleCount = count(sampleRows, g);
    return {
      group: g,
      popCount,
      popShare: popCount / population.length,
      sampleCount,
      sampleShare: sampleRows.length ? sampleCount / sampleRows.length : 0,
    };
  });
}
