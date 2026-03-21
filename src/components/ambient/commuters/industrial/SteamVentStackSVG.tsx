/**
 * Industrial Steam Vent Stack — Multi-outlet horizontal
 * Animations: Steam puff rhythmic, heat ripple, vibration
 */

export const SteamVentStackSVG = () => (
  <svg
    width="120"
    height="48"
    viewBox="0 0 75 30"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main manifold body */}
    <rect x="6" y="12" width="63" height="8" rx="1" stroke="currentColor" strokeWidth="1" opacity="0.9" fill="none" />

    {/* Riveted sections */}
    <circle cx="16" cy="16" r="0.6" stroke="currentColor" strokeWidth="0.4" opacity="0.6" fill="none" />
    <circle cx="32" cy="16" r="0.6" stroke="currentColor" strokeWidth="0.4" opacity="0.6" fill="none" />
    <circle cx="48" cy="16" r="0.6" stroke="currentColor" strokeWidth="0.4" opacity="0.6" fill="none" />
    <circle cx="64" cy="16" r="0.6" stroke="currentColor" strokeWidth="0.4" opacity="0.6" fill="none" />

    {/* Three outlet vents — steam emission */}
    <g className="vent-outlet-1">
      <rect x="12" y="20" width="1.5" height="8" stroke="currentColor" strokeWidth="0.5" opacity="0.8" fill="none" />
    </g>
    <g className="vent-outlet-2">
      <rect x="36" y="20" width="1.5" height="8" stroke="currentColor" strokeWidth="0.5" opacity="0.8" fill="none" />
    </g>
    <g className="vent-outlet-3">
      <rect x="60" y="20" width="1.5" height="8" stroke="currentColor" strokeWidth="0.5" opacity="0.8" fill="none" />
    </g>

    {/* Steam puff clouds — animated */}
    <g className="steam-puff-1" opacity="0.6">
      <circle cx="12.75" cy="22" r="2" stroke="currentColor" strokeWidth="0.3" fill="none" />
    </g>
    <g className="steam-puff-2" opacity="0.5">
      <circle cx="36.75" cy="22" r="2" stroke="currentColor" strokeWidth="0.3" fill="none" />
    </g>
    <g className="steam-puff-3" opacity="0.6">
      <circle cx="60.75" cy="22" r="2" stroke="currentColor" strokeWidth="0.3" fill="none" />
    </g>

    {/* Pressure gauge */}
    <circle cx="40" cy="10" r="2.5" stroke="currentColor" strokeWidth="0.6" opacity="0.7" fill="none" />
    <line x1="40" y1="10" x2="42" y2="8" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />

    {/* Heat indicator lines */}
    <g className="heat-ripple" opacity="0.4">
      <path d="M 30 14 Q 35 12 40 14" stroke="currentColor" strokeWidth="0.3" fill="none" />
      <path d="M 40 12 Q 45 10 50 12" stroke="currentColor" strokeWidth="0.3" fill="none" />
    </g>
  </svg>
);
