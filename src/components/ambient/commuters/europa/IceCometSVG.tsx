/**
 * Ice Comet — Crystalline meteor
 * Animations: Facet rotation glow, particle tail, core luminosity
 */

export const IceCometSVG = () => (
  <svg
    width="96"
    height="64"
    viewBox="0 0 60 40"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Core body */}
    <polygon
      points="40,12 49,16 52,23 47,30 39,30 34,23 35,16"
      stroke="currentColor"
      strokeWidth="1"
      className="comet-facet"
      opacity="0.9"
      fill="currentColor"
      fillOpacity="0.09"
    />

    {/* Facet plates */}
    <polygon points="39,13 45,10 50,14 45,17" stroke="currentColor" strokeWidth="0.75" className="comet-facet" opacity="0.76" fill="none" />
    <polygon points="37,24 45,23 49,28 41,29" stroke="currentColor" strokeWidth="0.75" className="comet-facet" opacity="0.76" fill="none" />
    <line x1="40" y1="16" x2="48" y2="22" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />
    <line x1="37" y1="22" x2="46" y2="17" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />

    {/* Core */}
    <circle className="comet-core" cx="43.5" cy="21" r="2.3" stroke="currentColor" strokeWidth="0.5" opacity="0.72" fill="none" />

    {/* Tail plume */}
    <g className="comet-tail">
      <path d="M 34 21 Q 27 19 21 20" stroke="currentColor" strokeWidth="0.6" opacity="0.45" fill="none" />
      <path d="M 34 23 Q 26 24 18 26" stroke="currentColor" strokeWidth="0.55" opacity="0.38" fill="none" />
      <circle cx="30" cy="20" r="1" stroke="currentColor" strokeWidth="0.35" opacity="0.56" fill="none" />
      <circle cx="24" cy="21" r="0.8" stroke="currentColor" strokeWidth="0.3" opacity="0.46" fill="none" />
      <circle cx="18" cy="24" r="0.6" stroke="currentColor" strokeWidth="0.25" opacity="0.38" fill="none" />
      <circle cx="12" cy="26" r="0.45" stroke="currentColor" strokeWidth="0.22" opacity="0.3" fill="none" />
    </g>
  </svg>
);
