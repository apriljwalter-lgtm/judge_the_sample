// Automated correctness checks for the shared sampling module (src/sampling.js).
// Run with:  npm run check
// These check the SOFTWARE only. They print PASS/FAIL for each check and do not
// report or interpret any sampling results.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseCsv } from "../src/parse.js";
import { makeRng, trueMean, sampleMean, srs, groupShares } from "../src/sampling.js";

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

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
