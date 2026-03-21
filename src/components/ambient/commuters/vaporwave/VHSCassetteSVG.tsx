/**
 * VHS Cassette Deck — Dual reel counter-rotation
 * Animations: Reel opposite rotation, tape glitch, label sheen
 */

export const VHSCassetteSVG = () => (
  <svg
    width="96"
    height="64"
    viewBox="0 0 60 40"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cassette shell */}
    <rect
      className="cassette-shell"
      x="6"
      y="8"
      width="48"
      height="24"
      rx="2"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.9"
      fill="none"
    />

    {/* Left reel — spinning element */}
    <g className="cassette-reel-left" style={{ transformOrigin: '18px 20px' }}>
      <circle cx="18" cy="20" r="4" stroke="currentColor" strokeWidth="0.7" opacity="0.85" fill="none" />
      {/* Reel spokes */}
      <line x1="18" y1="16" x2="18" y2="24" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
      <line x1="14" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
      <line x1="15" y1="17" x2="21" y2="23" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
      <line x1="21" y1="17" x2="15" y2="23" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
    </g>

    {/* Right reel — spinning opposite */}
    <g className="cassette-reel-right" style={{ transformOrigin: '42px 20px' }}>
      <circle cx="42" cy="20" r="4" stroke="currentColor" strokeWidth="0.7" opacity="0.85" fill="none" />
      {/* Reel spokes */}
      <line x1="42" y1="16" x2="42" y2="24" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
      <line x1="38" y1="20" x2="46" y2="20" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
      <line x1="39" y1="17" x2="45" y2="23" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
      <line x1="45" y1="17" x2="39" y2="23" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
    </g>

    {/* Tape path */}
    <path d="M 18 20 L 42 20" stroke="currentColor" strokeWidth="0.8" opacity="0.7" className="cassette-tape" />

    {/* Label area */}
    <rect x="10" y="11" width="40" height="7" rx="0.5" stroke="currentColor" strokeWidth="0.5" opacity="0.6" fill="none" />

    {/* Label decorative content */}
    <text x="30" y="15" fontSize="2" textAnchor="middle" fill="currentColor" opacity="0.5" fontFamily="monospace">
      SIDE A
    </text>

    {/* Glitch overlay */}
    <g className="cassette-glitch" opacity="0.3">
      <line x1="30" y1="13" x2="35" y2="13" stroke="currentColor" strokeWidth="0.3" />
    </g>
  </svg>
);
