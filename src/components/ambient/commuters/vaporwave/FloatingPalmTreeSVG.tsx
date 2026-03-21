/**
 * Floating Palm Tree — Organic multi-layer fronds
 * Animations: Frond multi-layer sway, aura pulse, slow rotation
 */

export const FloatingPalmTreeSVG = () => (
  <svg
    width="80"
    height="96"
    viewBox="0 0 50 60"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="palm-rig">
      {/* Trunk */}
      <path d="M 24 36 Q 23 44 25 52" stroke="currentColor" strokeWidth="1" opacity="0.82" fill="none" />
      <path d="M 27 36 Q 27 45 29 52" stroke="currentColor" strokeWidth="0.9" opacity="0.76" fill="none" />

      {/* Fronds */}
      <g className="palm-fronds-top">
        <path d="M 26 36 Q 19 28 11 23" stroke="currentColor" strokeWidth="1.05" opacity="0.84" fill="none" />
        <path d="M 26 36 Q 33 28 41 23" stroke="currentColor" strokeWidth="1.05" opacity="0.84" fill="none" />
        <path d="M 26 36 Q 16 34 8 33" stroke="currentColor" strokeWidth="0.95" opacity="0.78" fill="none" />
        <path d="M 26 36 Q 36 34 44 33" stroke="currentColor" strokeWidth="0.95" opacity="0.78" fill="none" />
      </g>

      <g className="palm-fronds-mid">
        <path d="M 26 37 Q 20 31 14 27" stroke="currentColor" strokeWidth="0.9" opacity="0.72" fill="none" />
        <path d="M 26 37 Q 32 31 38 27" stroke="currentColor" strokeWidth="0.9" opacity="0.72" fill="none" />
      </g>

      <g className="palm-fronds-base">
        <path d="M 26 38 Q 21 35 17 33" stroke="currentColor" strokeWidth="0.78" opacity="0.65" fill="none" />
        <path d="M 26 38 Q 31 35 35 33" stroke="currentColor" strokeWidth="0.78" opacity="0.65" fill="none" />
      </g>

      <g className="palm-aura" opacity="0.28">
        <circle cx="26" cy="30" r="15" stroke="currentColor" strokeWidth="0.45" fill="none" />
        <circle cx="26" cy="30" r="19" stroke="currentColor" strokeWidth="0.3" fill="none" />
      </g>
    </g>
  </svg>
);
