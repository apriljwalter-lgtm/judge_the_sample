// One colour per sampling method on the Experiments and Challenge range charts (decorative
// identity only; text stays in ink colours). Taken from the student's chosen dot set (navy,
// amber, rust brown) and checked with the dataviz palette validator (light surface, all pairs):
// lightness, chroma and colour-blind separation pass; amber is a little pale on white, so every
// row also carries its method name in the label and the table.
export const METHOD_COLORS = {
  srs: "#2b5797", // Simple random: navy
  systematic: "#d98a1c", // Systematic: amber
  stratified: "#9c4321", // Stratified: rust brown
};

// Picked-row strip: deep money-green marks on a bright gold bar (contrast 8.4:1).
export const PICK_STRIP = { background: "#f3d36b", mark: "#0f3d22" };

/** A small colour dot shown beside a method's name. */
export function MethodSwatch({ method }) {
  return <span className="method-swatch" style={{ background: METHOD_COLORS[method] }} aria-hidden="true" />;
}
