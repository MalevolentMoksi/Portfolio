/**
 * Airship (Dirigible) — Elegant floating vessel
 * Animations: Dual rotating propellers, gentle envelope bob
 */

export const AirshipSVG = () => (
  <svg
    width="120"
    height="48"
    viewBox="0 0 75 30"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Envelope — main body */}
    <ellipse cx="38" cy="10" rx="24" ry="8" stroke="currentColor" strokeWidth="1" opacity="0.9" />

    {/* Envelope top curve detail */}
    <path
      d="M 14 10 Q 14 4 38 2 Q 62 4 62 10"
      stroke="currentColor"
      strokeWidth="0.8"
      opacity="0.7"
      fill="none"
    />

    {/* Tail fins */}
    <polygon
      points="10,10 6,8 6,12"
      stroke="currentColor"
      strokeWidth="0.8"
      fill="none"
      opacity="0.6"
    />
    <polygon
      points="10,10 6,12 6,16"
      stroke="currentColor"
      strokeWidth="0.8"
      fill="none"
      opacity="0.6"
    />

    {/* Gondola suspension cables */}
    <line x1="22" y1="18" x2="22" y2="23" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
    <line x1="38" y1="18" x2="38" y2="23" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
    <line x1="54" y1="18" x2="54" y2="23" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />

    {/* Gondola basket */}
    <rect
      x="18"
      y="23"
      width="40"
      height="5"
      rx="0.5"
      stroke="currentColor"
      strokeWidth="0.7"
      opacity="0.8"
      fill="none"
    />

    {/* Basket weave detail */}
    <line x1="25" y1="23" x2="25" y2="28" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
    <line x1="32" y1="23" x2="32" y2="28" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
    <line x1="38" y1="23" x2="38" y2="28" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
    <line x1="45" y1="23" x2="45" y2="28" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
    <line x1="52" y1="23" x2="52" y2="28" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />

    {/* Left propeller */}
    <g className="airship-propeller-left" style={{ transformOrigin: '22px 16px' }}>
      <circle cx="22" cy="16" r="3.5" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
      <line x1="22" y1="12.5" x2="22" y2="19.5" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <line x1="18.5" y1="16" x2="25.5" y2="16" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
    </g>

    {/* Right propeller */}
    <g className="airship-propeller-right" style={{ transformOrigin: '54px 16px' }}>
      <circle cx="54" cy="16" r="3.5" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
      <line x1="54" y1="12.5" x2="54" y2="19.5" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <line x1="50.5" y1="16" x2="57.5" y2="16" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
    </g>

    {/* Rudder fins back */}
    <line x1="62" y1="8" x2="68" y2="6" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
    <line x1="62" y1="12" x2="68" y2="14" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
  </svg>
);
