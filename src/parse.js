// Parse the supplied CSV text into one object per row.
// The supplied CSVs have no quoted fields, so a plain split on commas is enough
// (the same approach as load_data.mjs). Columns listed in `numericColumns` are
// converted to numbers; any value that is not a finite number stops the app with
// an error rather than being silently dropped.
export function parseCsv(text, numericColumns = []) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const cols = header.split(",");
  return lines.map((line, i) => {
    const values = line.split(",");
    if (values.length !== cols.length) {
      throw new Error(`Row ${i + 1}: expected ${cols.length} values, found ${values.length}`);
    }
    const row = Object.fromEntries(values.map((v, j) => [cols[j], v]));
    for (const c of numericColumns) {
      const x = Number(row[c]);
      if (row[c] === "" || !Number.isFinite(x)) {
        throw new Error(`Row ${i + 1}: column "${c}" is not a number ("${row[c]}")`);
      }
      row[c] = x;
    }
    return row;
  });
}
