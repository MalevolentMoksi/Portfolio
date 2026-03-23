import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Tooltip from './Tooltip';
import { useToast } from '../contexts/ToastContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';
import type { PerformanceTier } from '@/types';

/* ── Configuration des effets ─────────────────────── */
const EFFECT_ICONS = {
  explode: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
      <line x1="12" y1="2" x2="12" y2="5.5" />
      <line x1="12" y1="18.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5.5" y2="12" />
      <line x1="18.5" y1="12" x2="22" y2="12" />
      <line x1="5.6" y1="5.6" x2="7.9" y2="7.9" />
      <line x1="16.1" y1="16.1" x2="18.4" y2="18.4" />
      <line x1="18.4" y1="5.6" x2="16.1" y2="7.9" />
      <line x1="7.9" y1="16.1" x2="5.6" y2="18.4" />
    </svg>
  ),
  attract: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
      <path d="M12 2 L12 6" markerEnd="url(#arr)" />
      <path d="M22 12 L18 12" />
      <path d="M12 22 L12 18" />
      <path d="M2 12 L6 12" />
      <polygon points="12,7 10.5,4.5 13.5,4.5" fill="currentColor" stroke="none" />
      <polygon points="17,12 19.5,10.5 19.5,13.5" fill="currentColor" stroke="none" />
      <polygon points="12,17 10.5,19.5 13.5,19.5" fill="currentColor" stroke="none" />
      <polygon points="7,12 4.5,10.5 4.5,13.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  storm: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="13,2 7,13 12,13 11,22 17,11 12,11" fill="currentColor" fillOpacity="0.2" />
    </svg>
  ),
  gravity: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="18" r="2.5" fill="currentColor" fillOpacity="0.25" />
      <line x1="12" y1="3" x2="12" y2="15" />
      <polyline points="8,11 12,15.5 16,11" />
    </svg>
  ),
};

const EFFECTS = [
  { key: 'explode', duration: 1800 },
  { key: 'attract', duration: 3000 },
  { key: 'storm', duration: 3000 },
  { key: 'gravity', duration: 3000 },
] as const;

type EffectKey = (typeof EFFECTS)[number]['key'];

interface EffectSignal {
  cancelled: boolean;
  _unmounted: boolean;
}

const WEATHER_EFFECT_META: Record<
  EffectKey,
  {
    energyBase: number;
    energySwing: number;
  }
> = {
  explode: { energyBase: 68, energySwing: 26 },
  attract: { energyBase: 56, energySwing: 20 },
  storm: { energyBase: 74, energySwing: 28 },
  gravity: { energyBase: 52, energySwing: 24 },
};

const WEATHER_NODE_LAYOUT = [
  { x: '50%', y: '8%' },
  { x: '86%', y: '50%' },
  { x: '50%', y: '92%' },
  { x: '14%', y: '50%' },
] as const;

const CHARGE_MAX_HOLD_MS = 950;
const CHARGE_DURATION_BOOST_MAX = 0.45;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/* ── Helpers : accès sécurisé à pJS ── */
const getPJS = () => {
  try {
    return window.pJSDom?.[0]?.pJS ?? null;
  } catch {
    return null;
  }
};

