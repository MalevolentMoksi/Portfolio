/**
 * Geometric Pyramid — Isometric 3D rotating form
 * Animations: Pyramid spin all axes, face gradient hue-rotate
 */

export const GeometricPyramidSVG = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 50 50"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Front face — bottom-left */}
    <polygon
      points="10,35 25,10 25,35"
      stroke="currentColor"
      strokeWidth="0.9"
      className="pyramid-face-left"
      opacity="0.85"
      fill="none"
    />

    {/* Right face — bottom-right */}
    <polygon
      points="25,35 40,35 25,10"
      stroke="currentColor"
      strokeWidth="0.9"
      className="pyramid-face-right"
      opacity="0.75"
      fill="none"
    />

    {/* Bottom face */}
    <polygon
      points="10,35 25,35 17.5,42"
      stroke="currentColor"
      strokeWidth="0.8"
      className="pyramid-face-bottom"
      opacity="0.65"
      fill="none"
    />
    <polygon
      points="25,35 40,35 32.5,42"
      stroke="currentColor"
      strokeWidth="0.8"
      className="pyramid-face-bottom"
      opacity="0.65"
      fill="none"
    />

    {/* Base outline */}
    <line x1="10" y1="35" x2="17.5" y2="42" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
    <line x1="40" y1="35" x2="32.5" y2="42" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />

    {/* Center apex glow */}
    <circle className="pyramid-apex" cx="25" cy="10" r="1.5" stroke="currentColor" strokeWidth="0.6" opacity="0.9" fill="none" />

    {/* Shadow underneath */}
    <g className="pyramid-shadow" opacity="0.4">
      <ellipse cx="25" cy="44" rx="10" ry="2" stroke="currentColor" strokeWidth="0.5" fill="none" />
    </g>
  </svg>
);
