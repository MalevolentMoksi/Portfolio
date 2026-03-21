/**
 * DataStream Beacon — Neural network node cluster
 * Animations: Node glow pulse wave, particle orbital paths, central core throb
 */

export const DataStreamBeaconSVG = () => (
  <svg
    width="88"
    height="64"
    viewBox="0 0 55 40"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Core */}
    <circle className="beacon-core" cx="27.5" cy="20" r="2.2" stroke="currentColor" strokeWidth="0.65" opacity="0.92" fill="none" />
    <circle cx="27.5" cy="20" r="5.5" stroke="currentColor" strokeWidth="0.45" opacity="0.45" fill="none" />

    {/* Orbit 1 */}
    <g className="beacon-orbit-1">
      <circle cx="27.5" cy="10" r="1.3" stroke="currentColor" strokeWidth="0.65" className="beacon-node" opacity="0.82" fill="none" />
      <circle cx="37" cy="15" r="1.3" stroke="currentColor" strokeWidth="0.65" className="beacon-node" opacity="0.82" fill="none" />
      <circle cx="37" cy="25" r="1.3" stroke="currentColor" strokeWidth="0.65" className="beacon-node" opacity="0.82" fill="none" />
      <circle cx="27.5" cy="30" r="1.3" stroke="currentColor" strokeWidth="0.65" className="beacon-node" opacity="0.82" fill="none" />
      <circle cx="18" cy="25" r="1.3" stroke="currentColor" strokeWidth="0.65" className="beacon-node" opacity="0.82" fill="none" />
      <circle cx="18" cy="15" r="1.3" stroke="currentColor" strokeWidth="0.65" className="beacon-node" opacity="0.82" fill="none" />
    </g>

    {/* Orbit 2 */}
    <g className="beacon-orbit-2">
      <circle cx="27.5" cy="6" r="0.9" stroke="currentColor" strokeWidth="0.5" className="beacon-data-node" opacity="0.65" fill="none" />
      <circle cx="42" cy="11" r="0.9" stroke="currentColor" strokeWidth="0.5" className="beacon-data-node" opacity="0.65" fill="none" />
      <circle cx="47" cy="20" r="0.9" stroke="currentColor" strokeWidth="0.5" className="beacon-data-node" opacity="0.65" fill="none" />
      <circle cx="42" cy="29" r="0.9" stroke="currentColor" strokeWidth="0.5" className="beacon-data-node" opacity="0.65" fill="none" />
      <circle cx="27.5" cy="34" r="0.9" stroke="currentColor" strokeWidth="0.5" className="beacon-data-node" opacity="0.65" fill="none" />
      <circle cx="13" cy="29" r="0.9" stroke="currentColor" strokeWidth="0.5" className="beacon-data-node" opacity="0.65" fill="none" />
      <circle cx="8" cy="20" r="0.9" stroke="currentColor" strokeWidth="0.5" className="beacon-data-node" opacity="0.65" fill="none" />
      <circle cx="13" cy="11" r="0.9" stroke="currentColor" strokeWidth="0.5" className="beacon-data-node" opacity="0.65" fill="none" />
    </g>

    {/* Connectors */}
    <line x1="27.5" y1="18" x2="27.5" y2="12" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />
    <line x1="29.5" y1="18" x2="35" y2="16" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />
    <line x1="29.5" y1="22" x2="35" y2="24" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />
    <line x1="25.5" y1="22" x2="20" y2="24" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />
    <line x1="25.5" y1="18" x2="20" y2="16" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />

    {/* Data paths */}
    <path d="M 12 12 Q 16 10 20 12" stroke="currentColor" strokeWidth="0.25" opacity="0.3" fill="none" />
    <path d="M 35 12 Q 40 10 43 12" stroke="currentColor" strokeWidth="0.25" opacity="0.3" fill="none" />
    <path d="M 35 28 Q 40 30 43 28" stroke="currentColor" strokeWidth="0.25" opacity="0.3" fill="none" />
    <path d="M 12 28 Q 16 30 20 28" stroke="currentColor" strokeWidth="0.25" opacity="0.3" fill="none" />
  </svg>
);
