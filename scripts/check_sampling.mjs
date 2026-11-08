// Automated correctness checks for the shared sampling module (src/sampling.js).
// Run with:  npm run check
// These check the SOFTWARE only. They print PASS/FAIL for each check and do not
// report or interpret any sampling results.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseCsv } from "../src/parse.js";
import {
  makeRng, trueMean, sampleMean, srs, groupShares,
  systematic, stratifiedAllocation, stratifiedEstimate, stratified,
} from "../src/sampling.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const csvPath = root + "data/healthcare_costs.csv";
const NUMERIC = ["row_id", "age", "bmi", "children", "charges"];

let failures = 0;
function check(name, fn) {
  try {
    const ok = fn();
    if (ok === true) console.log(`PASS  ${name}`);
    else {
      failures++;
      console.log(`FAIL  ${name}${ok ? ` (${ok})` : ""}`);
    }
  } catch (e) {
    failures++;
    console.log(`FAIL  ${name} (error: ${e.message})`);
  }
}
const throws = (fn) => {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
};
const sameIds = (a, b) => a.length === b.length && a.every((r, i) => r.row_id === b[i].row_id);

const raw = readFileSync(csvPath);
const text = raw.toString("utf8");
const pop = parseCsv(text, NUMERIC);
const N = pop.length;

// --- Data loading ---------------------------------------------------------
check("data file unchanged (SHA-256 matches data/manifest.json)", () => {
  const manifest = readFileSync(root + "data/manifest.json", "utf8");
  const sha = createHash("sha256").update(raw).digest("hex");
  return manifest.includes(sha) || `sha ${sha} not found in manifest`;
});
check("every row loaded: 1,338 rows", () => N === 1338 || `got ${N}`);
check("row_id runs 1..1338 in file order, no duplicates", () =>
  pop.every((r, i) => r.row_id === i + 1)
);
check("target 'charges' parsed as a finite number in every row", () =>
  pop.every((r) => typeof r.charges === "number" && Number.isFinite(r.charges))
);
check("a non-numeric target value is rejected, not silently dropped", () =>
  throws(() => parseCsv("row_id,charges\n1,abc", ["row_id", "charges"]))
);

// --- True mean ------------------------------------------------------------
check("trueMean matches the student's own value 13,270.42 (rounded to cents)", () => {
  const m = trueMean(pop, "charges");
  return Math.round(m * 100) / 100 === 13270.42 || `got ${m}`;
});
check("trueMean is unchanged when the same rows are reordered", () => {
  const a = trueMean(pop, "charges");
  const b = trueMean([...pop].reverse(), "charges");
  return Math.abs(a - b) < 1e-9;
});

// --- Random numbers ---------------------------------------------------------
check("seeded generator: values in [0, 1), same seed gives the same sequence", () => {
  const a = makeRng(42), b = makeRng(42);
  for (let i = 0; i < 10000; i++) {
    const x = a();
    if (x < 0 || x >= 1 || x !== b()) return false;
  }
  return true;
});
check("invalid seeds are rejected (negative, fractional, too large)", () =>
  throws(() => makeRng(-1)) && throws(() => makeRng(1.5)) && throws(() => makeRng(2 ** 32))
);

