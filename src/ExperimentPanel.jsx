import RangeChart, { typeText, samplesText } from "./RangeChart.jsx";
import { dollars, count } from "./format.js";
import Term from "./Term.jsx";

// One experiment: a range-bar chart (one row per result, same dollar axis) and a summary table.
// `results`: [{ key, label, result, summary, range, note }] where `result` comes from
// repeatedResult(), `summary` from summarizeEstimates() and `range` from middleRange() in sampling.js.
// A result may carry its own `truth` and `population` label (Stage 5: baseline vs modified);
// then its bias, SD and RMSE were computed against that row's own true mean.
export default function ExperimentPanel({ title, intro, results, truth, N, tourId }) {
  const perRow = results.some((x) => x.truth !== undefined);
  return (
    <section className="card" data-tour={tourId}>
      <h2 className="card-title">{title}</h2>
      <div className="card-body">
        {intro}
        <div data-tour="range-chart">
          <RangeChart results={results} truth={truth} />
        </div>
        <p className="note">
          <strong>How to read this chart:</strong> each faint dot is the mean cost from one sample.
          The bold bar covers the middle 95% of those dots, and the large dot is their mean.{" "}
          {perRow
            ? "In each row, the black line is the true mean of the population that row's samples were drawn from (baseline or modified)."
            : `The black line is the true mean of all ${count(N)} people.`}{" "}
          Hover over a dot to see its value.
        </p>
        <div className="table-wrap" data-tour="summary-table">
          <table className="shares summary">
            <thead>
              <tr>
                <th scope="col">Method</th>
                {perRow && <th scope="col">Population</th>}
                <th scope="col"><Term id="n">People per sample (n)</Term></th>
                <th scope="col"><Term id="monteCarlo">Type</Term></th>
                <th scope="col"><Term id="seed">Seed</Term></th>
                <th scope="col"><Term id="reps">Samples taken</Term></th>
                <th scope="col"><Term id="trueMean">True mean</Term></th>
                <th scope="col">Mean of the sample means</th>
                <th scope="col"><Term id="middle95">Middle 95% of the sample means</Term></th>
                <th scope="col"><Term id="bias">Bias (mean miss)</Term></th>
                <th scope="col"><Term id="sd">SD (spread)</Term></th>
                <th scope="col"><Term id="rmse">RMSE (typical error)</Term></th>
              </tr>
            </thead>
            <tbody>
              {results.map((x) => (
                <tr key={x.key}>
                  <th scope="row">
                    {x.color && <span className="method-swatch" style={{ background: x.color }} aria-hidden="true" />}
                    {x.label}
                    {x.note && <div className="note">{x.note}</div>}
                  </th>
                  {perRow && <td>{x.population}</td>}
                  <td>{count(x.result.n)}</td>
                  <td>{typeText(x.result)}</td>
                  <td>{x.result.seed === null ? "none (exact)" : x.result.seed}</td>
                  <td>{samplesText(x.result)}</td>
                  <td>{dollars(x.truth ?? truth)}</td>
                  <td>{dollars(x.summary.meanEstimate)}</td>
                  <td>{dollars(x.range.low)} to {dollars(x.range.high)}</td>
                  <td>{dollars(x.summary.bias)}</td>
                  <td>{dollars(x.summary.sd)}</td>
                  <td>{dollars(x.summary.rmse)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="glossary">
          <div>
            <dt>Bias (mean miss)</dt>
            <dd>
              How far the mean of the sample means is from the true mean. Minus means below.
            </dd>
          </div>
          <div>
            <dt>SD (spread)</dt>
            <dd>How much the sample means vary from one sample to the next.</dd>
          </div>
          <div>
            <dt>RMSE (typical error)</dt>
            <dd>
              The typical miss for one sample, combining bias and spread (RMSE² = bias² + SD²).
            </dd>
          </div>
          <div>
            <dt>Monte Carlo or exact</dt>
            <dd>
              Monte Carlo: many random samples, so a bias that is not exactly zero can be chance.
              Exact: every possible starting spot listed once, with no randomness and no seed.
            </dd>
          </div>
        </dl>
        <p className="note">All amounts are in US dollars.</p>
      </div>
    </section>
  );
}
