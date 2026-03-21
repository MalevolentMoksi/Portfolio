/**
 * Robotic Arm — Multi-jointed articulated
 * Animations: Arm articulation, gripper snap, joint power glow
 */

export const RoboticArmSVG = () => (
  <svg
    width="144"
    height="56"
    viewBox="0 0 90 35"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base carriage */}
    <rect x="4" y="22" width="14" height="8" rx="1" stroke="currentColor" strokeWidth="0.7" opacity="0.78" fill="none" />
    <line x1="4" y1="30" x2="20" y2="30" stroke="currentColor" strokeWidth="0.45" opacity="0.55" />

    {/* Base pivot */}
    <circle cx="16" cy="24" r="1.7" stroke="currentColor" strokeWidth="0.65" className="joint-power" opacity="0.9" fill="none" />

    {/* Segment 1 */}
    <g className="arm-segment-1">
      <line x1="16" y1="24" x2="29" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.86" />
    </g>
    <circle className="joint-power" cx="29" cy="16" r="1.35" stroke="currentColor" strokeWidth="0.6" opacity="0.82" fill="none" />

    {/* Segment 2 */}
    <g className="arm-segment-2">
      <line x1="29" y1="16" x2="43" y2="19" stroke="currentColor" strokeWidth="0.92" opacity="0.82" />
    </g>
    <circle className="joint-power" cx="43" cy="19" r="1.25" stroke="currentColor" strokeWidth="0.55" opacity="0.8" fill="none" />

    {/* Segment 3 */}
    <g className="arm-segment-3">
      <line x1="43" y1="19" x2="56" y2="14" stroke="currentColor" strokeWidth="0.86" opacity="0.78" />
    </g>
    <circle className="joint-power" cx="56" cy="14" r="1.15" stroke="currentColor" strokeWidth="0.52" opacity="0.78" fill="none" />

    {/* Segment 4 */}
    <g className="arm-segment-4">
      <line x1="56" y1="14" x2="68" y2="15" stroke="currentColor" strokeWidth="0.8" opacity="0.75" />
    </g>
    <circle className="joint-power" cx="68" cy="15" r="1.05" stroke="currentColor" strokeWidth="0.5" opacity="0.76" fill="none" />

    {/* Segment 5 */}
    <g className="arm-segment-5">
      <line x1="68" y1="15" x2="78" y2="13" stroke="currentColor" strokeWidth="0.74" opacity="0.72" />
    </g>

    {/* Gripper */}
    <g className="gripper-claw">
      <line x1="78" y1="13" x2="86" y2="10" stroke="currentColor" strokeWidth="0.62" opacity="0.82" />
      <line x1="78" y1="13" x2="86" y2="15" stroke="currentColor" strokeWidth="0.62" opacity="0.82" />
      <circle cx="86" cy="10" r="0.45" stroke="currentColor" strokeWidth="0.3" opacity="0.7" fill="none" />
      <circle cx="86" cy="15" r="0.45" stroke="currentColor" strokeWidth="0.3" opacity="0.7" fill="none" />
    </g>

    {/* Power cable */}
    <path d="M 4 24 Q 1 25 1 28" stroke="currentColor" strokeWidth="0.4" opacity="0.45" fill="none" strokeDasharray="1 1" />
  </svg>
);
