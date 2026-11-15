import { useEffect, useMemo, useRef, useState } from "react";
import PopulationStrip from "./PopulationStrip.jsx";
import RowOrderStrip from "./RowOrderStrip.jsx";
import ChartLegend from "./ChartLegend.jsx";
import Receipt from "./Receipt.jsx";
import Term from "./Term.jsx";
import { playSound, prefersReducedMotion } from "./celebrate.js";

// One boxed panel per sampling method: dot strip with its receipt, then how this sample was picked,
// then the row-order bar. "Watch the draw" replays the picking one person at a time (display only:
// the sample itself is already decided by sampling.js; the animation only reveals it).
export default function MethodPanel({
  title, titleTerm, receipt, population, target, groupColumn, truth, rows, drawOrder, drawNote,
  estimate, estimateName, estimateTerm, n, seed, message, children,
}) {
  const N = population.length;
  const order = useMemo(() => new Map(population.map((r, i) => [r.row_id, i + 1])), [population]);
  const [drawK, setDrawK] = useState(null); // null = not drawing; otherwise people revealed so far
  const frame = useRef(null);

  // Any change to the sample cancels a draw in progress and shows the full sample.
  useEffect(() => {
    cancelAnimationFrame(frame.current);
    setDrawK(null);
  }, [rows]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const ids = drawOrder ?? (rows ?? []).map((r) => r.row_id);
  const shownIds = drawK === null ? ids : ids.slice(0, drawK);
  const sampledIds = useMemo(() => new Set(shownIds), [shownIds.length, rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const positions = useMemo(() => shownIds.map((id) => order.get(id)), [shownIds.length, rows, order]); // eslint-disable-line react-hooks/exhaustive-deps

  const watch = () => {
    if (drawK !== null || ids.length === 0) return;
    if (prefersReducedMotion()) {
      playSound("cha-ching");
      return;
    }
    const total = ids.length;
    const duration = Math.min(4000, Math.max(800, total * 40));
    const start = performance.now();
    let lastClink = 0;
    const step = (now) => {
      const k = Math.min(total, Math.floor(((now - start) / duration) * total) + 1);
      setDrawK(k);
      if (now - lastClink > 160 && k < total) {
        lastClink = now;
        playSound("coin");
      }
      if (k < total) {
        frame.current = requestAnimationFrame(step);
      } else {
        setDrawK(null); // done: show the full sample, the sample-mean line and the printed receipt
        playSound("printer");
        setTimeout(() => playSound("cha-ching"), 350);
      }
    };
    setDrawK(0);
    frame.current = requestAnimationFrame(step);
  };

  return (
    <section className="card">
      <h2 className="card-title">{titleTerm ? <Term id={titleTerm}>{title}</Term> : title}</h2>
      <div className="card-body">
        {message ? (
          <p className="message">{message}</p>
        ) : (
          <>
            <div className="panel-layout">
              <ChartLegend groupColumn={groupColumn} />
              <div className="panel-chart" data-tour="dot-chart">
                <PopulationStrip
                  population={population}
                  target={target}
                  sampledIds={sampledIds}
                  groupColumn={groupColumn}
                  truth={truth}
                  estimate={estimate}
                  estimateLabel={estimateName}
                  hideEstimate={drawK !== null}
                  height={250}
                />
                <button type="button" className="button watch-draw" onClick={watch} disabled={drawK !== null}
                  data-tour="watch-draw">
                  {drawK !== null ? "Drawing…" : "▶ Watch the draw"}
                </button>
              </div>
              <div data-tour="receipt">
                <Receipt
                  {...receipt}
                  n={n}
                  seed={seed}
                  estimate={estimate}
                  estimateName={estimateName}
                  estimateTerm={estimateTerm}
                  truth={truth}
                  N={N}
                  drawing={drawK !== null ? { picked: drawK, total: ids.length, note: drawNote } : null}
                />
              </div>
            </div>
            <div className="how" data-tour="how-picked">
              <h3>How the people were picked</h3>
              {children}
              <div data-tour="row-strip">
                <RowOrderStrip N={N} positions={positions} />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
