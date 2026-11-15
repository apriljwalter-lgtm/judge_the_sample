import { useEffect, useRef, useState } from "react";
import { count, percent } from "./format.js";
import { GROUP_COLUMNS, GROUP_COLOURS } from "./groups.js";
import Odometer from "./Odometer.jsx";
import { playSound, prefersReducedMotion } from "./celebrate.js";

// Decorative picture of the two populations (descriptive only, no sampling results): one row of
// little people per age group, each figure = 10 people (rounded). The simulated children (0-17)
// are drawn as smaller figures. "Add the children" replays them joining the population.
const PER_ICON = 10;
const ADD_MS = 3000;
const CHILD_COLOUR = "#2e8b57"; // emerald; validated alongside the four age-group colors
const AGE_LEVELS = GROUP_COLUMNS.find((c) => c.key === "age_band").levels;
const colourFor = (band) => (band === "0-17" ? CHILD_COLOUR : GROUP_COLOURS[AGE_LEVELS.indexOf(band)]);

function Person({ colour, child, hop }) {
  const w = child ? 7.5 : 10;
  const h = child ? 12 : 16;
  return (
    <svg viewBox="0 0 10 16" width={w} height={h} className={hop ? "person hop" : "person"} aria-hidden="true">
      <circle cx="5" cy="3.2" r="2.7" fill={colour} />
      <path d="M1.2 15.6 V9.6 Q1.2 6.4 5 6.4 Q8.8 6.4 8.8 9.6 V15.6 Z" fill={colour} />
    </svg>
  );
}

export default function PopulationPictograph({ bands, baseSizes, modSizes, N }) {
  const childIndex = bands.indexOf("0-17");
  const childrenTotal = modSizes[childIndex];
  const [added, setAdded] = useState(false); // children appear only after "Add the children"
  const [frac, setFrac] = useState(null); // 0-1 while the children are being added
  const frame = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    setFrac(null);
  }, [childrenTotal]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const addChildren = () => {
    if (frac !== null || childrenTotal === 0) return;
    if (prefersReducedMotion()) {
      setAdded(true);
      return;
    }
    const start = performance.now();
    let lastClink = 0;
    const step = (now) => {
      const f = Math.min(1, (now - start) / ADD_MS);
      if (now - lastClink > 130 && f < 1) {
        lastClink = now;
        playSound("coin");
      }
      if (f < 1) {
        setFrac(f);
        frame.current = requestAnimationFrame(step);
      } else {
        setFrac(null);
        setAdded(true);
      }
    };
    setFrac(0);
    frame.current = requestAnimationFrame(step);
  };

  const adding = frac !== null;
  const shownChildren = adding ? Math.round(frac * childrenTotal) : added ? childrenTotal : 0;
  const total = N + shownChildren;

  return (
    <figure className="pictograph" aria-label="Picture of the baseline and modified populations by age group">
      <div className="pictograph-head">
        <button type="button" className="button watch-draw" onClick={addChildren}
          disabled={adding || childrenTotal === 0} data-tour="add-children">
          {adding ? "Adding…" : added ? "▶ Add them again" : "▶ Add the children"}
        </button>
      </div>
      {bands.map((band, i) => {
        const child = i === childIndex;
        const size = child ? shownChildren : modSizes[i];
        const icons = Math.round(size / PER_ICON);
        const baseShare = baseSizes[i] / N;
        const nowShare = size / total;
        return (
          <div key={band} className={child ? "picto-row picto-children" : "picto-row"}>
            <div className="picto-label">
              <span className="swatch" style={{ background: colourFor(band) }} aria-hidden="true" />
              <strong>{band}</strong>
              {child && <span className="picto-tag">simulated</span>}
              <span className="picto-count">
                {count(size)} people · {percent(baseShare)} → <strong>{percent(nowShare)}</strong>
              </span>
            </div>
            <div className="picto-people">
              {Array.from({ length: icons }, (_, k) => (
                <Person key={k} colour={colourFor(band)} child={child} hop={child && adding} />
              ))}
              {child && icons === 0 && (
                <span className="picto-empty">
                  {childrenTotal === 0
                    ? "no children set (see Modified population settings)"
                    : `${count(childrenTotal)} simulated children waiting: press Add the children`}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <figcaption className="picto-total">
        Baseline {count(N)} + <Odometer value={count(shownChildren)} /> simulated children ={" "}
        <strong><Odometer value={count(total)} /></strong> people
        <span className="picto-note">Each figure = {PER_ICON} people (rounded). Shares: baseline → modified.</span>
      </figcaption>
    </figure>
  );
}
