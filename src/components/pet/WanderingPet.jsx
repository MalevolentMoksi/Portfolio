/* ══════════════════════════════════════════════
   Robot qui se balade librement sur la page
   Physique RAF, drag, HUD, scroll, repos, hover
   ══════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue } from 'framer-motion';
import {
  PET_SIZE, HALF,
  BASE_SPEED, MAX_SPEED, MAGNET_RADIUS, MAGNET_SPEED,
  DRAG_FAST_THRESHOLD, BOUNCE_RESTITUTION, THROW_SPEED_CAP,
  SCROLL_DIZZY_WINDOW, clamp,
  CATCH_SEEK_SPEED, CATCH_BALL_GRAVITY, CATCH_BOT_RADIUS,
} from './petConstants.js';
import RobotFace from './RobotFace.jsx';
import ThoughtBubbleQueue from './ThoughtBubbleQueue.jsx';
import CatchGame from './CatchGame.jsx';
import AchievementsPanel from './AchievementsPanel.jsx';
import { FOOD_ICONS } from './petData.jsx';
import Tooltip from '../Tooltip.jsx';
import { byTier } from '@utils/performanceTier.js';

// Intercept prediction loop cap — adapté au tier de performance
const INTERCEPT_STEPS = byTier({ high: 40, mid: 25, low: 15 });

// forwardRef permet à AnimatePresence (PetButton) de transmettre sa ref sans warning React.
// Le portal rend dans document.body donc la ref n'est pas attachée à un DOM node visible.
const WanderingPet = forwardRef(function WanderingPet ({ stats, expression, eyeState, mouthExpr, petMood, onInteract, onBehavior, onBotCatchSuccess, onThought, onHoverPet, cooldowns, thoughtQueue, hudThought, sizeScale, speedMult, isSleeping, moodSpinActive, petName, onRename, feedIconIndex, achievements, onUnlock, isCatching, onGameEnd }, _ref) {
  const PET_TOP_MIN = HALF;
  // Position initiale aléatoire (calculée une seule fois)
  const posRef = useRef(null);
  if (!posRef.current) {
    posRef.current = {
      x: HALF + Math.random() * (window.innerWidth - PET_SIZE),
      y: PET_TOP_MIN + 60 + Math.random() * (window.innerHeight - PET_TOP_MIN - 150),
    };
  }
  // Motion values pour position — bypass le cycle render React (pas de re-render à 60fps)
  const petLeft = useMotionValue(posRef.current.x - HALF);
  const petTop  = useMotionValue(posRef.current.y - HALF);
  const [facingLeft, setFacingLeft] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  // speedLevel en ref (stretch visuel subtil, mis à jour au prochain render déclenché par autre chose)
  const speedLevelRef = useRef(0);
  const [isResting, setIsResting] = useState(false);
  // HUD inline rename editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  // Achievements sub-panel
  const [achOpen, setAchOpen] = useState(false);
  // Spring animation when bot catches ball
  const [catchSpring, setCatchSpring] = useState(false);

  // Callback stable pour CatchGame — évite de re-créer la RAF loop à chaque render
  const handleBotCatch = useCallback(() => {
    onBehavior('excited');
    setCatchSpring(true);
    setTimeout(() => setCatchSpring(false), 450);
    try {
      if (typeof onBotCatchSuccess === 'function') onBotCatchSuccess();
    } catch (e) {
      // defensive: don't break the game if parent callback throws
      // eslint-disable-next-line no-console
      console.error('onBotCatchSuccess threw', e);
    }
  }, [onBehavior, onBotCatchSuccess]);

  // Ticker pour mettre à jour les compte-à-rebours des cooldowns
  // Ne tourne que quand le HUD est ouvert — pas de re-renders pendant le jeu
  const [, setCdTick] = useState(0);
  useEffect(() => {
    if (!hudOpen) return;
    const anyCooling = Object.values(cooldowns).some((t) => t > Date.now());
    if (!anyCooling) return;
    const id = setInterval(() => setCdTick((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [cooldowns, hudOpen]);

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
  const prevHudOpenRef = useRef(false);
  // Proximity + movement behavior tracking (frame-counted cooldowns)
  const proximityRef = useRef({ dwellFrames: 0, lastDist: Infinity, exciteCooldown: 0, speedCooldown: 0, avoidDwellFrames: 0, avoidThoughtCooldown: 0, bounceCooldown: 0 });
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
  // Smoothed velocity vector tracked during drag — used for throw on release
  const dragVelRef         = useRef({ x: 0, y: 0 });
  const [isDragging,    setIsDragging]    = useState(false);
  const [dragSpeed,     setDragSpeed]     = useState(0);
  const [dragRotation,  setDragRotation]  = useState(0);
  // RAF gap & cursor-idle tracking — prevents false reactions on tab resume / mouse re-entry
  const lastTickTimeRef = useRef(Date.now());
  const resumeGraceRef = useRef(0);
  const lastCursorMoveTimeRef = useRef(Date.now());
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
  const [isHovering, setIsHovering] = useState(false);
  // Throw momentum — skip wander speed cap while decaying
  const throwActiveRef = useRef(false);
  // External gravity effect — pulls pet downward when active
  const gravityActiveRef = useRef(false);
  // External attract effect — pulls pet toward a target point when active
  const attractTargetRef = useRef(null);
  // Dynamic header bounds (viewport coords) for soft avoidance steering
  const headerBottomRef = useRef(0);
  // Ball info bridge — CatchGame writes ball state, RAF reads for seek steering
  const ballInfoRef = useRef(null);
  // Cached intercept target — recomputed every 10 frames, not every frame
  const cachedInterceptRef = useRef(null);
  // Catching ref for RAF closure
  const isCatchingRef = useRef(false);
  useEffect(() => { isCatchingRef.current = isCatching; }, [isCatching]);

  /* ── Header bounds tracking (for soft avoidance, not collision) ── */
  useEffect(() => {
    let ro = null;
    const updateHeaderBounds = () => {
      const header = document.querySelector('header');
      if (!header) {
        headerBottomRef.current = 0;
        return;
      }
      const rect = header.getBoundingClientRect();
      // Bottom edge of the visible header area in viewport coordinates.
      headerBottomRef.current = Math.max(0, Math.min(window.innerHeight, rect.bottom));
    };

    updateHeaderBounds();
    window.addEventListener('resize', updateHeaderBounds);
    window.addEventListener('scroll', updateHeaderBounds, { passive: true });

    const header = document.querySelector('header');
    if (header && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateHeaderBounds);
      ro.observe(header);
    }

    return () => {
      window.removeEventListener('resize', updateHeaderBounds);
      window.removeEventListener('scroll', updateHeaderBounds);
      ro?.disconnect();
    };
  }, []);

  /* ── Suivi du curseur ── */
  useEffect(() => {
    const onMove = (e) => {
      hasMouseMovedRef.current = true;
      lastCursorMoveTimeRef.current = Date.now();
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
    // Vider l'historique quand l'onglet perd/reprend le focus — évite les faux positifs
    // sur les événements scroll que le navigateur émet lors du retour au premier plan.
    const onVisibility = () => {
      scrollHistoryRef.current = [];
      lastScrollYRef.current = window.scrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(scrollIdleTimerRef.current);
      clearTimeout(restTimeoutRef.current);
    };
  }, [onBehavior, onThought]);

  /* ── Boucle d'animation RAF ── */
  useEffect(() => {
    const tick = () => {
      if (hudOpen || isDraggingRef.current) { lastTickTimeRef.current = Date.now(); rafRef.current = requestAnimationFrame(tick); return; }

      // ── RAF gap detection — suppresses false reactions after tab resume / long pause ──
      const tickNow = Date.now();
      if (tickNow - lastTickTimeRef.current > 500) {
        // Large gap detected (tab was in background, etc.)
        resumeGraceRef.current = 60;               // ~1 s grace period
        proximityRef.current.lastDist = Infinity;   // prevent false "sudden approach"
        proximityRef.current.dwellFrames = 0;
      }
      lastTickTimeRef.current = tickNow;
      if (resumeGraceRef.current > 0) resumeGraceRef.current--;

      // ── Cursor-idle detection — if mouse hasn't moved in >1 s, prevent stale proximity delta ──
      if (tickNow - lastCursorMoveTimeRef.current > 1000) {
        proximityRef.current.lastDist = Infinity;
      }

      const p = posRef.current;
      const v = velRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      frameRef.current++;
      const sm = speedMultRef.current;
      const sleeping = isSleepingRef.current;

      // ── Attract steering — highest priority override ──
      // Direct seek: SET velocity toward target each frame (no accumulation).
      // This guarantees the pet always moves toward the attraction point.
      if (attractTargetRef.current) {
        const at = attractTargetRef.current;
        const adx = at.x - p.x;
        const ady = at.y - p.y;
        const adist = Math.sqrt(adx * adx + ady * ady);

        if (adist > 3) {
          // Speed ramps with distance: fast when far, slows near target
          const speed = Math.min(5.0, 1.2 + adist * 0.008);
          // Overwrite velocity — no residual wander momentum
          v.x = (adx / adist) * speed;
          v.y = (ady / adist) * speed;
        } else {
          // Close enough — brake
          v.x *= 0.7;
          v.y *= 0.7;
        }

        p.x = clamp(p.x + v.x, HALF, vw - HALF);
        p.y = clamp(p.y + v.y, PET_TOP_MIN, vh - HALF);

        if (frameRef.current % 2 === 0) {
          petLeft.set(p.x - HALF);
          petTop.set(p.y - HALF);
          speedLevelRef.current = Math.sqrt(v.x * v.x + v.y * v.y);

          if (v.x > 0.08)       flipHysteresisRef.current = Math.min(flipHysteresisRef.current + 1,  20);
          else if (v.x < -0.08) flipHysteresisRef.current = Math.max(flipHysteresisRef.current - 1, -20);
          if (flipHysteresisRef.current >=  15) setFacingLeft(false);
          if (flipHysteresisRef.current <= -15) setFacingLeft(true);

          if (frameRef.current % 6 === 0) {
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
          }

          if (hoverCooldownRef.current > 0) hoverCooldownRef.current--;
        }

        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // ── Catch-game seek steering — intercept the ball intelligently ──
      if (isCatchingRef.current && ballInfoRef.current) {
        const bi = ballInfoRef.current;
        // Only seek when ball is flying (thrown by player)
        if (bi.holder === 'flying') {
          // Throttle: recompute intercept every 10 frames, cache between
          if (frameRef.current % 10 === 0 || !cachedInterceptRef.current) {
            let sx = bi.x, sy = bi.y, svx = bi.vx, svy = bi.vy;
            const seekSpd = CATCH_SEEK_SPEED;
            const bw = window.innerWidth, bh = window.innerHeight;
            const ballR = 11; // CATCH_BALL_SIZE / 2
            let bestPt = { x: sx, y: sy };
            for (let i = 1; i <= INTERCEPT_STEPS; i++) {
              svy += CATCH_BALL_GRAVITY;
              svx *= 0.997; svy *= 0.997;
              sx += svx; sy += svy;
              // Wall bounces (same logic as CatchGame)
              if (sx < ballR)          { sx = ballR;          svx =  Math.abs(svx) * BOUNCE_RESTITUTION; }
              else if (sx > bw - ballR){ sx = bw - ballR;     svx = -Math.abs(svx) * BOUNCE_RESTITUTION; }
              if (sy < ballR)                { sy = ballR;            svy =  Math.abs(svy) * BOUNCE_RESTITUTION; }
              else if (sy > bh - ballR - 4) { sy = bh - ballR - 4;  svy = -Math.abs(svy) * BOUNCE_RESTITUTION; }
              // Can the bot reach this point in i frames? (squared distance — avoid sqrt)
              const dx = sx - p.x, dy = sy - p.y;
              const distSq = dx * dx + dy * dy;
              const thresh = seekSpd * i + CATCH_BOT_RADIUS * 0.7;
              if (distSq <= thresh * thresh) {
                bestPt = { x: sx, y: sy };
                break;
              }
              bestPt = { x: sx, y: sy };
            }
            cachedInterceptRef.current = bestPt;
          }

          // Steer toward interception point
          const bestPt = cachedInterceptRef.current;
          const tdx = bestPt.x - p.x;
          const tdy = bestPt.y - p.y;
          const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
          if (tdist > 4) {
            const speed = Math.min(CATCH_SEEK_SPEED, 1.2 + tdist * 0.01);
            v.x = (tdx / tdist) * speed;
            v.y = (tdy / tdist) * speed;
          } else {
            v.x *= 0.7;
            v.y *= 0.7;
          }
        } else if (bi.holder === 'bot-held') {
          // Bot is holding — gentle brake, face toward cursor
          v.x *= 0.85;
          v.y *= 0.85;
        } else {
          // Ball held by player or returning — gentle wander with reduced speed
          v.x *= 0.92;
          v.y *= 0.92;
          const dv = desiredVRef.current;
          v.x += (dv.x * 0.3 - v.x) * 0.02;
          v.y += (dv.y * 0.3 - v.y) * 0.02;
        }

        p.x = clamp(p.x + v.x, HALF, vw - HALF);
        p.y = clamp(p.y + v.y, PET_TOP_MIN, vh - HALF);

        if (frameRef.current % 2 === 0) {
          petLeft.set(p.x - HALF);
          petTop.set(p.y - HALF);
          speedLevelRef.current = Math.sqrt(v.x * v.x + v.y * v.y);

          if (v.x > 0.08)       flipHysteresisRef.current = Math.min(flipHysteresisRef.current + 1,  20);
          else if (v.x < -0.08) flipHysteresisRef.current = Math.max(flipHysteresisRef.current - 1, -20);
          if (flipHysteresisRef.current >=  15) setFacingLeft(false);
          if (flipHysteresisRef.current <= -15) setFacingLeft(true);

          if (frameRef.current % 6 === 0) {
            // Gaze toward ball when flying, toward cursor otherwise
            const gazeTarget = bi.holder === 'flying' ? { x: bi.x, y: bi.y } : cursorRef.current;
            const gdx = gazeTarget.x - p.x;
            const gdy = gazeTarget.y - p.y;
            const gdist = Math.sqrt(gdx * gdx + gdy * gdy) || 1;
            const gazeStrength = Math.min(1, gdist / 260);
            const MAX_GAZE = 1.8;
            setGaze({
              x: (gdx / gdist) * gazeStrength * MAX_GAZE,
              y: (gdy / gdist) * gazeStrength * MAX_GAZE,
            });
          }

          if (hoverCooldownRef.current > 0) hoverCooldownRef.current--;
        }

        rafRef.current = requestAnimationFrame(tick);
        return;
      }

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
            onUnlock('footer-sit');
          }
        }
        // Update position with wall clamp
        p.x = clamp(p.x + v.x, HALF, vw - HALF);
        p.y = clamp(p.y + v.y, PET_TOP_MIN, vh - HALF);
        if (frameRef.current % 2 === 0) {
          petLeft.set(p.x - HALF);
          petTop.set(p.y - HALF);
          speedLevelRef.current = Math.sqrt(v.x * v.x + v.y * v.y);
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // ── Sleeping: near-zero drift, no cursor interaction ──
      if (sleeping && !attractTargetRef.current) {
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
        p.y = clamp(p.y + v.y, PET_TOP_MIN, vh - HALF);
        if (frameRef.current % 2 === 0) {
          petLeft.set(p.x - HALF);
          petTop.set(p.y - HALF);
          speedLevelRef.current = Math.sqrt(v.x * v.x + v.y * v.y);
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

      let speedCap = MAX_SPEED;

      // ── Gravity effect: pull pet downward when active ──
      if (gravityActiveRef.current) {
        v.y += 0.18;
      }

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
      if (nextY < PET_TOP_MIN) {
        v.y = Math.abs(v.y) * BOUNCE_RESTITUTION;
        p.y = PET_TOP_MIN;
        bounced = true;
      } else if (nextY > vh - HALF) {
        v.y = -Math.abs(v.y) * BOUNCE_RESTITUTION;
        p.y = vh - HALF;
        bounced = true;
      }
      // Bounce dizzy — if fast enough and cooldown expired
      const prox = proximityRef.current;
      if (bounced && resumeGraceRef.current === 0) {
        const bspd = Math.sqrt(v.x * v.x + v.y * v.y);
        if (bspd > 1.8 && prox.bounceCooldown === 0) {
          onBehavior('dizzy');
          prox.bounceCooldown = 120;
          onUnlock('wall-bounce');
        }
      }
      if (prox.bounceCooldown > 0) prox.bounceCooldown--;

      // Smooth edge repulsion (softer push when not bouncing hard)
      const margin = 40;
      if (!bounced) {
        if (p.x < margin + HALF)      v.x += 0.18 * Math.pow(1 - Math.max(0, (p.x - HALF) / margin), 1.5);
        if (p.x > vw - margin - HALF) v.x -= 0.18 * Math.pow(1 - Math.max(0, (vw - HALF - p.x) / margin), 1.5);
        if (p.y < PET_TOP_MIN + 10)   v.y += 0.28;
        if (!gravityActiveRef.current && p.y > vh - margin - HALF)  v.y -= 0.18 * Math.pow(1 - Math.max(0, (vh - HALF - p.y) / margin), 1.5);
      }

      // Cursor interaction — mood-dependent
      const dx = cursorRef.current.x - p.x;
      const dy = cursorRef.current.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isAttracting = Boolean(attractTargetRef.current);

      // Soft header avoidance: steer down when the bot enters a band near the header.
      // This is intentionally not a hard barrier, so drag/throw momentum can still cross.
      if (!isAttracting) {
        const headerBottom = headerBottomRef.current;
        if (headerBottom > 0) {
          const avoidBand = 42;
          const petTop = p.y - HALF;
          const overlap = headerBottom + avoidBand - petTop;
          if (overlap > 0) {
            const steerDown = Math.min(0.52, 0.07 + overlap * 0.012);
            v.y += steerDown;
          }
        }
      }

      if (!isAttracting && dist > 5) {
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
      if (!isAttracting && proximityRef.current.avoidThoughtCooldown > 0) proximityRef.current.avoidThoughtCooldown--;

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
        p.y = clamp(p.y + v.y, PET_TOP_MIN, vh - HALF);
      }

      // All state updates batched every 2 frames (~30fps render)
      if (frameRef.current % 2 === 0) {
        petLeft.set(p.x - HALF);
        petTop.set(p.y - HALF);
        speedLevelRef.current = spd;

        // Flip with hysteresis — commits only after 15 consecutive frames in new direction
        if (v.x > 0.08)       flipHysteresisRef.current = Math.min(flipHysteresisRef.current + 1,  20);
        else if (v.x < -0.08) flipHysteresisRef.current = Math.max(flipHysteresisRef.current - 1, -20);
        if (flipHysteresisRef.current >=  15) setFacingLeft(false);
        if (flipHysteresisRef.current <= -15) setFacingLeft(true);

        if (frameRef.current % 6 === 0) {
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
        }

        // ── Proximity & movement behaviors ──────────────────────────────
        if (prox.exciteCooldown > 0) prox.exciteCooldown--;
        if (prox.speedCooldown  > 0) prox.speedCooldown--;

        const isSad = petMoodRef.current === 'sad';

        // ── Skip proximity behaviors during resume grace period ──
        if (resumeGraceRef.current === 0) {
          // Dwell excitement — only when happy/content
          if (!isAttracting && !isSad && dist < 130 && dist > 8) {
            prox.dwellFrames++;
            if (prox.dwellFrames >= 90 && prox.exciteCooldown === 0) {
              onBehavior('excited');
              prox.exciteCooldown = 300;
              prox.dwellFrames = 0;
            }
          } else {
            prox.dwellFrames = Math.max(0, prox.dwellFrames - 2);
          }

          // Sustained high speed → energy burst — only when not sad
          if (!isAttracting && !isSad && spd > effectiveMaxSpeed * 0.82 && prox.speedCooldown === 0 && prox.exciteCooldown === 0) {
            onBehavior('excited');
            prox.speedCooldown = 240;
            prox.exciteCooldown = 240;
          }
        }
        prox.lastDist = dist;

        // Hover-to-pet cooldown decrement
        if (hoverCooldownRef.current > 0) hoverCooldownRef.current--;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    // Pause explicite quand l'onglet est masqué — plus déterministe que la
    // détection post-hoc du gap RAF (cohérent avec VisualEffects.initParallax).
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (rafRef.current === null) {
        lastTickTimeRef.current = Date.now(); // réinitialise le gap détecteur
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
    const ny = clamp(e.clientY - dragOffsetRef.current.y, PET_TOP_MIN, vh - HALF);
    posRef.current = { x: nx, y: ny };
    petLeft.set(nx - HALF);
    petTop.set(ny - HALF);
    // Update facing direction immediately while dragging
    const dx = e.movementX;
    if (Math.abs(dx) > 0.5) {
      flipHysteresisRef.current = dx > 0 ? 20 : -20;
      setFacingLeft(dx < 0);
    }
    // Track smoothed velocity vector (for throw) and speed magnitude (for spin)
    dragVelRef.current = {
      x: dragVelRef.current.x * 0.6 + e.movementX * 0.4,
      y: dragVelRef.current.y * 0.6 + e.movementY * 0.4,
    };
    const spd = Math.sqrt(e.movementX * e.movementX + e.movementY * e.movementY);
    dragSpeedRef.current = dragSpeedRef.current * 0.65 + spd * 0.35;
    setDragSpeed(dragSpeedRef.current);
    if (dragSpeedRef.current > DRAG_FAST_THRESHOLD) {
      dragRotRef.current += e.movementX * 3;
      setDragRotation(dragRotRef.current);
    }
  }, [onBehavior]);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    // Throw: use smoothed velocity tracked during drag (e.movementX on pointerup is ~0)
    const tv = dragVelRef.current;
    const throwSpeed = Math.sqrt(tv.x * tv.x + tv.y * tv.y);
    if (dragHasMovedRef.current && throwSpeed > 1.5) {
      // Scale up and cap
      const scale = Math.min(THROW_SPEED_CAP / Math.max(throwSpeed, 1), 2.5);
      velRef.current = {
        x: clamp(tv.x * scale, -THROW_SPEED_CAP, THROW_SPEED_CAP),
        y: clamp(tv.y * scale, -THROW_SPEED_CAP, THROW_SPEED_CAP),
      };
      throwActiveRef.current = true;
      onBehavior('excited');
      onUnlock('throw');
    } else {
      // Gentle placement — just kill velocity
      velRef.current = { x: 0, y: 0 };
    }
    // Reset smoothed drag vel for next drag
    dragVelRef.current = { x: 0, y: 0 };
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
      // Toujours au-dessus du bot (pousse vers le haut quand le contenu grandit)
      let top  = p.y - HALF - height - GAP;
      // Repli en dessous si pas assez de place au-dessus
      if (top < PAD) top = p.y + HALF + GAP;
      // Centré horizontalement, clamp dans le viewport
      let left = p.x - width / 2;
      left = Math.max(PAD, Math.min(vw - width - PAD, left));
      top  = Math.max(PAD, Math.min(vh - height - PAD, top));
      setHudPos({ left, top });
    };
    // Premier calcul après 2 frames (le HUD doit être peint avant qu'on le mesure)
    const id = requestAnimationFrame(() => requestAnimationFrame(recompute));
    window.addEventListener('resize', recompute);
    // ResizeObserver : reposisionne automatiquement quand le HUD change de taille
    // (panneau succès ouvert/fermé, stats mises à jour, etc.)
    const ro = new ResizeObserver(recompute);
    if (hudRef.current) ro.observe(hudRef.current);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', recompute); ro.disconnect(); };
  }, [hudOpen]);

  /* ── Focus management — modal-like ── */
  useEffect(() => {
    if (hudOpen) {
      const id = setTimeout(() => {
        const first = hudRef.current?.querySelector('button:not(:disabled)');
        first?.focus();
      }, 80);
      prevHudOpenRef.current = true;
      return () => clearTimeout(id);
    }
    // Restore focus only after an actual open -> close transition
    if (prevHudOpenRef.current) {
      robotRef.current?.focus();
      prevHudOpenRef.current = false;
    }
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
    setIsHovering(true);
    hoverTimerRef.current = setTimeout(() => {
      if (isDraggingRef.current) return;
      setIsHovering(false);
      onBehavior('petted');
      onHoverPet(); // +5 happiness
      hoverCooldownRef.current = 360; // ~6s cooldown in frames
      // Label flottant "+5"
      onThought({ type: 'text', content: '+5 \u{1F49B}', duration: 800 });
      // Cascade heart bubbles
      onThought({ type: 'symbol', content: 'heart' });
      const t1 = setTimeout(() => onThought({ type: 'symbol', content: 'heart' }), 500);
      const t2 = setTimeout(() => onThought({ type: 'symbol', content: 'heart' }), 1000);
      hoverTimerRef.current = { t1, t2 }; // store for cleanup
    }, 1500);
  }, [onBehavior, onThought, onHoverPet]);

  const handlePetHoverLeave = useCallback(() => {
    setIsHovering(false);
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

  /* ── API globale gravité ── */
  // Particles detection — unlock achievement when particles canvas is active
  useEffect(() => {
    const check = setInterval(() => {
      const el = document.getElementById('particles-js');
      if (el && el.childElementCount > 0) {
        onUnlock('particles');
        clearInterval(check);
      }
    }, 5000);
    return () => clearInterval(check);
  }, [onUnlock]);

  useEffect(() => {
    let gravityTimer = null;
    window.petGravity = (duration) => {
      clearTimeout(gravityTimer);
      gravityActiveRef.current = true;
      gravityTimer = setTimeout(() => {
        gravityActiveRef.current = false;
      }, duration);
    };
    return () => {
      clearTimeout(gravityTimer);
      gravityActiveRef.current = false;
      delete window.petGravity;
    };
  }, []);

  /* ── API globale attraction ── */
  useEffect(() => {
    let attractTimer = null;
    window.petAttract = (x, y, duration) => {
      clearTimeout(attractTimer);
      if (isRestingRef.current) {
        isRestingRef.current = false;
        setIsResting(false);
        restTargetRef.current = null;
        hasRestThoughtRef.current = false;
        clearTimeout(restTimeoutRef.current);
      }
      attractTargetRef.current = { x, y };
      // Reset velocity so the pet immediately heads toward the target
      velRef.current.x = 0;
      velRef.current.y = 0;
      window.petReact?.('excited');
      attractTimer = setTimeout(() => {
        attractTargetRef.current = null;
      }, duration);
    };
    return () => {
      clearTimeout(attractTimer);
      attractTargetRef.current = null;
      delete window.petAttract;
    };
  }, []);

  // Build wanderer class list
  const wandererClass = [
    'pet-wanderer',
    isDragging && 'pet-wanderer--dragging',
    isResting && 'pet-wanderer--resting',
    isSleeping && 'pet-wanderer--sleeping',
    moodSpinActive && 'pet-wanderer--mood-spin',
    isCatching && 'pet-wanderer--catching',
    isHovering && 'pet-wanderer--hovered',
  ].filter(Boolean).join(' ');

  return createPortal(
    <>
      {/* Robot qui se balade */}
      <motion.div
        ref={robotRef}
        className={wandererClass}
        style={{ left: petLeft, top: petTop }}
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
        {/* Arc de charge hover-to-pet */}
        {isHovering && (
          <svg className="pet-charge-ring" viewBox="0 0 72 72" width="72" height="72" aria-hidden="true">
            <circle className="pet-charge-ring__track" cx="36" cy="36" r="33" />
            <circle className="pet-charge-ring__fill"  cx="36" cy="36" r="33" />
          </svg>
        )}
        {(() => {
          const dir = facingLeft ? -1 : 1;
          const stretch    = Math.min(0.13, Math.max(0, (speedLevelRef.current - 0.4) * 0.1));
          const isFastDrag = isDragging && dragSpeed > DRAG_FAST_THRESHOLD;
          const dragScale  = isFastDrag
            ? 1 + Math.min(0.6, (dragSpeed - DRAG_FAST_THRESHOLD) * 0.035)
            : 1;
          return (
            <div className={`pet-svg-wrap${catchSpring ? ' pet-svg-wrap--catch-spring' : ''}`}>
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
                <RobotFace expression={expression} eyeState={isResting ? 'cozy' : eyeState} mouthExpr={isResting ? 'cozy' : mouthExpr} gazeX={facingLeft ? -gaze.x : gaze.x} gazeY={gaze.y} />
              </motion.div>
            </div>
          );
        })()}
      </motion.div>

      {/* Pensees flottantes */}
      <ThoughtBubbleQueue queue={thoughtQueue} petX={posRef.current.x} petY={posRef.current.y} />

      {/* HUD flottant */}
      {hudOpen && (
        <motion.div
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
          initial={{ opacity: 0, y: -6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 340, damping: 24 }}
        >
          <div className="pet-hud-header">
            <span className="pet-hud-title">
              {/* SVG robot icon */}
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pet-hud-title-icon">
                <line x1="12" y1="6" x2="12" y2="3" />
                <circle cx="12" cy="2" r="1.5" fill="currentColor" stroke="none" />
                <rect x="5" y="6" width="14" height="11" rx="3" />
                <circle cx="9.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="14.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
                <path d="M9 15 Q12 17 15 15" />
                <rect x="8" y="17" width="8" height="4" rx="1.5" />
              </svg>
              {isEditingName ? (
                <input
                  className="pet-hud-name-edit"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value.slice(0, 18))}
                  onBlur={() => { onRename(nameDraft); setIsEditingName(false); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { onRename(nameDraft); setIsEditingName(false); }
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                  maxLength={18}
                  aria-label="Renommer le robot"
                />
              ) : (
                <>
                  <span className="pet-hud-name">{petName}</span>
                  <Tooltip text="Renommer">
                  <button
                    className="pet-hud-name-pencil"
                    onClick={(e) => { e.stopPropagation(); setNameDraft(petName); setIsEditingName(true); }}
                    aria-label="Renommer"
                  >
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11.5 2.5 L13.5 4.5 L5 13 L2 14 L3 11 Z" />
                      <line x1="10" y1="4" x2="12" y2="6" />
                    </svg>
                  </button>
                  </Tooltip>
                </>
              )}
            </span>
            <div className="pet-hud-header-actions">
              {/* Trophy / achievements toggle */}
              <Tooltip text="Succès">
              <button
                className={`pet-hud-trophy-btn${achOpen ? ' pet-hud-trophy-btn--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setAchOpen((a) => !a); }}
                aria-label="Succès"
              >
                {/* Trophée : coupe + anses + pied + socle */}
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" stroke="none" aria-hidden="true">
                  {/* Coupe */}
                  <path d="M4 2 h8 v5 Q12 10 8 11 Q4 10 4 7 Z" />
                  {/* Anse gauche */}
                  <path d="M4 3 Q1 3 1 5.5 Q1 8 4 7.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  {/* Anse droite */}
                  <path d="M12 3 Q15 3 15 5.5 Q15 8 12 7.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  {/* Pied */}
                  <rect x="7" y="11" width="2" height="2.5" rx="0.4" />
                  {/* Socle */}
                  <rect x="5" y="13.5" width="6" height="1.2" rx="0.5" />
                </svg>
              </button>
              </Tooltip>
              <button className="pet-hud-close" onClick={() => setHudOpen(false)} aria-label="Fermer">
                <svg viewBox="0 0 16 16" width="13" height="13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mood badge */}
          <div className="pet-hud-status">
            <span className={`pet-hud-mood-badge pet-hud-mood-badge--${petMood}`}>
              <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                {petMood === 'happy' && (<><circle cx="8" cy="8" r="6.5" /><path d="M5.5 9.5 Q8 12 10.5 9.5" /><circle cx="5.8" cy="7" r="0.8" fill="currentColor" stroke="none" /><circle cx="10.2" cy="7" r="0.8" fill="currentColor" stroke="none" /></>)}
                {petMood === 'content' && (<><circle cx="8" cy="8" r="6.5" /><line x1="5.5" y1="10" x2="10.5" y2="10" /><circle cx="5.8" cy="7" r="0.8" fill="currentColor" stroke="none" /><circle cx="10.2" cy="7" r="0.8" fill="currentColor" stroke="none" /></>)}
                {petMood === 'sad' && (<><circle cx="8" cy="8" r="6.5" /><path d="M5.5 11 Q8 8.5 10.5 11" /><line x1="5" y1="5.5" x2="6.5" y2="6.5" /><line x1="11" y1="5.5" x2="9.5" y2="6.5" /></>)}
              </svg>
              {petMood === 'happy' ? 'Heureux' : petMood === 'content' ? 'Stable' : 'Triste'}
            </span>
          </div>

          {/* Achievements panel — toggleable */}
          {achOpen && <AchievementsPanel unlocked={achievements} />}

          <p className="pet-mood-text">{hudThought}</p>

          {/* Contextual needs / tip hints — SVG icons replace emoji */}
          {stats.hunger < 30 && (
            <p className="pet-hud-needs">
              <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="pet-hud-hint-icon">
                <path d="M8 1 L14.5 13 L1.5 13 Z" /><line x1="8" y1="5" x2="8" y2="9" /><circle cx="8" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
              Il a très faim !
            </p>
          )}
          {stats.hunger >= 30 && stats.happiness < 30 && (
            <p className="pet-hud-needs">
              <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="pet-hud-hint-icon">
                <path d="M8 1 L14.5 13 L1.5 13 Z" /><line x1="8" y1="5" x2="8" y2="9" /><circle cx="8" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
              Il se sent seul !
            </p>
          )}
          {stats.hunger >= 30 && stats.hunger < 50 && stats.happiness >= 30 && (
            <p className="pet-hud-tip">
              <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="pet-hud-hint-icon">
                <circle cx="8" cy="6" r="4.5" /><line x1="8" y1="10.5" x2="8" y2="14" />
              </svg>
              Il commence à avoir faim.
            </p>
          )}
          {stats.hunger >= 50 && stats.happiness >= 30 && stats.happiness < 50 && (
            <p className="pet-hud-tip">
              <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="pet-hud-hint-icon">
                <circle cx="8" cy="6" r="4.5" /><line x1="8" y1="10.5" x2="8" y2="14" />
              </svg>
              Un câlin lui ferait du bien.
            </p>
          )}
          {stats.hunger >= 80 && stats.happiness >= 80 && stats.hunger < 85 && (
            <p className="pet-hud-tip">
              <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="pet-hud-hint-icon">
                <circle cx="8" cy="6" r="4.5" /><line x1="8" y1="10.5" x2="8" y2="14" />
              </svg>
              Il explore joyeusement !
            </p>
          )}
          {stats.hunger >= 85 && stats.happiness >= 85 && (
            <p className="pet-hud-tip pet-hud-tip--thriving">
              <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor" stroke="none" aria-hidden="true" className="pet-hud-hint-icon">
                <path d="M8 1.5 L9.6 6 L14.5 6 L10.5 9 L12 13.5 L8 11 L4 13.5 L5.5 9 L1.5 6 L6.4 6 Z" />
              </svg>
              En pleine forme ! — déclin ralenti
            </p>
          )}

          <div className="pet-stats">
            <div className="pet-stat">
              {/* Fork+knife SVG for hunger */}
              <svg className="pet-stat-icon" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-label="Faim">
                <line x1="5" y1="2" x2="5" y2="6" />
                <path d="M3 2 L3 5 Q3 7 5 7 Q7 7 7 5 L7 2" />
                <line x1="5" y1="7" x2="5" y2="14" />
                <line x1="11" y1="2" x2="11" y2="14" />
                <path d="M9 2 Q11 3 11 6" />
              </svg>
              <div className="pet-stat-track">
                <motion.div
                  className={`pet-stat-fill${stats.hunger < 30 ? ' pet-stat-fill--critical' : ''}`}
                  animate={{ width: `${stats.hunger}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                />
              </div>
              <span className="pet-stat-value">{stats.hunger}%</span>
            </div>
            <div className="pet-stat">
              {/* Star SVG for happiness */}
              <svg className="pet-stat-icon" viewBox="0 0 16 16" width="13" height="13" fill="currentColor" stroke="none" aria-label="Bonheur">
                <path d="M8 2 L9.5 6.2 L14 6.2 L10.5 8.8 L11.8 13 L8 10.5 L4.2 13 L5.5 8.8 L2 6.2 L6.5 6.2 Z" />
              </svg>
              <div className="pet-stat-track">
                <motion.div
                  className={`pet-stat-fill${stats.happiness < 30 ? ' pet-stat-fill--critical' : ''}`}
                  animate={{ width: `${stats.happiness}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                />
              </div>
              <span className="pet-stat-value">{stats.happiness}%</span>
            </div>
          </div>

          <div className="pet-actions">
            {[
              {
                key: 'feed', label: 'Nourrir', title: 'Nourrir',
                icon: FOOD_ICONS[feedIconIndex] || FOOD_ICONS[0],
              },
              {
                key: 'pet', label: 'Câliner', title: 'Câliner',
                icon: (
                  <svg viewBox="0 0 16 16" width="17" height="17" fill="currentColor" stroke="none" aria-hidden="true">
                    <path d="M3 7.5 Q3 5 5.5 4 Q7 3.5 8 5 Q9 3.5 10.5 4 Q13 5 13 7.5 Q13 11 8 13.5 Q3 11 3 7.5Z" opacity="0.9" />
                  </svg>
                ),
              },
              {
                key: 'play', label: 'Jouer', title: 'Jouer',
                icon: (
                  <svg viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="1.5" y="5" width="13" height="9" rx="2.5" />
                    <circle cx="5.5" cy="9.5" r="1.3" fill="currentColor" stroke="none" />
                    <circle cx="10.5" cy="9.5" r="1.3" fill="currentColor" stroke="none" />
                    <path d="M6 2.5 L8 1 L10 2.5" />
                  </svg>
                ),
              },
              {
                key: 'catch', label: 'Attrape', title: 'Attrape !',
                noCooldown: true,
                icon: (
                  <svg viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
                    <circle cx="8" cy="8" r="5" />
                    <path d="M5 8 Q8 4 11 8" />
                    <path d="M5 8 Q8 12 11 8" />
                  </svg>
                ),
              },
            ].map(({ key, label, title, icon, noCooldown }) => {
              const cdFull    = key === 'play' ? 3000 : 2000;
              const remaining = noCooldown ? 0 : Math.max(0, (cooldowns[key] || 0) - Date.now());
              const cooling   = remaining > 0;
              const progress  = cooling ? remaining / cdFull : 0;
              const r         = 9;
              const circ      = 2 * Math.PI * r;
              return (
                <Tooltip key={key} text={title}>
                <button
                  className={`pet-action-btn${cooling ? ' pet-action-btn--cooling' : ''}`}
                  onClick={() => onInteract(key)}
                  disabled={cooling}
                  aria-disabled={cooling}
                >
                  <span className="pet-action-btn-inner">
                    {cooling ? (
                      <span className="pet-cd-ring" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 22 22">
                          <circle cx="11" cy="11" r={r} className="pet-cd-ring-track" />
                          <circle
                            cx="11" cy="11" r={r}
                            className="pet-cd-ring-fill"
                            style={{
                              strokeDasharray: circ,
                              strokeDashoffset: circ * (1 - progress),
                            }}
                          />
                        </svg>
                        <span className="pet-cd-ring-text">{(remaining / 1000).toFixed(1)}s</span>
                      </span>
                    ) : icon}
                    <span className="pet-action-label">{label}</span>
                  </span>
                </button>
                </Tooltip>
              );
            })}
          </div>
        </motion.div>
      )}
      {/* Jeu d'attrape */}
      {isCatching && (
        <CatchGame
          botPosRef={posRef}
          onBotCatch={handleBotCatch}
          onGameEnd={onGameEnd}
          ballInfoRef={ballInfoRef}
          stats={stats}
        />
      )}
    </>,
    document.body,
  );
});

export default WanderingPet;
