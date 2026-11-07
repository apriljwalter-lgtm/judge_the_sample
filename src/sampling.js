// The ONE shared module for every sampling calculation in the app.
// Every display imports from here, so a chart can never silently change an estimator.
//
// Stage 2 contents: seedable random numbers, true mean, sample mean, a simple random
// sampler (used only for the temporary test sample), and group shares.
// Stage 3 adds systematic and stratified sampling; stage 4 adds repeated-sampling summaries.

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
  if (!Number.isInteger(n) || n < 1 || n > N) {
    throw new Error(`Sample size n must be a whole number from 1 to ${N}`);
  }
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
