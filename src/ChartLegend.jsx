import { GROUP_COLUMNS, colourFor, groupLabel } from "./groups.js";

// Simple legend for one dot chart: what solid and faint dots mean, and the group colours.
export default function ChartLegend({ groupColumn }) {
  const levels = GROUP_COLUMNS.find((c) => c.key === groupColumn).levels;
  return (
    <aside className="side-legend panel-legend" aria-label="Legend">
      <h3>Each dot is one person</h3>
      <ul>
        <li>
          <span className="key-solid" aria-hidden="true" /> Picked
        </li>
        <li>
          <span className="key-faint" aria-hidden="true" /> Not picked
        </li>
      </ul>
      <h3>Colour: {groupLabel(groupColumn)}</h3>
      <ul>
        {levels.map((g) => (
          <li key={g}>
            <span className="swatch" style={{ background: colourFor(groupColumn, g) }} aria-hidden="true" />
            {g}
          </li>
        ))}
      </ul>
    </aside>
  );
}
