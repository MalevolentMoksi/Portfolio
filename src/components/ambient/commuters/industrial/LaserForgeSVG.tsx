/**
 * Laser Forge / Energy Cannon — Mounted barrel
 * Animations: Thermal vent steam, beam pulse emission, heat distortion
 */

export const LaserForgeSVG = () => (
  <svg
    width="120"
    height="48"
    viewBox="0 0 75 30"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main barrel — pointed forward */}
    <polygon
      points="52,10 68,15 52,20"
      stroke="currentColor"
      strokeWidth="1.2"
      opacity="0.95"
      fill="none"
    />

    {/* Barrel bore */}
    <line x1="52" y1="12" x2="68" y2="15" stroke="currentColor" strokeWidth="0.6" opacity="0.8" />
    <line x1="52" y1="18" x2="68" y2="15" stroke="currentColor" strokeWidth="0.6" opacity="0.8" />

    {/* Cooling fins — ribbed */}
    <g className="cooling-fins">
      <line x1="35" y1="8" x2="35" y2="22" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <line x1="42" y1="8" x2="42" y2="22" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <line x1="48" y1="9" x2="48" y2="21" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
    </g>

    {/* Main casing */}
    <rect x="20" y="10" width="32" height="10" rx="1" stroke="currentColor" strokeWidth="0.8" opacity="0.8" fill="none" />

    {/* Thermal vents — left side */}
    <g className="forge-vent-1">
      <rect x="12" y="13" width="0.7" height="4" stroke="currentColor" strokeWidth="0.4" opacity="0.8" />
    </g>
    <g className="forge-vent-2">
      <rect x="16" y="13" width="0.7" height="4" stroke="currentColor" strokeWidth="0.4" opacity="0.8" />
    </g>

    {/* Steam puff from vents */}
    <g className="forge-steam" opacity="0.5">
      <circle cx="12.35" cy="12" r="1.5" stroke="currentColor" strokeWidth="0.3" fill="none" />
      <circle cx="16.35" cy="12" r="1.5" stroke="currentColor" strokeWidth="0.3" fill="none" />
    </g>

    {/* Energy beam emission */}
    <g className="forge-beam" opacity="0.6">
      <line x1="68" y1="14" x2="75" y2="15" stroke="currentColor" strokeWidth="1" />
      <line x1="68" y1="15" x2="75" y2="15" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <line x1="68" y1="16" x2="75" y2="15" stroke="currentColor" strokeWidth="0.8" />
    </g>

    {/* Heat distortion indicator */}
    <g className="heat-distortion" opacity="0.3">
      <path d="M 60 13 Q 62 12 64 13" stroke="currentColor" strokeWidth="0.2" fill="none" />
      <path d="M 60 17 Q 62 18 64 17" stroke="currentColor" strokeWidth="0.2" fill="none" />
    </g>
  </svg>
);
