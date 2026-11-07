// Group columns the user can colour by, with a fixed group order so each group
// always keeps the same colour.
export const GROUP_COLUMNS = [
  { key: "smoker", label: "smoker", levels: ["no", "yes"] },
  { key: "region", label: "region", levels: ["northeast", "northwest", "southeast", "southwest"] },
  { key: "age_band", label: "age_band", levels: ["18-29", "30-39", "40-49", "50-64"] },
  { key: "sex", label: "sex", levels: ["female", "male"] },
];

// Four colours checked to stay distinguishable for colour-blind viewers
// when all four appear together (blue, orange, aqua, dark violet).
export const GROUP_COLOURS = ["#2a78d6", "#eb6834", "#1baf7a", "#4a3aa7"];

export function colourFor(column, group) {
  const col = GROUP_COLUMNS.find((c) => c.key === column);
  return GROUP_COLOURS[col.levels.indexOf(group)];
}
