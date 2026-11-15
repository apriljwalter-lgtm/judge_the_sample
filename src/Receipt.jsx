import { dollars, count } from "./format.js";
import Odometer from "./Odometer.jsx";
import Term from "./Term.jsx";

// One sample's result as a paper receipt (replaces the plain means box). While a sample is being
// drawn, it shows a cash-register display counting the people picked instead.
// Shows only this one sample's figures; repeated-sampling results live on the other tab.
export default function Receipt({ method, methodTerm, n, seed, extra, estimateName, estimateTerm, estimate, truth, N, drawing }) {
  if (drawing) {
    return (
      <aside className="register" aria-live="polite" aria-label="Drawing the sample">
        <div className="register-label">Picking people…</div>
        <div className="register-screen">
          <span className="register-small">PICKED</span>
          <Odometer value={String(drawing.picked).padStart(String(drawing.total).length, "0")} />
          <span className="register-small">/ {count(drawing.total)}</span>
        </div>
        <div className="register-note">{drawing.note}</div>
      </aside>
    );
  }
  const miss = estimate - truth;
  return (
    <aside className="receipt-wrap" aria-label={`${method}: receipt for this one sample`}>
      {/* key: a new receipt "prints" whenever this sample's figures change */}
      <div className="receipt" key={`${n}-${seed}-${estimate}`}>
        <div className="receipt-head">SAMPLE RECEIPT</div>
        <div className="receipt-method">
          <Term id={methodTerm}>{method}</Term>
        </div>
        <dl className="receipt-lines">
          <div><dt><Term id="n">People picked</Term></dt><dd>{count(n)}</dd></div>
          <div><dt><Term id="seed">Seed</Term></dt><dd>{seed}</dd></div>
          {extra && <div><dt>{extra[0]}</dt><dd>{extra[1]}</dd></div>}
        </dl>
        <div className="receipt-rule" aria-hidden="true" />
        <dl className="receipt-lines receipt-money">
          <div>
            <dt><span className="key-line dashed" aria-hidden="true" /> <Term id={estimateTerm}>{estimateName}</Term></dt>
            <dd><Odometer value={dollars(estimate)} rollIn /></dd>
          </div>
          <div>
            <dt><span className="key-line" aria-hidden="true" /> <Term id="trueMean">True mean</Term></dt>
            <dd>{dollars(truth)}</dd>
          </div>
        </dl>
        <div className="receipt-rule" aria-hidden="true" />
        <p className="receipt-miss">
          Miss for this one sample: <strong>{dollars(Math.abs(miss))}</strong> {miss >= 0 ? "above" : "below"} the true mean
        </p>
        <p className="receipt-foot">
          One sample only (true mean from all {count(N)} people). The Repeated-sampling tab shows how much samples vary.
        </p>
      </div>
    </aside>
  );
}
