import { useId, useState } from "react";
import { GLOSSARY } from "./glossary.js";

// A term with a small gold coin beside it. Hovering, focusing or tapping the coin shows a
// plain-language definition (from glossary.js).
export default function Term({ id, children }) {
  const [open, setOpen] = useState(false);
  const tipId = `term-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const text = GLOSSARY[id];
  if (!text) return children ?? null;
  return (
    <span className="term" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      <button
        type="button"
        className="term-coin"
        aria-label="What does this mean?"
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ¢
      </button>
      {open && (
        <span role="tooltip" id={tipId} className="term-tip">
          {text}
        </span>
      )}
    </span>
  );
}
