/**
 * Retro Synthesizer Keyboard — Keys glowing sequentially
 * Animations: Key glow sweep, wheel spin, LED strobe
 */

export const SynthesizerKeyboardSVG = () => (
  <svg
    width="144"
    height="56"
    viewBox="0 0 90 35"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Device body */}
    <rect
      x="4"
      y="6"
      width="82"
      height="24"
      rx="2"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.9"
      fill="none"
    />

    {/* Keyboard keys — lit sequentially */}
    <g className="synth-keys">
      {/* White keys */}
      {[12, 18, 24, 30, 36, 42, 48, 54, 60].map((x) => (
        <rect key={x} x={x} y="12" width="5" height="12" rx="0.3" stroke="currentColor" strokeWidth="0.5" opacity="0.7" fill="none" />
      ))}
    </g>

    {/* Pitch bend wheel — on left */}
    <g className="synth-pitch-wheel" style={{ transformOrigin: '10px 24px' }}>
      <circle cx="10" cy="24" r="3" stroke="currentColor" strokeWidth="0.7" opacity="0.85" fill="none" />
      <line x1="10" y1="21" x2="10" y2="27" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
    </g>

    {/* Modulation wheel — left center */}
    <circle cx="10" cy="17" r="1.8" stroke="currentColor" strokeWidth="0.6" opacity="0.7" fill="none" />

    {/* LED indicators — top right */}
    <g className="synth-leds">
      <circle className="synth-led" cx="72" cy="10" r="0.6" fill="currentColor" opacity="0.8" />
      <circle className="synth-led" cx="78" cy="10" r="0.6" fill="currentColor" opacity="0.6" />
      <circle className="synth-led" cx="84" cy="10" r="0.6" fill="currentColor" opacity="0.5" />
    </g>

    {/* Sliders — right side */}
    <g className="synth-sliders">
      <line x1="72" y1="14" x2="72" y2="26" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <line x1="78" y1="14" x2="78" y2="26" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <line x1="84" y1="14" x2="84" y2="26" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      {/* Slider handles */}
      <rect x="70" y="18" width="4" height="2" rx="0.5" stroke="currentColor" strokeWidth="0.3" opacity="0.7" fill="none" />
      <rect x="76" y="16" width="4" height="2" rx="0.5" stroke="currentColor" strokeWidth="0.3" opacity="0.7" fill="none" />
      <rect x="82" y="20" width="4" height="2" rx="0.5" stroke="currentColor" strokeWidth="0.3" opacity="0.7" fill="none" />
    </g>
  </svg>
);
