import { dollars, count } from "./format.js";
import Odometer from "./Odometer.jsx";
import Term from "./Term.jsx";

// One chart row's repeated-sampling result as a printed receipt. While the samples are piling up
// it is a cash-register display instead: samples so far, with bias / SD / RMSE for those samples
// only (clearly labeled "so far"). Every figure is passed in from sampling.js; nothing is computed here.
export default function ResultReceipt({ item, truth, live }) {
  const r = item.result;
  const s = item.summary;
  const exact = r.type === "exact";

  if (live) {
    return (
      <aside className="register register-small-card" aria-live="polite" aria-label={`${item.label}: samples piling up`}>
        <div className="register-label">{exact ? "Listing starts…" : "Taking samples…"}</div>
        <div className="register-screen">
          <span className="register-small">{exact ? "STARTS" : "SAMPLES"}</span>
          <Odometer value={String(live.shown).padStart(String(live.total).length, "0")} />
          <span className="register-small">/ {count(live.total)}</span>
        </div>
        {live.summary && (
          <dl className="register-stats">
            <div><dt>Bias</dt><dd>{dollars(live.summary.bias)}</dd></div>
            <div><dt>SD</dt><dd>{dollars(live.summary.sd)}</dd></div>
            <div><dt>RMSE</dt><dd>{dollars(live.summary.rmse)}</dd></div>
          </dl>
        )}
        <div className="register-note">So far, from the samples shown. Not the final result.</div>
      </aside>
    );
  }

  return (
    <aside className="receipt-wrap result-receipt" aria-label={`${item.label}: results receipt`}>
      {/* key: a new receipt "prints" whenever this row's result changes. Type, samples and seed are
          not repeated here: they are in the row's label and in the table below. */}
      <div className="receipt" key={`${r.n}-${r.seed}-${r.count}-${s.bias}`}>
        <div className="receipt-head">RESULTS RECEIPT</div>
        <dl className="receipt-lines">
          <div><dt><Term id="trueMean">True mean</Term></dt><dd>{dollars(truth)}</dd></div>
          <div><dt>Mean of sample means</dt><dd>{dollars(s.meanEstimate)}</dd></div>
          <div>
            <dt><Term id="middle95">Middle 95%</Term></dt>
            <dd>{dollars(item.range.low)} to {dollars(item.range.high)}</dd>
          </div>
        </dl>
        <div className="receipt-rule" aria-hidden="true" />
        <dl className="receipt-lines receipt-money">
          <div><dt><Term id="bias">Bias</Term></dt><dd><Odometer value={dollars(s.bias)} rollIn /></dd></div>
          <div><dt><Term id="sd">SD</Term></dt><dd><Odometer value={dollars(s.sd)} rollIn /></dd></div>
          <div><dt><Term id="rmse">RMSE</Term></dt><dd><Odometer value={dollars(s.rmse)} rollIn /></dd></div>
        </dl>
      </div>
    </aside>
  );
}
