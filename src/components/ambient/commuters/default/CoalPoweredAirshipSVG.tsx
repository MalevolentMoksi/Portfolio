/**
 * Coal-Powered Airship — Steampunk elegance
 * Animations: Steam puff cycles, turbine spin, body rock
 */

export const CoalPoweredAirshipSVG = () => (
  <svg
    width="120"
    height="44"
    viewBox="0 0 75 28"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main hull — side view */}
    <path
      d="M 8 14 L 12 8 L 60 8 L 68 14 L 60 20 L 12 20 Z"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.9"
      fill="none"
    />

    {/* Rivets along hull */}
    <circle cx="18" cy="14" r="0.6" stroke="currentColor" strokeWidth="0.4" opacity="0.5" fill="none" />
    <circle cx="28" cy="14" r="0.6" stroke="currentColor" strokeWidth="0.4" opacity="0.5" fill="none" />
    <circle cx="38" cy="14" r="0.6" stroke="currentColor" strokeWidth="0.4" opacity="0.5" fill="none" />
    <circle cx="48" cy="14" r="0.6" stroke="currentColor" strokeWidth="0.4" opacity="0.5" fill="none" />
    <circle cx="58" cy="14" r="0.6" stroke="currentColor" strokeWidth="0.4" opacity="0.5" fill="none" />

    {/* Steam vents — left side triple outlet */}
    <g className="coal-steam-vent">
      <rect x="10" y="18" width="1.5" height="7" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <rect x="13" y="19" width="1.5" height="6" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <rect x="16" y="18" width="1.5" height="7" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
    </g>

    {/* Turbine — front center spinning */}
    <g className="coal-turbine" style={{ transformOrigin: '28px 14px' }}>
      <circle cx="28" cy="14" r="3.5" stroke="currentColor" strokeWidth="0.6" opacity="0.8" fill="none" />
      <line x1="28" y1="10.5" x2="28" y2="17.5" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <line x1="24.5" y1="14" x2="31.5" y2="14" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <line x1="25.5" y1="11" x2="30.5" y2="17" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
    </g>

    {/* Antenna */}
    <line x1="50" y1="5" x2="52" y2="0" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
    <circle cx="52" cy="0" r="1" stroke="currentColor" strokeWidth="0.4" opacity="0.5" fill="none" />

    {/* Engine block */}
    <rect
      x="52"
      y="10"
      width="12"
      height="8"
      rx="1"
      stroke="currentColor"
      strokeWidth="0.7"
      opacity="0.7"
      fill="none"
    />

    {/* Engine exhaust */}
    <g className="coal-exhaust">
      <line x1="64" y1="12" x2="72" y2="12" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      <line x1="64" y1="14" x2="72" y2="14" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      <line x1="64" y1="16" x2="72" y2="16" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
    </g>

    {/* Cockpit window */}
    <circle cx="60" cy="11" r="1.5" stroke="currentColor" strokeWidth="0.5" opacity="0.6" fill="none" />
  </svg>
);
