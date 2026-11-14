import { useState } from "react";

// A text box that only accepts whole numbers from min to max. While the typed text is not valid,
// the last valid value stays in use (the page says so). `reset(v)` sets both back to v.
export default function useWholeNumberInput(initial, min, max) {
  const [value, setValue] = useState(initial);
  const [text, setText] = useState(String(initial));
  const valid = (t) => /^\d+$/.test(t) && Number(t) >= min && Number(t) <= max;
  const onChange = (t) => {
    setText(t);
    if (valid(t)) setValue(Number(t));
  };
  const reset = (v) => {
    setValue(v);
    setText(String(v));
  };
  return { value, text, onChange, reset, isValid: valid(text), min, max };
}
