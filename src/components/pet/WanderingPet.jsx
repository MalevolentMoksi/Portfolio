/* ══════════════════════════════════════════════
   Robot qui se balade librement sur la page
   Physique RAF, drag, HUD, scroll, repos, hover
   ══════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PET_SIZE, HALF, HEADER_H,
  BASE_SPEED, MAX_SPEED, MAGNET_RADIUS, MAGNET_SPEED,
  DRAG_FAST_THRESHOLD, BOUNCE_RESTITUTION, THROW_SPEED_CAP,
  SCROLL_DIZZY_WINDOW, clamp,
} from './petConstants.js';
import RobotFace from './RobotFace.jsx';
import ThoughtBubbleQueue from './ThoughtBubbleQueue.jsx';

const WanderingPet = ({ stats, expression, eyeState, mouthExpr, petMood, onInteract, onBehavior, onThought, onHoverPet, cooldowns, thoughtQueue, hudThought, sizeScale, speedMult, isSleeping, moodSpinActive }) => {
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
  // Smoothed velocity vector tracked during drag — used for throw on release
  const dragVelRef         = useRef({ x: 0, y: 0 });
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
  // External gravity effect — pulls pet downward when active
  const gravityActiveRef = useRef(false);
  // External attract effect — pulls pet toward a target point when active
  const attractTargetRef = useRef(null);

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
      if (hudOpen || isDraggingRef.current) { rafRef.current = requestAnimationFrame(tick); return; }

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
        p.y = clamp(p.y + v.y, HEADER_H + 10, vh - HALF);

        if (frameRef.current % 2 === 0) {
          setPos({ x: p.x, y: p.y });
          setSpeedLevel(Math.sqrt(v.x * v.x + v.y * v.y));

          if (v.x > 0.08)       flipHysteresisRef.current = Math.min(flipHysteresisRef.current + 1,  20);
          else if (v.x < -0.08) flipHysteresisRef.current = Math.max(flipHysteresisRef.current - 1, -20);
          if (flipHysteresisRef.current >=  15) setFacingLeft(false);
          if (flipHysteresisRef.current <= -15) setFacingLeft(true);

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
        if (!gravityActiveRef.current && p.y > vh - margin - HALF)  v.y -= 0.18 * Math.pow(1 - Math.max(0, (vh - HALF - p.y) / margin), 1.5);
      }

      // Cursor interaction — mood-dependent
      const dx = cursorRef.current.x - p.x;
      const dy = cursorRef.current.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isAttracting = Boolean(attractTargetRef.current);

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

        // Sudden close approach → scared (mood-independent — surprise is universal)
        if (!isAttracting && prox.lastDist - dist > 80 && dist < 160 && prox.scaredCooldown === 0) {
          onBehavior('scared');
          prox.scaredCooldown = 180;
          prox.dwellFrames = 0;
        }
        prox.lastDist = dist;

        // Sustained high speed → energy burst — only when not sad
        if (!isAttracting && !isSad && spd > effectiveMaxSpeed * 0.82 && prox.speedCooldown === 0 && prox.exciteCooldown === 0) {
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
      onThought({ type: 'symbol', content: 'heart' });
      const t1 = setTimeout(() => onThought({ type: 'symbol', content: 'heart' }), 500);
      const t2 = setTimeout(() => onThought({ type: 'symbol', content: 'heart' }), 1000);
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

  /* ── API globale gravité ── */
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

      {/* Pensees flottantes */}
      <ThoughtBubbleQueue queue={thoughtQueue} petX={pos.x} petY={pos.y} />

      {/* HUD flottant */}
      <AnimatePresence>
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
              Mon Robot
            </span>
            <button className="pet-hud-close" onClick={() => setHudOpen(false)} aria-label="Fermer">
              <svg viewBox="0 0 16 16" width="10" height="10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="3" x2="13" y2="13" />
                <line x1="13" y1="3" x2="3" y2="13" />
              </svg>
            </button>
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
                icon: (
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
                    <line x1="5" y1="2" x2="5" y2="6" />
                    <path d="M3 2 L3 5 Q3 7 5 7 Q7 7 7 5 L7 2" />
                    <line x1="5" y1="7" x2="5" y2="14" />
                    <line x1="11" y1="2" x2="11" y2="14" />
                    <path d="M9 2 Q11 3 11 6" />
                  </svg>
                ),
              },
              {
                key: 'pet', label: 'Câliner', title: 'Câliner',
                icon: (
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" stroke="none" aria-hidden="true">
                    <path d="M3 7.5 Q3 5 5.5 4 Q7 3.5 8 5 Q9 3.5 10.5 4 Q13 5 13 7.5 Q13 11 8 13.5 Q3 11 3 7.5Z" opacity="0.9" />
                  </svg>
                ),
              },
              {
                key: 'play', label: 'Jouer', title: 'Jouer',
                icon: (
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="1.5" y="5" width="13" height="9" rx="2.5" />
                    <circle cx="5.5" cy="9.5" r="1.3" fill="currentColor" stroke="none" />
                    <circle cx="10.5" cy="9.5" r="1.3" fill="currentColor" stroke="none" />
                    <path d="M6 2.5 L8 1 L10 2.5" />
                  </svg>
                ),
              },
            ].map(({ key, label, title, icon }) => {
              const cdFull    = key === 'play' ? 3000 : 2000;
              const remaining = Math.max(0, cooldowns[key] - Date.now());
              const cooling   = remaining > 0;
              const progress  = cooling ? remaining / cdFull : 0;
              const r         = 7;
              const circ      = 2 * Math.PI * r;
              return (
                <button
                  key={key}
                  className={`pet-action-btn${cooling ? ' pet-action-btn--cooling' : ''}`}
                  onClick={() => onInteract(key)}
                  disabled={cooling}
                  aria-disabled={cooling}
                  title={title}
                >
                  <span className="pet-action-btn-inner">
                    {cooling ? (
                      <span className="pet-cd-ring" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 18 18">
                          <circle cx="9" cy="9" r={r} className="pet-cd-ring-track" />
                          <circle
                            cx="9" cy="9" r={r}
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
              );
            })}
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
};

export default WanderingPet;
