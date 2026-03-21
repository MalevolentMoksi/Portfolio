/**
 * Clockwork Flying Vessel — Mechanical precision
 * Animations: Interlocking gear spin, ring wobble, core glow pulse
 */

export const ClockworkVesselSVG = () => (
  <svg
    width="104"
    height="48"
    viewBox="0 0 65 30"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main hull body */}
    <rect
      x="8"
      y="10"
      width="40"
      height="14"
      rx="3"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.9"
      fill="none"
    />

    {/* Decorative corner rivets */}
    <circle cx="10" cy="12" r="0.5" fill="currentColor" opacity="0.6" />
    <circle cx="46" cy="12" r="0.5" fill="currentColor" opacity="0.6" />
    <circle cx="10" cy="22" r="0.5" fill="currentColor" opacity="0.6" />
    <circle cx="46" cy="22" r="0.5" fill="currentColor" opacity="0.6" />

    {/* Left large gear */}
    <g className="clockwork-gear-left" style={{ transformOrigin: '18px 17px' }}>
      <circle cx="18" cy="17" r="5" stroke="currentColor" strokeWidth="0.7" opacity="0.85" fill="none" />
      {/* Gear teeth */}
      <line x1="18" y1="12" x2="18" y2="11" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <line x1="18" y1="22" x2="18" y2="23" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <line x1="13" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <line x1="23" y1="17" x2="24" y2="17" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
    </g>

    {/* Center large gear */}
    <g className="clockwork-gear-center" style={{ transformOrigin: '32px 17px' }}>
      <circle cx="32" cy="17" r="5" stroke="currentColor" strokeWidth="0.7" opacity="0.85" fill="none" />
      {/* Gear teeth */}
      <line x1="32" y1="12" x2="32" y2="11" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <line x1="32" y1="22" x2="32" y2="23" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <line x1="27" y1="17" x2="26" y2="17" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <line x1="37" y1="17" x2="38" y2="17" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
    </g>

    {/* Right small gear */}
    <g className="clockwork-gear-right" style={{ transformOrigin: '42px 17px' }}>
      <circle cx="42" cy="17" r="3.5" stroke="currentColor" strokeWidth="0.6" opacity="0.8" fill="none" />
      {/* Smaller teeth */}
      <line x1="42" y1="13.5" x2="42" y2="12.5" stroke="currentColor" strokeWidth="0.4" opacity="0.7" />
      <line x1="42" y1="20.5" x2="42" y2="21.5" stroke="currentColor" strokeWidth="0.4" opacity="0.7" />
      <line x1="38.5" y1="17" x2="37.5" y2="17" stroke="currentColor" strokeWidth="0.4" opacity="0.7" />
      <line x1="45.5" y1="17" x2="46.5" y2="17" stroke="currentColor" strokeWidth="0.4" opacity="0.7" />
    </g>

    {/* Ornamental ring */}
    <g className="clockwork-ring" style={{ transformOrigin: '28px 17px' }}>
      <circle cx="28" cy="17" r="8" stroke="currentColor" strokeWidth="0.5" opacity="0.6" fill="none" />
      <circle cx="28" cy="17" r="9.5" stroke="currentColor" strokeWidth="0.4" opacity="0.4" fill="none" />
    </g>

    {/* Core luminosity center */}
    <circle className="clockwork-core" cx="28" cy="17" r="1.5" stroke="currentColor" strokeWidth="0.6" opacity="0.8" fill="none" />

    {/* Front nose cone */}
    <polygon
      points="48,14 52,17 48,20"
      stroke="currentColor"
      strokeWidth="0.7"
      opacity="0.8"
      fill="none"
    />

    {/* Back propulsion vents */}
    <line x1="2" y1="15" x2="6" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
    <line x1="2" y1="17" x2="6" y2="17" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
    <line x1="2" y1="19" x2="6" y2="19" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
  </svg>
);
