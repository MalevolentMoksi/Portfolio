/**
 * Loading Progress Bar — System feedback
 * Animations: Fill advance (scaleX), stripe scroll, checkpoint glow
 */

export const LoadingBarSVG = () => (
  <svg
    width="120"
    height="32"
    viewBox="0 0 75 20"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Chassis */}
    <rect x="2" y="5" width="71" height="10" rx="2.2" stroke="currentColor" strokeWidth="0.7" opacity="0.55" fill="none" />

    {/* Progress lane */}
    <rect x="4" y="7" width="67" height="6" rx="1.4" stroke="currentColor" strokeWidth="0.45" opacity="0.36" fill="none" />

    <g className="loading-fill">
      <rect className="loading-progress" x="4" y="7" width="52" height="6" rx="1.4" fill="currentColor" opacity="0.35" />
      <g className="loading-stripes">
        <rect x="6" y="7" width="2" height="6" fill="currentColor" opacity="0.72" />
        <rect x="11" y="7" width="2" height="6" fill="currentColor" opacity="0.62" />
        <rect x="16" y="7" width="2" height="6" fill="currentColor" opacity="0.72" />
        <rect x="21" y="7" width="2" height="6" fill="currentColor" opacity="0.62" />
        <rect x="26" y="7" width="2" height="6" fill="currentColor" opacity="0.72" />
        <rect x="31" y="7" width="2" height="6" fill="currentColor" opacity="0.62" />
        <rect x="36" y="7" width="2" height="6" fill="currentColor" opacity="0.72" />
        <rect x="41" y="7" width="2" height="6" fill="currentColor" opacity="0.62" />
        <rect x="46" y="7" width="2" height="6" fill="currentColor" opacity="0.72" />
      </g>
      <rect className="loading-head" x="55" y="6.6" width="2.2" height="6.8" rx="0.6" fill="currentColor" opacity="0.8" />
    </g>

    {/* Label */}
    <text x="37" y="18" fontSize="3" textAnchor="middle" fill="currentColor" opacity="0.68" fontFamily="monospace">
      SYS LOAD
    </text>

    <g className="loading-checkpoints">
      <circle cx="18" cy="10" r="0.75" stroke="currentColor" strokeWidth="0.45" opacity="0.62" fill="none" />
      <circle cx="32" cy="10" r="0.75" stroke="currentColor" strokeWidth="0.45" opacity="0.62" fill="none" />
      <circle cx="46" cy="10" r="0.75" stroke="currentColor" strokeWidth="0.45" opacity="0.62" fill="none" />
      <circle cx="60" cy="10" r="0.75" stroke="currentColor" strokeWidth="0.45" opacity="0.62" fill="none" />
    </g>
  </svg>
);
