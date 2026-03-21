/**
 * Mining Drill Head — Rotating helical bit with auger
 * Animations: Bit helix spin, auger screw, spark ejection
 */

export const MiningDrillSVG = () => (
  <svg
    width="128"
    height="56"
    viewBox="0 0 80 35"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Chassis */}
    <rect x="10" y="13" width="28" height="10" rx="1.3" stroke="currentColor" strokeWidth="0.8" opacity="0.82" fill="none" />
    <line x1="14" y1="16" x2="34" y2="16" stroke="currentColor" strokeWidth="0.35" opacity="0.42" />

    {/* Drive shaft */}
    <rect x="38" y="15.3" width="15" height="5.4" rx="0.8" stroke="currentColor" strokeWidth="0.7" opacity="0.78" fill="none" />

    {/* Drill bit */}
    <g className="drill-bit">
      <circle cx="59" cy="18" r="5" stroke="currentColor" strokeWidth="0.95" opacity="0.9" fill="none" />
      <path d="M 59 13.2 Q 62 15 59 18 Q 56 21 59 22.8" stroke="currentColor" strokeWidth="0.55" opacity="0.78" fill="none" />
      <path d="M 56 14 Q 59 15.5 56 18.5 Q 53 21 56 22.5" stroke="currentColor" strokeWidth="0.5" opacity="0.68" fill="none" />
      <path d="M 62 14 Q 65 15.5 62 18.5 Q 59 21 62 22.5" stroke="currentColor" strokeWidth="0.5" opacity="0.68" fill="none" />
    </g>

    {/* Auger housing */}
    <g className="auger-bucket">
      <rect x="52" y="7" width="14" height="6" rx="0.9" stroke="currentColor" strokeWidth="0.65" opacity="0.74" fill="none" />
      <line x1="56" y1="7" x2="56" y2="13" stroke="currentColor" strokeWidth="0.3" opacity="0.44" />
      <line x1="60" y1="7" x2="60" y2="13" stroke="currentColor" strokeWidth="0.3" opacity="0.44" />
      <line x1="64" y1="7" x2="64" y2="13" stroke="currentColor" strokeWidth="0.3" opacity="0.44" />
    </g>

    {/* Sparks */}
    <g className="drill-sparks">
      <line x1="59" y1="23" x2="56" y2="31" stroke="currentColor" strokeWidth="0.45" opacity="0.6" />
      <line x1="59" y1="23" x2="59" y2="32" stroke="currentColor" strokeWidth="0.45" opacity="0.6" />
      <line x1="59" y1="23" x2="62" y2="31" stroke="currentColor" strokeWidth="0.45" opacity="0.6" />
    </g>
  </svg>
);
