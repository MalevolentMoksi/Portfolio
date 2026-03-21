/**
 * Data Core Module — planar cyber cube glyph
 * Animations: core pulse, line scan, corner node blink
 */

export const DataCubeSVG = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 50 50"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect className="cube-shell" x="10" y="10" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="0.9" opacity="0.9" fill="none" />
    <rect x="14" y="14" width="22" height="22" rx="1.3" stroke="currentColor" strokeWidth="0.6" opacity="0.62" fill="none" />

    <line className="cube-scan" x1="14" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="0.5" opacity="0.55" />
    <line x1="14" y1="26" x2="36" y2="26" stroke="currentColor" strokeWidth="0.3" opacity="0.38" />
    <line x1="20" y1="14" x2="20" y2="36" stroke="currentColor" strokeWidth="0.3" opacity="0.38" />
    <line x1="30" y1="14" x2="30" y2="36" stroke="currentColor" strokeWidth="0.3" opacity="0.38" />

    <circle className="cube-vertex" cx="10" cy="10" r="1" stroke="currentColor" strokeWidth="0.5" opacity="0.86" fill="none" />
    <circle className="cube-vertex" cx="40" cy="10" r="1" stroke="currentColor" strokeWidth="0.5" opacity="0.86" fill="none" />
    <circle className="cube-vertex" cx="40" cy="40" r="1" stroke="currentColor" strokeWidth="0.5" opacity="0.86" fill="none" />
    <circle className="cube-vertex" cx="10" cy="40" r="1" stroke="currentColor" strokeWidth="0.5" opacity="0.86" fill="none" />

    <circle className="cube-core" cx="25" cy="25" r="2" stroke="currentColor" strokeWidth="0.5" opacity="0.75" fill="none" />
  </svg>
);
