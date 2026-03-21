/**
 * Nightshade Lantern Wisp — Floating spirit lantern with spectral trails
 * Animations: Lantern sway, core pulse, chain drift, wisp orbit
 */

export const GlowingVineSVG = () => (
  <svg
    width="120"
    height="88"
    viewBox="0 0 75 55"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="wisp-lantern">
      {/* Top ring and chain */}
      <ellipse cx="30" cy="10" rx="5" ry="1.8" stroke="currentColor" strokeWidth="0.6" opacity="0.72" fill="none" />
      <line x1="30" y1="10" x2="30" y2="16" stroke="currentColor" strokeWidth="0.45" opacity="0.62" className="wisp-chain" />

      {/* Lantern body */}
      <path
        d="M 22 19 Q 22 29 30 33 Q 38 29 38 19 Q 30 15 22 19"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.88"
        fill="currentColor"
        fillOpacity="0.08"
        className="wisp-shell"
      />
      <line x1="26" y1="19" x2="26" y2="31" stroke="currentColor" strokeWidth="0.35" opacity="0.42" />
      <line x1="30" y1="17" x2="30" y2="33" stroke="currentColor" strokeWidth="0.35" opacity="0.42" />
      <line x1="34" y1="19" x2="34" y2="31" stroke="currentColor" strokeWidth="0.35" opacity="0.42" />

      {/* Core */}
      <circle className="wisp-core" cx="30" cy="24" r="2" stroke="currentColor" strokeWidth="0.5" opacity="0.9" fill="none" />

      {/* Trailing spectral ribbons */}
      <path className="wisp-tail-1" d="M 30 33 Q 22 39 16 46" stroke="currentColor" strokeWidth="0.55" opacity="0.58" fill="none" />
      <path className="wisp-tail-2" d="M 30 33 Q 28 41 30 49" stroke="currentColor" strokeWidth="0.5" opacity="0.52" fill="none" />
      <path className="wisp-tail-3" d="M 30 33 Q 36 40 42 46" stroke="currentColor" strokeWidth="0.55" opacity="0.58" fill="none" />

      {/* Orbiting motes */}
      <circle className="wisp-mote mote-1" cx="19" cy="22" r="0.8" fill="currentColor" opacity="0.65" />
      <circle className="wisp-mote mote-2" cx="41" cy="20" r="0.75" fill="currentColor" opacity="0.62" />
      <circle className="wisp-mote mote-3" cx="22" cy="34" r="0.7" fill="currentColor" opacity="0.58" />
      <circle className="wisp-mote mote-4" cx="39" cy="34" r="0.7" fill="currentColor" opacity="0.58" />

      <g className="wisp-halo" opacity="0.28">
        <ellipse cx="30" cy="24" rx="13" ry="11" stroke="currentColor" strokeWidth="0.35" fill="none" />
      </g>
    </g>
  </svg>
);
