import { useEffect, useState } from "react";

// Decorative rolling numbers: each digit is a column 0-9 that slides to the right digit, like a
// gas-pump or cash-register counter. `rollIn` starts every digit at 0 and rolls up on first show.
export default function Odometer({ value, rollIn = false, className = "" }) {
  const [shown, setShown] = useState(rollIn ? value.replace(/\d/g, "0") : value);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  const chars = shown.split("");
  return (
    <span className={`odometer ${className}`} aria-label={value} role="text">
      {chars.map((ch, i) => {
        const key = chars.length - i; // keyed from the right so columns stay put as numbers grow
        return /\d/.test(ch) ? (
          <span key={key} className="odo-digit" aria-hidden="true">
            <span className="odo-strip" style={{ transform: `translateY(-${Number(ch)}em)` }}>
              {"0123456789".split("").map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={key} className="odo-char" aria-hidden="true">{ch}</span>
        );
      })}
    </span>
  );
}
