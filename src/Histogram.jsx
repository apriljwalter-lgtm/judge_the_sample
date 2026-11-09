import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, ReferenceLine, Tooltip } from "recharts";
import { dollars, count } from "./format.js";

const INK = "#0b0b0b";
const INK_2 = "#52514e";
const AXIS = "#c3c2b7";
const BAR = "#6b8fb3";

// Short dollar labels for the axis: $13k, $12.5k, $800.
const short = (v) => {
  if (Math.abs(v) >= 1000) return `$${+(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
};

// About five round-number ticks across the shared range.
function axisTicks(lo, hi) {
  const raw = (hi - lo) / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * p).find((s) => s >= raw);
  const ticks = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) ticks.push(t);
  return ticks;
}

function TrueMeanLabel({ viewBox }) {
  return (
    <text x={viewBox.x} y={viewBox.y - 8} textAnchor="middle" fill={INK} fontSize={12} fontWeight={600}>
      True mean
    </text>
  );
}

function BinTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  return (
    <div className="tip">
      <div>
        {dollars(b.lo)} to under {dollars(b.hi)}
      </div>
      <div>
        <strong>{count(b.count)}</strong> sample{b.count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

// One histogram of repeated-sampling estimates. All histograms in one experiment get the same
// bin edges and the same axis range, so they can be compared directly.
export default function Histogram({ title, subtitle, edges, counts, truth, yMax }) {
  const data = counts.map((c, i) => ({ mid: (edges[i] + edges[i + 1]) / 2, lo: edges[i], hi: edges[i + 1], count: c }));
  const lo = edges[0];
  const hi = edges[edges.length - 1];
  return (
    <figure className="histogram">
      <figcaption>
        <strong>{title}</strong>
        <br />
        {subtitle}
      </figcaption>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 24, right: 14, bottom: 30, left: 4 }} barCategoryGap={1}>
          <XAxis
            type="number"
            dataKey="mid"
            domain={[lo, hi]}
            ticks={axisTicks(lo, hi)}
            tickFormatter={short}
            stroke={AXIS}
            tick={{ fill: INK_2, fontSize: 11 }}
            label={{ value: "Average cost from one sample (US dollars)", position: "bottom", offset: 12, fill: INK_2, fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, yMax]}
            stroke={AXIS}
            tick={{ fill: INK_2, fontSize: 11 }}
            width={44}
            label={{ value: "Number of samples", angle: -90, position: "insideLeft", offset: 10, dy: 60, fill: INK_2, fontSize: 12 }}
          />
          <Tooltip content={<BinTip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} isAnimationActive={false} />
          <Bar dataKey="count" fill={BAR} isAnimationActive={false} />
          <ReferenceLine x={truth} stroke={INK} strokeWidth={2} label={<TrueMeanLabel />} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
