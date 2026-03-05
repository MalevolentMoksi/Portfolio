import { useState, useRef, useCallback, useEffect } from 'react';
import Tooltip from './Tooltip.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { getPerformanceTier } from '../utils/performanceTier.js';

/* ── Configuration des effets ─────────────────────── */
const EFFECT_ICONS = {
  explode: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
      <line x1="12" y1="2"  x2="12" y2="5.5" />
      <line x1="12" y1="18.5" x2="12" y2="22" />
      <line x1="2"  y1="12" x2="5.5"  y2="12" />
      <line x1="18.5" y1="12" x2="22" y2="12" />
      <line x1="5.6"  y1="5.6"  x2="7.9"  y2="7.9" />
      <line x1="16.1" y1="16.1" x2="18.4" y2="18.4" />
      <line x1="18.4" y1="5.6"  x2="16.1" y2="7.9" />
      <line x1="7.9"  y1="16.1" x2="5.6"  y2="18.4" />
    </svg>
  ),
  attract: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
      <path d="M12 2 L12 6"   markerEnd="url(#arr)" />
      <path d="M22 12 L18 12" />
      <path d="M12 22 L12 18" />
      <path d="M2 12 L6 12" />
      <polygon points="12,7 10.5,4.5 13.5,4.5"  fill="currentColor" stroke="none" />
      <polygon points="17,12 19.5,10.5 19.5,13.5" fill="currentColor" stroke="none" />
      <polygon points="12,17 10.5,19.5 13.5,19.5"  fill="currentColor" stroke="none" />
      <polygon points="7,12 4.5,10.5 4.5,13.5"  fill="currentColor" stroke="none" />
    </svg>
  ),
  storm: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="13,2 7,13 12,13 11,22 17,11 12,11" fill="currentColor" fillOpacity="0.2" />
    </svg>
  ),
  gravity: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="18" r="2.5" fill="currentColor" fillOpacity="0.25" />
      <line x1="12" y1="3" x2="12" y2="15" />
      <polyline points="8,11 12,15.5 16,11" />
    </svg>
  ),
};

const EFFECTS = [
  { key: 'explode',  label: 'Explosion',   duration: 1800, toast: 'Explosion — particules projetées !' },
  { key: 'attract',  label: 'Attraction',  duration: 3000, toast: 'Attraction — convergence en cours\u2026' },
  { key: 'storm',    label: 'Temp\u00eate',     duration: 3000, toast: 'Temp\u00eate — turbulences maximales !' },
  { key: 'gravity',  label: 'Gravit\u00e9',     duration: 3000, toast: 'Gravit\u00e9 — les particules chutent !' },
];

/* ── Helpers : accès sécurisé à pJS ── */
const getPJS = () => {
  try {
    return window.pJSDom?.[0]?.pJS ?? null;
  } catch { return null; }
};

const triggerPetAttract = (x, y, duration) => {
  const fire = () => window.petAttract?.(x, y, duration);
  fire();
  requestAnimationFrame(fire);
  setTimeout(fire, 50);
};

/**
 * Active/désactive le mode "foreground" des particules :
 * - Monte le z-index du canvas au-dessus du main
 * - Réduit l'opacité du main pour laisser les particules visibles
 */
const setParticlesForeground = (active) => {
  const canvas = document.getElementById('particles-js');
  const main   = document.querySelector('main');
  if (canvas) canvas.classList.toggle('particles-foreground', active);
  if (main)   main.classList.toggle('main--particles-active', active);
};

/**
 * Génère un point aléatoire en DEHORS du rectangle central du viewport.
 * Le centre est exclu pour que l'attraction ne couvre pas le contenu.
 * Divise le viewport en 4 bandes (haut, bas, gauche, droite).
 */
const randomEdgePoint = () => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  // Hauteur du header sticky (correspond à HEADER_H dans petConstants)
  const HEADER_H = 75;
  // Rectangle central exclu : 40% largeur × 50% hauteur, centré
  const marginX = W * 0.30;
  const marginY = H * 0.25;
  const cx1 = marginX, cx2 = W - marginX;
  // La limite haute de la bande centrale ne peut pas être dans le header
  const cy1 = Math.max(marginY, HEADER_H + 20);
  const cy2 = H - marginY;

  // 4 bandes : haut, bas, gauche, droite (excluant le centre et le header)
  const bands = [
    // haut : commence après le header pour éviter la zone sticky
    { x: () => Math.random() * W, y: () => HEADER_H + Math.random() * Math.max(1, cy1 - HEADER_H) },
    { x: () => Math.random() * W, y: () => cy2 + Math.random() * (H - cy2) },   // bas
    { x: () => Math.random() * cx1, y: () => cy1 + Math.random() * (cy2 - cy1) }, // gauche
    { x: () => cx2 + Math.random() * (W - cx2), y: () => cy1 + Math.random() * (cy2 - cy1) }, // droite
  ];
  const band = bands[Math.floor(Math.random() * bands.length)];
  return { x: band.x(), y: band.y() };
};

