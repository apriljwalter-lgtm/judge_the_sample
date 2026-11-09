import { useMemo, useState } from "react";
import { population, TARGET, DATA_FILE } from "./data.js";
import {
  makeRng, trueMean, srs, systematic, stratified, sampleMean, groupShares,
  repeatedResult, summarizeEstimates, histogramBins,
} from "./sampling.js";
import { GROUP_COLUMNS } from "./groups.js";
import { dollars, count, fixed } from "./format.js";
import MethodPanel from "./MethodPanel.jsx";
import GroupControls from "./GroupControls.jsx";
import SharesTable from "./SharesTable.jsx";
import ExperimentPanel from "./ExperimentPanel.jsx";
import ExperimentSettings from "./ExperimentSettings.jsx";

const N = population.length;
const DEFAULT_N = 100;
const DEFAULT_SEED = 12345;
const MAX_SEED = 4294967295;
const EXPERIMENT_N = 100;
const SIZES_B = [1, 10, 100];

// The student's stratification column.
const STRATA_COLUMN = "age_band";
const STRATA_LEVELS = GROUP_COLUMNS.find((c) => c.key === STRATA_COLUMN).levels;

const levelsOf = (column) => GROUP_COLUMNS.find((c) => c.key === column).levels;

function useWholeNumberInput(initial, min, max) {
  const [value, setValue] = useState(initial);
  const [text, setText] = useState(String(initial));
  const valid = (t) => /^\d+$/.test(t) && Number(t) >= min && Number(t) <= max;
  const onChange = (t) => {
    setText(t);
    if (valid(t)) setValue(Number(t));
  };
  return { value, text, onChange, isValid: valid(text) };
}

