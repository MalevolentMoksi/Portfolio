/**
 * Ghostly Dragonfly — Aquatic spirit hunter
 * Animations: Wing beat staggered, abdomen shimmer, eye glow
 */

export const GhostlyDragonflySVG = () => (
  <svg
    width="112"
    height="72"
    viewBox="0 0 70 45"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Body axis */}
    <line x1="18" y1="24" x2="43" y2="24" stroke="currentColor" strokeWidth="0.7" opacity="0.72" />

    {/* Segmented abdomen */}
    <g className="abdomen-shimmer">
      <rect x="18" y="22.3" width="4" height="3.4" rx="0.9" stroke="currentColor" strokeWidth="0.55" opacity="0.86" fill="none" />
      <rect x="23" y="22.1" width="4.3" height="3.8" rx="1" stroke="currentColor" strokeWidth="0.55" opacity="0.84" fill="none" />
      <rect x="28.5" y="22" width="4.8" height="4" rx="1" stroke="currentColor" strokeWidth="0.55" opacity="0.82" fill="none" />
      <rect x="34.2" y="21.8" width="5" height="4.2" rx="1" stroke="currentColor" strokeWidth="0.55" opacity="0.8" fill="none" />
    </g>

    {/* Thorax and head */}
    <circle cx="40.5" cy="24" r="2.2" stroke="currentColor" strokeWidth="0.65" opacity="0.9" fill="none" />
    <circle cx="45" cy="23.5" r="1.4" stroke="currentColor" strokeWidth="0.6" opacity="0.88" fill="none" />

    {/* Eyes */}
    <circle className="dragonfly-eye" cx="45.8" cy="22.8" r="0.55" stroke="currentColor" strokeWidth="0.4" opacity="0.9" fill="none" />
    <circle className="dragonfly-eye" cx="45.8" cy="24.2" r="0.55" stroke="currentColor" strokeWidth="0.4" opacity="0.9" fill="none" />

    {/* Wings */}
    <g className="dragonfly-wing-upper-left">
      <path d="M 39 22 L 14 12 L 19 21 L 37 24" stroke="currentColor" strokeWidth="0.75" opacity="0.8" fill="none" />
      <line x1="21" y1="15" x2="30" y2="21" stroke="currentColor" strokeWidth="0.22" opacity="0.36" />
    </g>
    <g className="dragonfly-wing-upper-right">
      <path d="M 41 22 L 23 12 L 28 20 L 42 23" stroke="currentColor" strokeWidth="0.68" opacity="0.68" fill="none" />
      <line x1="29" y1="15" x2="35" y2="20" stroke="currentColor" strokeWidth="0.2" opacity="0.34" />
    </g>
    <g className="dragonfly-wing-lower-left">
      <path d="M 39 26 L 15 31 L 22 35 L 37 27" stroke="currentColor" strokeWidth="0.7" opacity="0.75" fill="none" />
    </g>
    <g className="dragonfly-wing-lower-right">
      <path d="M 41 26 L 25 31 L 31 34 L 42 27" stroke="currentColor" strokeWidth="0.64" opacity="0.64" fill="none" />
    </g>

    {/* Trail */}
    <g className="dragonfly-trail" opacity="0.26">
      <ellipse cx="16" cy="24" rx="5" ry="5.5" fill="currentColor" />
      <ellipse cx="23" cy="24" rx="3" ry="4" fill="currentColor" />
    </g>
  </svg>
);