/**
 * Vitesse de base réelle d'une particule : les particules.js initialisent
 * chaque composante à (random - 0.5) * speed / 3, donc la magnitude RMS
 * est environ speed / (3 * sqrt(2)) ≈ speed * 0.235.
 * Avec le mode gentle (speed = 1), le baseline est ~0.22 px/frame.
 */
const getBaseSpeed = () => (getPJS()?.particles.move.speed ?? 1) * 0.22;

/**
 * Décélération exponentielle smooth : ramène toutes les particules vers
 * baseSpeed sur `duration` ms sans snap brutal.
 * Retourne un handle { cancel() } pour annuler la boucle depuis l'extérieur.
 */
const smoothRestore = (duration = 1500) => {
  const baseSpeed = getBaseSpeed();
  const frames = duration * 0.06;
  const k = Math.pow(0.05, 1 / frames);
  const start = performance.now();
  let cancelled = false;
  let rafId = null;

  const frame = () => {
    if (cancelled) return;
    const elapsed = performance.now() - start;
    const done = elapsed >= duration;
    const p = getPJS();
    if (!p) return;

    p.particles.array.forEach((pt) => {
      const mag = Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy);
      if (mag < 0.001) return;

      let targetMag;
      if (done) {
        targetMag = baseSpeed;
      } else {
        targetMag = baseSpeed + (mag - baseSpeed) * k;
      }
      const ratio = targetMag / mag;
      pt.vx *= ratio;
      pt.vy *= ratio;
    });

    if (!done) rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);

  return {
    cancel() {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    },
  };
};

/* ── Implémentation des effets ──
 *
 * Chaque effet accepte un objet `signal` : { cancelled: boolean }
 * Le composant peut marquer signal.cancelled = true pour stopper
 * les boucles RAF en cas de démontage ou de nouvel effet.
 *
 * Chaque effet retourne un objet { restoreHandle } pour permettre
 * au composant d'annuler le smoothRestore si besoin.
 */
