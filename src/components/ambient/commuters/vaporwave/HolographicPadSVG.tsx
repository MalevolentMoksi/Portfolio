/**
 * Holographic Pad — Flat tablet device
 * Animations: Screen glow pulse, scanline sweep, device rotation
 */

export const HolographicPadSVG = () => (
  <svg
    width="96"
    height="128"
    viewBox="0 0 60 80"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="pad-float">
    {/* Device frame */}
    <rect
      x="8"
      y="8"
      width="44"
      height="60"
      rx="3"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.9"
      fill="none"
    />

    {/* Screen area — glowing */}
    <g className="pad-screen">
      <rect x="12" y="12" width="36" height="52" rx="1.5" stroke="currentColor" strokeWidth="0.7" opacity="0.8" fill="none" />

      {/* Scanlines */}
      <g className="pad-scanlines" opacity="0.4">
        <line x1="12" y1="16" x2="48" y2="16" stroke="currentColor" strokeWidth="0.2" />
        <line x1="12" y1="20" x2="48" y2="20" stroke="currentColor" strokeWidth="0.2" />
        <line x1="12" y1="24" x2="48" y2="24" stroke="currentColor" strokeWidth="0.2" />
        <line x1="12" y1="28" x2="48" y2="28" stroke="currentColor" strokeWidth="0.2" />
        <line x1="12" y1="32" x2="48" y2="32" stroke="currentColor" strokeWidth="0.2" />
        <line x1="12" y1="36" x2="48" y2="36" stroke="currentColor" strokeWidth="0.2" />
        <line x1="12" y1="40" x2="48" y2="40" stroke="currentColor" strokeWidth="0.2" />
        <line x1="12" y1="44" x2="48" y2="44" stroke="currentColor" strokeWidth="0.2" />
        <line x1="12" y1="48" x2="48" y2="48" stroke="currentColor" strokeWidth="0.2" />
        <line x1="12" y1="52" x2="48" y2="52" stroke="currentColor" strokeWidth="0.2" />
        <line x1="12" y1="56" x2="48" y2="56" stroke="currentColor" strokeWidth="0.2" />
      </g>

      {/* Screen content gradient illusion */}
      <rect x="14" y="18" width="8" height="8" fill="currentColor" opacity="0.3" />
      <rect x="26" y="18" width="8" height="8" fill="currentColor" opacity="0.2" />
      <rect x="38" y="18" width="4" height="8" fill="currentColor" opacity="0.25" />
    </g>

    {/* Device bezel */}
    <rect x="8" y="8" width="44" height="60" rx="3" stroke="currentColor" strokeWidth="0.5" opacity="0.5" fill="none" />

    {/* Bottom button */}
    <rect x="26" y="70" width="8" height="2" rx="0.5" stroke="currentColor" strokeWidth="0.5" opacity="0.7" fill="none" />

    {/* Corner indicator lights */}
    <circle className="pad-indicator" cx="12" cy="12" r="0.6" fill="currentColor" opacity="0.7" />
    <circle className="pad-indicator" cx="52" cy="12" r="0.6" fill="currentColor" opacity="0.7" />
    </g>
  </svg>
);