// --- Simple random sampling -------------------------------------------------
check("temporary SRS (n = 100, seed 12345): 100 rows, all distinct", () => {
  const s = srs(pop, 100, makeRng(12345));
  return (s.length === 100 && new Set(s.map((r) => r.row_id)).size === 100) || `got ${s.length}`;
});
check("SRS rows all come from the population", () => {
  const ids = new Set(pop.map((r) => r.row_id));
  return srs(pop, 100, makeRng(12345)).every((r) => ids.has(r.row_id));
});
check("SRS gives exactly n distinct rows for n = 1, 10, 100 and N, over 50 seeds each", () => {
  for (const n of [1, 10, 100, N]) {
    for (let seed = 0; seed < 50; seed++) {
      const s = srs(pop, n, makeRng(seed));
      if (s.length !== n || new Set(s.map((r) => r.row_id)).size !== n) return `failed at n=${n}, seed=${seed}`;
    }
  }
  return true;
});
check("SRS rejects n outside 1..N or not whole (0, N + 1, 1.5)", () =>
  throws(() => srs(pop, 0, makeRng(1))) &&
  throws(() => srs(pop, N + 1, makeRng(1))) &&
  throws(() => srs(pop, 1.5, makeRng(1)))
);
check("same seed gives the same rows and the same sample mean (seed 12345)", () => {
  const a = srs(pop, 100, makeRng(12345));
  const b = srs(pop, 100, makeRng(12345));
  return sameIds(a, b) && sampleMean(a, "charges") === sampleMean(b, "charges");
});
check("same seed gives the same rows for 100 other seeds", () => {
  for (let seed = 1; seed <= 100; seed++) {
    if (!sameIds(srs(pop, 100, makeRng(seed)), srs(pop, 100, makeRng(seed)))) return `seed ${seed}`;
  }
  return true;
});
check("SRS does not change the population (no rows moved or altered)", () => {
  const before = JSON.stringify(pop);
  srs(pop, 100, makeRng(7));
  return JSON.stringify(pop) === before;
});

// --- Known-answer case on a tiny synthetic population -----------------------
const tiny = [1, 2, 3, 4, 5].map((v, i) => ({ row_id: i + 1, y: v }));
check("known answer: true mean of 1, 2, 3, 4, 5 is 3", () => trueMean(tiny, "y") === 3);
check("known answer: SRS with n = N returns every row once", () =>
  sameIds(srs(tiny, 5, makeRng(9)), tiny)
);
check("known answer: n = 2 from N = 5, each row included with probability 2/5 (40,000 draws, within ±0.01)", () => {
  const hits = [0, 0, 0, 0, 0];
  const rng = makeRng(2026);
  const reps = 40000;
  for (let i = 0; i < reps; i++) for (const r of srs(tiny, 2, rng)) hits[r.row_id - 1]++;
  const worst = Math.max(...hits.map((h) => Math.abs(h / reps - 0.4)));
  return worst < 0.01 || `worst deviation ${worst.toFixed(4)}`;
});

// --- Group shares -----------------------------------------------------------
const expected = {
  smoker: { no: 1064, yes: 274 },
  region: { northeast: 324, northwest: 325, southeast: 364, southwest: 325 },
  age_band: { "18-29": 417, "30-39": 257, "40-49": 279, "50-64": 385 },
  sex: { female: 662, male: 676 },
};
const s100 = srs(pop, 100, makeRng(12345));
for (const [col, groups] of Object.entries(expected)) {
  check(`groupShares(${col}): population counts match data/README.md; sample counts sum to 100; shares sum to 1`, () => {
    const sh = groupShares(pop, s100, col, Object.keys(groups));
    const popOk = sh.every((s) => s.popCount === groups[s.group]);
    const sampleSum = sh.reduce((t, s) => t + s.sampleCount, 0);
    const popShareSum = sh.reduce((t, s) => t + s.popShare, 0);
    const sampleShareSum = sh.reduce((t, s) => t + s.sampleShare, 0);
    return (
      (popOk && sampleSum === 100 && Math.abs(popShareSum - 1) < 1e-12 && Math.abs(sampleShareSum - 1) < 1e-12) ||
      "mismatch"
    );
  });
}

