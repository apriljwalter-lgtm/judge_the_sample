import { count } from "./format.js";

// A whole-number box, optionally with a slider beside it. Both use the same value from
// useWholeNumberInput, so typing and dragging always agree. `sliderMax` can be lower than the
// box's own maximum (the box still accepts larger numbers).
export default function NumberSlider({ label, input, help, unit, slider = true, sliderMax }) {
  const max = sliderMax ?? input.max;
  return (
    <div className="field number-slider">
      <label>
        <span className="field-label">{label}</span>{" "}
        <input
          type="text"
          inputMode="numeric"
          value={input.text}
          onChange={(e) => input.onChange(e.target.value.trim())}
          aria-invalid={!input.isValid}
        />
        {unit}
      </label>
      {slider && (
        <input
          type="range"
          className="slider"
          min={input.min}
          max={max}
          step={1}
          value={Math.min(input.value, max)}
          onChange={(e) => input.onChange(e.target.value, "coin")}
          aria-label={`${label} slider`}
        />
      )}{" "}
      {input.isValid ? (
        <span className="field-help">{help}</span>
      ) : (
        <span className="error">
          Enter a whole number from {count(input.min)} to {count(input.max)}. Still using {count(input.value)}.
        </span>
      )}
    </div>
  );
}
