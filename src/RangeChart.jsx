import { dollars, count } from "./format.js";

// Range bars with faint sample dots: one row per result, all rows on the same dollar axis.
// Each faint dot is one sample's mean (or one systematic start, for exact results); the bold bar
// covers the middle 95% of those means; the large dot is the mean of the sample means; the black
// line is the true mean. Display only: every number shown comes from sampling.js.

const W = 1000; // drawing width in SVG units; every strip uses the same x scale
const PAD = 60; // room at both sides so the first and last axis labels and bar-end labels fit
const STRIP_H = 72;
const DOT_TOP = 22; // space above the dots for the small bar-end labels
const MID = (DOT_TOP + STRIP_H - 6) / 2;

const INK = "#0b0b0b";
const INK_2 = "#52514e";
const AXIS = "#c3c2b7";
const GRID = "#e2e1da";
const DOT = "#6b8fb3";
const BAR = "#1f4e79";

// Whole-dollar axis labels: $12,500.
const axisLabel = (v) => `$${Math.round(v).toLocaleString("en-US")}`;

// Axis covering lo..hi that starts and ends on a labelled round number, with equal gaps
// between labels: the widest round step that still gives at least 7 labels.
function niceAxis(lo, hi) {
  if (hi - lo <= 0) { lo -= 1; hi += 1; }
  const p = 10 ** Math.floor(Math.log10((hi - lo) / 6));
  const steps = [10, 5, 2.5, 2, 1, 0.5].map((f) => f * p);
  const labels = (s) => Math.ceil(hi / s) - Math.floor(lo / s) + 1;
  const step = steps.find((s) => labels(s) >= 7) ?? steps[steps.length - 1];
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let i = 0; start + i * step <= end + step * 1e-9; i++) ticks.push(start + i * step);
  return { lo: start, hi: end, ticks };
}

// Fixed vertical spread for the faint dots so they don't sit on top of each other.
// Not random (golden-ratio steps), so it needs no seed and never changes between runs.
const spread = (i) => ((i * 0.6180339887) % 1) * (STRIP_H - DOT_TOP - 10) + DOT_TOP + 2;

export const typeText = (r) => (r.type === "exact" ? "Exact (every start listed)" : "Monte Carlo (random samples)");
export const samplesText = (r) =>
  r.type === "exact" ? `all ${count(r.count)} possible starts` : `${count(r.count)} samples`;