const effects = {

  /**
   * Explosion : spawn dans les coins supérieurs
   * et projection radiale de toutes les particules.
   */
  explode(signal) {
    setParticlesForeground(true);
    const pJS = getPJS();
    if (!pJS) return { restoreHandle: null };

    const W = window.innerWidth;
    const H = window.innerHeight;
    const pxr = pJS.canvas.pxratio ?? 1;
    const zoneW = W * 0.25;
    const zoneH = H * 0.35;
    const headerH = 70;

    // Adapter le nombre de particules spawnées au tier
    const spawnCount = getPerformanceTier() === 'low' ? 8 : 15;

    for (let i = 0; i < spawnCount; i++) {
      pJS.fn.modes.pushParticles(1, {
        pos_x: Math.random() * zoneW * pxr,
        pos_y: (headerH + Math.random() * (zoneH - headerH)) * pxr,
      });
    }
    for (let i = 0; i < spawnCount; i++) {
      pJS.fn.modes.pushParticles(1, {
        pos_x: (W - Math.random() * zoneW) * pxr,
        pos_y: (headerH + Math.random() * (zoneH - headerH)) * pxr,
      });
    }

    const cx = (W / 2) * pxr;
    const cy = (H / 4) * pxr;
    pJS.particles.array.forEach((pt) => {
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const burst = 5 + Math.random() * 5;
      pt.vx = (dx / dist) * burst;
      pt.vy = (dy / dist) * burst;
    });

    let restoreHandle = null;
    setTimeout(() => {
      if (!signal.cancelled) {
        restoreHandle = smoothRestore(1800);
        setParticlesForeground(false);
      }
    }, 600);
    window.petReact?.('scared');
    return { get restoreHandle() { return restoreHandle; } };
  },

  /**
   * Attraction : les particules convergent vers un point en bordure.
   */
  attract(signal) {
    setParticlesForeground(true);
    const { x: cx, y: cy } = randomEdgePoint();
    triggerPetAttract(cx, cy, 3000);

    const pJS = getPJS();
    if (!pJS) return { restoreHandle: null };

    const pxr = pJS.canvas.pxratio ?? 1;
    const pcx = cx * pxr;
    const pcy = cy * pxr;

    const pull = () => {
      if (signal.cancelled) return;
      const p = getPJS();
      if (!p) return;
      p.particles.array.forEach((pt) => {
        const dx = pcx - pt.x;
        const dy = pcy - pt.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        pt.vx += (dx / dist) * 0.5;
        pt.vy += (dy / dist) * 0.5;
        const spd = Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy);
        if (spd > 8) {
          pt.vx = (pt.vx / spd) * 8;
          pt.vy = (pt.vy / spd) * 8;
        }
      });
      requestAnimationFrame(pull);
    };

    requestAnimationFrame(pull);

    let restoreHandle = null;
    setTimeout(() => {
      signal.cancelled = true; // Arrêter la boucle pull
      if (!signal._unmounted) {
        restoreHandle = smoothRestore(1500);
        setParticlesForeground(false);
      }
    }, 3000);
    return { get restoreHandle() { return restoreHandle; } };
  },

  /**
   * Tempête : ajoute des particules bonus et uniformise leur vitesse.
   */
  storm(signal) {
    setParticlesForeground(true);
    window.petReact?.('dizzy');

    const pJS = getPJS();
    if (!pJS) return { restoreHandle: null };

    const originalCount = pJS.particles.array.length;
    // Adapter le nombre de particules bonus au tier (proportionnel au baseline réduit)
    const maxBonus = getPerformanceTier() === 'low' ? 20 : (getPerformanceTier() === 'mid' ? 40 : 60);
    const bonus = Math.min(originalCount, maxBonus);
    const stormSpeed = 5;
    const pxr = pJS.canvas.pxratio ?? 1;

    for (let i = 0; i < bonus; i++) {
      pJS.fn.modes.pushParticles(1, {
        pos_x: Math.random() * window.innerWidth * pxr,
        pos_y: Math.random() * window.innerHeight * pxr,
      });
    }

    pJS.particles.array.forEach((pt) => {
      const mag = Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy);
      if (mag < 0.001) {
        const angle = Math.random() * Math.PI * 2;
        pt.vx = Math.cos(angle) * stormSpeed;
        pt.vy = Math.sin(angle) * stormSpeed;
      } else {
        const ratio = stormSpeed / mag;
        pt.vx *= ratio;
        pt.vy *= ratio;
      }
    });

    let restoreHandle = null;
    setTimeout(() => {
      if (signal.cancelled) return;
      const p2 = getPJS();
      if (!p2) return;
      const excess = p2.particles.array.length - originalCount;
      if (excess > 0) {
        p2.particles.array.splice(p2.particles.array.length - excess, excess);
      }
      restoreHandle = smoothRestore(2200);
      setParticlesForeground(false);
    }, 3000);
    return { get restoreHandle() { return restoreHandle; } };
  },

  /**
   * Gravité : les particules tombent et rebondissent.
   */
  gravity(signal) {
    setParticlesForeground(true);
    window.petReact?.('dizzy');
    window.petGravity?.(3000);

    const pJS = getPJS();
    if (!pJS) return { restoreHandle: null };

    const fall = () => {
      if (signal.cancelled) return;
      const p = getPJS();
      if (!p) return;
      const floor = p.canvas.h - 4;

      p.particles.array.forEach((pt) => {
        pt.vy += 0.18;
        if (pt.y >= floor) {
          pt.vy *= -0.55;
          pt.y = floor;
        }
      });
      requestAnimationFrame(fall);
    };

    requestAnimationFrame(fall);

    let restoreHandle = null;
    setTimeout(() => {
      signal.cancelled = true; // Arrêter la boucle fall
      if (!signal._unmounted) {
        restoreHandle = smoothRestore(2000);
        setParticlesForeground(false);
      }
    }, 3000);
    return { get restoreHandle() { return restoreHandle; } };
  },
};

/* ── Composant ─────────────────────────────────────── */

