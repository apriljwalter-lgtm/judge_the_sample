import { useMemo } from "react";
import PopulationStrip from "./PopulationStrip.jsx";
import RowOrderStrip from "./RowOrderStrip.jsx";
import ChartLegend from "./ChartLegend.jsx";
import { dollars, count } from "./format.js";

// One boxed panel per sampling method: dot strip (left) and the two means (right),
// then how this sample was picked, then the row-order bar.
export default function MethodPanel({
  title, population, target, groupColumn, truth, rows, estimate, estimateName, n, seed, message, children,
}) {
  const N = population.length;
  const sampledIds = useMemo(() => new Set((rows ?? []).map((r) => r.row_id)), [rows]);
  const positions = useMemo(() => {
    const order = new Map(population.map((r, i) => [r.row_id, i + 1]));
    return (rows ?? []).map((r) => order.get(r.row_id));
  }, [population, rows]);

  return (
    <section className="card">
      <h2 className="card-title">{title}</h2>
      <div className="card-body">
        {message ? (
          <p className="message">{message}</p>
        ) : (
          <>
            <div className="panel-layout">
              <ChartLegend groupColumn={groupColumn} />
              <PopulationStrip
                population={population}
                target={target}
                sampledIds={sampledIds}
                groupColumn={groupColumn}
                truth={truth}
                estimate={estimate}
                estimateLabel={estimateName}
                height={250}
              />
              <aside className="panel-means" aria-label={`${title}: means`}>
                <dl className="means">
                  <div>
                    <dt>
                      <span className="key-line" aria-hidden="true" /> True population mean
                    </dt>
                    <dd>{dollars(truth)}</dd>
                    <dd className="note">all {count(N)} people</dd>
                  </div>
                  <div>
                    <dt>
                      <span className="key-line dashed" aria-hidden="true" /> {estimateName}
                    </dt>
                    <dd>{dollars(estimate)}</dd>
                    <dd className="note">
                      one sample, n = {count(n)}, seed {seed}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>
            <div className="how">
              <h3>How this sample was picked</h3>
              {children}
              <RowOrderStrip N={N} positions={positions} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
