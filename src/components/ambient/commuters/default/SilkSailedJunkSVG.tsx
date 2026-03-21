/**
 * Silk-Sailed Junk (Asian Ship) — Elegant grace
 * Animations: Sail flutter, hull bob, pennant wave
 */

export const SilkSailedJunkSVG = () => (
  <svg
    width="112"
    height="64"
    viewBox="0 0 70 40"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Hull — enclosed profile so it reads as a real vessel in motion */}
    <g className="junk-hull">
      <path
        d="M 8 24 Q 20 18 38 18 Q 53 18 64 22 L 60 29 Q 45 33 24 32 L 11 29 Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.9"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <path d="M 12 24 L 59 24" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
    </g>

    {/* Masts */}
    <line x1="24" y1="8" x2="24" y2="24" stroke="currentColor" strokeWidth="0.8" opacity="0.75" />
    <line x1="37" y1="10" x2="37" y2="24" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
    <line x1="48" y1="12" x2="48" y2="24" stroke="currentColor" strokeWidth="0.6" opacity="0.65" />

    {/* Main sail */}
    <g className="junk-sail-1">
      <path
        d="M 24 9 L 24 24 L 13 21 L 14 14 Z"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.82"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <line x1="15" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />
      <line x1="14" y1="19" x2="24" y2="19" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />
    </g>

    {/* Mid sail */}
    <g className="junk-sail-2">
      <path
        d="M 37 11 L 37 24 L 27 22 L 28 15 Z"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.74"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <line x1="29" y1="17" x2="37" y2="17" stroke="currentColor" strokeWidth="0.3" opacity="0.42" />
      <line x1="28" y1="20" x2="37" y2="20" stroke="currentColor" strokeWidth="0.3" opacity="0.42" />
    </g>

    {/* Rear sail */}
    <g className="junk-sail-3">
      <path
        d="M 48 13 L 48 24 L 40 23 L 41 17 Z"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.66"
        fill="currentColor"
        fillOpacity="0.05"
      />
      <line x1="42" y1="19" x2="48" y2="19" stroke="currentColor" strokeWidth="0.28" opacity="0.38" />
    </g>

    {/* Rigging */}
    <line x1="24" y1="10" x2="18" y2="24" stroke="currentColor" strokeWidth="0.3" opacity="0.45" />
    <line x1="37" y1="12" x2="32" y2="24" stroke="currentColor" strokeWidth="0.28" opacity="0.42" />
    <line x1="48" y1="14" x2="45" y2="24" stroke="currentColor" strokeWidth="0.26" opacity="0.38" />

    {/* Stern pennant */}
    <g className="junk-pennant">
      <line x1="12" y1="12" x2="12" y2="6" stroke="currentColor" strokeWidth="0.45" opacity="0.7" />
      <path d="M 12 7 L 6 8 L 12 10" stroke="currentColor" strokeWidth="0.5" opacity="0.72" fill="none" />
    </g>

    {/* Cabin and portholes */}
    <rect
      x="50"
      y="20"
      width="8"
      height="5"
      rx="0.8"
      stroke="currentColor"
      strokeWidth="0.6"
      opacity="0.72"
      fill="none"
    />
    <circle cx="52" cy="22.5" r="0.7" stroke="currentColor" strokeWidth="0.35" opacity="0.58" fill="none" />
    <circle cx="56" cy="22.5" r="0.7" stroke="currentColor" strokeWidth="0.35" opacity="0.58" fill="none" />
  </svg>
);
