import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMood } from '../contexts/MoodContext.jsx';

/* ── Configuration ── */
const DECAY_MS = 8000;
const REACTION_MS = 2000;
const COOLDOWNS = { feed: 2000, pet: 2000, play: 3000 };
const PET_SIZE = 60;
const HALF = PET_SIZE / 2;
const HEADER_H = 75;          // zone interdite en haut
const BASE_SPEED = 0.6;       // px/frame en balade
const MAX_SPEED = 1.2;        // px/frame max en balade
const MAGNET_RADIUS = 200;    // rayon d'attraction au curseur
const MAGNET_SPEED = 2.5;     // px/frame max sous attraction
const DRAG_FAST_THRESHOLD = 8; // vitesse (px/frame) à partir de laquelle scale + spin s'activent
const BOUNCE_RESTITUTION = 0.65; // coefficient de rebond sur les murs
const THROW_SPEED_CAP = 18;      // vitesse max de lancer (px/frame)
const SLEEP_IDLE_MS = 60_000;    // 1 minute sans activité → sommeil
const SCROLL_DIZZY_WINDOW = 1500; // fenêtre de détection scroll rapide (ms)
const REST_SCROLL_IDLE = 2500;   // 2.5s sans scroll → tenter repos

const LS = {
  hunger: 'pet-hunger',
  happiness: 'pet-happiness',
  spawned: 'pet-spawned',
};

const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));
const readLS = (key, fallback) => {
  const v = localStorage.getItem(key);
  return v !== null ? clamp(Number(v)) : fallback;
};

/* ── Humeur dérivée ── */
const getMood = (hunger, happiness) => {
  if (hunger > 60 && happiness > 60) return 'happy';
  if (hunger > 30 && happiness > 30) return 'content';
  return 'sad';
};

/* ── Textes d'humeur — pools avec variation aléatoire ── */
const MOOD_TEXT_POOL = {
  happy: [
    'Mes circuits ronronnent...',
    "J'ai calculé π à 37 décimales !",
    'Le monde est beau vu d\'ici.',
    'Niveau d\'énergie : optimal !',
    'Je pourrais explorer indéfiniment.',
    'Tout fonctionne parfaitement. ✓',
  ],
  content: [
    'Traitement en cours...',
    'Mode veille : désactivé.',
    'Scan de l\'environnement : nominal.',
    'En attente d\'instructions.',
    '01001000 01101001',
  ],
  sad: [
    'Mes batteries se vident...',
    'Un câlin, peut-être ?',
    "Tu m'as oublié…",
  ],
  scared: ['Alarme ! Alarme !', "Qu'est-ce que c'est ?!"],
  excited: ['Woohoo ! Overdrive activé !', 'Turbo mode !', 'Énergie maximale !'],
  dizzy:  ['Tout tourne... recalibrage.', 'Erreur : vertigo_overflow.'],
  woozy:  ['Téléportation... réussie... je crois.', 'Systèmes en cours de stabilisation...', 'Calibration gyroscopique requise.'],
  eat: ['Miam ! Énergie restaurée.', 'Délicieux ! +25% batterie.'],
  petted: ['Séquence câlin reçue. Bonheur ++', 'Chaleur détectée. Agréable.'],
  play: ['Mode jeu activé !', 'Ha ! Je gagne !', 'Partie enregistrée.'],
  sleep: ['Zzz...', 'Mode veille activé...', 'Analyse des rêves en cours...', 'Traitement des souvenirs de la journée...'],
};

/* ── Combinaisons yeux/bouche par expression ── */
const FACE_COMBOS = {
  happy:   [
    { eyes: 'happy-closed', mouth: 'happy' },
    { eyes: 'happy-open',   mouth: 'happy' },
    { eyes: 'happy-open',   mouth: 'excited' },
  ],
  excited: [{ eyes: 'happy-closed', mouth: 'excited' }],
  petted:  [{ eyes: 'happy-closed', mouth: 'petted' }],
  play:    [{ eyes: 'happy-open',   mouth: 'play' }],
  eat:     [{ eyes: 'default',      mouth: 'eat' }],
  sad: [
    { eyes: 'sad',   mouth: 'sad' },
    { eyes: 'angry', mouth: 'sad' },
    { eyes: 'tired', mouth: 'sad' },
  ],
  dizzy:   [{ eyes: 'dizzy',   mouth: 'dizzy' }],
  woozy:   [{ eyes: 'woozy',  mouth: 'woozy' }],
  scared:  [{ eyes: 'scared',  mouth: 'scared' }],
  content: [{ eyes: 'default', mouth: 'content' }],
  sleep:   [{ eyes: 'tired',   mouth: 'content' }],
};

