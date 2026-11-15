import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// Short guided tours, one per tab. Each step spotlights the first element with a matching
// data-tour attribute and explains what it is and how to read it (never what the results show).
export const TOURS = {
  single: [
    { target: "settings", title: "Settings", text: "Choose how many people go in each sample (n) and a seed. The box and the slider always agree. You can also color the dots by a group." },
    { target: "dot-chart", title: "Every person is a dot", text: "Each dot is one of the 1,338 people, placed by their charges. Solid dots with an outline are the people this sample picked; faint dots are everyone else. The black line is the true mean; the dashed line is this sample's mean." },
    { target: "watch-draw", title: "Watch the draw", text: "Press this to watch the people being picked one at a time." },
    { target: "receipt", title: "The receipt", text: "This sample's mean next to the true mean, and how far apart they are for this one sample. Tap a gold coin for what a term means." },
    { target: "how-picked", title: "How the people were picked", text: "A plain-language description of the method. 'Show the details' has the maths." },
    { target: "row-strip", title: "Where the picked people sit in the file", text: "The gold bar is the whole file from the first row to the last; each green mark is a picked person." },
    { target: "shares", title: "The mix of groups", text: "Compares each sample's share of each group with the whole file." },
  ],
  experiments: [
    { target: "exp-settings", title: "Experiment settings", text: "Choose how many samples the computer takes for each result (100 or 1,000) and the seed." },
    { target: "range-chart", title: "Many samples at once", text: "Each row is one way of sampling. Each faint dot is the mean from one sample, the bold bar covers the middle 95% of them, the large dot is their mean, and the black line is the true mean." },
    { target: "summary-table", title: "The numbers behind each row", text: "Bias, SD and RMSE for each row. Tap a gold coin for what each one means." },
    { target: "experiment-b", title: "Experiment B", text: "The same method each time; only the number of people per sample changes." },
  ],
  challenge: [
    { target: "mod-settings", title: "Build the modified population", text: "Add simulated children aged 0-17 (not real people) to a copy of the file. The seed makes the copy repeatable; Reset returns to the hypothesis values." },
    { target: "populations", title: "Baseline and modified", text: "Group sizes, weights and each population's own true mean." },
    { target: "ch-settings", title: "Same settings for all four", text: "The same n, number of samples and seed are used for every result." },
    { target: "ch-results", title: "Four results", text: "Each method on each population. Every row is compared with its own population's true mean; striped bars are the modified population." },
  ],
};

// Where to put the note: below the highlighted area if it fits, else above, else beside it (left or
// right), else at the bottom of the screen. Always kept fully inside the window.
function placeNote(rect, w, h) {
  const gap = 18;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampX = (x) => Math.min(Math.max(12, x), vw - w - 12);
  const clampY = (y) => Math.min(Math.max(12, y), vh - h - 12);
  if (!rect) return { top: clampY(80), left: 12 };
  if (rect.bottom + gap + h <= vh - 12) return { top: rect.bottom + gap, left: clampX(rect.left) };
  if (rect.top - gap - h >= 12) return { top: rect.top - gap - h, left: clampX(rect.left) };
  if (rect.left - gap - w >= 12) return { top: clampY(rect.top), left: rect.left - gap - w };
  if (rect.right + gap + w <= vw - 12) return { top: clampY(rect.top), left: rect.right + gap };
  return { top: vh - h - 12, left: clampX(rect.left) };
}

export default function Tour({ steps, onClose }) {
  const available = steps.filter((s) => document.querySelector(`[data-tour="${s.target}"]`));
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [size, setSize] = useState({ w: 340, h: 200 }); // the note's real size, measured below
  const noteRef = useRef(null);
  const step = available[i];

  useLayoutEffect(() => {
    const box = noteRef.current?.getBoundingClientRect();
    if (box && (Math.abs(box.width - size.w) > 1 || Math.abs(box.height - size.h) > 1)) {
      setSize({ w: box.width, h: box.height });
    }
  });

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) setRect(el.getBoundingClientRect());
  }, [step]);

  useLayoutEffect(() => {
    if (!step) return undefined;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(measure, 400);
    measure();
    return () => clearTimeout(t);
  }, [step, measure]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => Math.min(available.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [available.length, onClose, measure]);

  if (!step) return null;
  const pad = 8;
  const spot = rect && { top: rect.top - pad, left: rect.left - pad, right: rect.right + pad, bottom: rect.bottom + pad };
  const { top: noteTop, left: noteLeft } = placeNote(spot, size.w, size.h);

  return (
    <div className="tour" role="dialog" aria-label={`Tour step ${i + 1} of ${available.length}: ${step.title}`}>
      {rect && (
        <div
          className="tour-spot"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      )}
      <div className="tour-note" ref={noteRef} style={{ top: noteTop, left: noteLeft }}>
        <div className="tour-count">Step {i + 1} of {available.length}</div>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <div className="tour-buttons">
          <button type="button" className="link-button tour-skip" onClick={onClose}>Close tour</button>
          <span>
            <button type="button" className="button" onClick={() => setI(i - 1)} disabled={i === 0}>Back</button>{" "}
            {i < available.length - 1 ? (
              <button type="button" className="button tour-next" onClick={() => setI(i + 1)} autoFocus>Next</button>
            ) : (
              <button type="button" className="button tour-next" onClick={onClose} autoFocus>Done</button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
