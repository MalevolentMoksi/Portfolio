/**
 * Bioluminescent Flower — Glowing petals
 * Animations: Petal sway, stamen throb, aura pulse
 */

export const BioluminescentFlowerSVG = () => (
  <svg
    width="80"
    height="96"
    viewBox="0 0 50 60"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Stem and sepals */}
    <line x1="25" y1="34" x2="25" y2="51" stroke="currentColor" strokeWidth="0.85" opacity="0.78" />
    <path d="M 25 34 L 20 38" stroke="currentColor" strokeWidth="0.6" opacity="0.55" fill="none" />
    <path d="M 25 34 L 30 38" stroke="currentColor" strokeWidth="0.6" opacity="0.55" fill="none" />

    {/* Petals */}
    <g className="petal petal-1">
      <ellipse cx="25" cy="18" rx="5" ry="11" stroke="currentColor" strokeWidth="0.9" opacity="0.86" fill="none" />
    </g>
    <g className="petal petal-2">
      <ellipse cx="17" cy="22" rx="4.2" ry="8.5" transform="rotate(-28 17 22)" stroke="currentColor" strokeWidth="0.85" opacity="0.8" fill="none" />
    </g>
    <g className="petal petal-3">
      <ellipse cx="33" cy="22" rx="4.2" ry="8.5" transform="rotate(28 33 22)" stroke="currentColor" strokeWidth="0.85" opacity="0.8" fill="none" />
    </g>
    <g className="petal petal-4">
      <ellipse cx="20" cy="14" rx="3.5" ry="7" transform="rotate(-45 20 14)" stroke="currentColor" strokeWidth="0.75" opacity="0.72" fill="none" />
    </g>
    <g className="petal petal-5">
      <ellipse cx="30" cy="14" rx="3.5" ry="7" transform="rotate(45 30 14)" stroke="currentColor" strokeWidth="0.75" opacity="0.72" fill="none" />
    </g>

    {/* Center */}
    <g className="stamen">
      <circle cx="25" cy="24" r="2.3" stroke="currentColor" strokeWidth="0.7" opacity="0.9" fill="currentColor" fillOpacity="0.08" />
      <circle className="stamen-glow" cx="25" cy="24" r="1.2" stroke="currentColor" strokeWidth="0.4" opacity="0.82" fill="none" />
      <line x1="24" y1="22" x2="22" y2="19" stroke="currentColor" strokeWidth="0.3" opacity="0.45" />
      <line x1="26" y1="22" x2="28" y2="19" stroke="currentColor" strokeWidth="0.3" opacity="0.45" />
    </g>

    <g className="flower-aura" opacity="0.3">
      <circle cx="25" cy="24" r="12" stroke="currentColor" strokeWidth="0.45" fill="none" />
      <circle cx="25" cy="24" r="16" stroke="currentColor" strokeWidth="0.3" fill="none" />
    </g>
  </svg>
);
