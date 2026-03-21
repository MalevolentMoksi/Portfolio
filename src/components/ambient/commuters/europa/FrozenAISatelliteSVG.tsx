/**
 * Frozen AI Satellite — Icy spiky hull with lens
 * Animations: Spike glow pulse, lens rotation, panel ice-crackle
 */

export const FrozenAISatelliteSVG = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 50 50"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main spherical hull */}
    <circle cx="25" cy="25" r="10" stroke="currentColor" strokeWidth="1" opacity="0.9" fill="none" />

    {/* Protruding icicle spikes */}
    <g className="satellite-spike">
      <line x1="25" y1="15" x2="25" y2="8" stroke="currentColor" strokeWidth="0.7" opacity="0.8" />
      <path d="M 24 8 L 25 6 L 26 8" stroke="currentColor" strokeWidth="0.5" opacity="0.7" fill="none" />
    </g>
    <g className="satellite-spike">
      <line x1="35" y1="25" x2="42" y2="25" stroke="currentColor" strokeWidth="0.7" opacity="0.8" />
      <path d="M 42 24 L 44 25 L 42 26" stroke="currentColor" strokeWidth="0.5" opacity="0.7" fill="none" />
    </g>
    <g className="satellite-spike">
      <line x1="25" y1="35" x2="25" y2="42" stroke="currentColor" strokeWidth="0.7" opacity="0.8" />
      <path d="M 24 42 L 25 44 L 26 42" stroke="currentColor" strokeWidth="0.5" opacity="0.7" fill="none" />
    </g>
    <g className="satellite-spike">
      <line x1="15" y1="25" x2="8" y2="25" stroke="currentColor" strokeWidth="0.7" opacity="0.8" />
      <path d="M 8 24 L 6 25 L 8 26" stroke="currentColor" strokeWidth="0.5" opacity="0.7" fill="none" />
    </g>

    {/* Center lens — rotating eye */}
    <g className="satellite-lens">
      <circle cx="25" cy="25" r="2.5" stroke="currentColor" strokeWidth="0.6" opacity="0.9" fill="none" />
      <circle cx="25" cy="25" r="1.5" stroke="currentColor" strokeWidth="0.4" opacity="0.7" fill="none" />
    </g>

    {/* Solar panels */}
    <rect x="18" y="35" width="14" height="2" rx="0.5" stroke="currentColor" strokeWidth="0.5" className="ice-panel" opacity="0.7" fill="none" />

    {/* Panel ice-crackle lines */}
    <g className="ice-crackle" opacity="0.4">
      <line x1="20" y1="35" x2="22" y2="37" stroke="currentColor" strokeWidth="0.2" />
      <line x1="28" y1="35" x2="26" y2="37" stroke="currentColor" strokeWidth="0.2" />
      <line x1="24" y1="34" x2="24" y2="38" stroke="currentColor" strokeWidth="0.2" />
    </g>
  </svg>
);
