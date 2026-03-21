/**
 * Electromagnetic Rail Thruster — Linear motor
 * Animations: Coil glow pulse, thrust glow oscillate
 */

export const RailThrusterSVG = () => (
  <svg
    width="120"
    height="48"
    viewBox="0 0 75 30"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base body */}
    <rect x="8" y="11" width="46" height="8" rx="1.2" stroke="currentColor" strokeWidth="0.8" opacity="0.84" fill="none" />
    <line x1="12" y1="14.5" x2="50" y2="14.5" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />

    {/* Forward rail barrel */}
    <polygon points="54,11 68,15 54,19" stroke="currentColor" strokeWidth="0.95" opacity="0.9" fill="none" />
    <line x1="54" y1="11" x2="68" y2="15" stroke="currentColor" strokeWidth="0.45" opacity="0.68" />
    <line x1="54" y1="19" x2="68" y2="15" stroke="currentColor" strokeWidth="0.45" opacity="0.68" />

    {/* Coil modules */}
    <g className="thruster-coil-1">
      <circle cx="23" cy="15" r="3.6" stroke="currentColor" strokeWidth="0.7" opacity="0.86" fill="none" />
      <circle cx="23" cy="15" r="2.1" stroke="currentColor" strokeWidth="0.35" opacity="0.55" fill="none" />
    </g>
    <g className="thruster-coil-2">
      <circle cx="37" cy="15" r="3.6" stroke="currentColor" strokeWidth="0.7" opacity="0.86" fill="none" />
      <circle cx="37" cy="15" r="2.1" stroke="currentColor" strokeWidth="0.35" opacity="0.55" fill="none" />
    </g>

    {/* Rear fins */}
    <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="0.45" opacity="0.68" />
    <line x1="6" y1="15" x2="10" y2="15" stroke="currentColor" strokeWidth="0.45" opacity="0.68" />
    <line x1="6" y1="18" x2="10" y2="18" stroke="currentColor" strokeWidth="0.45" opacity="0.68" />

    {/* Emission */}
    <g className="thruster-emission" opacity="0.5">
      <polygon points="69,13.5 75,15 69,16.5" fill="currentColor" />
    </g>

    <circle cx="48" cy="15" r="5" stroke="currentColor" strokeWidth="0.35" className="thruster-energy-ring" opacity="0.6" fill="none" />
    <line x1="49" y1="15" x2="67" y2="15" stroke="currentColor" strokeWidth="0.3" opacity="0.5" strokeDasharray="2 1" />
  </svg>
);
