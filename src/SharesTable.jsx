import { colourFor } from "./groups.js";
import { count, percent } from "./format.js";

export default function SharesTable({ shares, column, N, n }) {
  return (
    <section>
      <h2>Share of each {column} group in the whole population and in the temporary sample</h2>
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
              <th scope="colgroup" colSpan={2} className="group-head">
                Temporary sample ({n} people)
              </th>
            </tr>
            <tr>
              <th scope="col">Count</th>
              <th scope="col">Share</th>
              <th scope="col">Count</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {shares.map((s) => (
              <tr key={s.group}>
                <th scope="row">
                  <span className="swatch" style={{ background: colourFor(column, s.group) }} aria-hidden="true" />
                  {s.group}
                </th>
                <td>{count(s.popCount)}</td>
                <td>{percent(s.popShare)}</td>
                <td>{s.sampleCount}</td>
                <td>{percent(s.sampleShare)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
