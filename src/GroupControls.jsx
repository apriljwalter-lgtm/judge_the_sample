import { GROUP_COLUMNS } from "./groups.js";

export default function GroupControls({ value, onChange }) {
  return (
    <fieldset className="radios">
      <legend>Colour the dots by</legend>
      {GROUP_COLUMNS.map((c) => (
        <label key={c.key}>
          <input
            type="radio"
            name="group-column"
            value={c.key}
            checked={value === c.key}
            onChange={() => onChange(c.key)}
          />
          {c.label}
        </label>
      ))}
    </fieldset>
  );
}