export default function App() {
  const truth = useMemo(() => trueMean(population, TARGET), []);
  const nInput = useWholeNumberInput(DEFAULT_N, 1, N);
  const seedInput = useWholeNumberInput(DEFAULT_SEED, 0, MAX_SEED);
  const n = nInput.value;
  const seed = seedInput.value;
  const [groupColumn, setGroupColumn] = useState("smoker");
  const [tab, setTab] = useState("single");

  // Each method uses its own generator started from the same displayed seed.
  const srsResult = useMemo(() => {
    const rows = srs(population, n, makeRng(seed));
    return { rows, estimate: sampleMean(rows, TARGET) };
  }, [n, seed]);

  const sysResult = useMemo(() => {
    const r = systematic(population, n, makeRng(seed));
    return { ...r, estimate: sampleMean(r.rows, TARGET) };
  }, [n, seed]);

  const strResult = useMemo(
    () => (n < STRATA_LEVELS.length ? null : stratified(population, STRATA_COLUMN, n, makeRng(seed), TARGET, STRATA_LEVELS)),
    [n, seed]
  );

  const levels = levelsOf(groupColumn);
  const popShares = useMemo(() => groupShares(population, [], groupColumn, levels), [groupColumn, levels]);
  const sampleShares = useMemo(
    () => [
      { name: `Simple random (n = ${count(n)})`, shares: groupShares(population, srsResult.rows, groupColumn, levels) },
      { name: `Systematic (n = ${count(n)})`, shares: groupShares(population, sysResult.rows, groupColumn, levels) },
      {
        name: `Stratified (n = ${count(n)})`,
        shares: strResult ? groupShares(population, strResult.rows, groupColumn, levels) : null,
      },
    ],
    [n, srsResult, sysResult, strResult, groupColumn, levels]
  );

  // --- Stage 4: repeated-sampling experiments on the baseline population ---
  // Separate settings from the one-sample panels above. Results recalculate automatically
  // and replace the previous result whenever the seed or repetition count changes.
  const expSeedInput = useWholeNumberInput(DEFAULT_SEED, 0, MAX_SEED);
  const expSeed = expSeedInput.value;
  const [reps, setReps] = useState(100);

  const experiments = useMemo(() => {
    const base = { population, target: TARGET, reps, seed: expSeed };
    const run = (method, n) =>
      repeatedResult({ ...base, method, n, column: STRATA_COLUMN, levels: STRATA_LEVELS });
    const withSummary = (r) => ({ result: r, summary: summarizeEstimates(r.estimates, truth) });

    // Experiment A: three methods, same n = 100. Each method uses its own generator from the same seed.
    const srs100 = withSummary(run("srs", EXPERIMENT_N));
    const a = [
      { key: "srs", label: "Simple random", ...srs100 },
      { key: "sys", label: "Systematic", ...withSummary(run("systematic", EXPERIMENT_N)) },
      { key: "str", label: `Stratified by age group (${STRATA_COLUMN})`, ...withSummary(run("stratified", EXPERIMENT_N)) },
    ];
    a[0].note = "people picked completely at random";
    a[1].note = "every so many rows down the file (" + a[1].result.design + ")";
    a[2].note = "people picked at random within each age group; groups weighted by their size";

    // Experiment B: simple random at n = 1, 10, 100. n = 100 reuses Experiment A's result
    // (same population, method, seed and repetitions).
    const b = SIZES_B.map((size) =>
      size === EXPERIMENT_N
        ? { key: `srs-${size}`, label: `Simple random, ${size} ${size === 1 ? "person" : "people"}`, ...srs100, note: "same result as Experiment A" }
        : { key: `srs-${size}`, label: `Simple random, ${size} ${size === 1 ? "person" : "people"}`, ...withSummary(run("srs", size)) }
    );

    const binsFor = (list) => histogramBins(list.map((x) => x.result.estimates), 30, [truth]);
    return { a, b, binsA: binsFor(a), binsB: binsFor(b) };
  }, [reps, expSeed, truth]);

  const common = { population, target: TARGET, groupColumn, truth, n, seed };

  return (
    <main>
      <h1>Judge the Sample: healthcare costs</h1>

      <p>
        <strong>Population:</strong> all {count(N)} people (one beneficiary record per row) in{" "}
        <code>{DATA_FILE}</code>, a simulated teaching dataset. It is not all patients or all
        insurance claims. <strong>Target:</strong> <code>{TARGET}</code>, individual medical costs
        billed, in US dollars.
      </p>

      <div className="tabs" role="tablist" aria-label="Page sections">
        {[
          ["single", "Single samples"],
          ["experiments", "Repeated-sampling experiments"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "tab active" : "tab"}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "single" && (
      <>
      <section className="card">
      <h2 className="card-title">Settings</h2>
      <div className="card-body">
        <div className="controls">
          <div className="field">
            <label>
              Sample size n{" "}
              <input
                type="text"
                inputMode="numeric"
                value={nInput.text}
                onChange={(e) => nInput.onChange(e.target.value.trim())}
                aria-invalid={!nInput.isValid}
              />
            </label>{" "}
            {nInput.isValid ? (
              <span>The same n is used for all three methods.</span>
            ) : (
              <span className="error">
                Enter a whole number from 1 to {count(N)}. Still showing n = {count(n)}.
              </span>
            )}
          </div>
          <div className="field">
            <label>
              Seed{" "}
              <input
                type="text"
                inputMode="numeric"
                value={seedInput.text}
                onChange={(e) => seedInput.onChange(e.target.value.trim())}
                aria-invalid={!seedInput.isValid}
              />
            </label>{" "}
            {seedInput.isValid ? (
              <span>The same seed and n always give the same samples.</span>
            ) : (
              <span className="error">
                Enter a whole number from 0 to {MAX_SEED}. Still showing seed {seed}.
              </span>
            )}
          </div>
          <GroupControls value={groupColumn} onChange={setGroupColumn} />
        </div>
      </div>
      </section>

      <section className="card">
        <h2 className="card-title">One sample from each method</h2>
        <div className="card-body">
          <div className="table-wrap">
            <table className="shares summary">
              <thead>
                <tr>
                  <th scope="col">Method</th>
                  <th scope="col">Estimate from one sample</th>
                  <th scope="col">Settings</th>
                </tr>
              </thead>
              <tbody>
                <tr className="truth-row">
                  <th scope="row">True population mean</th>
                  <td>{dollars(truth)}</td>
                  <td>all {count(N)} people</td>
                </tr>
                <tr>
                  <th scope="row">Simple random</th>
                  <td>{dollars(srsResult.estimate)}</td>
                  <td>n = {count(n)}, seed {seed}</td>
                </tr>
                <tr>
                  <th scope="row">Systematic</th>
                  <td>{dollars(sysResult.estimate)}</td>
                  <td>
                    n = {count(n)}, seed {seed}, {sysResult.design}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Stratified by {STRATA_COLUMN}</th>
                  <td>{strResult ? dollars(strResult.estimate) : "–"}</td>
                  <td>
                    {strResult
                      ? `n = ${count(n)}, seed ${seed}, proportional allocation`
                      : `not drawn: needs n of at least ${STRATA_LEVELS.length}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="note">
            Each estimate comes from one sample, not repeated sampling. All three use the same n and
            seed. In this file, row order is only the order of the source file; it is not a time order.
          </p>
        </div>
      </section>

      <MethodPanel {...common} title="Simple random sampling" rows={srsResult.rows}
        estimate={srsResult.estimate} estimateName="Sample mean">
        <p>
          {count(n)} different people are chosen at random, without replacement, from all {count(N)}.
          Every possible set of {count(n)} people is equally likely. The estimate is the plain mean of
          their charges.
        </p>
      </MethodPanel>

      <MethodPanel {...common} title="Systematic sampling with a random start" rows={sysResult.rows}
        estimate={sysResult.estimate} estimateName="Sample mean">
        {sysResult.design === "whole-number interval" ? (
          <p>
            N ÷ n = {count(N)} ÷ {count(n)} = {count(sysResult.k)} is a whole number, so the{" "}
            <strong>whole-number interval</strong> design applies. A random start r = {sysResult.start}{" "}
            was chosen from 1 to {count(sysResult.k)}, then every {count(sysResult.k)}th row in file
            order was taken: rows {sysResult.positions.slice(0, 8).join(", ")}
            {n > 8 ? ", …" : "."}
          </p>
        ) : (
          <p>
            N ÷ n = {count(N)} ÷ {count(n)} = {fixed(sysResult.k, 4)} is not a whole number, so the{" "}
            <strong>fractional interval</strong> design applies. Interval k = {fixed(sysResult.k, 4)};
            random start u = {fixed(sysResult.start, 4)} (between 0 and k); row j is the next whole
            number at or above u + j × k: rows {sysResult.positions.slice(0, 8).join(", ")}
            {n > 8 ? ", …" : "."}
          </p>
        )}
        <p>
          Either way, every row has the same chance, {count(n)}/{count(N)}, of being picked. The rows
          are taken in the file's order, which here is only the order of the source file, not a time
          order. The estimate is the plain mean of the sampled charges.
        </p>
      </MethodPanel>

      <MethodPanel {...common} title={`Stratified sampling by ${STRATA_COLUMN}`}
        rows={strResult?.rows} estimate={strResult?.estimate} estimateName="Weighted estimate"
        message={
          strResult
            ? null
            : `Stratified sampling by ${STRATA_COLUMN} needs n of at least ${STRATA_LEVELS.length} (one person per group). No stratified sample is drawn at n = ${n}.`
        }>
        {strResult && (
          <>
            <p>
              The population is split into {STRATA_LEVELS.length} {STRATA_COLUMN} groups. Each group gets
              a share of the {count(n)} people in proportion to its size (largest-remainder rounding, at
              least 1 per group), and people are then picked at random without replacement inside each
              group. The estimate is the <strong>population-weighted mean</strong>: each group's sample
              mean × (group size ÷ {count(N)}), added up.
            </p>
            <div className="table-wrap">
              <table className="shares">
                <thead>
                  <tr>
                    <th scope="col">{STRATA_COLUMN}</th>
                    <th scope="col">Group size N_h</th>
                    <th scope="col">Weight N_h ÷ N</th>
                    <th scope="col">People sampled n_h</th>
                    <th scope="col">Sample mean in group</th>
                    <th scope="col">Weight × group mean</th>
                  </tr>
                </thead>
                <tbody>
                  {strResult.strata.map((s) => (
                    <tr key={s.group}>
                      <th scope="row">{s.group}</th>
                      <td>{count(s.Nh)}</td>
                      <td>{fixed(s.weight, 4)}</td>
                      <td>{count(s.nh)}</td>
                      <td>{dollars(s.mean)}</td>
                      <td>{dollars(s.weight * s.mean)}</td>
                    </tr>
                  ))}
                  <tr className="total">
                    <th scope="row">Total</th>
                    <td>{count(N)}</td>
                    <td>{fixed(strResult.strata.reduce((t, s) => t + s.weight, 0), 4)}</td>
                    <td>{count(strResult.strata.reduce((t, s) => t + s.nh, 0))}</td>
                    <td></td>
                    <td>{dollars(strResult.estimate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </MethodPanel>

      <SharesTable column={groupColumn} population={popShares} samples={sampleShares} N={N} />
      </>
      )}

      {tab === "experiments" && (
      <>
      <p>
        On this tab the computer takes many samples, one after another, and works out the
        average cost from each one. The charts show how much those averages vary from one sample
        to the next, and how close they land to the true average. Everything here uses the
        original {count(N)} people, unchanged. (The other tab shows just one sample at a time.)
      </p>

      <ExperimentSettings seedInput={expSeedInput} seed={expSeed} maxSeed={MAX_SEED} reps={reps} onRepsChange={setReps} />

      <ExperimentPanel
        title={`Experiment A: three ways of picking ${EXPERIMENT_N} people`}
        results={experiments.a}
        bins={experiments.binsA}
        truth={truth}
        N={N}
        intro={<>
          <p>
            The same number of people ({EXPERIMENT_N}) in every sample, picked three different ways:
            simple random, systematic, and stratified by age group ({STRATA_COLUMN}).
          </p>
          <p className="note">
            Systematic: {count(N)} people ÷ {EXPERIMENT_N}
            {N % EXPERIMENT_N === 0
              ? ` = ${count(N / EXPERIMENT_N)}, a whole number, so every possible starting point is listed once (exact, no seed).`
              : ` = ${fixed(N / EXPERIMENT_N, 2)}, not a whole number, so the fractional-interval design is used with random starting points (Monte Carlo).`}{" "}
            The rows are in the order of the original file, which is not a time order.
          </p>
        </>}
      />

      <ExperimentPanel
        title="Experiment B: does a bigger sample help? (simple random, 1, 10 or 100 people)"
        results={experiments.b}
        bins={experiments.binsB}
        truth={truth}
        N={N}
        intro={
          <p>
            Same people, same method (simple random). Only the number of people in each sample
            changes: 1, 10 or 100. Don't mix up the two numbers: "people per sample" (n) is how
            many people are in one sample; "samples taken" (repetitions) is how many separate
            samples the computer draws for each chart. The 100-person chart is the same result
            as in Experiment A.
          </p>
        }
      />
      </>
      )}
    </main>
  );
}
