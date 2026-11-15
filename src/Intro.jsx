import { useEffect, useState } from "react";
import { MedicalLetter, LETTER_W, LETTER_H } from "./MoneyArt.jsx";
import { playSound, paperTimeline, playPaperClip } from "./celebrate.js";

const WIDTH = 220; // letter width on screen (px)
const PANEL = (WIDTH * LETTER_H) / LETTER_W / 3; // height of one third of the letter (px)
const RISE = 0.9; // seconds the letter takes to slide out
const UNFOLD = 0.55; // seconds each third takes to unfold

// When each step starts (seconds after the click). With the recorded paper rustle, the steps
// are placed on the rustles found in the recording: the flap opens on the first rustle, and each
// third of the letter unfolds on the next rustle after the letter is out. Without it, fixed times.
function makePlan() {
  const tl = paperTimeline();
  let flap = 0.05;
  let slide = 0.6;
  let top = 1.6;
  let bot = 2.15;
  if (tl && tl.onsets.length > 0) {
    flap = tl.onsets[0];
    slide = flap + 0.45;
    const after = (t) => tl.onsets.find((o) => o >= t);
    top = after(slide + RISE - 0.15) ?? slide + RISE;
    bot = after(top + UNFOLD - 0.1) ?? top + UNFOLD + 0.05;
  }
  const chaChing = bot + UNFOLD + 0.05;
  const zoom = chaChing + 0.3;
  const fade = zoom + 0.85;
  return { recorded: Boolean(tl), flap, slide, top, bot, chaChing, zoom, fade, done: fade + 0.5 };
}

// One third of the letter: the front shows its slice of the bill; folding panels also have a
// blank back (the back of the paper), seen while the letter is folded.
function Panel({ index, withBack }) {
  return (
    <div className={`fold fold-${["top", "mid", "bot"][index]}`}>
      <div className="face front">
        <div className="slice" style={{ top: -index * PANEL }}>
          <MedicalLetter width={WIDTH} />
        </div>
      </div>
      {withBack && <div className="face back" />}
    </div>
  );
}

// Decorative starting screen: a closed envelope waits for the user. Opening it lifts the flap,
// pulls out a medical bill folded in thirds, unfolds the top third, then the bottom third, plays
// a cha-ching, zooms toward the viewer and fades to the app's tabs, all timed to the paper sound.
// Skip (or Esc) goes straight to the app; `onDone` is called at the end.
export default function Intro({ onDone }) {
  const [plan, setPlan] = useState(null); // null until the envelope is opened

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  useEffect(() => {
    if (!plan) return undefined;
    const ms = (s) => Math.round(s * 1000);
    const steps = plan.recorded
      ? [[0, () => playPaperClip()]]
      : [
          [ms(plan.flap), () => playSound("paper-flap")],
          [ms(plan.slide), () => playSound("paper-slide")],
          [ms(plan.top), () => playSound("paper-unfold")],
          [ms(plan.bot), () => playSound("paper-unfold")],
        ];
    steps.push([ms(plan.chaChing), () => playSound("cha-ching")]);
    steps.push([ms(plan.done), onDone]);
    const timers = steps.map(([t, fn]) => setTimeout(fn, t));
    return () => timers.forEach(clearTimeout);
  }, [plan, onDone]);

  const open = () => {
    if (plan) return;
    const next = makePlan();
    console.info("Envelope timing (seconds after click):", next);
    setPlan(next);
  };
  const s = (x) => `${x.toFixed(2)}s`;
  const timing = plan
    ? {
        "--t-flap": s(plan.flap), "--t-slide": s(plan.slide), "--t-top": s(plan.top),
        "--t-bot": s(plan.bot), "--t-zoom": s(plan.zoom), "--t-fade": s(plan.fade),
      }
    : undefined;

  return (
    <div className={plan ? "intro opened" : "intro"} style={timing} role="dialog"
      aria-label="Starting screen: a medical bill in an envelope">
      <div className="intro-stage" onClick={plan ? undefined : open} aria-hidden="true">
        <div className="env-back" />
        <div className="intro-bill" style={{ width: WIDTH, height: PANEL, "--panel": `${PANEL}px` }}>
          <Panel index={0} withBack />
          <Panel index={1} />
          <Panel index={2} withBack />
        </div>
        <div className="env-front">
          <span className="env-seal">$</span>
        </div>
        <div className="env-flap" />
      </div>
      <div className="intro-text">
        <p className="intro-tagline">
          A healthcare bill has arrived.
          <br />
          <strong>Can one sample tell you what care really costs?</strong>
        </p>
        <button type="button" className="intro-open" onClick={open} disabled={Boolean(plan)} autoFocus>
          Open the envelope
        </button>
      </div>
      <button type="button" className="intro-skip" onClick={onDone}>
        Skip intro
      </button>
    </div>
  );
}
