/**
 * Crystalline Probe — Hexagonal geometric probe
 * Animations: Facet refraction pulse, antenna sweep, core glow
 */

export const CrystallineProbeSVG = () => (
  <svg
    width="80"
    height="96"
    viewBox="0 0 50 60"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main hull */}
    <polygon
      points="25,8 34,13 36,23 30,32 20,32 14,23 16,13"
      stroke="currentColor"
      strokeWidth="1"
      className="probe-facet"
      opacity="0.9"
      fill="currentColor"
      fillOpacity="0.08"
    />

    {/* Facet lines */}
    <line x1="25" y1="8" x2="25" y2="32" stroke="currentColor" strokeWidth="0.35" opacity="0.42" />
    <line x1="16" y1="13" x2="34" y2="13" stroke="currentColor" strokeWidth="0.35" opacity="0.42" />
    <line x1="14" y1="23" x2="36" y2="23" stroke="currentColor" strokeWidth="0.35" opacity="0.42" />

    <circle className="probe-core" cx="25" cy="20" r="2.1" stroke="currentColor" strokeWidth="0.6" opacity="0.84" fill="none" />

    {/* Antenna mast */}
    <g className="probe-antenna">
      <line x1="25" y1="8" x2="25" y2="2" stroke="currentColor" strokeWidth="0.65" opacity="0.8" />
      <line x1="25" y1="2" x2="29" y2="0" stroke="currentColor" strokeWidth="0.45" opacity="0.68" />
      <circle cx="29" cy="0" r="0.9" stroke="currentColor" strokeWidth="0.45" opacity="0.7" fill="none" />
    </g>

    {/* Side sensors */}
    <circle cx="15" cy="20" r="1" stroke="currentColor" strokeWidth="0.5" className="probe-sensor" opacity="0.72" fill="none" />
    <circle cx="35" cy="20" r="1" stroke="currentColor" strokeWidth="0.5" className="probe-sensor" opacity="0.72" fill="none" />
    <line x1="16" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="0.3" opacity="0.45" />
    <line x1="30" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="0.3" opacity="0.45" />

    {/* Lower sensor array */}
    <g className="probe-array">
      <line x1="22" y1="32" x2="22" y2="37" stroke="currentColor" strokeWidth="0.35" opacity="0.5" />
      <line x1="25" y1="32" x2="25" y2="37" stroke="currentColor" strokeWidth="0.35" opacity="0.5" />
      <line x1="28" y1="32" x2="28" y2="37" stroke="currentColor" strokeWidth="0.35" opacity="0.5" />
      <circle cx="22" cy="38" r="0.7" stroke="currentColor" strokeWidth="0.35" opacity="0.64" fill="none" />
      <circle cx="25" cy="39" r="0.7" stroke="currentColor" strokeWidth="0.35" opacity="0.64" fill="none" />
      <circle cx="28" cy="38" r="0.7" stroke="currentColor" strokeWidth="0.35" opacity="0.64" fill="none" />
    </g>

    {/* Under-panel */}
    <rect x="13" y="42" width="24" height="4" rx="0.6" stroke="currentColor" strokeWidth="0.55" className="probe-panel" opacity="0.72" fill="currentColor" fillOpacity="0.06" />
    <line x1="19" y1="42" x2="19" y2="46" stroke="currentColor" strokeWidth="0.3" opacity="0.42" />
    <line x1="25" y1="42" x2="25" y2="46" stroke="currentColor" strokeWidth="0.3" opacity="0.42" />
    <line x1="31" y1="42" x2="31" y2="46" stroke="currentColor" strokeWidth="0.3" opacity="0.42" />
  </svg>
);
