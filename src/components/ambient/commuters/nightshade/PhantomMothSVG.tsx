/**
 * Phantom Moth — Spectral butterfly/moth
 * Animations: Wing flap, shimmer, body bob
 */

export const PhantomMothSVG = () => (
  <svg
    width="96"
    height="80"
    viewBox="0 0 60 50"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="moth-body">
      <path d="M 21 24 Q 29 20 37 23 Q 30 28 22 27" stroke="currentColor" strokeWidth="0.82" opacity="0.88" fill="none" />
      <circle cx="39" cy="23" r="1.2" stroke="currentColor" strokeWidth="0.55" opacity="0.84" fill="none" />
      <line x1="39" y1="22.4" x2="43" y2="19" stroke="currentColor" strokeWidth="0.32" opacity="0.62" />
      <line x1="39" y1="23.6" x2="43" y2="26.7" stroke="currentColor" strokeWidth="0.32" opacity="0.62" />
    </g>

    {/* Wings tuned as side-profile moth */}
    <g className="wing wing-upper-left">
      <path d="M 29 23 Q 18 14 8 18 Q 11 26 27 27" stroke="currentColor" strokeWidth="0.9" opacity="0.84" fill="none" />
      <path d="M 24 21 Q 17 18 12 20" stroke="currentColor" strokeWidth="0.28" opacity="0.4" fill="none" />
    </g>
    <g className="wing wing-upper-right">
      <path d="M 31 23 Q 25 16 19 14 Q 20 20 28 26" stroke="currentColor" strokeWidth="0.78" opacity="0.72" fill="none" />
      <path d="M 28 21 Q 25 18 22 17" stroke="currentColor" strokeWidth="0.25" opacity="0.36" fill="none" />
    </g>
    <g className="wing wing-lower-left">
      <path d="M 28 26 Q 16 31 10 36 Q 16 39 29 33" stroke="currentColor" strokeWidth="0.8" opacity="0.78" fill="none" />
    </g>
    <g className="wing wing-lower-right">
      <path d="M 31 26 Q 24 31 21 36 Q 27 36 32 31" stroke="currentColor" strokeWidth="0.7" opacity="0.66" fill="none" />
    </g>

    <g className="moth-shimmer" opacity="0.24">
      <ellipse cx="25" cy="26" rx="16" ry="11" stroke="currentColor" strokeWidth="0.36" fill="none" />
    </g>
  </svg>
);
