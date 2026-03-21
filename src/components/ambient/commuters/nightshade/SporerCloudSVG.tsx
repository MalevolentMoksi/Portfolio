/**
 * Swirling Spore Cloud — Vortex of mystical essence
 * Animations: Spiral rotation, particle orbit, core glow
 */

export const SporerCloudSVG = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 50 50"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="spore-spiral">
      <path d="M 25 9 Q 35 9 39 17 Q 43 25 38 33 Q 33 40 23 41 Q 12 42 8 34" stroke="currentColor" strokeWidth="0.45" opacity="0.34" fill="none" />
      <circle cx="25" cy="9" r="0.9" fill="currentColor" className="spore-particle" opacity="0.7" />
      <circle cx="35" cy="12" r="0.85" fill="currentColor" className="spore-particle" opacity="0.7" />
      <circle cx="40" cy="20" r="0.8" fill="currentColor" className="spore-particle" opacity="0.7" />
      <circle cx="39" cy="30" r="0.85" fill="currentColor" className="spore-particle" opacity="0.7" />
      <circle cx="31" cy="38" r="0.9" fill="currentColor" className="spore-particle" opacity="0.7" />
      <circle cx="20" cy="40" r="0.85" fill="currentColor" className="spore-particle" opacity="0.7" />
      <circle cx="11" cy="34" r="0.8" fill="currentColor" className="spore-particle" opacity="0.7" />
      <circle cx="8" cy="24" r="0.8" fill="currentColor" className="spore-particle" opacity="0.7" />
    </g>

    <g className="spore-spiral-inner">
      <path d="M 25 16 Q 31 16 34 21 Q 37 26 34 31 Q 31 35 25 35 Q 18 35 15 30" stroke="currentColor" strokeWidth="0.35" opacity="0.3" fill="none" />
      <circle cx="25" cy="16" r="0.65" fill="currentColor" className="spore-particle" opacity="0.62" />
      <circle cx="32" cy="20" r="0.65" fill="currentColor" className="spore-particle" opacity="0.62" />
      <circle cx="33" cy="28" r="0.65" fill="currentColor" className="spore-particle" opacity="0.62" />
      <circle cx="26" cy="33" r="0.65" fill="currentColor" className="spore-particle" opacity="0.62" />
      <circle cx="18" cy="32" r="0.65" fill="currentColor" className="spore-particle" opacity="0.62" />
      <circle cx="14" cy="25" r="0.65" fill="currentColor" className="spore-particle" opacity="0.62" />
    </g>

    <circle className="spore-core" cx="25" cy="25" r="2.7" stroke="currentColor" strokeWidth="0.5" opacity="0.86" fill="none" />
    <circle className="spore-core-inner" cx="25" cy="25" r="1.6" stroke="currentColor" strokeWidth="0.3" opacity="0.72" fill="none" />
    <circle className="spore-mist" cx="25" cy="25" r="19" stroke="currentColor" strokeWidth="0.3" opacity="0.22" fill="none" />
  </svg>
);
