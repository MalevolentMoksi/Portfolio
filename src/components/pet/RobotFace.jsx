/* ══════════════════════════════════════════════
   Robot SVG — 60 × 60 px, viewBox 0 0 48 48
   Expressions réactives + regard curseur + détails
   ══════════════════════════════════════════════ */
import { motion } from 'framer-motion';
import { PET_SIZE } from './petConstants.js';

const RobotFace = ({ expression, eyeState, mouthExpr, gazeX = 0, gazeY = 0 }) => {
  const expr = expression || 'content';
  // eyeState / mouthExpr allow eyes and mouth to vary independently from the base expression
  const es = eyeState || expr;
  const me = mouthExpr || expr;
  // Clamp gaze to stay inside eye socket (socket r=3.5 − pupil r=1.5 = max 2.0)
  let gx = Math.max(-1.8, Math.min(1.8, gazeX));
  let gy = Math.max(-1.8, Math.min(1.8, gazeY));
  // Enforce minimum offset to prevent dead-center stare (use raw gaze direction)
  const minOffset = 0.4;
  const mag = Math.sqrt(gx * gx + gy * gy);
  if (mag < minOffset && mag > 0.01) {
    gx = (gx / mag) * minOffset;
    gy = (gy / mag) * minOffset;
  } else if (mag <= 0.01) {
    // Near-zero gaze → nudge slightly down-right so it doesn't snap to angle 0
    gx = minOffset * 0.7;
    gy = minOffset * 0.7;
  }
  // Add subtle jitter for natural micro-saccades (applied after offset so it never inverts direction)
  gx += Math.sin(Date.now() * 0.003) * 0.18;
  gy += Math.cos(Date.now() * 0.004) * 0.15;
  // Final re-clamp after jitter
  gx = Math.max(-1.8, Math.min(1.8, gx));
  gy = Math.max(-1.8, Math.min(1.8, gy));

  const renderEyes = () => {
    switch (es) {
      // ── Happy variants ───────────────────────────────────────────────
      case 'happy': case 'excited': case 'petted': case 'happy-closed':
        // ^_^ closed arc eyes — used for classic happy or petted
        return (
          <>
            <path d="M13.5 19.5 Q17 15 20.5 19.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M27.5 19.5 Q31 15 34.5 19.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="21" cy="16" r="0.7" fill="currentColor" opacity="0.6" />
            <circle cx="35" cy="16" r="0.7" fill="currentColor" opacity="0.6" />
          </>
        );
      case 'happy-open': {
        // Open blinking eyes + smile — happy but eyes visible
        const blinkAnim = { scaleY: [1, 1, 0.08, 1, 1] };
        const blinkTrans = { duration: 3.5, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1], ease: 'easeInOut' };
        return (
          <>
            <circle cx="17" cy="19" r="3.5" fill="rgba(0,0,0,0.55)" stroke="currentColor" strokeWidth="1.5" />
            <motion.circle
              cx={17 + gx} cy={19 + gy} r="1.6"
              fill="currentColor" className="pet-eye-pupil"
              animate={blinkAnim} transition={blinkTrans}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            />
            <circle cx="14.5" cy="15.5" r="0.7" fill="currentColor" opacity="0.55" />
            <circle cx="31" cy="19" r="3.5" fill="rgba(0,0,0,0.55)" stroke="currentColor" strokeWidth="1.5" />
            <motion.circle
              cx={31 + gx} cy={19 + gy} r="1.6"
              fill="currentColor" className="pet-eye-pupil"
              animate={blinkAnim} transition={{ ...blinkTrans, delay: 0.08 }}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            />
            <circle cx="28.5" cy="15.5" r="0.7" fill="currentColor" opacity="0.55" />
          </>
        );
      }
      // ── Sad variants ─────────────────────────────────────────────────
      case 'sad':
        // Classic sad — droopy downward pupils + inward brows
        return (
          <>
            <circle cx="17" cy="19" r="3.5" fill="rgba(0,0,0,0.55)" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="31" cy="19" r="3.5" fill="rgba(0,0,0,0.55)" stroke="currentColor" strokeWidth="1.5" />
            <circle cx={17 + gx * 0.6} cy={19 + gy * 0.6 + 0.5} r="1.5" fill="currentColor" className="pet-eye-pupil" />
            <circle cx={31 + gx * 0.6} cy={19 + gy * 0.6 + 0.5} r="1.5" fill="currentColor" className="pet-eye-pupil" />
            {/* Sad brows — slant inward toward center */}
            <line x1="13" y1="13" x2="20" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="35" y1="13" x2="28" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'angry':
        // Furrowed angry brows — frustrated/neglected variant of sad
        return (
          <>
            <circle cx="17" cy="19" r="3.5" fill="rgba(0,0,0,0.55)" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="31" cy="19" r="3.5" fill="rgba(0,0,0,0.55)" stroke="currentColor" strokeWidth="1.5" />
            <circle cx={17 + gx * 0.6} cy={19 + gy * 0.6} r="1.5" fill="currentColor" className="pet-eye-pupil" />
            <circle cx={31 + gx * 0.6} cy={19 + gy * 0.6} r="1.5" fill="currentColor" className="pet-eye-pupil" />
            {/* Angry brows — slant outward, mirrored from sad */}
            <line x1="13" y1="15" x2="20" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="35" y1="15" x2="28" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </>
        );
      case 'tired':
        // Half-closed heavy-lid eyes — dejected/exhausted variant of sad
        return (
          <>
            <circle cx="17" cy="19" r="3.5" fill="rgba(0,0,0,0.55)" stroke="currentColor" strokeWidth="1.5" />
            <circle cx={17 + gx * 0.4} cy={19 + gy * 0.4 + 0.8} r="1.4" fill="currentColor" opacity="0.8" className="pet-eye-pupil" />
            {/* Heavy lid — filled arc covering top of eye socket */}
            <path d="M13.5 19 Q17 15.5 20.5 19" fill="rgba(0,0,0,0.78)" stroke="none" />
            <circle cx="31" cy="19" r="3.5" fill="rgba(0,0,0,0.55)" stroke="currentColor" strokeWidth="1.5" />
            <circle cx={31 + gx * 0.4} cy={19 + gy * 0.4 + 0.8} r="1.4" fill="currentColor" opacity="0.8" className="pet-eye-pupil" />
            <path d="M27.5 19 Q31 15.5 34.5 19" fill="rgba(0,0,0,0.78)" stroke="none" />
          </>
        );
      case 'woozy':
        // Œil tourbillon — point central + arc 315° ouvert à l'extrémité (style manga "étourdi")
        // Le point central + l'arc avec une "queue" ouverte donne une spirale clairement lisible
        return (
          <>
            {/* Left swirl eye */}
            <g className="pet-spiral-eye">
              <circle cx="17" cy="19" r="1" fill="currentColor" />
              <path
                d="M17,16.2 Q20.2,16.2 20.2,19 Q20.2,21.8 17,21.8 Q13.8,21.8 13.8,19 Q13.8,17.2 15.8,17"
                fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              />
            </g>
            {/* Right swirl eye */}
            <g className="pet-spiral-eye">
              <circle cx="31" cy="19" r="1" fill="currentColor" />
              <path
                d="M31,16.2 Q34.2,16.2 34.2,19 Q34.2,21.8 31,21.8 Q27.8,21.8 27.8,19 Q27.8,17.2 29.8,17"
                fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              />
            </g>
          </>
        );
      case 'sleep':
        // U_U — yeux fermés en arcs inversés (dodo mignon)
        return (
          <>
            {/* Left U eye */}
            <path d="M14 17 Q14 22 17 22 Q20 22 20 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            {/* Right U eye */}
            <path d="M28 17 Q28 22 31 22 Q34 22 34 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </>
        );
      case 'cozy':
        // ^v^ — petits arcs v (convexe vers le bas) pour l'expression «posé sur le sol»
        return (
          <>
            <path d="M13.5 18 Q17 22.5 20.5 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M27.5 18 Q31 22.5 34.5 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="15" cy="21" r="0.6" fill="currentColor" opacity="0.55" />
            <circle cx="29" cy="21" r="0.6" fill="currentColor" opacity="0.55" />
          </>
        );
      // ── Other expressions ─────────────────────────────────────────────
      case 'dizzy':
        return (
          <>
            <line x1="14.5" y1="16.5" x2="19.5" y2="21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="19.5" y1="16.5" x2="14.5" y2="21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="28.5" y1="16.5" x2="33.5" y2="21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="33.5" y1="16.5" x2="28.5" y2="21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        );
      case 'scared': {
        // Dilated pupils — follow cursor with reduced range
        const sg = 0.4;
        return (
          <>
            <circle cx="17" cy="19" r="4" fill="currentColor" opacity="0.9" />
            <circle cx={17 + gx * sg} cy={19 + gy * sg} r="2.2" fill="var(--pet-bg, #080808)" />
            <circle cx={17 + gx * sg - 0.5} cy={19 + gy * sg - 0.5} r="0.5" fill="white" opacity="0.4" />
            <circle cx="31" cy="19" r="4" fill="currentColor" opacity="0.9" />
            <circle cx={31 + gx * sg} cy={19 + gy * sg} r="2.2" fill="var(--pet-bg, #080808)" />
            <circle cx={31 + gx * sg - 0.5} cy={19 + gy * sg - 0.5} r="0.5" fill="white" opacity="0.4" />
          </>
        );
      }
      default: {
        // Normal — gaze-tracking pupils that blink naturally
        const blinkAnim = { scaleY: [1, 1, 1, 1, 0.08, 1, 1, 1] };
        const blinkTrans = {
          duration: 4,
          repeat: Infinity,
          times: [0, 0.4, 0.45, 0.75, 0.8, 0.85, 0.9, 1],
          ease: 'easeInOut',
        };
        return (
          <>
            <circle cx="17" cy="19" r="3.5" fill="rgba(0,0,0,0.6)" stroke="currentColor" strokeWidth="1.5" />
            <motion.circle
              cx={17 + gx} cy={19 + gy} r="1.6"
              fill="currentColor"
              className="pet-eye-pupil"
              animate={blinkAnim}
              transition={blinkTrans}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            />
            <circle cx={17 + gx * 0.5 - 0.7} cy={19 + gy * 0.5 - 0.7} r="0.55" fill="white" opacity="0.55" />
            <circle cx="31" cy="19" r="3.5" fill="rgba(0,0,0,0.6)" stroke="currentColor" strokeWidth="1.5" />
            <motion.circle
              cx={31 + gx} cy={19 + gy} r="1.6"
              fill="currentColor"
              className="pet-eye-pupil"
              animate={blinkAnim}
              transition={{ ...blinkTrans, delay: 0.05 }}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            />
            <circle cx={31 + gx * 0.5 - 0.7} cy={19 + gy * 0.5 - 0.7} r="0.55" fill="white" opacity="0.55" />
          </>
        );
      }
    }
  };

  // All mouth shapes as identical M+Q structures so Framer Motion always
  // interpolates point-to-point instead of jumping from SVG origin on remount.
  // scared/eat are path-approximated (upward arc = gasp, wide arc = chew).
  const MOUTH_PATHS = {
    happy:   'M20 27 Q24 31 28 27',   // narrow :> smile
    petted:  'M20 27 Q24 31 28 27',
    excited: 'M19 26 Q24 30 29 26',   // slightly wider for excitement
    play:    'M19 26 Q24 30 29 26',
    cozy:    'M20 27.5 Q24 29.5 28 27.5', // subtle resting smile
    sad:     'M20 27 Q24 23 28 27',   // narrow :< frown
    dizzy:   'M19 27 Q24 23 29 27',   // shallow frown
    woozy:   'M16 27 C18 24 21 30 24 27 C27 24 30 30 32 27',  // ~~ wavy mouth
    scared:  'M20 27 Q24 22 28 27',  // tight upward arc — pursed gasp
    eat:     'M17 26 Q24 29.5 31 26',  // wide-open eating arc
    sleep:   'M22 27 Q24 30 26 27',  // petite bouche "o" de ronflement
    content: 'M18 28 Q24 28 30 28',
    default: 'M18 28 Q24 28 30 28',
  };

  // Single persistent motion.path — never unmounts, so Framer Motion always
  // interpolates from whatever shape is currently drawn, eliminating the
  // top-left origin jump that happens when element types (circle/rect) swap.
  const renderMouth = () => (
    <g className={expr === 'sleep' ? 'pet-mouth-wrap' : undefined}>
      <motion.path
        initial={{ d: MOUTH_PATHS.default }}
        animate={{ d: MOUTH_PATHS[me] ?? MOUTH_PATHS.default }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );

  const renderBlush = () => {
    if (expr === 'petted') {
      return (
        <>
          <circle className="pet-blush" cx="11" cy="23" r="5" fill="currentColor" opacity="0.38" />
          <circle className="pet-blush" cx="37" cy="23" r="5" fill="currentColor" opacity="0.38" />
        </>
      );
    }
    if (expr === 'happy') {
      return (
        <>
          <circle className="pet-blush" cx="11" cy="23" r="4" fill="currentColor" opacity="0.15" />
          <circle className="pet-blush" cx="37" cy="23" r="4" fill="currentColor" opacity="0.15" />
        </>
      );
    }
    return null;
  };

  // ── Antenna paths by expression — quadratic bezier M start Q control end ──
  // Bases at (18,6) left / (30,6) right (top of body, y=6).
  // All paths share the same M Q structure so Framer Motion can interpolate d.
  // Drooping: control point well above base, end point falls back down → bent wilted shape.
  const ANTENNA_PATHS = {
    happy:   { left: 'M18,6 Q17,1 15,0',    right: 'M30,6 Q31,1 33,0'   },
    content: { left: 'M18,6 Q17,1 15,0',    right: 'M30,6 Q31,1 33,0'   },
    excited: { left: 'M18,6 Q15,0 14,-1',   right: 'M30,6 Q33,0 34,-1'  },
    play:    { left: 'M18,6 Q15,0 14,-1',   right: 'M30,6 Q33,0 34,-1'  },
    petted:  { left: 'M18,6 Q17,0 15,-1',   right: 'M30,6 Q31,0 33,-1'  },
    eat:     { left: 'M18,6 Q17,1 15,0',    right: 'M30,6 Q31,1 33,0'   },
    scared:  { left: 'M18,6 Q16,-2 15,-3',  right: 'M30,6 Q32,-2 33,-3' },
    // Droop: bases slightly inward, tip ends outside body x-bounds (x<10 left, x>38 right)
    // so the curve arcs outward and never overlaps the head. y stays above y=6 (body top).
    sad:     { left: 'M20,6 Q10,2 6,4',     right: 'M28,6 Q38,2 42,4'  },
    dizzy:   { left: 'M20,6 Q10,2 6,4',     right: 'M28,6 Q38,2 42,4'  },
    woozy:   { left: 'M20,6 Q10,2 6,4',     right: 'M30,6 Q32,0 34,-1'  }, // asymmetric
    sleep:   { left: 'M20,6 Q9,3 5,5',      right: 'M28,6 Q39,3 43,5'  }, // most wilted
  };
  const antPath = ANTENNA_PATHS[expr] || ANTENNA_PATHS.content;
  const isWaggle = expr === 'excited' || expr === 'play';

  const animClass = [
    'pet-robot',
    expr === 'scared' && 'pet-robot--shake',
    (expr === 'eat' || expr === 'petted' || expr === 'play') && 'pet-robot--bounce',
    expr === 'woozy' && 'pet-robot--woozy',
    expr === 'sleep' && 'pet-robot--sleep',
  ].filter(Boolean).join(' ');

  return (
    <svg className={animClass} viewBox="0 0 48 48" width={PET_SIZE} height={PET_SIZE} aria-hidden="true">
      <defs>
        {/* Body fill gradient — translucent neon tint top to bottom */}
        <linearGradient id="petBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
        {/* Shine highlight — top-left gleam */}
        <linearGradient id="petShineGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.11" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        {/* Inner shadow for face screen — depth illusion */}
        <filter id="petScreenInner" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="bg" />
          <feBlend in="SourceGraphic" in2="bg" result="shape" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="alpha" />
          <feOffset dy="1.5" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="alpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.65 0" />
          <feBlend in2="shape" result="effect1_innerShadow" />
        </filter>
      </defs>

      {/* Dual antennas — bezier paths, expression-reactive */}
      <motion.path
        className={`pet-antenna pet-antenna--left${isWaggle ? ' pet-antenna--waggle-l' : ''}`}
        d={antPath.left}
        initial={{ d: antPath.left }}
        animate={{ d: antPath.left }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"
      />
      <motion.path
        className={`pet-antenna pet-antenna--right${isWaggle ? ' pet-antenna--waggle-r' : ''}`}
        d={antPath.right}
        initial={{ d: antPath.right }}
        animate={{ d: antPath.right }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"
      />

      {/* Arms — filled + stroke */}
      <rect x="2" y="14" width="5" height="8" rx="2" fill="url(#petBodyGrad)" stroke="currentColor" strokeWidth="2" />
      <rect x="41" y="14" width="5" height="8" rx="2" fill="url(#petBodyGrad)" stroke="currentColor" strokeWidth="2" />

      {/* Body — glassmorphism fill + thicker stroke for silhouette */}
      <rect x="7" y="6" width="34" height="26" rx="6" fill="url(#petBodyGrad)" stroke="currentColor" strokeWidth="3" />
      {/* Shine overlay — top-left arc of light */}
      <rect x="9" y="8" width="16" height="9" rx="3" fill="url(#petShineGrad)" />

      {/* Face screen — recessed dark panel with inner shadow for depth */}
      <rect x="10" y="13" width="28" height="17" rx="3.5" fill="rgba(0,0,0,0.42)" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.25" filter="url(#petScreenInner)" />

      {/* Micro-circuit: 4 corner connection dots */}
      <circle className="pet-circuit-dot" cx="10" cy="9"  r="1" fill="currentColor" opacity="0.28" />
      <circle className="pet-circuit-dot" cx="38" cy="9"  r="1" fill="currentColor" opacity="0.28" />
      <circle className="pet-circuit-dot" cx="10" cy="29" r="1" fill="currentColor" opacity="0.28" />
      <circle className="pet-circuit-dot" cx="38" cy="29" r="1" fill="currentColor" opacity="0.28" />

      {/* Forehead loader bar */}
      <rect x="16" y="8.5" width="16" height="1.4" rx="0.7" fill="currentColor" opacity="0.08" />
      <rect className="pet-loader-bar" x="16" y="8.5" width="10" height="1.4" rx="0.7" fill="currentColor" opacity="0.55" />

      {/* Eyes */}
      {renderEyes()}
      {renderBlush()}
      {renderMouth()}

      {/* Neck connectors */}
      <line x1="20" y1="32" x2="20" y2="35" stroke="currentColor" strokeWidth="1.5" />
      <line x1="28" y1="32" x2="28" y2="35" stroke="currentColor" strokeWidth="1.5" />

      {/* Lower body — filled */}
      <rect x="12" y="35" width="24" height="10" rx="4" fill="url(#petBodyGrad)" stroke="currentColor" strokeWidth="2" />

      {/* Chest LEDs — alternating pulse */}
      <circle className="pet-led" cx="20" cy="40" r="1.5" fill="currentColor" />
      <circle className="pet-led pet-led--alt" cx="28" cy="40" r="1.5" fill="currentColor" />
    </svg>
  );
};

export default RobotFace;