/* ── Symboles SVG pour les pensées flottantes (viewBox 0 0 16 16) ── */
const THOUGHT_SYMBOLS = {
  heart: <path d="M8 13 C8 13 2.5 9 2.5 5.5 C2.5 3.5 4 2 6 2 C7 2 7.8 2.7 8 3 C8.2 2.7 9 2 10 2 C12 2 13.5 3.5 13.5 5.5 C13.5 9 8 13 8 13Z" fill="currentColor" />,
  star:  <path d="M8 1.5 L9.8 6 L14.5 6 L10.8 9 L12.2 13.5 L8 10.8 L3.8 13.5 L5.2 9 L1.5 6 L6.2 6 Z" fill="currentColor" />,
  note: (
    <>
      <ellipse cx="5" cy="12" rx="2.5" ry="1.8" fill="currentColor" />
      <line x1="7.5" y1="12" x2="7.5" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7.5" y1="3.5" x2="13.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.5" y1="5" x2="13.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  bolt: <path d="M10 1.5 L5 8.5 L9 8.5 L6 14.5 L13 6.5 L9 6.5 Z" fill="currentColor" />,
  zzz: (
    <>
      <path d="M3.5 12.5 L7.5 12.5 L3.5 15 L7.5 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 7.5 L10.5 7.5 L5.5 10.5 L10.5 10.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 2.5 L13.5 2.5 L8 6 L13.5 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  dots: (
    <>
      <circle cx="2.5" cy="8" r="1.8" fill="currentColor" />
      <circle cx="8"   cy="8" r="1.8" fill="currentColor" />
      <circle cx="13.5" cy="8" r="1.8" fill="currentColor" />
    </>
  ),
  exclaim: (
    <>
      <rect x="6.5" y="1.5" width="3" height="8.5" rx="1.5" fill="currentColor" />
      <circle cx="8" cy="13.5" r="1.8" fill="currentColor" />
    </>
  ),
};

const THOUGHT_POOLS = {
  happy:   ['heart', 'star', 'note', 'bolt'],
  content: ['note', 'dots'],
  sad:     ['dots', 'zzz'],
  scared:  ['exclaim'],
  excited: ['star', 'bolt'],
  play:    ['star', 'bolt'],
  eat:     ['heart'],
  petted:  ['heart', 'star'],
  dizzy:   ['zzz'],
  woozy:   ['zzz', 'dots'],
  sleep:   ['zzz'],
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ─────────────────────────────────────────────────
   Robot SVG — 60 × 60 px, viewBox 0 0 48 48
   Expressions réactives + regard curseur + détails
   ───────────────────────────────────────────────── */
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
        // X~X — crossed eyes + wavy mouth
        return (
          <>
            {/* Left X eye */}
            <line x1="14" y1="16" x2="20" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="20" y1="16" x2="14" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            {/* Right X eye */}
            <line x1="28" y1="16" x2="34" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="34" y1="16" x2="28" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
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
    excited: 'M19 26 Q24 32 29 26',   // slightly wider for excitement
    play:    'M19 26 Q24 32 29 26',
    sad:     'M20 30 Q24 26 28 30',   // narrow :< frown
    dizzy:   'M19 29 Q24 25 29 29',   // shallow frown
    woozy:   'M16 27 C18 24 21 30 24 27 C27 24 30 30 32 27',  // ~~ wavy mouth
    scared:  'M20 27 Q24 22 28 27',  // tight upward arc — pursed gasp
    eat:     'M17 26 Q24 36 31 26',  // wide-open eating arc
    sleep:   'M18 28 Q24 28 30 28',  // flat neutral line while sleeping
    content: 'M18 28 Q24 28 30 28',
    default: 'M18 28 Q24 28 30 28',
  };

  // Single persistent motion.path — never unmounts, so Framer Motion always
  // interpolates from whatever shape is currently drawn, eliminating the
  // top-left origin jump that happens when element types (circle/rect) swap.
  const renderMouth = () => (
    <motion.path
      initial={{ d: MOUTH_PATHS.default }}
      animate={{ d: MOUTH_PATHS[me] ?? MOUTH_PATHS.default }}
      transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
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

  const animClass = [
    'pet-robot',
    expr === 'scared' && 'pet-robot--shake',
    (expr === 'eat' || expr === 'petted' || expr === 'play') && 'pet-robot--bounce',
    (expr === 'excited' || expr === 'play') && 'pet-robot--antenna-spin',
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

      {/* Antenna */}
      <line className="pet-antenna" x1="24" y1="6" x2="24" y2="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle className="pet-antenna-tip" cx="24" cy="0.5" r="2.5" fill="currentColor" />

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

/* ─────────────────────────────────────────────────
   Pensée flottante — emoji SVG qui monte puis disparaît
   ───────────────────────────────────────────────── */
const FloatingThought = ({ symbol, petX, petY }) => {
  if (!symbol || !THOUGHT_SYMBOLS[symbol]) return null;
  return createPortal(
    <div
      className="pet-thought-bubble"
      style={{ left: `${petX - 22}px`, top: `${petY - 78}px` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" stroke="none" overflow="visible">
        {THOUGHT_SYMBOLS[symbol]}
      </svg>
    </div>,
    document.body,
  );
};

/* ─────────────────────────────────────────────────
   Robot qui se balade librement sur la page
   ───────────────────────────────────────────────── */
const WanderingPet = ({ stats, expression, eyeState, mouthExpr, petMood, onInteract, onBehavior, onThought, onHoverPet, cooldowns, thoughtSymbol, hudThought, sizeScale, speedMult, isSleeping, moodSpinActive }) => {
  const [pos, setPos] = useState(() => ({
    x: HALF + Math.random() * (window.innerWidth - PET_SIZE),
    y: HEADER_H + 60 + Math.random() * (window.innerHeight - HEADER_H - 150),
  }));
  const [facingLeft, setFacingLeft] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [speedLevel, setSpeedLevel] = useState(0);
  const [isResting, setIsResting] = useState(false);

  const posRef = useRef(pos);
  const velRef = useRef({ x: (Math.random() - 0.5) * BASE_SPEED * 2, y: (Math.random() - 0.5) * BASE_SPEED * 2 });
  // Desired velocity — slowly drifts for organic wandering
  const desiredVRef = useRef((() => {
    const a = Math.random() * Math.PI * 2;
    return { x: Math.cos(a) * BASE_SPEED, y: Math.sin(a) * BASE_SPEED };
  })());
  const cursorRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const hasMouseMovedRef = useRef(false);
  const frameRef = useRef(0);
  const rafRef = useRef(null);
  const hudRef = useRef(null);
  const robotRef = useRef(null);
  // Proximity + movement behavior tracking (frame-counted cooldowns)
  const proximityRef = useRef({ dwellFrames: 0, lastDist: Infinity, exciteCooldown: 0, scaredCooldown: 0, speedCooldown: 0, avoidDwellFrames: 0, avoidThoughtCooldown: 0, bounceCooldown: 0 });
  // petMood in a ref so the RAF closure is never stale
  const petMoodRef = useRef(petMood);
  useEffect(() => { petMoodRef.current = petMood; }, [petMood]);
  // Speed multiplier ref for RAF closure
  const speedMultRef = useRef(speedMult);
  useEffect(() => { speedMultRef.current = speedMult; }, [speedMult]);
  // Sleeping ref for RAF closure
  const isSleepingRef = useRef(isSleeping);
  useEffect(() => { isSleepingRef.current = isSleeping; }, [isSleeping]);
  // Hysteresis: +1/frame moving right, -1/frame moving left. Flip commits after ±15 frames (~0.5 s).
  const flipHysteresisRef = useRef(0);
  // Drag
  const isDraggingRef      = useRef(false);
  const dragOffsetRef      = useRef({ x: 0, y: 0 });
  const dragHasMovedRef    = useRef(false);
  const dragScaredFiredRef = useRef(false);
  const dragSpeedRef       = useRef(0);
  const dragRotRef         = useRef(0);
  const [isDragging,    setIsDragging]    = useState(false);
  const [dragSpeed,     setDragSpeed]     = useState(0);
  const [dragRotation,  setDragRotation]  = useState(0);
  // Scroll dizzy detection
  const scrollHistoryRef = useRef([]);
  const scrollDizzyCooldownRef = useRef(0);
  const lastScrollYRef = useRef(window.scrollY);
  // Rest/sit detection
  const restTargetRef = useRef(null);
  const scrollIdleTimerRef = useRef(null);
  const hasRestThoughtRef = useRef(false);
  const restTimeoutRef = useRef(null);
  const isRestingRef = useRef(false);
  // Hover-to-pet
  const hoverTimerRef = useRef(null);
  const hoverCooldownRef = useRef(0);
  // Throw momentum — skip wander speed cap while decaying
  const throwActiveRef = useRef(false);

  /* ── Suivi du curseur ── */
  useEffect(() => {
    const onMove = (e) => {
      hasMouseMovedRef.current = true;
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  /* ── Scroll dizzy — détection de scroll rapide back-and-forth ── */
  useEffect(() => {
    const onScroll = () => {
      const now = Date.now();
      const sy = window.scrollY;
      const delta = sy - lastScrollYRef.current;
      lastScrollYRef.current = sy;
      if (Math.abs(delta) < 5) return; // ignore micro-scrolls
      scrollHistoryRef.current.push({ delta, time: now });
      // Trim to window
      scrollHistoryRef.current = scrollHistoryRef.current.filter(e => now - e.time < SCROLL_DIZZY_WINDOW);
      // Count sign reversals
      const hist = scrollHistoryRef.current;
      if (hist.length >= 3 && scrollDizzyCooldownRef.current === 0) {
        let reversals = 0;
        for (let i = 1; i < hist.length; i++) {
          if ((hist[i].delta > 0) !== (hist[i - 1].delta > 0)) reversals++;
        }
        if (reversals >= 3) {
          onBehavior('dizzy');
          onThought('zzz');
          scrollDizzyCooldownRef.current = Date.now() + 8000;
          scrollHistoryRef.current = [];
        }
      }
      // Reset cooldown after timeout
      if (scrollDizzyCooldownRef.current > 0 && now > scrollDizzyCooldownRef.current) {
        scrollDizzyCooldownRef.current = 0;
      }

      // Cancel resting on scroll
      if (isRestingRef.current) {
        isRestingRef.current = false;
        setIsResting(false);
        restTargetRef.current = null;
        hasRestThoughtRef.current = false;
        clearTimeout(restTimeoutRef.current);
      }

      // Schedule rest attempt after scroll idle
      clearTimeout(scrollIdleTimerRef.current);
      const restDelay = 2500 + Math.random() * 7500; // 2.5 – 10 s
      scrollIdleTimerRef.current = setTimeout(() => {
        if (isDraggingRef.current || isSleepingRef.current) return;
        // Find a visible resting target (main or footer)
        const vh = window.innerHeight;
        const mainEl = document.querySelector('main');
        const footerEl = document.querySelector('footer');
        let target = null;
        for (const el of [footerEl, mainEl]) {
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          // Element's top edge must be within visible viewport
          if (rect.top > 60 && rect.top < vh - 80) {
            const rx = HALF + Math.random() * Math.max(0, Math.min(rect.width, window.innerWidth) - PET_SIZE);
            // Sit ON the element's top edge: pet bottom aligns with rect.top
            target = { x: rect.left + rx, y: rect.top - HALF + 6 };
            break;
          }
        }
        if (target) {
          restTargetRef.current = target;
          hasRestThoughtRef.current = false;
          isRestingRef.current = true;
          setIsResting(true);
          // Auto cancel rest after 10s
          restTimeoutRef.current = setTimeout(() => {
            isRestingRef.current = false;
            setIsResting(false);
            restTargetRef.current = null;
          }, 10000);
        }
      }, restDelay);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(scrollIdleTimerRef.current);
      clearTimeout(restTimeoutRef.current);
    };
  }, [onBehavior, onThought]);

  /* ── Boucle d'animation RAF ── */
  useEffect(() => {
    const tick = () => {
      if (hudOpen || isDraggingRef.current) { rafRef.current = requestAnimationFrame(tick); return; }

      const p = posRef.current;
      const v = velRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      frameRef.current++;
      const sm = speedMultRef.current;
      const sleeping = isSleepingRef.current;

      // ── Rest/sit steering — override normal wander when resting ──
      if (isRestingRef.current && restTargetRef.current) {
        const rt = restTargetRef.current;
        const rdx = rt.x - p.x;
        const rdy = rt.y - p.y;
        const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
        if (rdist > 12) {
          // Steer strongly toward rest target
          v.x += (rdx / rdist) * 0.18;
          v.y += (rdy / rdist) * 0.18;
          v.x *= 0.92;
          v.y *= 0.92;
        } else {
          // Arrived — stop and emit zzz thought once
          v.x *= 0.8;
          v.y *= 0.8;
          if (!hasRestThoughtRef.current) {
            hasRestThoughtRef.current = true;
            onThought('zzz');
          }
        }
        // Update position with wall clamp
        p.x = clamp(p.x + v.x, HALF, vw - HALF);
        p.y = clamp(p.y + v.y, HEADER_H + 10, vh - HALF);
        if (frameRef.current % 2 === 0) {
          setPos({ x: p.x, y: p.y });
          setSpeedLevel(Math.sqrt(v.x * v.x + v.y * v.y));
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // ── Sleeping: near-zero drift, no cursor interaction ──
      if (sleeping) {
        v.x *= 0.96;
        v.y *= 0.96;
        if (frameRef.current % 50 === 0) {
          const dv = desiredVRef.current;
          dv.x = (Math.random() - 0.5) * 0.1;
          dv.y = (Math.random() - 0.5) * 0.1;
        }
        v.x += (desiredVRef.current.x - v.x) * 0.01;
        v.y += (desiredVRef.current.y - v.y) * 0.01;
        // Emit zzz thought every ~300 frames (~5s)
        if (frameRef.current % 300 === 0) onThought('zzz');
        p.x = clamp(p.x + v.x, HALF, vw - HALF);
        p.y = clamp(p.y + v.y, HEADER_H + 10, vh - HALF);
        if (frameRef.current % 2 === 0) {
          setPos({ x: p.x, y: p.y });
          setSpeedLevel(Math.sqrt(v.x * v.x + v.y * v.y));
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Organic wander: gently perturb desired direction every 50 frames
      if (frameRef.current % 50 === 0) {
        const dv = desiredVRef.current;
        dv.x += (Math.random() - 0.5) * 1.4;
        dv.y += (Math.random() - 0.5) * 1.4;
        const dm = Math.sqrt(dv.x * dv.x + dv.y * dv.y) || 1;
        dv.x = (dv.x / dm) * BASE_SPEED * sm;
        dv.y = (dv.y / dm) * BASE_SPEED * sm;
      }
      // Smooth steering toward desired velocity
      const dv = desiredVRef.current;
      v.x += (dv.x - v.x) * 0.035;
      v.y += (dv.y - v.y) * 0.035;
      // Natural friction
      v.x *= 0.984;
      v.y *= 0.984;

      // ── Wall bounce with momentum ──
      const effectiveMaxSpeed = MAX_SPEED * sm;
      const nextX = p.x + v.x;
      const nextY = p.y + v.y;
      let bounced = false;
      if (nextX < HALF) {
        v.x = Math.abs(v.x) * BOUNCE_RESTITUTION;
        p.x = HALF;
        bounced = true;
      } else if (nextX > vw - HALF) {
        v.x = -Math.abs(v.x) * BOUNCE_RESTITUTION;
        p.x = vw - HALF;
        bounced = true;
      }
      if (nextY < HEADER_H + 10) {
        v.y = Math.abs(v.y) * BOUNCE_RESTITUTION;
        p.y = HEADER_H + 10;
        bounced = true;
      } else if (nextY > vh - HALF) {
        v.y = -Math.abs(v.y) * BOUNCE_RESTITUTION;
        p.y = vh - HALF;
        bounced = true;
      }
      // Bounce dizzy — if fast enough and cooldown expired
      const prox = proximityRef.current;
      if (bounced) {
        const bspd = Math.sqrt(v.x * v.x + v.y * v.y);
        if (bspd > 1.8 && prox.bounceCooldown === 0) {
          onBehavior('dizzy');
          prox.bounceCooldown = 120;
        }
      }
      if (prox.bounceCooldown > 0) prox.bounceCooldown--;

      // Smooth edge repulsion (softer push when not bouncing hard)
      const margin = 40;
      if (!bounced) {
        if (p.x < margin + HALF)      v.x += 0.18 * Math.pow(1 - Math.max(0, (p.x - HALF) / margin), 1.5);
        if (p.x > vw - margin - HALF) v.x -= 0.18 * Math.pow(1 - Math.max(0, (vw - HALF - p.x) / margin), 1.5);
        if (p.y < HEADER_H + 20)      v.y += 0.28;
        if (p.y > vh - margin - HALF)  v.y -= 0.18 * Math.pow(1 - Math.max(0, (vh - HALF - p.y) / margin), 1.5);
      }

      // Cursor interaction — mood-dependent
      const dx = cursorRef.current.x - p.x;
      const dy = cursorRef.current.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let speedCap = MAX_SPEED;

      if (dist > 5) {
        if (petMoodRef.current !== 'sad' && dist < MAGNET_RADIUS) {
          // Happy/content: gently attracted to cursor
          const strength = ((MAGNET_RADIUS - dist) / MAGNET_RADIUS) * 0.06;
          v.x += (dx / dist) * strength;
          v.y += (dy / dist) * strength;
          speedCap = MAGNET_SPEED;
        } else if (petMoodRef.current === 'sad' && dist < 120) {
          // Sad: softly avoids the cursor
          const pushback = ((120 - dist) / 120) * 0.04;
          v.x -= (dx / dist) * pushback;
          v.y -= (dy / dist) * pushback;
          // Track dwell time near cursor while avoiding — trigger angry thought bubble
          proximityRef.current.avoidDwellFrames++;
          if (proximityRef.current.avoidDwellFrames >= 30 && proximityRef.current.avoidThoughtCooldown === 0) {
            onThought('exclaim');
            proximityRef.current.avoidDwellFrames = 0;
            proximityRef.current.avoidThoughtCooldown = 360; // ~6s cooldown
          }
        } else {
          // Reset avoid dwell when cursor is far
          proximityRef.current.avoidDwellFrames = 0;
        }
      }
      if (proximityRef.current.avoidThoughtCooldown > 0) proximityRef.current.avoidThoughtCooldown--;

      // Limiter la vitesse — skip wander cap during throw momentum
      const uncappedSpeed = Math.sqrt(v.x * v.x + v.y * v.y);
      if (throwActiveRef.current) {
        // Only apply hard cap (THROW_SPEED_CAP) during throw; let friction decay naturally
        if (uncappedSpeed > THROW_SPEED_CAP) {
          v.x = (v.x / uncappedSpeed) * THROW_SPEED_CAP;
          v.y = (v.y / uncappedSpeed) * THROW_SPEED_CAP;
        }
        // Clear throw state once momentum has decayed to normal wander speed
        if (uncappedSpeed < speedCap) throwActiveRef.current = false;
      } else if (uncappedSpeed > speedCap) {
        v.x = (v.x / uncappedSpeed) * speedCap;
        v.y = (v.y / uncappedSpeed) * speedCap;
      }
      const spd = Math.sqrt(v.x * v.x + v.y * v.y);

      // Mettre à jour la position (with bounce already handled above, just apply velocity)
      if (!bounced) {
        p.x = clamp(p.x + v.x, HALF, vw - HALF);
        p.y = clamp(p.y + v.y, HEADER_H + 10, vh - HALF);
      }

      // All state updates batched every 2 frames (~30fps render)
      if (frameRef.current % 2 === 0) {
        setPos({ x: p.x, y: p.y });
        setSpeedLevel(spd);

        // Flip with hysteresis — commits only after 15 consecutive frames in new direction
        if (v.x > 0.08)       flipHysteresisRef.current = Math.min(flipHysteresisRef.current + 1,  20);
        else if (v.x < -0.08) flipHysteresisRef.current = Math.max(flipHysteresisRef.current - 1, -20);
        if (flipHysteresisRef.current >=  15) setFacingLeft(false);
        if (flipHysteresisRef.current <= -15) setFacingLeft(true);

        // Gaze: pupils follow cursor direction, clamped to eye socket range
        const gdx = cursorRef.current.x - p.x;
        const gdy = cursorRef.current.y - p.y;
        const gdist = Math.sqrt(gdx * gdx + gdy * gdy) || 1;
        const gazeStrength = Math.min(1, gdist / 260);
        const MAX_GAZE = 1.8;
        if (!hasMouseMovedRef.current) {
          setGaze({ x: 0, y: 0 });
        } else {
          setGaze({
            x: (gdx / gdist) * gazeStrength * MAX_GAZE,
            y: (gdy / gdist) * gazeStrength * MAX_GAZE,
          });
        }

        // ── Proximity & movement behaviors ──────────────────────────────
        if (prox.exciteCooldown > 0) prox.exciteCooldown--;
        if (prox.scaredCooldown > 0) prox.scaredCooldown--;
        if (prox.speedCooldown  > 0) prox.speedCooldown--;

        const isSad = petMoodRef.current === 'sad';

        // Dwell excitement — only when happy/content
        if (!isSad && dist < 130 && dist > 8) {
          prox.dwellFrames++;
          if (prox.dwellFrames >= 90 && prox.exciteCooldown === 0) {
            onBehavior('excited');
            prox.exciteCooldown = 300;
            prox.dwellFrames = 0;
          }
        } else {
          prox.dwellFrames = Math.max(0, prox.dwellFrames - 2);
        }

        // Sudden close approach → scared (mood-independent — surprise is universal)
        if (prox.lastDist - dist > 80 && dist < 160 && prox.scaredCooldown === 0) {
          onBehavior('scared');
          prox.scaredCooldown = 180;
          prox.dwellFrames = 0;
        }
        prox.lastDist = dist;

        // Sustained high speed → energy burst — only when not sad
        if (!isSad && spd > effectiveMaxSpeed * 0.82 && prox.speedCooldown === 0 && prox.exciteCooldown === 0) {
          onBehavior('excited');
          prox.speedCooldown = 240;
          prox.exciteCooldown = 240;
        }

        // Hover-to-pet cooldown decrement
        if (hoverCooldownRef.current > 0) hoverCooldownRef.current--;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hudOpen]);

  /* ── Fermer le HUD au clic extérieur ── */
  useEffect(() => {
    if (!hudOpen) return;
    const handle = (e) => {
      if (
        hudRef.current && !hudRef.current.contains(e.target) &&
        robotRef.current && !robotRef.current.contains(e.target)
      ) {
        setHudOpen(false);
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handle); };
  }, [hudOpen]);

  /* ── Fermer avec Escape ── */
  useEffect(() => {
    if (!hudOpen) return;
    const handle = (e) => { if (e.key === 'Escape') setHudOpen(false); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [hudOpen]);

  const toggleHud = () => setHudOpen((h) => !h);

  /* ── Drag — pointer capture ── */
  const handleDragStart = useCallback((e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    isDraggingRef.current      = true;
    dragHasMovedRef.current    = false;
    dragScaredFiredRef.current = false;
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    // Only count as a drag once the pointer has actually moved a few pixels
    if (!dragHasMovedRef.current) {
      const dx0 = e.clientX - (dragOffsetRef.current.x + posRef.current.x);
      const dy0 = e.clientY - (dragOffsetRef.current.y + posRef.current.y);
      if (Math.abs(dx0) < 4 && Math.abs(dy0) < 4) return; // ignore micro-jitter
      dragHasMovedRef.current = true;
    }
    // Fire scared once on first real movement
    if (!dragScaredFiredRef.current) {
      dragScaredFiredRef.current = true;
      onBehavior('scared');
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const nx = clamp(e.clientX - dragOffsetRef.current.x, HALF, vw - HALF);
    const ny = clamp(e.clientY - dragOffsetRef.current.y, HEADER_H + 10, vh - HALF);
    posRef.current = { x: nx, y: ny };
    setPos({ x: nx, y: ny });
    // Update facing direction immediately while dragging
    const dx = e.movementX;
    if (Math.abs(dx) > 0.5) {
      flipHysteresisRef.current = dx > 0 ? 20 : -20;
      setFacingLeft(dx < 0);
    }
    // Track drag speed (smoothed) and accumulate spin rotation
    const spd = Math.sqrt(e.movementX * e.movementX + e.movementY * e.movementY);
    dragSpeedRef.current = dragSpeedRef.current * 0.65 + spd * 0.35;
    setDragSpeed(dragSpeedRef.current);
    if (dragSpeedRef.current > DRAG_FAST_THRESHOLD) {
      dragRotRef.current += e.movementX * 3;
      setDragRotation(dragRotRef.current);
    }
  }, [onBehavior]);

  const handleDragEnd = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    // Throw velocity from last pointer movement — use THROW_SPEED_CAP for bouncing
    velRef.current = {
      x: clamp(e.movementX * 1.2, -THROW_SPEED_CAP, THROW_SPEED_CAP),
      y: clamp(e.movementY * 1.2, -THROW_SPEED_CAP, THROW_SPEED_CAP),
    };
    if (dragHasMovedRef.current) {
      throwActiveRef.current = true;
      onBehavior('excited');
    }
    // Cancel resting on drag
    if (isRestingRef.current) {
      isRestingRef.current = false;
      setIsResting(false);
      restTargetRef.current = null;
      clearTimeout(restTimeoutRef.current);
    }
    // Reset smoothed drag speed so scale springs back to normal
    dragSpeedRef.current = 0;
    setDragSpeed(0);
  }, [onBehavior]);

  /* ── HUD position — measured after render, viewport-safe smart placement ── */
  const [hudPos, setHudPos] = useState(null);
  useEffect(() => {
    if (!hudOpen) { setHudPos(null); return; }
    const recompute = () => {
      if (!hudRef.current) return;
      const { width, height } = hudRef.current.getBoundingClientRect();
      const vw  = window.innerWidth;
      const vh  = window.innerHeight;
      const p   = posRef.current;
      const GAP = 14;
      const PAD = 8;
      // Prefer above pet; fall back below if not enough room
      let top  = p.y - HALF - height - GAP;
      if (top < HEADER_H + PAD) top = p.y + HALF + GAP;
      // Center on pet horizontally, clamp to viewport
      let left = p.x - width / 2;
      left = Math.max(PAD, Math.min(vw - width - PAD, left));
      top  = Math.max(HEADER_H + PAD, Math.min(vh - height - PAD, top));
      setHudPos({ left, top });
    };
    // Double rAF: HUD must paint before we can measure its bounds
    const id = requestAnimationFrame(() => requestAnimationFrame(recompute));
    window.addEventListener('resize', recompute);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', recompute); };
  }, [hudOpen, pos]);

  /* ── Focus management — modal-like ── */
  useEffect(() => {
    if (hudOpen) {
      const id = setTimeout(() => {
        const first = hudRef.current?.querySelector('button:not(:disabled)');
        first?.focus();
      }, 80);
      return () => clearTimeout(id);
    }
    // Restore focus to pet trigger on close
    robotRef.current?.focus();
  }, [hudOpen]);

  /* ── Focus trap + keyboard handler for HUD dialog ── */
  const handleHudKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { setHudOpen(false); return; }
    if (e.key !== 'Tab' || !hudRef.current) return;
    const focusable = [...hudRef.current.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )];
    if (focusable.length < 2) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }, [])

  /* ── Hover-to-pet — sustained hover triggers petted reaction ── */
  const handlePetHoverEnter = useCallback(() => {
    if (isDraggingRef.current || isSleepingRef.current || hoverCooldownRef.current > 0) return;
    hoverTimerRef.current = setTimeout(() => {
      if (isDraggingRef.current) return;
      onBehavior('petted');
      onHoverPet(); // +5 happiness
      hoverCooldownRef.current = 360; // ~6s cooldown in frames
      // Cascade heart bubbles
      onThought('heart');
      const t1 = setTimeout(() => onThought('heart'), 500);
      const t2 = setTimeout(() => onThought('heart'), 1000);
      hoverTimerRef.current = { t1, t2 }; // store for cleanup
    }, 1500);
  }, [onBehavior, onThought, onHoverPet]);

  const handlePetHoverLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      if (typeof hoverTimerRef.current === 'number') {
        clearTimeout(hoverTimerRef.current);
      } else {
        clearTimeout(hoverTimerRef.current.t1);
        clearTimeout(hoverTimerRef.current.t2);
      }
      hoverTimerRef.current = null;
    }
  }, []);

  // Build wanderer class list
  const wandererClass = [
    'pet-wanderer',
    isDragging && 'pet-wanderer--dragging',
    isResting && 'pet-wanderer--resting',
    isSleeping && 'pet-wanderer--sleeping',
    moodSpinActive && 'pet-wanderer--mood-spin',
  ].filter(Boolean).join(' ');

  return createPortal(
    <>
      {/* Robot qui se balade */}
      <motion.div
        ref={robotRef}
        className={wandererClass}
        style={{ left: `${pos.x - HALF}px`, top: `${pos.y - HALF}px` }}
        onClick={() => { if (!dragHasMovedRef.current) toggleHud(); }}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        onPointerEnter={handlePetHoverEnter}
        onPointerLeave={handlePetHoverLeave}
        role="button"
        tabIndex={-1}
        aria-label="Robot de compagnie — cliquer pour interagir"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleHud();
          }
        }}
        initial={{ scale: 0, opacity: 0, y: -24 }}
        animate={{ scale: sizeScale, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, rotate: -180, y: -20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
      >
        {(() => {
          const dir = facingLeft ? -1 : 1;
          const stretch    = Math.min(0.13, Math.max(0, (speedLevel - 0.4) * 0.1));
          const isFastDrag = isDragging && dragSpeed > DRAG_FAST_THRESHOLD;
          const dragScale  = isFastDrag
            ? 1 + Math.min(0.6, (dragSpeed - DRAG_FAST_THRESHOLD) * 0.035)
            : 1;
          return (
            <div className="pet-svg-wrap">
              <motion.div
                whileHover={isFastDrag ? {} : { scale: 1.1 }}
                whileTap={{ scale: 0.9, scaleY: 0.82 }}
                animate={isFastDrag ? {
                  scale:  dragScale,
                  rotate: dragRotation,
                  scaleX: dir,
                  scaleY: 1,
                  y: 0,
                } : {
                  scale:  1,
                  y:      [0, -7, 0],
                  rotate: [-1, 2, -1],
                  scaleX: dir * (1 + stretch),
                  scaleY: 1 - stretch * 0.5,
                }}
                transition={isFastDrag ? {
                  scale:  { type: 'spring', stiffness: 260, damping: 18 },
                  rotate: { type: 'spring', stiffness: 420, damping: 8 },
                  scaleX: { type: 'spring', stiffness: 260, damping: 18 },
                  scaleY: { type: 'spring', stiffness: 260, damping: 18 },
                } : {
                  y:      { duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' },
                  rotate: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' },
                  scale:  { type: 'spring', stiffness: 260, damping: 18 },
                  scaleX: { type: 'spring', stiffness: 100, damping: 20 },
                  scaleY: { type: 'spring', stiffness: 180, damping: 16 },
                }}
                style={{ transformOrigin: 'center center', display: 'flex' }}
              >
                <RobotFace expression={expression} eyeState={eyeState} mouthExpr={mouthExpr} gazeX={facingLeft ? -gaze.x : gaze.x} gazeY={gaze.y} />
              </motion.div>
            </div>
          );
        })()}
      </motion.div>

      {/* Pensée flottante */}
      {thoughtSymbol && <FloatingThought symbol={thoughtSymbol} petX={pos.x} petY={pos.y} />}

      {/* HUD flottant */}
      {hudOpen && (
        <div
          ref={hudRef}
          className="pet-hud"
          style={
            hudPos
              ? { left: `${hudPos.left}px`, top: `${hudPos.top}px` }
              : { left: '-9999px', top: '-9999px', visibility: 'hidden' }
          }
          role="dialog"
          aria-modal="true"
          aria-label="Robot de compagnie"
          tabIndex={-1}
          onKeyDown={handleHudKeyDown}
        >
          <div className="pet-hud-header">
            <span className="pet-hud-title">🤖 Mon Robot</span>
            <button className="pet-hud-close" onClick={() => setHudOpen(false)} aria-label="Fermer">×</button>
          </div>

          {/* Mood badge */}
          <div className="pet-hud-status">
            <span className={`pet-hud-mood-badge pet-hud-mood-badge--${petMood}`}>
              {petMood === 'happy' ? '😊 Heureux' : petMood === 'content' ? '😐 Stable' : '😢 Triste'}
            </span>
          </div>

          <p className="pet-mood-text">{hudThought}</p>

          {/* Contextual needs / tip hints */}
          {stats.hunger < 30 && (
            <p className="pet-hud-needs">⚠️ Il a très faim !</p>
          )}
          {stats.hunger >= 30 && stats.happiness < 30 && (
            <p className="pet-hud-needs">⚠️ Il se sent seul !</p>
          )}
          {stats.hunger >= 30 && stats.hunger < 50 && stats.happiness >= 30 && (
            <p className="pet-hud-tip">💡 Il commence à avoir faim.</p>
          )}
          {stats.hunger >= 50 && stats.happiness >= 30 && stats.happiness < 50 && (
            <p className="pet-hud-tip">💡 Un câlin lui ferait du bien.</p>
          )}
          {stats.hunger >= 80 && stats.happiness >= 80 && stats.hunger < 85 && (
            <p className="pet-hud-tip">🐞 Il explore joyeusement !</p>
          )}
          {stats.hunger >= 85 && stats.happiness >= 85 && (
            <p className="pet-hud-tip pet-hud-tip--thriving">🌟 En pleine forme ! — déclin ralenti</p>
          )}

          <div className="pet-stats">
            <div className="pet-stat">
              <span className="pet-stat-icon" aria-label="Faim">🍔</span>
              <div className="pet-stat-track">
                <div
                  className={`pet-stat-fill${stats.hunger < 30 ? ' pet-stat-fill--critical' : ''}`}
                  style={{ width: `${stats.hunger}%` }}
                />
              </div>
              <span className="pet-stat-value">{stats.hunger}%</span>
            </div>
            <div className="pet-stat">
              <span className="pet-stat-icon" aria-label="Bonheur">⭐</span>
              <div className="pet-stat-track">
                <div
                  className={`pet-stat-fill${stats.happiness < 30 ? ' pet-stat-fill--critical' : ''}`}
                  style={{ width: `${stats.happiness}%` }}
                />
              </div>
              <span className="pet-stat-value">{stats.happiness}%</span>
            </div>
          </div>

          <div className="pet-actions">
            {[
              { key: 'feed', label: '🍕 Nourrir', title: 'Nourrir' },
              { key: 'pet',  label: '🫳 Câliner', title: 'Câliner' },
              { key: 'play', label: '🎮 Jouer',   title: 'Jouer'   },
            ].map(({ key, label, title }) => {
              const remaining = Math.max(0, cooldowns[key] - Date.now());
              const cooling   = remaining > 0;
              return (
                <button
                  key={key}
                  className="pet-action-btn"
                  onClick={() => onInteract(key)}
                  disabled={cooling}
                  aria-disabled={cooling}
                  title={title}
                >
                  {label}
                  {cooling && <span className="pet-cd-badge">{(remaining / 1000).toFixed(1)}s</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>,
    document.body,
  );
};

/* ─────────────────────────────────────────────────
   Composant principal (bouton header + logique)
   ───────────────────────────────────────────────── */
const PetButton = () => {
  const { mood } = useMood();
  const [isSpawned, setIsSpawned] = useState(() => localStorage.getItem(LS.spawned) === 'true');
  const [stats, setStats] = useState(() => {
    // Réinitialise à ~50% à chaque chargement de page (synchrone, évite le délai d'un useEffect)
    const neutral = () => Math.round(50 + (Math.random() - 0.5) * 10);
    return { hunger: clamp(neutral()), happiness: clamp(neutral()) };
  });
  const [reaction, setReaction] = useState(null);
  // Timestamp (ms) when each cooldown expires; 0 = not cooling
  const [cdEnds, setCdEnds] = useState({ feed: 0, pet: 0, play: 0 });
  // Face combo — independent eyes/mouth variation
  const [faceCombo, setFaceCombo] = useState(() => {
    return pickRandom(FACE_COMBOS[getMood(50, 50)] ?? FACE_COMBOS.content);
  });
  // Floating thought bubble symbol
  const [thoughtSymbol, setThoughtSymbol] = useState(null);
  // HUD thought line — varies per expression
  const [hudThought, setHudThought] = useState(() => {
    return pickRandom(MOOD_TEXT_POOL[getMood(50, 50)] ?? MOOD_TEXT_POOL.content);
  });
  // Sleep after long idle
  const [isSleeping, setIsSleeping] = useState(false);
  // Mood switch flourish
  const [moodSpinActive, setMoodSpinActive] = useState(false);

  const reactionTimer = useRef(null);
  const thoughtTimerRef = useRef(null);
  const decayRef = useRef(null);
  const idleTimerRef = useRef(null);
  const idleReactionRef = useRef(null);
  const interactionStreakRef = useRef({ count: 0, lastAt: 0 });
  const firstSpawnRef = useRef(true);
  // Track previous isSpawned to detect false→true transitions (init to current value to avoid false trigger on mount)
  const prevSpawnedRef = useRef(isSpawned);
  // Sleep/idle tracking
  const lastActivityRef = useRef(Date.now());
  const sleepCheckRef = useRef(null);
  // Mood switch tracking
  const prevMoodRef = useRef(mood);

  const expression = reaction || getMood(stats.hunger, stats.happiness);
  const petMood = getMood(stats.hunger, stats.happiness);
  const needsAttention = petMood === 'sad' && isSpawned;

  // ── Vitality-derived size and speed ──
  const vitality = clamp((stats.hunger + stats.happiness) / 200, 0, 1);
  const sizeScale = 0.85 + vitality * 0.25;   // range 0.85–1.10
  const speedMult = 0.6 + vitality * 0.8;     // range 0.6–1.40

  /* ── Persistance ── */
  useEffect(() => {
    localStorage.setItem(LS.hunger, String(stats.hunger));
    localStorage.setItem(LS.happiness, String(stats.happiness));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(LS.spawned, String(isSpawned));
  }, [isSpawned]);

  // Migration: remove stale pet-renderer key (SVG is now the only renderer)
  useEffect(() => { localStorage.removeItem('pet-renderer'); }, []);

  /* ── Réactions temporaires ── */
  const triggerReaction = useCallback((r) => {
    clearTimeout(reactionTimer.current);
    setReaction(r);
    setFaceCombo(pickRandom(FACE_COMBOS[r] ?? FACE_COMBOS.content));
    setHudThought(pickRandom(MOOD_TEXT_POOL[r] ?? MOOD_TEXT_POOL.content));
    reactionTimer.current = setTimeout(() => setReaction(null), REACTION_MS);
  }, []);

  // On every spawn: woozy landing. On first spawn only: also boost stats to happy.
  useEffect(() => {
    if (!prevSpawnedRef.current && isSpawned) {
      if (firstSpawnRef.current) {
        firstSpawnRef.current = false;
        setStats({ hunger: 80, happiness: 80 });
      }
      // No cleanup return — StrictMode double-invoke would cancel the timeout before it fires
      setTimeout(() => triggerReaction('woozy'), 0);
    }
    prevSpawnedRef.current = isSpawned;
  }, [isSpawned, triggerReaction]);

  // Mirror `reaction` into a ref so timer callbacks always read current value
  useEffect(() => { idleReactionRef.current = reaction; }, [reaction]);

  // When reaction clears, reset combo to base mood
  useEffect(() => {
    if (reaction === null) {
      setFaceCombo(pickRandom(FACE_COMBOS[petMood] ?? FACE_COMBOS.content));
      setHudThought(pickRandom(MOOD_TEXT_POOL[petMood] ?? MOOD_TEXT_POOL.content));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction, petMood]);

  /* ── Dégradation en session (ralentie si thriving) ── */
  useEffect(() => {
    if (!isSpawned) return;
    decayRef.current = setInterval(() => {
      setStats((s) => {
        const thriving = s.hunger > 85 && s.happiness > 85;
        const m = thriving ? 0.2 : 1.0;
        return {
          hunger: clamp(s.hunger - 2 * m),
          happiness: clamp(s.happiness - 1 * m),
        };
      });
    }, DECAY_MS);
    return () => clearInterval(decayRef.current);
  }, [isSpawned]);

  /* ── Idle micro-reactions — occasional autonomous expressions ── */
  useEffect(() => {
    if (!isSpawned) return;
    const schedule = () => {
      idleTimerRef.current = setTimeout(() => {
        if (idleReactionRef.current === null) {
          const h   = readLS(LS.hunger, 80);
          const hap = readLS(LS.happiness, 80);
          const mood = getMood(h, hap);
          const opts = {
            happy:   ['happy', 'excited'],
            content: ['content'],
            sad:     ['sad'],
          };
          const choices = opts[mood] ?? ['content'];
          const chosenReaction = choices[Math.floor(Math.random() * choices.length)];
          triggerReaction(chosenReaction);
          // ~40% chance: also pop a floating thought symbol matching the mood
          if (Math.random() < 0.4) {
            const pool = THOUGHT_POOLS[chosenReaction] ?? THOUGHT_POOLS[mood] ?? ['dots'];
            const sym = pickRandom(pool);
            clearTimeout(thoughtTimerRef.current);
            setThoughtSymbol(sym);
            thoughtTimerRef.current = setTimeout(() => setThoughtSymbol(null), 2600);
          }
        }
        schedule();
      }, 13000 + Math.random() * 20000); // 13–33 s between idle pulses
    };
    schedule();
    return () => { clearTimeout(idleTimerRef.current); clearTimeout(thoughtTimerRef.current); };
  }, [isSpawned, triggerReaction]);

  /* ── Neglect escalation — sustained sad triggers dizzy ── */
  useEffect(() => {
    if (!isSpawned) return;
    if (getMood(stats.hunger, stats.happiness) !== 'sad') return;
    const id = setTimeout(() => triggerReaction('dizzy'), 28000);
    return () => clearTimeout(id);
  }, [isSpawned, stats.hunger, stats.happiness, triggerReaction]);

  /* ── Sommeil après inactivité ── */
  useEffect(() => {
    if (!isSpawned) return;
    lastActivityRef.current = Date.now();
    const onActivity = () => {
      lastActivityRef.current = Date.now();
      if (isSleeping) {
        setIsSleeping(false);
        triggerReaction('woozy');
      }
    };
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('pointerdown', onActivity);
    sleepCheckRef.current = setInterval(() => {
      if (!isSleeping && Date.now() - lastActivityRef.current > SLEEP_IDLE_MS) {
        setIsSleeping(true);
        triggerReaction('sleep');
      }
    }, 15000);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('pointerdown', onActivity);
      clearInterval(sleepCheckRef.current);
    };
  }, [isSpawned, isSleeping, triggerReaction]);

  /* ── Flourish quand le mood du site change ── */
  useEffect(() => {
    if (prevMoodRef.current !== null && prevMoodRef.current !== mood && isSpawned) {
      triggerReaction('excited');
      setMoodSpinActive(true);
      const id = setTimeout(() => setMoodSpinActive(false), 900);
      return () => clearTimeout(id);
    }
    prevMoodRef.current = mood;
  }, [mood, isSpawned, triggerReaction]);

  /* ── API globale ── */
  useEffect(() => {
    window.petReact = (r) => {
      if (localStorage.getItem(LS.spawned) === 'false') return;
      triggerReaction(r);
    };
    window.getPetStats = () => {
      if (localStorage.getItem(LS.spawned) === 'false') return null;
      return {
        hunger: readLS(LS.hunger, 80),
        happiness: readLS(LS.happiness, 80),
        get mood() { return getMood(this.hunger, this.happiness); },
      };
    };
    return () => { delete window.petReact; delete window.getPetStats; };
  }, [triggerReaction]);

  /* ── Interactions (depuis le HUD) ── */
  const handleInteract = useCallback((action) => {
    if (Date.now() < cdEnds[action]) return;
    switch (action) {
      case 'feed':
        setStats((s) => ({ ...s, hunger: clamp(s.hunger + 25) }));
        triggerReaction('eat');
        break;
      case 'pet':
        setStats((s) => ({ ...s, happiness: clamp(s.happiness + 20) }));
        triggerReaction('petted');
        break;
      case 'play':
        setStats((s) => ({ hunger: clamp(s.hunger + 10), happiness: clamp(s.happiness + 10) }));
        triggerReaction('play');
        break;
    }
    setCdEnds((c) => ({ ...c, [action]: Date.now() + COOLDOWNS[action] }));

    // Combo streak bonus — 3 interactions within 7 s → excited burst + happiness bonus
    const now = Date.now();
    const streak = interactionStreakRef.current;
    streak.count = (now - streak.lastAt < 7000) ? streak.count + 1 : 1;
    streak.lastAt = now;
    if (streak.count >= 3) {
      streak.count = 0;
      setStats((s) => ({ ...s, happiness: clamp(s.happiness + 8) }));
      setTimeout(() => triggerReaction('excited'), REACTION_MS + 50);
    }
  }, [cdEnds, triggerReaction]);

  /* ── Thought bubble (déclenché depuis WanderingPet) ── */
  const handleThought = useCallback((symbol) => {
    clearTimeout(thoughtTimerRef.current);
    setThoughtSymbol(symbol);
    thoughtTimerRef.current = setTimeout(() => setThoughtSymbol(null), 2600);
  }, []);

  /* ── Hover-pet stat bump (+5 happiness) ── */
  const handleHoverPet = useCallback(() => {
    setStats((s) => ({ ...s, happiness: clamp(s.happiness + 5) }));
  }, []);

  /* ── Toggle spawn (recharge les stats si elles étaient basses) ── */
  const toggleSpawn = useCallback(() => {
    setIsSpawned((prev) => {
      const next = !prev;
      if (next) {
        setStats((s) => ({
          hunger: s.hunger < 10 ? 50 : s.hunger,
          happiness: s.happiness < 10 ? 50 : s.happiness,
        }));
      }
      return next;
    });
  }, []);

  return (
    <>
      {/* Bouton header */}
      <button
        className={`header-action-btn pet-btn${needsAttention ? ' pet-btn--attention' : ''}${!isSpawned ? ' pet-btn--off' : ''}`}
        onClick={toggleSpawn}
        tabIndex={-1}
        aria-label={isSpawned ? 'Rappeler le robot' : 'Invoquer le robot'}
        title={isSpawned ? 'Rappeler le robot' : 'Invoquer le robot'}
      >
        <svg
          className={`pet-icon${needsAttention ? ' pet-icon--bob' : ''}`}
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="6" x2="12" y2="3" />
          <circle cx="12" cy="2" r="1.5" fill="currentColor" stroke="none" />
          <rect x="5" y="6" width="14" height="11" rx="3" />
          <circle cx="9.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
          <path d="M9 15 Q12 17 15 15" />
          <rect x="8" y="17" width="8" height="4" rx="1.5" />
        </svg>
      </button>

      {/* Robot qui se balade (via portail) */}
      <AnimatePresence>
        {isSpawned && (
          <WanderingPet
            key="wandering-pet"
            stats={stats}
            expression={expression}
            eyeState={faceCombo.eyes}
            mouthExpr={faceCombo.mouth}
            petMood={petMood}
            onInteract={handleInteract}
            onBehavior={triggerReaction}
            onThought={handleThought}
            onHoverPet={handleHoverPet}
            cooldowns={cdEnds}
            thoughtSymbol={thoughtSymbol}
            hudThought={hudThought}
            sizeScale={sizeScale}
            speedMult={speedMult}
            isSleeping={isSleeping}
            moodSpinActive={moodSpinActive}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PetButton;
