import { useEffect, useState } from "react";
import { onRain, prefersReducedMotion } from "./celebrate.js";
import { Bill, Coin } from "./MoneyArt.jsx";

// Decorative only: a short burst of falling bills and coins over the page.
// The layer ignores the mouse (pointer-events: none), so it never blocks a click.
export default function CashRain() {
  const [bursts, setBursts] = useState([]);

  useEffect(
    () =>
      onRain(() => {
        if (prefersReducedMotion()) return;
        const id = `${Date.now()}-${Math.random()}`;
        const pieces = Array.from({ length: 26 }, (_, i) => ({
          i,
          coin: i % 5 === 0,
          left: Math.random() * 96,
          delay: Math.random() * 0.45,
          duration: 1.3 + Math.random() * 0.8,
          rot: Math.random() * 360 - 180,
          spin: (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 400),
          scale: 0.7 + Math.random() * 0.6,
        }));
        setBursts((b) => [...b, { id, pieces }]);
        setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 2800);
      }),
    []
  );

  return (
    <div className="cash-rain" aria-hidden="true">
      {bursts.flatMap((b) =>
        b.pieces.map((p) => (
          <span
            key={`${b.id}-${p.i}`}
            className="cash-piece"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--rot0": `${p.rot}deg`,
              "--spin": `${p.spin}deg`,
              "--scale": p.scale,
            }}
          >
            {p.coin ? <Coin size={28} /> : <Bill width={72} />}
          </span>
        ))
      )}
    </div>
  );
}