export default function RangeChart({ results, truth }) {
  // A row may carry its own `truth` (the true mean of the population it was drawn from, e.g.
  // baseline vs modified). Then each row's black line sits at its own population's true mean.
  const perRow = results.some((item) => item.truth !== undefined);
  const rowTruth = (item) => item.truth ?? truth;
  const all = results.flatMap((item) => [...item.result.estimates, rowTruth(item)]);
  const { lo, hi, ticks } = niceAxis(Math.min(...all), Math.max(...all));
  const x = (v) => PAD + ((v - lo) / (hi - lo)) * (W - 2 * PAD);
  const tx = x(truth);
  const dotOpacity = results[0].result.count > 300 ? 0.18 : 0.35;

  return (
    <figure className="range-chart">
      <ul className="range-legend" aria-label="Legend">
        <li>
          <svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="4" fill={DOT} opacity="0.5" /></svg>
          one sample's mean
        </li>
        <li>
          <svg width="26" height="14" aria-hidden="true"><line x1="1" x2="25" y1="7" y2="7" stroke={BAR} strokeWidth="6" /></svg>
          middle 95% of the sample means (its two ends are written above it)
        </li>
        <li>
          <svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill={BAR} stroke="#fff" strokeWidth="1.5" /></svg>
          mean of the sample means
        </li>
        <li>
          <svg width="10" height="14" aria-hidden="true"><line x1="5" x2="5" y1="0" y2="14" stroke={INK} strokeWidth="2" /></svg>
          {perRow ? "True mean of that row's own population (value in the row's label)" : `True mean (${dollars(truth)})`}
        </li>
      </ul>

      {!perRow && (
        <svg viewBox={`0 0 ${W} 22`} width="100%" aria-hidden="true" className="range-top">
          <text x={tx} y="16" textAnchor="middle" fill={INK} fontSize="15" fontWeight="600">True mean</text>
        </svg>
      )}

      {results.map((item) => {
        const r = item.result;
        const { low, high } = item.range;
        const name = r.type === "exact" ? "Start" : "Sample";
        return (
          <div key={item.key} className="range-row">
            <div className="range-row-label">
              <strong>{item.label}</strong>{" "}
              <span>
                · {count(r.n)} {r.n === 1 ? "person" : "people"} per sample · {samplesText(r)}
                {r.seed === null ? "" : ` · seed ${r.seed}`} · {typeText(r)}
                {perRow && <> · <strong>true mean {dollars(rowTruth(item))}</strong></>}
              </span>
            </div>
            <svg viewBox={`0 0 ${W} ${STRIP_H}`} width="100%" role="img"
              aria-label={`${item.label}: ${count(r.estimates.length)} sample means; middle 95% from ${dollars(low)} to ${dollars(high)}; mean of the sample means ${dollars(item.summary.meanEstimate)}`}>
              <rect x={PAD} y="0" width={W - 2 * PAD} height={STRIP_H} fill="#f7f7f5" />
              {ticks.map((t) => (
                <line key={t} x1={x(t)} x2={x(t)} y1="0" y2={STRIP_H} stroke={GRID} strokeWidth="1.5" />
              ))}
              {r.estimates.map((e, i) => (
                <circle key={i} cx={x(e)} cy={spread(i)} r="4" fill={DOT} opacity={dotOpacity}>
                  <title>{`${name} #${i + 1}: mean ${dollars(e)}`}</title>
                </circle>
              ))}
              <line x1={x(low)} x2={x(high)} y1={MID} y2={MID} stroke={BAR} strokeWidth="7" strokeLinecap="butt">
                <title>{`Middle 95%: ${dollars(low)} to ${dollars(high)}`}</title>
              </line>
              <line x1={x(low)} x2={x(low)} y1={MID - 10} y2={MID + 10} stroke={BAR} strokeWidth="3" />
              <line x1={x(high)} x2={x(high)} y1={MID - 10} y2={MID + 10} stroke={BAR} strokeWidth="3" />
              <line x1={x(rowTruth(item))} x2={x(rowTruth(item))} y1="0" y2={STRIP_H} stroke={INK} strokeWidth="2.5">
                <title>{`True mean of this row's population: ${dollars(rowTruth(item))}`}</title>
              </line>
              {/* Small labels for the two ends of the bold bar, written outward so they never overlap. */}
              <text x={x(low) + 4} y="15" textAnchor="end" fill={BAR} fontSize="13" fontWeight="600"
                stroke="#f7f7f5" strokeWidth="4" paintOrder="stroke">{axisLabel(low)}</text>
              <text x={x(high) - 4} y="15" textAnchor="start" fill={BAR} fontSize="13" fontWeight="600"
                stroke="#f7f7f5" strokeWidth="4" paintOrder="stroke">{axisLabel(high)}</text>
              <circle cx={x(item.summary.meanEstimate)} cy={MID} r="9" fill={BAR} stroke="#fff" strokeWidth="2">
                <title>{`Mean of the sample means: ${dollars(item.summary.meanEstimate)}`}</title>
              </circle>
            </svg>
          </div>
        );
      })}

      <svg viewBox={`0 0 ${W} 52`} width="100%" aria-hidden="true" className="range-axis">
        <line x1={PAD} x2={W - PAD} y1="2" y2="2" stroke={AXIS} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1="2" y2="8" stroke={AXIS} />
            <text x={x(t)} y="24" textAnchor="middle" fill={INK_2} fontSize="14">{axisLabel(t)}</text>
          </g>
        ))}
        <text x={W / 2} y="46" textAnchor="middle" fill={INK_2} fontSize="14">
          Sample mean from one sample (US dollars)
        </text>
      </svg>
    </figure>
  );
}
