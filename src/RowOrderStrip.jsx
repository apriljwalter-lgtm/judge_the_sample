import { count } from "./format.js";

// Colour for sampled-row marks: deep raspberry, checked to stay distinct from the four group colours.
export const ROW_MARK = "#b8336a";

// Every row of the file, left to right in file order (row 1 to row N), with the sampled rows marked.
export default function RowOrderStrip({ N, positions }) {
  return (
    <div className="row-order">
      <div className="row-order-title">
        Where the sampled rows sit in the file's row order (row 1 on the left, row {count(N)} on the right)
        <span className="row-order-key">
          <span className="key-rowmark" aria-hidden="true" /> = a sampled row
        </span>
      </div>
      <svg viewBox={`0 0 ${N} 40`} preserveAspectRatio="none" width="100%" height="40" role="img"
        aria-label={`File rows 1 to ${N}, left to right; ${positions.length} sampled rows marked`}>
        <rect x="0" y="0" width={N} height="40" fill="#f0efec" />
        {positions.map((p) => (
          <line key={p} x1={p - 0.5} x2={p - 0.5} y1="0" y2="40" stroke={ROW_MARK} strokeWidth="2"
            vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="row-order-axis">
        <span>Row 1</span>
        <span>Row {count(N)}</span>
      </div>
    </div>
  );
}
