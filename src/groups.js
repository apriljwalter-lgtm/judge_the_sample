// Group columns the user can colour by, with a fixed group order so each group
// always keeps the same colour.
export const GROUP_COLUMNS = [
  { key: "smoker", label: "smoker", levels: ["no", "yes"] },
  { key: "region", label: "region", levels: ["northeast", "northwest", "southeast", "southwest"] },
  { key: "age_band", label: "age group", levels: ["18-29", "30-39", "40-49", "50-64"] },
  { key: "sex", label: "sex", levels: ["female", "male"] },
];

// Navy, amber, rust brown and soft plum: chosen by the student to go with the green-and-gold
// theme (no pink or teal). Checked with the dataviz palette validator: every pair stays
// distinguishable, including for colour-blind viewers. Amber is a little pale on white, so picked
// dots keep their dark outline and every chart has a legend. Two-group columns (smoker, sex)
// use the first two: navy and amber.
export const GROUP_COLOURS = ["#2b5797", "#d98a1c", "#9c4321", "#8c6bb1"];

// Plain-language name for a group column, e.g. "age group" for age_band.
export const groupLabel = (column) => GROUP_COLUMNS.find((c) => c.key === column).label;

export function colourFor(column, group) {
  const col = GROUP_COLUMNS.find((c) => c.key === column);
  return GROUP_COLOURS[col.levels.indexOf(group)];
}