// --- Systematic sampling (stage 3) ------------------------------------------
check("systematic: exactly n distinct rows, none above N, for EVERY n from 1 to 1,338 (5 seeds each)", () => {
  for (let n = 1; n <= N; n++) {
    for (let seed = 0; seed < 5; seed++) {
      const s = systematic(pop, n, makeRng(seed));
      if (s.rows.length !== n) return `n=${n}: got ${s.rows.length} rows`;
      if (new Set(s.positions).size !== n) return `n=${n}, seed=${seed}: duplicate rows`;
      if (s.positions.some((p) => p < 1 || p > N)) return `n=${n}: row index out of range`;
      if (s.rows.some((r, i) => r.row_id !== s.positions[i])) return `n=${n}: rows do not match positions`;
    }
  }
  return true;
});
check("systematic: whole-number design used exactly when n divides 1,338; rows r, r+k, r+2k, ...", () => {
  for (let n = 1; n <= N; n++) {
    const s = systematic(pop, n, makeRng(n));
    const divides = N % n === 0;
    if ((s.design === "whole-number interval") !== divides) return `n=${n}: wrong design`;
    if (divides) {
      if (s.start < 1 || s.start > s.k) return `n=${n}: start outside 1..k`;
      if (s.positions.some((p, j) => p !== s.start + j * s.k)) return `n=${n}: not following interval`;
    }
  }
  const d = [10, 100].map((n) => systematic(pop, n, makeRng(1)).design);
  return d.every((x) => x === "fractional interval") || `n=10/100 gave ${d}`;
});
check("systematic fractional: rows are ceil(u + j*k) with u in (0, k] (n = 10, 100, 1000; 20 seeds)", () => {
  for (const n of [10, 100, 1000]) {
    for (let seed = 0; seed < 20; seed++) {
      const s = systematic(pop, n, makeRng(seed));
      if (!(s.start > 0 && s.start <= s.k)) return `start ${s.start} outside (0, k]`;
      for (let j = 0; j < n; j++) {
        const expected = Math.min(N, Math.ceil(s.start + j * s.k - 1e-9));
        if (s.positions[j] !== expected) return `n=${n}, seed=${seed}, j=${j}`;
      }
    }
  }
  return true;
});
check("systematic whole-number interval: listing all k starts includes every row exactly once (probability n/N)", () => {
  for (const n of [1, 2, 3, 6, 223, 446, 669, 1338]) {
    const k = N / n;
    const hits = new Array(N).fill(0);
    for (let r = 1; r <= k; r++) for (let j = 0; j < n; j++) hits[r + j * k - 1]++;
    if (hits.some((h) => h !== 1)) return `n=${n}`;
  }
  return true;
});
check("systematic fractional: each row picked with probability n/N (N = 7, n = 3; 70,000 draws, within ±0.01)", () => {
  const p7 = Array.from({ length: 7 }, (_, i) => ({ row_id: i + 1, y: i }));
  const hits = new Array(7).fill(0);
  const rng = makeRng(99);
  const reps = 70000;
  for (let i = 0; i < reps; i++) for (const p of systematic(p7, 3, rng).positions) hits[p - 1]++;
  const worst = Math.max(...hits.map((h) => Math.abs(h / reps - 3 / 7)));
  return worst < 0.01 || `worst deviation ${worst.toFixed(4)}`;
});
check("systematic: same seed and n give the same rows", () =>
  [1, 10, 100, 223].every((n) => sameIds(systematic(pop, n, makeRng(12345)).rows, systematic(pop, n, makeRng(12345)).rows))
);

