/**
 * Aurora Wave — Flowing ribbon energy form
 * Animations: Wave undulation, glow flicker, particle scatter
 */

export const AuroraWaveSVG = () => (
  <svg
    width="144"
    height="64"
    viewBox="0 0 90 40"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Multiple wave layers — sine curves */}
    <g className="aurora-layer-1">
      <path
        d="M 5,20 Q 15,10 25,20 T 45,20 T 65,20 T 85,20"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.8"
        fill="none"
      />
    </g>

    <g className="aurora-layer-2">
      <path
        d="M 5,22 Q 15,14 25,22 T 45,22 T 65,22 T 85,22"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.6"
        fill="none"
      />
    </g>

    <g className="aurora-layer-3">
      <path
        d="M 5,18 Q 15,12 25,18 T 45,18 T 65,18 T 85,18"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
        fill="none"
      />
    </g>

    {/* Glow aura */}
    <g className="aurora-glow" opacity="0.25">
      <ellipse cx="25" cy="20" rx="8" ry="6" fill="currentColor" />
      <ellipse cx="50" cy="20" rx="8" ry="6" fill="currentColor" />
      <ellipse cx="75" cy="20" rx="8" ry="6" fill="currentColor" />
    </g>

    {/* Particle scatter */}
    <g className="aurora-particles">
      <circle cx="20" cy="15" r="0.6" fill="currentColor" className="particle" opacity="0.5" />
      <circle cx="30" cy="12" r="0.5" fill="currentColor" className="particle" opacity="0.4" />
      <circle cx="50" cy="16" r="0.6" fill="currentColor" className="particle" opacity="0.5" />
      <circle cx="60" cy="12" r="0.5" fill="currentColor" className="particle" opacity="0.4" />
      <circle cx="75" cy="14" r="0.6" fill="currentColor" className="particle" opacity="0.5" />
      <circle cx="85" cy="18" r="0.5" fill="currentColor" className="particle" opacity="0.4" />
    </g>
  </svg>
);
