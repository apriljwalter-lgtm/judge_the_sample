import { useEffect, useState } from "react";
import { isMuted, onMuteChange, playSound, setMuted } from "./celebrate.js";

// Corner button to turn the money sounds on or off (remembered in this browser).
export default function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted);
  useEffect(() => onMuteChange(setMutedState), []);
  const toggle = () => {
    const next = !muted;
    setMuted(next);
    if (!next) playSound("coin");
  };
  return (
    <button type="button" className="sound-toggle" onClick={toggle} aria-pressed={!muted}
      title={muted ? "Turn money sounds on" : "Mute money sounds"}>
      <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span> {muted ? "Sound off" : "Sound on"}
    </button>
  );
}
