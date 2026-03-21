/**
 * Firewall Gate Shield — Angular geometric barrier
 * Animations: Grid pulse inward/outward, lock glow blink
 */

export const FirewallShieldSVG = () => (
  <svg
    width="88"
    height="72"
    viewBox="0 0 55 45"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main shield */}
    <polygon
      points="27.5,5 44,14 42,36 27.5,42 13,36 11,14"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.92"
      fill="currentColor"
      fillOpacity="0.05"
    />
    <polygon
      points="27.5,8 39,15 38,33 27.5,38 17,33 16,15"
      stroke="currentColor"
      strokeWidth="0.75"
      opacity="0.72"
      fill="none"
    />

    {/* Grid */}
    <g className="shield-grid">
      <line x1="21" y1="15" x2="21" y2="35" stroke="currentColor" strokeWidth="0.45" opacity="0.52" />
      <line x1="27.5" y1="12" x2="27.5" y2="38" stroke="currentColor" strokeWidth="0.45" opacity="0.52" />
      <line x1="34" y1="15" x2="34" y2="35" stroke="currentColor" strokeWidth="0.45" opacity="0.52" />
      <line x1="17" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="0.45" opacity="0.52" />
      <line x1="17" y1="26" x2="38" y2="26" stroke="currentColor" strokeWidth="0.45" opacity="0.52" />
      <line x1="17" y1="32" x2="38" y2="32" stroke="currentColor" strokeWidth="0.45" opacity="0.52" />
    </g>

    {/* Lock */}
    <g className="shield-lock">
      <rect x="24.5" y="25" width="6" height="8" rx="0.8" stroke="currentColor" strokeWidth="0.6" opacity="0.84" fill="none" />
      <path d="M 25.8 25 Q 25.8 21 27.5 20 Q 29.2 21 29.2 25" stroke="currentColor" strokeWidth="0.6" opacity="0.78" fill="none" />
      <circle cx="27.5" cy="29" r="0.7" stroke="currentColor" strokeWidth="0.4" opacity="0.7" fill="none" />
    </g>

    {/* Scan line */}
    <line className="firewall-scan-line" x1="15" y1="22" x2="40" y2="22" stroke="currentColor" strokeWidth="0.35" opacity="0.4" strokeDasharray="1.2 1.2" />
  </svg>
);
