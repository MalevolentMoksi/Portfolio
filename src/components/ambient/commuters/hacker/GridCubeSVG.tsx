/**
 * Grid Lattice Core — planar matrix frame
 * Animations: lattice drift, scanline shimmer, node pulses
 */

export const GridCubeSVG = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 50 50"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="grid-shell">
      <rect x="9" y="9" width="32" height="32" rx="2.4" stroke="currentColor" strokeWidth="0.9" opacity="0.88" fill="none" />
      <rect x="13" y="13" width="24" height="24" rx="1.4" stroke="currentColor" strokeWidth="0.6" opacity="0.56" fill="none" />

      <g className="grid-internal">
        <line x1="17" y1="13" x2="17" y2="37" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
        <line x1="21" y1="13" x2="21" y2="37" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
        <line x1="25" y1="13" x2="25" y2="37" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />
        <line x1="29" y1="13" x2="29" y2="37" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
        <line x1="33" y1="13" x2="33" y2="37" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />

        <line x1="13" y1="17" x2="37" y2="17" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
        <line x1="13" y1="21" x2="37" y2="21" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
        <line x1="13" y1="25" x2="37" y2="25" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />
        <line x1="13" y1="29" x2="37" y2="29" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
        <line x1="13" y1="33" x2="37" y2="33" stroke="currentColor" strokeWidth="0.35" opacity="0.38" />
      </g>

      <line className="grid-scanline" x1="13" y1="17" x2="37" y2="17" stroke="currentColor" strokeWidth="0.55" opacity="0.55" />

      <circle className="grid-vertex" cx="9" cy="9" r="0.9" stroke="currentColor" strokeWidth="0.5" opacity="0.82" fill="none" />
      <circle className="grid-vertex" cx="41" cy="9" r="0.9" stroke="currentColor" strokeWidth="0.5" opacity="0.82" fill="none" />
      <circle className="grid-vertex" cx="41" cy="41" r="0.9" stroke="currentColor" strokeWidth="0.5" opacity="0.82" fill="none" />
      <circle className="grid-vertex" cx="9" cy="41" r="0.9" stroke="currentColor" strokeWidth="0.5" opacity="0.82" fill="none" />

      <circle className="grid-core" cx="25" cy="25" r="1.6" stroke="currentColor" strokeWidth="0.5" opacity="0.72" fill="none" />
    </g>
  </svg>
);
