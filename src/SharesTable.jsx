import { colourFor } from "./groups.js";
import { count, percent } from "./format.js";

// One table: each group's count and share in the whole population and in each method's sample.
// `samples` is a list of { name, shares } where shares is null when that method drew no sample.
export default function SharesTable({ column, population, samples, N }) {
  return (
    <section className="card">
      <h2 className="card-title">Share of each {column} group in the whole population and in each sample</h2>
      <div className="card-body">
      <div className="table-wrap">
        <table className="shares">
          <thead>
            <tr>
              <th scope="col" rowSpan={2}>
                {column} group
              </th>
              <th scope="colgroup" colSpan={2} className="group-head">
                Whole population ({count(N)} people)
              </th>
              {samples.map((s) => (
                <th key={s.name} scope="colgroup" colSpan={2} className="group-head">
                  {s.name}
                </th>
              ))}
            </tr>
            <tr>
              <th scope="col">Count</th>
              <th scope="col">Share</th>
              {samples.map((s) => [
                <th key={`${s.name}-c`} scope="col">Count</th>,
                <th key={`${s.name}-s`} scope="col">Share</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {population.map((p, i) => (
              <tr key={p.group}>
                <th scope="row">
                  <span className="swatch" style={{ background: colourFor(column, p.group) }} aria-hidden="true" />
                  {p.group}
                </th>
                <td>{count(p.popCount)}</td>
                <td>{percent(p.popShare)}</td>
                {samples.map((s) =>
                  s.shares
                    ? [
                        <td key={`${s.name}-c`}>{s.shares[i].sampleCount}</td>,
                        <td key={`${s.name}-s`}>{percent(s.shares[i].sampleShare)}</td>,
                      ]
                    : [
                        <td key={`${s.name}-c`}>–</td>,
                        <td key={`${s.name}-s`}>–</td>,
                      ]
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">Each sample has n people; "–" means that method drew no sample at this n.</p>
      </div>
    </section>
  );
}
