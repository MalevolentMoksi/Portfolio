/**
 * Glacial Hexapod Rover — 6 mechanical legs
 * Animations: Leg march staggered, thermal vent steam, sensor sweep
 */

export const GlacialRoverSVG = () => (
  <svg
    width="128"
    height="56"
    viewBox="0 0 80 35"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main chassis */}
    <polygon
      points="16,14 28,9 48,9 61,14 59,24 46,28 24,28 14,24"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.92"
      fill="currentColor"
      fillOpacity="0.06"
    />
    <line x1="21" y1="18" x2="54" y2="18" stroke="currentColor" strokeWidth="0.45" opacity="0.5" />

    {/* Cockpit and sensor head */}
    <circle cx="38" cy="17" r="2" stroke="currentColor" strokeWidth="0.65" opacity="0.75" fill="none" />
    <circle cx="62" cy="18" r="1.2" stroke="currentColor" strokeWidth="0.6" opacity="0.84" fill="none" />
    <line x1="56" y1="18" x2="60.5" y2="18" stroke="currentColor" strokeWidth="0.45" opacity="0.6" />

    {/* Six legs — all attached under the hull base */}
    <g className="rover-leg rover-leg-1">
      <line x1="22" y1="28" x2="19" y2="32" stroke="currentColor" strokeWidth="0.7" opacity="0.82" />
      <line x1="19" y1="32" x2="17" y2="34" stroke="currentColor" strokeWidth="0.6" opacity="0.82" />
    </g>
    <g className="rover-leg rover-leg-2">
      <line x1="30" y1="28" x2="29" y2="33" stroke="currentColor" strokeWidth="0.7" opacity="0.82" />
      <line x1="29" y1="33" x2="27" y2="34" stroke="currentColor" strokeWidth="0.6" opacity="0.82" />
    </g>
    <g className="rover-leg rover-leg-3">
      <line x1="38" y1="28" x2="39" y2="33" stroke="currentColor" strokeWidth="0.7" opacity="0.82" />
      <line x1="39" y1="33" x2="41" y2="34" stroke="currentColor" strokeWidth="0.6" opacity="0.82" />
    </g>
    <g className="rover-leg rover-leg-4">
      <line x1="46" y1="28" x2="49" y2="32" stroke="currentColor" strokeWidth="0.7" opacity="0.82" />
      <line x1="49" y1="32" x2="52" y2="34" stroke="currentColor" strokeWidth="0.6" opacity="0.82" />
    </g>
    <g className="rover-leg rover-leg-5">
      <line x1="52" y1="26" x2="55" y2="30" stroke="currentColor" strokeWidth="0.7" opacity="0.78" />
      <line x1="55" y1="30" x2="58" y2="32" stroke="currentColor" strokeWidth="0.6" opacity="0.78" />
    </g>
    <g className="rover-leg rover-leg-6">
      <line x1="18" y1="26" x2="15" y2="30" stroke="currentColor" strokeWidth="0.7" opacity="0.78" />
      <line x1="15" y1="30" x2="12" y2="32" stroke="currentColor" strokeWidth="0.6" opacity="0.78" />
    </g>

    {/* Thermal vents */}
    <g className="rover-vent">
      <line x1="34" y1="8" x2="34" y2="5" stroke="currentColor" strokeWidth="0.5" className="thermal-puff" opacity="0.72" />
      <line x1="41" y1="8" x2="41" y2="5" stroke="currentColor" strokeWidth="0.5" className="thermal-puff" opacity="0.72" />
    </g>
  </svg>
);