// --- Stratified sampling (stage 3) ------------------------------------------
const AGE = ["18-29", "30-39", "40-49", "50-64"];
const AGE_SIZES = [417, 257, 279, 385];
check("allocation (age_band): whole numbers, total n, each >= 1 and <= group size, for EVERY n from 4 to 1,338", () => {
  for (let n = 4; n <= N; n++) {
    const a = stratifiedAllocation(pop, "age_band", n, AGE);
    const total = a.reduce((t, s) => t + s.nh, 0);
    if (total !== n) return `n=${n}: total ${total}`;
    if (a.some((s, h) => !Number.isInteger(s.nh) || s.nh < 1 || s.nh > AGE_SIZES[h])) return `n=${n}: bad n_h`;
  }
  return true;
});
check("allocation: group sizes match data/README.md and weights sum to 1", () => {
  const a = stratifiedAllocation(pop, "age_band", 100, AGE);
  const sum = a.reduce((t, s) => t + s.weight, 0);
  return (a.every((s, h) => s.Nh === AGE_SIZES[h]) && Math.abs(sum - 1) < 1e-12) || "mismatch";
});
check("allocation: proportional with largest-remainder rounding (n = 100 gives 31, 19, 21, 29)", () => {
  const got = stratifiedAllocation(pop, "age_band", 100, AGE).map((s) => s.nh).join(",");
  return got === "31,19,21,29" || `got ${got}`;
});
check("allocation: n smaller than the number of groups (1, 2, 3) is refused with a message", () =>
  [1, 2, 3].every((n) => throws(() => stratifiedAllocation(pop, "age_band", n, AGE)))
);
check("stratified: n distinct rows, n_h of them from each group (n = 4, 10, 100, 1338; 20 seeds)", () => {
  for (const n of [4, 10, 100, N]) {
    for (let seed = 0; seed < 20; seed++) {
      const s = stratified(pop, "age_band", n, makeRng(seed), "charges", AGE);
      if (s.rows.length !== n || new Set(s.rows.map((r) => r.row_id)).size !== n) return `n=${n}`;
      for (const st of s.strata) {
        if (st.rows.length !== st.nh || st.rows.some((r) => r.age_band !== st.group)) return `n=${n}, group ${st.group}`;
      }
    }
  }
  return true;
});
check("stratified: estimate equals sum of (N_h / N) x group sample mean", () => {
  const s = stratified(pop, "age_band", 100, makeRng(3), "charges", AGE);
  const manual = s.strata.reduce((t, st) => t + (st.Nh / N) * (st.rows.reduce((a, r) => a + r.charges, 0) / st.rows.length), 0);
  return Math.abs(s.estimate - manual) < 1e-9 && Math.abs(stratifiedEstimate(s.strata) - manual) < 1e-9;
});
check("stratified known answer: weighted mean differs from the plain sample mean when allocation is not proportional", () => {
  // Groups A (8 rows, value 10) and B (2 rows, value 50): true mean = (8*10 + 2*50)/10 = 18.
  const t = [...Array(8)].map((_, i) => ({ row_id: i + 1, g: "A", y: 10 }))
    .concat([...Array(2)].map((_, i) => ({ row_id: i + 9, g: "B", y: 50 })));
  // n = 2 -> allocation 1 and 1 (at-least-1 rule), so the plain mean is 30 but the weighted estimate is 18.
  const s = stratified(t, "g", 2, makeRng(1), "y", ["A", "B"]);
  const plain = sampleMean(s.rows, "y");
  return (trueMean(t, "y") === 18 && Math.abs(s.estimate - 18) < 1e-12 && plain === 30) || `estimate ${s.estimate}, plain ${plain}`;
});
check("stratified: same seed and n give the same rows and estimate", () => {
  const a = stratified(pop, "age_band", 100, makeRng(12345), "charges", AGE);
  const b = stratified(pop, "age_band", 100, makeRng(12345), "charges", AGE);
  return sameIds(a.rows, b.rows) && a.estimate === b.estimate;
});
check("all three methods: same seed and n reproduce identical samples for 50 seeds (n = 100)", () => {
  for (let seed = 0; seed < 50; seed++) {
    const r = makeRng;
    if (!sameIds(srs(pop, 100, r(seed)), srs(pop, 100, r(seed)))) return `srs ${seed}`;
    if (!sameIds(systematic(pop, 100, r(seed)).rows, systematic(pop, 100, r(seed)).rows)) return `sys ${seed}`;
    if (!sameIds(stratified(pop, "age_band", 100, r(seed), "charges", AGE).rows,
      stratified(pop, "age_band", 100, r(seed), "charges", AGE).rows)) return `str ${seed}`;
  }
  return true;
});

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