const ParticlesButton = () => {
  const { showToast } = useToast();
  const [effectIndex, setEffectIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [activeEffectKey, setActiveEffectKey] = useState(null);
  const [progress, setProgress] = useState(100);
  const cooldownRef = useRef(false);
  const progressIntervalRef = useRef(null);
  // Refs pour annuler les effets en cours lors du démontage
  const isMountedRef = useRef(true);
  const effectSignalRef = useRef(null);
  const smoothRestoreHandleRef = useRef(null);

  const triggerEffect = useCallback(() => {
    if (cooldownRef.current) return;

    // Annuler tout smoothRestore précédent encore en cours
    smoothRestoreHandleRef.current?.cancel();
    smoothRestoreHandleRef.current = null;

    const effect = EFFECTS[effectIndex];

    // Créer un signal pour cet effet — permet de l'annuler depuis cleanup
    const signal = { cancelled: false, _unmounted: false };
    effectSignalRef.current = signal;

    showToast(effect.toast, { type: 'info', duration: effect.duration, icon: EFFECT_ICONS[effect.key] });
    const result = effects[effect.key](signal);

    // Intercepter le smoothRestore retourné par l'effet (via getter lazy)
    // pour pouvoir l'annuler au démontage
    if (result) {
      const checkRestore = setInterval(() => {
        const h = result.restoreHandle;
        if (h) {
          smoothRestoreHandleRef.current = h;
          clearInterval(checkRestore);
        }
      }, 200);
      // Safety : ne pas fuiter l'interval
      setTimeout(() => clearInterval(checkRestore), 5000);
    }

    setIsActive(true);
    setActiveEffectKey(effect.key);
    setProgress(100);
    cooldownRef.current = true;

    const duration = effect.duration;
    const startTime = Date.now();

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // 100ms au lieu de 50ms — 10 updates/sec suffisent pour un compteur %
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = (remaining / duration) * 100;
      setProgress(progressPercent);

      if (progressPercent <= 0) {
        clearInterval(progressIntervalRef.current);
        setIsActive(false);
        setActiveEffectKey(null);
        cooldownRef.current = false;
        setEffectIndex((i) => (i + 1) % EFFECTS.length);
      }
    }, 100);
  }, [effectIndex]);

  // Cleanup complet au démontage : annuler RAF leaks + intervals
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Signaler à l'effet en cours de s'arrêter
      if (effectSignalRef.current) {
        effectSignalRef.current.cancelled = true;
        effectSignalRef.current._unmounted = true;
      }
      // Annuler le smoothRestore en cours
      smoothRestoreHandleRef.current?.cancel();
      // Annuler l'interval de progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      // Remettre le foreground à l'état normal
      setParticlesForeground(false);
    };
  }, []);

  const currentEffect = EFFECTS[effectIndex];
  const progressRingPerimeter = 4 * (39 - 2 * 10.5) + 2 * Math.PI * 10.5; // périmètre rect 39×39 rx=10.5
  const progressOffset = progressRingPerimeter * (1 - progress / 100);

  // Determine progress class for color transition
  let progressClass = '';
  if (progress > 75) progressClass = 'progress-75';
  else if (progress > 50) progressClass = 'progress-50';
  else if (progress > 25) progressClass = 'progress-25';

  return (
    <Tooltip text={currentEffect.label} desc={isActive ? `Chargement ${Math.ceil(progress)}%` : 'Cliquer pour déclencher'} position="bottom">
    <button
      className={`header-action-btn particles-btn ${isActive ? 'particles-btn--active' : ''}`}
      onClick={triggerEffect}
      aria-label={`Effet particules : ${currentEffect.label}`}
      disabled={isActive}
    >
      {/* Cooldown Progress Ring */}
      {isActive && (
        <svg
          className="particles-progress-ring"
          viewBox="0 0 40 40"
          width="40"
          height="40"
        >
          <rect
            className={`particles-progress-ring__circle ${progressClass}`}
            x="0.5"
            y="0.5"
            width="39"
            height="39"
            rx="10.5"
            strokeWidth="2"
            strokeDasharray={progressRingPerimeter}
            strokeDashoffset={progressOffset}
          />
        </svg>
      )}

      {/* Effect Icon with Animation */}
      <svg
        className={`particles-icon ${activeEffectKey ? `particles-icon--${activeEffectKey}` : ''}`}
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
        {/* Étoile / spark central */}
        <path
          className="particles-icon__star"
          d="M12 2 L13.5 8.5 L20 7 L15 12 L20 17 L13.5 15.5 L12 22 L10.5 15.5 L4 17 L9 12 L4 7 L10.5 8.5 Z"
          fill="currentColor"
          stroke="none"
          opacity="0.9"
        />
        {/* Rayons dynamiques */}
        <line className="particles-icon__ray particles-icon__ray--1" x1="12" y1="1" x2="12" y2="4" />
        <line className="particles-icon__ray particles-icon__ray--2" x1="23" y1="12" x2="20" y2="12" />
        <line className="particles-icon__ray particles-icon__ray--3" x1="12" y1="23" x2="12" y2="20" />
        <line className="particles-icon__ray particles-icon__ray--4" x1="1" y1="12" x2="4" y2="12" />
      </svg>
    </button>
    </Tooltip>
  );
};

export default ParticlesButton;
