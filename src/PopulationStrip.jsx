import { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { makeRng } from "./sampling.js";
import { GROUP_COLUMNS, colourFor } from "./groups.js";
import { dollars } from "./format.js"; // used in the hover tooltip

const INK = "#0b0b0b";
const INK_2 = "#52514e";
const AXIS = "#c3c2b7";
const SURFACE = "#fcfcfb";

// Fixed vertical spread so dots don't sit on top of each other. It uses its own fixed
// seed, so the layout never changes with the sample seed. Up-down position means nothing.
const LAYOUT_SEED = 20261107;

function FaintDot({ cx, cy, fill }) {
  return <circle cx={cx} cy={cy} r={3.5} fill={fill} fillOpacity={0.28} />;
}

function SampledDot({ cx, cy, fill }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={6.5} fill={SURFACE} />
      <circle cx={cx} cy={cy} r={5} fill={fill} stroke={INK} strokeWidth={1.5} />
    </g>
  );
}

// Short label at the top of each mean line. The left-hand line is labelled to its left
// and the right-hand line to its right, so the two labels never run into each other.
function MeanLabel({ viewBox, text, side, colour }) {
  const { x, y } = viewBox;
  return (
    <text
      x={side === "left" ? x - 6 : x + 6}
      y={y - 10}
      textAnchor={side === "left" ? "end" : "start"}
      fill={colour}
      fontSize={13}
      fontWeight={600}
    >
      {text}
    </text>
  );
}

function PointTip({ active, payload, groupColumn }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="tip">
      <div>
        <strong>Row {p.row.row_id}</strong> {p.sampled ? "· in this sample" : "· not sampled"}
      </div>
      <div>Charges: {dollars(p.row.charges)}</div>
      <div>
        {groupColumn}: {p.row[groupColumn]}
      </div>
    </div>
  );
}

export default function PopulationStrip({
  population, target, sampledIds, groupColumn, truth, estimate, estimateLabel = "Sample mean", height = 360,
}) {
  const jitter = useMemo(() => {
    const rng = makeRng(LAYOUT_SEED);
    return new Map(population.map((r) => [r.row_id, rng()]));
  }, [population]);

  const levels = GROUP_COLUMNS.find((c) => c.key === groupColumn).levels;

  // One layer per group: faint (not sampled) first, sampled drawn on top.
  const layers = useMemo(() => {
    const point = (r) => ({ x: r[target], y: jitter.get(r.row_id), row: r, sampled: sampledIds.has(r.row_id) });
    const faint = levels.map((g) => ({
      group: g,
      data: population.filter((r) => r[groupColumn] === g && !sampledIds.has(r.row_id)).map(point),
    }));
    const sampled = levels.map((g) => ({
      group: g,
      data: population.filter((r) => r[groupColumn] === g && sampledIds.has(r.row_id)).map(point),
    }));
    return { faint, sampled };
  }, [population, target, jitter, sampledIds, groupColumn, levels]);

  const maxX = Math.ceil(Math.max(...population.map((r) => r[target])) / 10000) * 10000;
  const ticks = Array.from({ length: maxX / 10000 + 1 }, (_, i) => i * 10000);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 28, right: 24, bottom: 36, left: 24 }}>
        <XAxis
          type="number"
          dataKey="x"
          domain={[0, maxX]}
          ticks={ticks}
          tickFormatter={(v) => (v === 0 ? "$0" : `$${v / 1000}k`)}
          stroke={AXIS}
          tick={{ fill: INK_2, fontSize: 12 }}
          label={{ value: "Charges per person (US dollars)", position: "bottom", offset: 16, fill: INK_2, fontSize: 13 }}
        />
        <YAxis type="number" dataKey="y" domain={[-0.04, 1.04]} hide />
        <Tooltip content={<PointTip groupColumn={groupColumn} />} cursor={false} isAnimationActive={false} />
        {layers.faint.map((l) => (
          <Scatter
            key={`faint-${l.group}`}
            data={l.data}
            fill={colourFor(groupColumn, l.group)}
            shape={<FaintDot />}
            isAnimationActive={false}
          />
        ))}
        {layers.sampled.map((l) => (
          <Scatter
            key={`sampled-${l.group}`}
            data={l.data}
            fill={colourFor(groupColumn, l.group)}
            shape={<SampledDot />}
            isAnimationActive={false}
          />
        ))}
        <ReferenceLine
          x={truth}
          stroke={INK}
          strokeWidth={2}
          ifOverflow="extendDomain"
          label={<MeanLabel text="True mean" side={truth <= estimate ? "left" : "right"} colour={INK} />}
        />
        <ReferenceLine
          x={estimate}
          stroke={INK_2}
          strokeWidth={2}
          strokeDasharray="6 4"
          ifOverflow="extendDomain"
          label={<MeanLabel text={estimateLabel} side={truth <= estimate ? "right" : "left"} colour={INK_2} />}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
