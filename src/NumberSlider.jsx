import { useId } from "react";
import { count } from "./format.js";
import Term from "./Term.jsx";

// A whole-number box, optionally with a slider beside it. Both use the same value from
// useWholeNumberInput, so typing and dragging always agree. `sliderMax` can be lower than the
// box's own maximum (the box still accepts larger numbers). `term` adds a glossary coin, kept
// outside the <label> so clicking the label still focuses the box.
export default function NumberSlider({ label, term, input, help, unit, slider = true, sliderMax }) {
  const max = sliderMax ?? input.max;
  const id = `num-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const labelEl = <label htmlFor={id} className="field-label">{label}</label>;
  return (
    <div className="field number-slider">
      {term ? <Term id={term}>{labelEl}</Term> : labelEl}
      <span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={input.text}
          onChange={(e) => input.onChange(e.target.value.trim())}
          aria-invalid={!input.isValid}
        />
        {unit}
      </span>
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
