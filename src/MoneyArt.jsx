// Decorative money drawings (original, stylised: not a copy of any real banknote).

export function Bill({ width = 70 }) {
  return (
    <svg viewBox="0 0 140 64" width={width} height={(width * 64) / 140} aria-hidden="true" className="bill-art">
      <rect x="1" y="1" width="138" height="62" rx="5" fill="#3f8f57" stroke="#1d5a32" strokeWidth="2" />
      <rect x="7" y="7" width="126" height="50" rx="3" fill="none" stroke="#cfe9c6" strokeWidth="1.5" strokeDasharray="4 2" />
      <path d="M12 32 Q 30 18 48 32 T 84 32" fill="none" stroke="#5aa66f" strokeWidth="1" opacity="0.7" />
      <path d="M56 32 Q 74 46 92 32 T 128 32" fill="none" stroke="#5aa66f" strokeWidth="1" opacity="0.7" />
      <ellipse cx="70" cy="32" rx="19" ry="21" fill="#dcefd5" stroke="#1d5a32" strokeWidth="1.5" />
      <text x="70" y="41" textAnchor="middle" fontSize="26" fontWeight="700" fill="#1d5a32" fontFamily="Georgia, serif">$</text>
      <text x="17" y="22" fontSize="12" fontWeight="700" fill="#eaf6e4" fontFamily="Georgia, serif">$</text>
      <text x="123" y="55" fontSize="12" fontWeight="700" fill="#eaf6e4" fontFamily="Georgia, serif" textAnchor="end">$</text>
    </svg>
  );
}

// A generic (made-up) medical bill printed as a portrait letter, used in the opening scene.
// It is 200 x 270 units: three equal panels of 90 (the letter is folded in thirds).
export const LETTER_W = 200;
export const LETTER_H = 270;
const FONT = "system-ui, sans-serif";

export function MedicalLetter({ width = 220 }) {
  const rows = [
    ["Office visit", 122],
    ["Lab tests", 138],
    ["X-ray", 154],
    ["Prescriptions", 170],
  ];
  return (
    <svg viewBox={`0 0 ${LETTER_W} ${LETTER_H}`} width={width} height={(width * LETTER_H) / LETTER_W}
      aria-hidden="true" className="bill-art" style={{ display: "block" }}>
      <rect x="0" y="0" width="200" height="270" fill="#ffffff" />
      {/* Panel 1: letterhead */}
      <rect x="0" y="0" width="200" height="24" fill="#1e6b3a" />
      <text x="10" y="16" fontSize="10" fontWeight="700" fill="#ffffff" fontFamily={FONT} letterSpacing="1">HEALTHCARE STATEMENT</text>
      <text x="10" y="42" fontSize="8" fill="#52514e" fontFamily={FONT}>Patient: 1 of 1,338</text>
      <text x="10" y="54" fontSize="8" fill="#52514e" fontFamily={FONT}>Account: SAMPLE-0001</text>
      <text x="190" y="42" fontSize="8" fill="#52514e" fontFamily={FONT} textAnchor="end">Statement of charges</text>
      <text x="10" y="78" fontSize="6.5" fill="#898781" fontFamily={FONT}>Simulated teaching data - not a real bill</text>
      {/* Panel 2: charges */}
      <text x="10" y="104" fontSize="9.5" fontWeight="700" fill="#0f3d22" fontFamily={FONT}>Charges</text>
      {rows.map(([label, y]) => (
        <g key={label}>
          <text x="10" y={y} fontSize="8.5" fill="#3b3a36" fontFamily={FONT}>{label}</text>
          <line x1="72" x2="158" y1={y - 2} y2={y - 2} stroke="#c9c6b8" strokeDasharray="1.5 2" />
          <text x="190" y={y} fontSize="8.5" fill="#3b3a36" fontFamily={FONT} textAnchor="end">$ ? ? ?</text>
        </g>
      ))}
      {/* Panel 3: amount due */}
      <line x1="10" x2="190" y1="194" y2="194" stroke="#1e6b3a" strokeWidth="1.2" />
      <text x="10" y="216" fontSize="11" fontWeight="700" fill="#0f3d22" fontFamily={FONT}>AMOUNT DUE</text>
      <text x="190" y="219" fontSize="17" fontWeight="700" fill="#b42318" fontFamily="Georgia, serif" textAnchor="end">$ ? ? ?</text>
      <text x="100" y="248" fontSize="8" fontStyle="italic" fill="#52514e" fontFamily="Georgia, serif" textAnchor="middle">
        Which sample would you trust to estimate it?
      </text>
      {/* Faint fold creases */}
      <line x1="0" x2="200" y1="90" y2="90" stroke="#e4e1d6" strokeWidth="0.8" />
      <line x1="0" x2="200" y1="180" y2="180" stroke="#e4e1d6" strokeWidth="0.8" />
    </svg>
  );
}

export function Coin({ size = 30 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="#e3b93c" stroke="#9c7a17" strokeWidth="2" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="#f5dc8a" strokeWidth="1.5" />
      <text x="20" y="27" textAnchor="middle" fontSize="18" fontWeight="700" fill="#8a6a10" fontFamily="Georgia, serif">$</text>
    </svg>
  );
}