const triggerPetAttract = (x: any, y: any, duration: number) => {
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
const setParticlesForeground = (active: any) => {
  const canvas = document.getElementById('particles-canvas');
  const main = document.querySelector('main');
  if (canvas) canvas.classList.toggle('particles-foreground', active);
  if (main) main.classList.toggle('main--particles-active', active);
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
  const marginX = W * 0.3;
  const marginY = H * 0.25;
  const cx1 = marginX,
    cx2 = W - marginX;
  // La limite haute de la bande centrale ne peut pas être dans le header
  const cy1 = Math.max(marginY, HEADER_H + 20);
  const cy2 = H - marginY;

  // 4 bandes : haut, bas, gauche, droite (excluant le centre et le header)
  const bands = [
    // haut : commence après le header pour éviter la zone sticky
    { x: () => Math.random() * W, y: () => HEADER_H + Math.random() * Math.max(1, cy1 - HEADER_H) },
    { x: () => Math.random() * W, y: () => cy2 + Math.random() * (H - cy2) }, // bas
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

const getCurrentMood = () =>
  document.querySelector('.mood-stage')?.getAttribute('data-mood') ||
  document.body.getAttribute('data-mood') ||
  'default';

const getMoodFxProfile = () => {
  const mood = getCurrentMood();
  if (mood === 'industrial') {
    return {
      spawnMult: 1.9,
      burstMult: 1.45,
      pullForce: 0.78,
      pullCap: 11,
      stormBonusMult: 2.1,
      stormSpeed: 7.2,
      gravityAccel: 0.24,
      bounceDamp: -0.62,
    };
  }
  if (mood === 'nightshade') {
    return {
      spawnMult: 1.6,
      burstMult: 1.35,
      pullForce: 0.66,
      pullCap: 9.5,
      stormBonusMult: 1.85,
      stormSpeed: 6.3,
      gravityAccel: 0.14,
      bounceDamp: -0.5,
    };
  }
  return {
    spawnMult: 1,
    burstMult: 1,
    pullForce: 0.5,
    pullCap: 8,
    stormBonusMult: 1,
    stormSpeed: 5,
    gravityAccel: 0.18,
    bounceDamp: -0.55,
  };
};

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
  let rafId: any = null;

  const frame = () => {
    if (cancelled) return;
    const elapsed = performance.now() - start;
    const done = elapsed >= duration;
    const p = getPJS();
    if (!p) return;

    p.particles.array.forEach((pt: any) => {
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
const effects: Record<
  EffectKey,
  (signal: EffectSignal, tier: PerformanceTier, runtimeDuration: number) => { readonly restoreHandle: any }
> = {
  /**
   * Explosion : spawn dans les coins supérieurs
   * et projection radiale de toutes les particules.
   */
  explode(signal: any, tier: PerformanceTier, runtimeDuration: number) {
    setParticlesForeground(true);
    const pJS = getPJS();
    if (!pJS) return { restoreHandle: null };
    const profile = getMoodFxProfile();

    const W = window.innerWidth;
    const H = window.innerHeight;
    const pxr = pJS.canvas.pxratio ?? 1;
    const zoneW = W * 0.25;
    const zoneH = H * 0.35;
    const headerH = 70;

    // Adapter le nombre de particules spawnées au tier + mood
    const baseSpawnCount = tier === 'low' ? 8 : 15;
    const spawnCount = Math.max(6, Math.round(baseSpawnCount * profile.spawnMult));

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
    pJS.particles.array.forEach((pt: any) => {
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const burst = (5 + Math.random() * 5) * profile.burstMult;
      pt.vx = (dx / dist) * burst;
      pt.vy = (dy / dist) * burst;
    });

    let restoreHandle: any = null;
    const warmupMs = Math.max(260, Math.round(runtimeDuration * 0.33));
    setTimeout(() => {
      if (!signal.cancelled) {
        restoreHandle = smoothRestore(Math.max(1200, Math.round(runtimeDuration * 0.9)));
        setParticlesForeground(false);
      }
    }, warmupMs);
    window.petReact?.('scared');
    return {
      get restoreHandle() {
        return restoreHandle;
      },
    };
  },

  /**
   * Attraction : les particules convergent vers un point en bordure.
   */
  attract(signal: any, _tier: PerformanceTier, runtimeDuration: number) {
    setParticlesForeground(true);
    const { x: cx, y: cy } = randomEdgePoint();
    triggerPetAttract(cx, cy, runtimeDuration);

    const pJS = getPJS();
    if (!pJS) return { restoreHandle: null };

    const pxr = pJS.canvas.pxratio ?? 1;
    const pcx = cx * pxr;
    const pcy = cy * pxr;
    const { pullForce, pullCap } = getMoodFxProfile();

    const pull = () => {
      if (signal.cancelled) return;
      const p = getPJS();
      if (!p) return;
      p.particles.array.forEach((pt: any) => {
        const dx = pcx - pt.x;
        const dy = pcy - pt.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        pt.vx += (dx / dist) * pullForce;
        pt.vy += (dy / dist) * pullForce;
        const spd = Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy);
        if (spd > pullCap) {
          pt.vx = (pt.vx / spd) * pullCap;
          pt.vy = (pt.vy / spd) * pullCap;
        }
      });
      requestAnimationFrame(pull);
    };

    requestAnimationFrame(pull);

    let restoreHandle: any = null;
    setTimeout(() => {
      signal.cancelled = true; // Arrêter la boucle pull
      if (!signal._unmounted) {
        restoreHandle = smoothRestore(Math.max(1000, Math.round(runtimeDuration * 0.5)));
        setParticlesForeground(false);
      }
    }, runtimeDuration);
    return {
      get restoreHandle() {
        return restoreHandle;
      },
    };
  },

  /**
   * Tempête : ajoute des particules bonus et uniformise leur vitesse.
   */
  storm(signal: any, tier: PerformanceTier, runtimeDuration: number) {
    setParticlesForeground(true);
    window.petReact?.('dizzy');

    const pJS = getPJS();
    if (!pJS) return { restoreHandle: null };
    const profile = getMoodFxProfile();

    const originalCount = pJS.particles.array.length;
    // Adapter le nombre de particules bonus au tier (proportionnel au baseline réduit)
    const baseMaxBonus = tier === 'low' ? 20 : tier === 'mid' ? 40 : 60;
    const maxBonus = Math.round(baseMaxBonus * profile.stormBonusMult);
    const bonus = Math.min(originalCount, maxBonus);
    const stormSpeed = profile.stormSpeed;
    const pxr = pJS.canvas.pxratio ?? 1;

    for (let i = 0; i < bonus; i++) {
      pJS.fn.modes.pushParticles(1, {
        pos_x: Math.random() * window.innerWidth * pxr,
        pos_y: Math.random() * window.innerHeight * pxr,
      });
    }

    pJS.particles.array.forEach((pt: any) => {
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

    let restoreHandle: any = null;
    setTimeout(() => {
      if (signal.cancelled) return;
      const p2 = getPJS();
      if (!p2) return;
      const excess = p2.particles.array.length - originalCount;
      if (excess > 0) {
        p2.particles.array.splice(p2.particles.array.length - excess, excess);
      }
      restoreHandle = smoothRestore(Math.max(1300, Math.round(runtimeDuration * 0.72)));
      setParticlesForeground(false);
    }, runtimeDuration);
    return {
      get restoreHandle() {
        return restoreHandle;
      },
    };
  },

  /**
   * Gravité : les particules tombent et rebondissent.
   */
  gravity(signal: any, _tier: PerformanceTier, runtimeDuration: number) {
    setParticlesForeground(true);
    window.petReact?.('dizzy');
    window.petGravity?.(runtimeDuration);

    const pJS = getPJS();
    if (!pJS) return { restoreHandle: null };
    const { gravityAccel, bounceDamp } = getMoodFxProfile();

    const fall = () => {
      if (signal.cancelled) return;
      const p = getPJS();
      if (!p) return;
      const floor = p.canvas.h - 4;

      p.particles.array.forEach((pt: any) => {
        pt.vy += gravityAccel;
        if (pt.y >= floor) {
          pt.vy *= bounceDamp;
          pt.y = floor;
        }
      });
      requestAnimationFrame(fall);
    };

    requestAnimationFrame(fall);

    let restoreHandle: any = null;
    setTimeout(() => {
      signal.cancelled = true; // Arrêter la boucle fall
      if (!signal._unmounted) {
        restoreHandle = smoothRestore(Math.max(1200, Math.round(runtimeDuration * 0.65)));
        setParticlesForeground(false);
      }
    }, runtimeDuration);
    return {
      get restoreHandle() {
        return restoreHandle;
      },
    };
  },
};

/* ── Composant ─────────────────────────────────────── */

const ParticlesButton = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const tier = usePerformanceTierValue();
  const { settings: a11ySettings } = useAccessibility();
  const noMotion = a11ySettings.noMotion;

  const weatherPanelTitle = t('common.particles.weather.panelTitle');
  const weatherPanelAria = t('common.particles.weather.panelAria');
  const weatherHint = t('common.particles.weather.hint');
  const weatherTriggerLabel = t('common.particles.weather.triggerLabel');
  const weatherChargeLabel = t('common.particles.weather.chargeLabel');
  const weatherEnergyLabel = t('common.particles.weather.energyLabel');
  const weatherCountLabel = t('common.particles.weather.countLabel');
  const weatherSignatureLabel = t('common.particles.weather.signatureLabel');
  const weatherReadyStatus = t('common.particles.weather.statusReady');
  const weatherActiveStatus = t('common.particles.weather.statusActive');

  const [effectIndex, setEffectIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [activeEffectKey, setActiveEffectKey] = useState<EffectKey | null>(null);
  const [progress, setProgress] = useState(100);
  const [isStationOpen, setIsStationOpen] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);
  const [lastCommittedCharge, setLastCommittedCharge] = useState(0);
  const [particleCount, setParticleCount] = useState(0);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);

  const cooldownRef = useRef(false);
  const progressIntervalRef = useRef<any>(null);

  // Refs pour annuler les effets en cours lors du démontage
  const isMountedRef = useRef(true);
  const effectSignalRef = useRef<any>(null);
  const smoothRestoreHandleRef = useRef<any>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const chargeRafRef = useRef<number | null>(null);
  const isChargingRef = useRef(false);
  const chargeProgressRef = useRef(0);
  const skipNextCoreClickRef = useRef(false);

  const localizedEffects = EFFECTS.map((effect) => ({
    ...effect,
    label: t(`common.particles.effects.${effect.key}.label`),
    toast: t(`common.particles.effects.${effect.key}.toast`),
    code: t(`common.particles.weather.codes.${effect.key}`),
    signature: t(`common.particles.weather.signatures.${effect.key}`),
  }));

  const triggerHaptic = useCallback(
    (pattern: number | number[]) => {
      if (noMotion || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
        return;
      }
      navigator.vibrate(pattern);
    },
    [noMotion]
  );

  const triggerEffect = useCallback(
    (chargedPercent = 0) => {
      if (cooldownRef.current) return;

      if (!getPJS()) {
        showToast('Effets meteo indisponibles avec ce moteur de particules.', {
          type: 'warning',
          duration: 2200,
        });
        return;
      }

      triggerHaptic([30, 20, 40]);

      // Stop any previous effect loop before starting a new one.
      if (effectSignalRef.current) {
        effectSignalRef.current.cancelled = true;
        effectSignalRef.current._unmounted = true;
      }

      // Annuler tout smoothRestore précédent encore en cours
      smoothRestoreHandleRef.current?.cancel();
      smoothRestoreHandleRef.current = null;

      const effect = localizedEffects[effectIndex];
      const chargeRatio = clamp(chargedPercent / 100, 0, 1);
      const runtimeDuration = Math.round(
        effect.duration * (1 + CHARGE_DURATION_BOOST_MAX * chargeRatio)
      );

      // Créer un signal pour cet effet — permet de l'annuler depuis cleanup
      const signal: EffectSignal = { cancelled: false, _unmounted: false };
      effectSignalRef.current = signal;

      showToast(effect.toast, {
        type: 'info',
        duration: runtimeDuration,
        icon: EFFECT_ICONS[effect.key as EffectKey],
      });
      const result = effects[effect.key as EffectKey](signal, tier, runtimeDuration);

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
      setActiveEffectKey(effect.key as EffectKey);
      setProgress(100);
      setLastCommittedCharge(Math.round(chargedPercent));
      cooldownRef.current = true;

      const duration = runtimeDuration;
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
        }
      }, 100);
    },
    [effectIndex, localizedEffects, showToast, tier]
  );

  const closeStation = useCallback(() => {
    setIsStationOpen(false);
    setIsCharging(false);
    isChargingRef.current = false;
    chargeProgressRef.current = 0;
    setChargeProgress(0);
    if (chargeRafRef.current !== null) {
      cancelAnimationFrame(chargeRafRef.current);
      chargeRafRef.current = null;
    }
  }, []);

  const finishCharging = useCallback(
    (shouldTrigger: boolean) => {
      if (!isChargingRef.current) return;

      isChargingRef.current = false;
      setIsCharging(false);

      if (chargeRafRef.current !== null) {
        cancelAnimationFrame(chargeRafRef.current);
        chargeRafRef.current = null;
      }

      const chargedPercent = chargeProgressRef.current;
      chargeProgressRef.current = 0;
      setChargeProgress(0);

      if (shouldTrigger) {
        triggerEffect(chargedPercent);
      }
    },
    [triggerEffect]
  );

  const handleCorePointerDown = useCallback(
    (event: any) => {
      if (cooldownRef.current || noMotion) return;

      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // no-op: some synthetic pointer flows can fail capture
      }

      isChargingRef.current = true;
      setIsCharging(true);
      chargeProgressRef.current = 0;
      setChargeProgress(0);
      triggerHaptic(20);

      if (chargeRafRef.current !== null) {
        cancelAnimationFrame(chargeRafRef.current);
      }

      const startTime = performance.now();
      const tick = (now: number) => {
        if (!isChargingRef.current || !isMountedRef.current) return;

        const ratio = clamp((now - startTime) / CHARGE_MAX_HOLD_MS, 0, 1);
        const nextProgress = Math.round(ratio * 100);
        chargeProgressRef.current = nextProgress;
        setChargeProgress(nextProgress);

        if (ratio < 1) {
          chargeRafRef.current = requestAnimationFrame(tick);
        }
      };

      chargeRafRef.current = requestAnimationFrame(tick);
    },
    [noMotion]
  );

  const handleCorePointerUp = useCallback(
    (event: any) => {
      if (!isChargingRef.current) return;

      skipNextCoreClickRef.current = true;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // no-op
      }
      finishCharging(true);
    },
    [finishCharging]
  );

  const handleCorePointerCancel = useCallback(() => {
    finishCharging(false);
  }, [finishCharging]);

  const handleCoreClick = useCallback(() => {
    if (skipNextCoreClickRef.current) {
      skipNextCoreClickRef.current = false;
      return;
    }
    triggerEffect(0);
  }, [triggerEffect]);

  const handlePanelKeyDown = useCallback(
    (event: any) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        setEffectIndex((prev) => (prev + 1) % EFFECTS.length);
        triggerHaptic(10);
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        setEffectIndex((prev) => (prev - 1 + EFFECTS.length) % EFFECTS.length);
        triggerHaptic(10);
        return;
      }

      if (event.key === 'Enter' && !isActive) {
        event.preventDefault();
        triggerEffect(chargeProgressRef.current);
      }
    },
    [isActive, triggerEffect]
  );

  const toggleStation = useCallback(() => {
    if (noMotion) return;
    setIsStationOpen((prev) => !prev);
  }, [noMotion]);

  useEffect(() => {
    if (!isStationOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 12,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isStationOpen]);

  useEffect(() => {
    if (!isStationOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closeStation();
    };

    const timerId = window.setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [closeStation, isStationOpen]);

  useEffect(() => {
    if (!isStationOpen && !isActive) {
      setParticleCount(0);
      return;
    }

    const updateCount = () => {
      const p = getPJS();
      setParticleCount(p?.particles?.array?.length ?? 0);
    };

    updateCount();
    const intervalId = window.setInterval(updateCount, 260);
    return () => window.clearInterval(intervalId);
  }, [isActive, isStationOpen]);

  useEffect(() => {
    if (!isStationOpen) return;

    panelRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeStation();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeStation, isStationOpen]);

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
      if (chargeRafRef.current !== null) {
        cancelAnimationFrame(chargeRafRef.current);
      }
      // Remettre le foreground à l'état normal
      setParticlesForeground(false);
    };
  }, []);

  const currentEffect = localizedEffects[effectIndex];
  const currentEffectKey = currentEffect.key as EffectKey;
  const weatherMeta = WEATHER_EFFECT_META[currentEffectKey];
  const activityRatio = isActive ? 1 - progress / 100 : 0;
  const fieldEnergy = clamp(
    Math.round(weatherMeta.energyBase + activityRatio * weatherMeta.energySwing + lastCommittedCharge * 0.22),
    0,
    100
  );
  const observedParticles = Math.max(0, particleCount);
  const panelStatus = isActive ? weatherActiveStatus : weatherReadyStatus;

  const progressRingRadius = 18;
  const progressRingPerimeter = 2 * Math.PI * progressRingRadius;
  const progressOffset = progressRingPerimeter * (1 - progress / 100);

  // Determine progress class for color transition
  let progressClass = '';
  if (progress > 75) progressClass = 'progress-75';
  else if (progress > 50) progressClass = 'progress-50';
  else if (progress > 25) progressClass = 'progress-25';

  return (
    <div className="particles-weather-wrapper" ref={triggerRef}>
      <Tooltip
        text={currentEffect.label}
        desc={
          isActive
            ? t('common.particles.loading', { progress: Math.ceil(progress) })
            : weatherHint
        }
        position="bottom"
      >
        <button
          className={`header-action-btn particles-btn particles-weather-toggle ${isActive ? 'particles-btn--active' : ''}`}
          onClick={toggleStation}
          aria-label={t('common.particles.ariaLabel', { effect: currentEffect.label })}
          aria-expanded={isStationOpen}
          aria-haspopup="dialog"
          aria-controls="particles-weather-panel"
          disabled={noMotion}
        >
          {isActive && (
            <svg className="particles-progress-ring" viewBox="0 0 40 40" width="40" height="40">
              <circle
                className={`particles-progress-ring__circle ${progressClass}`}
                cx="20"
                cy="20"
                r="18"
                strokeWidth="2"
                strokeDasharray={progressRingPerimeter}
                strokeDashoffset={progressOffset}
              />
            </svg>
          )}

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
            <path
              className="particles-icon__star"
              d="M12 2 L13.5 8.5 L20 7 L15 12 L20 17 L13.5 15.5 L12 22 L10.5 15.5 L4 17 L9 12 L4 7 L10.5 8.5 Z"
              fill="currentColor"
              stroke="none"
              opacity="0.9"
            />
            <line className="particles-icon__ray particles-icon__ray--1" x1="12" y1="1" x2="12" y2="4" />
            <line className="particles-icon__ray particles-icon__ray--2" x1="23" y1="12" x2="20" y2="12" />
            <line className="particles-icon__ray particles-icon__ray--3" x1="12" y1="23" x2="12" y2="20" />
            <line className="particles-icon__ray particles-icon__ray--4" x1="1" y1="12" x2="4" y2="12" />
          </svg>

          <span className="particles-weather-toggle__glyph" aria-hidden="true">
            {currentEffect.code}
          </span>
        </button>
      </Tooltip>

      {isStationOpen &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            id="particles-weather-panel"
            className={`particles-weather-panel${isActive ? ' particles-weather-panel--active' : ''}`}
            role="dialog"
            aria-label={weatherPanelAria}
            tabIndex={-1}
            onKeyDown={handlePanelKeyDown}
            style={{ top: `${panelPos.top}px`, right: `${panelPos.right}px` }}
          >
            {/* Industrial Screws */}
            <div className="particles-weather-panel__screw particles-weather-panel__screw--tl" />
            <div className="particles-weather-panel__screw particles-weather-panel__screw--tr" />
            <div className="particles-weather-panel__screw particles-weather-panel__screw--bl" />
            <div className="particles-weather-panel__screw particles-weather-panel__screw--br" />

            <div className="particles-weather-panel__header">
              <p className="particles-weather-panel__title">{weatherPanelTitle}</p>
              <button
                type="button"
                className="particles-weather-panel__close"
                onClick={closeStation}
                aria-label={t('common.particles.weather.closeAria')}
              >
                ×
              </button>
            </div>

            <div className="particles-weather-wheel" role="radiogroup" aria-label={weatherPanelTitle}>
              {localizedEffects.map((effect, index) => {
                const isSelected = effectIndex === index;
                const nodePos = WEATHER_NODE_LAYOUT[index];

                return (
                  <button
                    key={effect.key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={effect.label}
                    className={`particles-weather-node${isSelected ? ' particles-weather-node--selected' : ''}`}
                    style={{ left: nodePos.x, top: nodePos.y }}
                    onClick={() => {
                      setEffectIndex(index);
                      triggerHaptic(10);
                    }}
                  >
                    <span className="particles-weather-node__glyph" aria-hidden="true">
                      {effect.code}
                    </span>
                    <span className="particles-weather-node__label">{effect.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                className={`particles-weather-core${isCharging ? ' particles-weather-core--charging' : ''}`}
                aria-label={t('common.particles.weather.triggerAria')}
                onPointerDown={handleCorePointerDown}
                onPointerUp={handleCorePointerUp}
                onPointerCancel={handleCorePointerCancel}
                onPointerLeave={handleCorePointerCancel}
                onClick={handleCoreClick}
                disabled={isActive || noMotion}
              >
                <span className="particles-weather-core__label">
                  {isActive ? `${Math.ceil(progress)}%` : weatherTriggerLabel}
                </span>
                <span className="particles-weather-core__hint">
                  {isActive
                    ? t('common.particles.weather.chargedWithValue', { value: lastCommittedCharge })
                    : t('common.particles.weather.chargedHint')}
                </span>
                {isCharging && (
                  <svg
                    className="particles-weather-core__charge"
                    viewBox="0 0 240 240"
                    width="240"
                    height="240"
                    aria-hidden="true"
                  >
                    <circle
                      className="particles-weather-core__charge-ring"
                      cx="120"
                      cy="120"
                      r="110"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 110}
                      strokeDashoffset={2 * Math.PI * 110 * (1 - chargeProgress / 100)}
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="particles-weather-meter" aria-live="polite">
              <p className="particles-weather-meter__row">
                <span>{weatherEnergyLabel}</span>
                <strong>{fieldEnergy}%</strong>
              </p>
              <div className="particles-weather-meter__track" aria-hidden="true">
                <span style={{ width: `${fieldEnergy}%` }} />
              </div>
              <p className="particles-weather-meter__row">
                <span>{weatherCountLabel}</span>
                <strong>{observedParticles}</strong>
              </p>
              <p className="particles-weather-meter__row particles-weather-meter__row--signature">
                <span>{weatherSignatureLabel}</span>
                <strong>{currentEffect.signature}</strong>
              </p>
              <p className="particles-weather-meter__row particles-weather-meter__row--status">
                <span>{weatherChargeLabel}</span>
                <strong>{panelStatus}</strong>
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ParticlesButton;
