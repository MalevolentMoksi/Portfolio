/**
 * Hot Air Balloon — Serene slow floater
 * Animations: Basket swing, envelope breathing puff
 */

export const HotAirBalloonSVG = () => (
  <svg
    width="88"
    height="104"
    viewBox="0 0 55 65"
    overflow="visible"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="balloon-rig">
      {/* Balloon envelope */}
      <g className="balloon-envelope">
        <ellipse cx="27.5" cy="18" rx="20" ry="18" stroke="currentColor" strokeWidth="1" opacity="0.9" fill="currentColor" fillOpacity="0.05" />
        <path d="M 27.5 1 L 27.5 35" stroke="currentColor" strokeWidth="0.7" opacity="0.58" />
        <path d="M 15 6 Q 15 18 15 33" stroke="currentColor" strokeWidth="0.55" opacity="0.48" />
        <path d="M 40 6 Q 40 18 40 33" stroke="currentColor" strokeWidth="0.55" opacity="0.48" />
        <path d="M 8 15 Q 8 19 10 31" stroke="currentColor" strokeWidth="0.45" opacity="0.42" />
        <path d="M 47 15 Q 47 19 45 31" stroke="currentColor" strokeWidth="0.45" opacity="0.42" />
        <ellipse cx="27.5" cy="34.5" rx="18" ry="2.8" stroke="currentColor" strokeWidth="0.7" opacity="0.62" />
      </g>

      {/* Ropes */}
      <line x1="17" y1="36" x2="18" y2="49" stroke="currentColor" strokeWidth="0.45" opacity="0.5" />
      <line x1="24" y1="37" x2="24" y2="49" stroke="currentColor" strokeWidth="0.45" opacity="0.5" />
      <line x1="31" y1="37" x2="30" y2="49" stroke="currentColor" strokeWidth="0.45" opacity="0.5" />
      <line x1="38" y1="36" x2="36" y2="49" stroke="currentColor" strokeWidth="0.45" opacity="0.5" />

      {/* Basket */}
      <g className="balloon-basket">
        <rect
          x="16"
          y="49"
          width="20"
          height="10"
          rx="1"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity="0.86"
          fill="none"
        />
        <line x1="20" y1="49" x2="20" y2="59" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
        <line x1="24" y1="49" x2="24" y2="59" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
        <line x1="28" y1="49" x2="28" y2="59" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
        <line x1="32" y1="49" x2="32" y2="59" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
        <line x1="16" y1="53" x2="36" y2="53" stroke="currentColor" strokeWidth="0.28" opacity="0.33" />
        <line x1="16" y1="56" x2="36" y2="56" stroke="currentColor" strokeWidth="0.28" opacity="0.33" />
      </g>
    </g>
  </svg>
);
