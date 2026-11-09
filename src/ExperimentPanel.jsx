import Histogram from "./Histogram.jsx";
import { dollars, count } from "./format.js";

// One experiment: a row of histograms (same bins, same axes) and a summary table.
// `results`: [{ key, label, result, summary, note }] where `result` comes from repeatedResult()
// and `summary` from summarizeEstimates() in sampling.js.
export const typeText = (r) => (r.type === "exact" ? "Exact (every start listed)" : "Monte Carlo (random samples)");
export const samplesText = (r) =>
  r.type === "exact" ? `all ${count(r.count)} possible starts` : `${count(r.count)} samples`;

export default function ExperimentPanel({ title, intro, results, bins, truth, N }) {
  const yMax = Math.max(...bins.counts.flat());

  return (
    <section className="card">
      <h2 className="card-title">{title}</h2>
      <div className="card-body">
        {intro}
        <div className="histogram-row">
          {results.map((x, i) => (
            <Histogram
              key={x.key}
              title={x.label}
              subtitle={`${count(x.result.n)} ${x.result.n === 1 ? "person" : "people"} per sample · ${samplesText(
                x.result
              )}${x.result.seed === null ? "" : ` · seed ${x.result.seed}`} · ${typeText(x.result)}`}
              edges={bins.edges}
              counts={bins.counts[i]}
              truth={truth}
              yMax={yMax}
            />
          ))}
        </div>
        <p className="note">
          <strong>How to read these charts:</strong> each sample gives one average cost. Each bar
          shows how many samples gave an average in that dollar range; taller bars mean more samples
          landed there. The black line is the true average cost of all {count(N)} people. All charts
          in this box use the same scale, so you can compare them directly.
        </p>
        <div className="table-wrap">
          <table className="shares summary">
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col">People per sample (n)</th>
                <th scope="col">Type</th>
                <th scope="col">Seed</th>
                <th scope="col">Samples taken</th>
                <th scope="col">True average</th>
                <th scope="col">Average of the sample averages</th>
                <th scope="col">Bias (average miss)</th>
                <th scope="col">SD (spread)</th>
                <th scope="col">RMSE (typical error)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((x) => (
                <tr key={x.key}>
                  <th scope="row">
                    {x.label}
                    {x.note && <div className="note">{x.note}</div>}
                  </th>
                  <td>{count(x.result.n)}</td>
                  <td>{typeText(x.result)}</td>
                  <td>{x.result.seed === null ? "none (exact)" : x.result.seed}</td>
                  <td>{samplesText(x.result)}</td>
                  <td>{dollars(truth)}</td>
                  <td>{dollars(x.summary.meanEstimate)}</td>
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
            <dt>Bias (average miss)</dt>
            <dd>
              How far the average of all the sample averages is from the true average. A minus sign
              means below the true average.
            </dd>
          </div>
          <div>
            <dt>SD (spread)</dt>
            <dd>How much the sample averages vary from one sample to the next.</dd>
          </div>
          <div>
            <dt>RMSE (typical error)</dt>
            <dd>
              The typical size of the miss for one sample, combining bias and spread
              (RMSE² = bias² + SD²).
            </dd>
          </div>
          <div>
            <dt>Monte Carlo or exact</dt>
            <dd>
              Monte Carlo means the computer drew many random samples, so a bias that is not exactly
              zero can be due to chance. Exact means every possible starting point was listed once,
              with no randomness and no seed.
            </dd>
          </div>
        </dl>
        <p className="note">All amounts are in US dollars.</p>
      </div>
    </section>
  );
}
