/**
 * Gear Assembly — Interlocking interdependent gears
 * Animations: Interdependent rotation, pressure pulse, shaft glow
 */

export const GearAssemblySVG = () => (
  <svg
    width="120"
    height="80"
    viewBox="0 0 75 50"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Large gear — left */}
    <g className="gear-left" style={{ transformOrigin: '20px 25px' }}>
      <circle cx="20" cy="25" r="8" stroke="currentColor" strokeWidth="1" opacity="0.9" fill="none" />
      {/* Teeth */}
      <line x1="20" y1="17" x2="20" y2="15" stroke="currentColor" strokeWidth="0.6" opacity="0.8" />
      <line x1="20" y1="33" x2="20" y2="35" stroke="currentColor" strokeWidth="0.6" opacity="0.8" />
      <line x1="12" y1="25" x2="10" y2="25" stroke="currentColor" strokeWidth="0.6" opacity="0.8" />
      <line x1="28" y1="25" x2="30" y2="25" stroke="currentColor" strokeWidth="0.6" opacity="0.8" />
      {/* Inner hub */}
      <circle cx="20" cy="25" r="3" stroke="currentColor" strokeWidth="0.5" opacity="0.6" fill="none" />
    </g>

    {/* Medium gear — center */}
    <g className="gear-center" style={{ transformOrigin: '45px 25px' }}>
      <circle cx="45" cy="25" r="6" stroke="currentColor" strokeWidth="0.9" opacity="0.85" fill="none" />
      {/* Teeth */}
      <line x1="45" y1="19" x2="45" y2="17.5" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
      <line x1="45" y1="31" x2="45" y2="32.5" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
      <line x1="39" y1="25" x2="37.5" y2="25" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
      <line x1="51" y1="25" x2="52.5" y2="25" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
      {/* Inner hub */}
      <circle cx="45" cy="25" r="2.5" stroke="currentColor" strokeWidth="0.5" opacity="0.6" fill="none" />
    </g>

    {/* Small gear — right */}
    <g className="gear-right" style={{ transformOrigin: '65px 25px' }}>
      <circle cx="65" cy="25" r="4.5" stroke="currentColor" strokeWidth="0.8" opacity="0.8" fill="none" />
      {/* Teeth */}
      <line x1="65" y1="20.5" x2="65" y2="19" stroke="currentColor" strokeWidth="0.4" opacity="0.8" />
      <line x1="65" y1="29.5" x2="65" y2="31" stroke="currentColor" strokeWidth="0.4" opacity="0.8" />
      <line x1="60.5" y1="25" x2="59" y2="25" stroke="currentColor" strokeWidth="0.4" opacity="0.8" />
      <line x1="69.5" y1="25" x2="71" y2="25" stroke="currentColor" strokeWidth="0.4" opacity="0.8" />
      {/* Inner hub */}
      <circle cx="65" cy="25" r="2" stroke="currentColor" strokeWidth="0.4" opacity="0.6" fill="none" />
    </g>

    {/* Pressure lines — connecting */}
    <g className="pressure-pulse">
      <line x1="28" y1="20" x2="39" y2="20" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <line x1="51" y1="25" x2="60" y2="25" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
    </g>

    {/* Shaft glow */}
    <circle className="shaft-glow" cx="20" cy="25" r="3.5" stroke="currentColor" strokeWidth="0.3" opacity="0.4" fill="none" />
    <circle className="shaft-glow" cx="45" cy="25" r="3.5" stroke="currentColor" strokeWidth="0.3" opacity="0.4" fill="none" />
  </svg>
);
