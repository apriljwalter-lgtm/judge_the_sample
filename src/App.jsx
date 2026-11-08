import { useMemo, useState } from "react";
import { population, TARGET, DATA_FILE } from "./data.js";
import { makeRng, trueMean, srs, systematic, stratified, sampleMean, groupShares } from "./sampling.js";
import { GROUP_COLUMNS } from "./groups.js";
import { dollars, count, fixed } from "./format.js";
import MethodPanel from "./MethodPanel.jsx";
import GroupControls from "./GroupControls.jsx";
import SharesTable from "./SharesTable.jsx";

const N = population.length;
const DEFAULT_N = 100;
const DEFAULT_SEED = 12345;
const MAX_SEED = 4294967295;

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
    </main>
  );
}
