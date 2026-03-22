/**
 * Performance Tier Detection
 *
 * Détermine le niveau de performance du client pour adapter la qualité
 * visuelle (particules, retina, effets).
 *
 * Tiers :
 * - 'high' : machine puissante → qualité maximale, retina ON
 * - 'mid'  : machine intermédiaire → qualité réduite, retina OFF
 * - 'low'  : machine faible → qualité minimale, retina OFF
 */

import type { PerformanceTier } from '@/types';

const SS_KEY = 'perf-tier-v3';
const SS_FPS_KEY = 'perf-fps-v3';

export const PERFORMANCE_TIER_CHANGE_EVENT = 'portfolio:performance-tier-change';

export interface PerformanceTierChangeDetail {
  previousTier: PerformanceTier;
  nextTier: PerformanceTier;
  reason: 'fps-monitor';
}

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
}

// Safe sessionStorage helpers — some environments (privacy extensions)
// may throw on access to storage. We silently ignore failures.
const safeSessionGet = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSessionSet = (key: string, value: string): void => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const applyTierAttributes = (tier: PerformanceTier): void => {
  if (typeof document === 'undefined') return;

  document.body?.setAttribute('data-perf-tier', tier);
  const moodStages = document.querySelectorAll<HTMLElement>('.mood-stage');
  moodStages.forEach((stage) => {
    stage.setAttribute('data-perf-tier', tier);
  });
};

const emitTierChange = (detail: PerformanceTierChangeDetail): void => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<PerformanceTierChangeDetail>(PERFORMANCE_TIER_CHANGE_EVENT, {
      detail,
    })
  );
};

const getDeviceMemoryGb = (): number | null => {
  const memory = (navigator as NavigatorWithHints).deviceMemory;
  if (typeof memory !== 'number' || !Number.isFinite(memory) || memory <= 0) {
    return null;
  }
  return memory;
};

/* ────────────────────────────────────────────
   Détection synchrone basée sur les hints hardware
   ──────────────────────────────────────────── */

/**
 * Retourne true si le dispositif de pointage principal est tactile
 * (téléphone, tablette). Les laptops à écran tactile ont aussi un
 * pointeur fin (souris/trackpad) → (hover: hover) est vrai pour eux
 * et ne sont donc pas affectés.
 */
const isTouchDevice = (): boolean =>
  window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches ?? false;

const detectTierSync = (): PerformanceTier => {
  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const cores = navigator.hardwareConcurrency || 0;
  const memoryGb = getDeviceMemoryGb();
  const touch = isTouchDevice();
  let score = 0;

  // Heuristic designed to keep capable devices on high by default,
  // and only downgrade when multiple weak signals agree.
  if (cores > 0) {
    if (cores <= 2) score -= 3;
    else if (cores <= 4) score -= 1;
    else if (cores >= 8) score += 1;
  } else {
    // API indisponible (rare): légère prudence.
    score -= 1;
  }

  if (memoryGb !== null) {
    if (memoryGb <= 2) score -= 2;
    else if (memoryGb <= 4) score -= 1;
    else if (memoryGb >= 8) score += 1;
  }

  if (touch) {
    score -= 1;
    // High-end mobiles/tablettes restent éligibles au tier high.
    if (cores >= 8 && (memoryGb === null || memoryGb >= 6)) {
      score += 1;
    }
  }

  // Préférence utilisateur (a11y), pas un benchmark hardware.
  // On applique un léger abaissement visuel sans forcer low.
  if (prefersReducedMotion) {
    score -= 1;
  }

  if (score <= -3) return 'low';
  if (score <= -1) return 'mid';

  return 'high';
};

/* ────────────────────────────────────────────
   Cache session + API publique
   ──────────────────────────────────────────── */

let _cached: PerformanceTier | null = null;
let _fpsRunning = false;

/**
 * Retourne le tier de performance courant (sync, pas de mesure).
 * Le résultat est mis en cache dans sessionStorage pour éviter
 * les recalculs à chaque navigation SPA.
 */
export const getPerformanceTier = (): PerformanceTier => {
  if (_cached) {
    applyTierAttributes(_cached);
    return _cached;
  }

  // Vérifier si déjà mesuré/abaissé dans cette session (protéger l'accès)
  const stored = safeSessionGet(SS_KEY);
  if (stored === 'high' || stored === 'mid' || stored === 'low') {
    _cached = stored;
    applyTierAttributes(_cached);
    return _cached;
  }

  _cached = detectTierSync();
  safeSessionSet(SS_KEY, _cached);
  applyTierAttributes(_cached);
  return _cached;
};

export const subscribePerformanceTierChanges = (
  listener: (detail: PerformanceTierChangeDetail) => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event): void => {
    const customEvent = event as CustomEvent<PerformanceTierChangeDetail>;
    if (customEvent.detail) {
      listener(customEvent.detail);
    }
  };

  window.addEventListener(PERFORMANCE_TIER_CHANGE_EVENT, handler as EventListener);
  return () => {
    window.removeEventListener(PERFORMANCE_TIER_CHANGE_EVENT, handler as EventListener);
  };
};

/* ────────────────────────────────────────────
   Monitoring FPS passif (optionnel, non-bloquant)
   ──────────────────────────────────────────── */

interface FpsMonitorOptions {
  sampleFrames?: number;
  fpsThreshold?: number;
  delayMs?: number;
  warmupFrames?: number;
}

export const startFpsMonitor = ({
  sampleFrames = 120,
  fpsThreshold = 30,
  delayMs = 7000,
  warmupFrames = 20,
}: FpsMonitorOptions = {}): void => {
  // Ne mesurer qu'une fois par session (flag stocké) — accès protégé
  if (safeSessionGet(SS_FPS_KEY)) return;
  if (_fpsRunning) return;
  // Déjà au tier minimum → dégradation impossible, inutile de mesurer
  if (getPerformanceTier() === 'low') return;

  const startRun = (): void => {
    _fpsRunning = true;
    let frameIndex = 0;
    let count = 0;
    let start = 0;

    const cleanup = (): void => {
      _fpsRunning = false;
    };

    const tick = (now: number): void => {
      // If page hidden, abort sampling
      if (document.hidden) {
        cleanup();
        return;
      }

      frameIndex++;

      // Warm-up frames — ignore first few frames to avoid measuring jitter
      if (frameIndex <= warmupFrames) {
        requestAnimationFrame(tick);
        return;
      }

      if (count === 0) start = now;
      count++;

      if (count >= sampleFrames) {
        const elapsed = now - start;
        const avgFps = (count / elapsed) * 1000;

        // Save a compact value for diagnostics (protected)
        safeSessionSet(SS_FPS_KEY, avgFps.toFixed(1));

        if (avgFps < fpsThreshold) {
          const current = getPerformanceTier();
          let degraded: PerformanceTier = 'low';
          if (current === 'high') degraded = 'mid';
          else if (current === 'mid') degraded = 'low';

          // Mettre à jour le cache et le sessionStorage (protégé)
          if (degraded !== current) {
            _cached = degraded;
            safeSessionSet(SS_KEY, degraded);
            applyTierAttributes(degraded);
            emitTierChange({
              previousTier: current,
              nextTier: degraded,
              reason: 'fps-monitor',
            });
          }
        }

        cleanup();
        return;
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  // Si l'onglet est masqué maintenant, attendre qu'il soit visible
  if (document.hidden) {
    const onVis = (): void => {
      if (!document.hidden) {
        document.removeEventListener('visibilitychange', onVis);
        setTimeout(startRun, delayMs);
      }
    };
    document.addEventListener('visibilitychange', onVis);
  } else {
    setTimeout(startRun, delayMs);
  }
};

/* ────────────────────────────────────────────
   Helpers pour lecture rapide
   ──────────────────────────────────────────── */

export const isLowTier = (): boolean => getPerformanceTier() === 'low';

export const isHighTier = (): boolean => getPerformanceTier() === 'high';

export const byTier = <T>(map: Record<PerformanceTier, T>): T => map[getPerformanceTier()];

/**
 * Returns true if the performance tier was already committed to sessionStorage
 * before this call (i.e. this is NOT the first detection this session).
 * Call this BEFORE getPerformanceTier() to test freshness.
 */
export const isTierStoredInSession = (): boolean => safeSessionGet(SS_KEY) !== null;

export interface PerformanceTierDiagnostics {
  tier: PerformanceTier;
  measuredFps: number | null;
  hardwareConcurrency: number;
  deviceMemoryGb: number | null;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean;
  isTierStoredInSession: boolean;
}

export const getPerformanceTierDiagnostics = (): PerformanceTierDiagnostics => {
  const rawFps = safeSessionGet(SS_FPS_KEY);
  const parsedFps = rawFps ? Number.parseFloat(rawFps) : Number.NaN;

  return {
    tier: getPerformanceTier(),
    measuredFps: Number.isFinite(parsedFps) ? parsedFps : null,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemoryGb: getDeviceMemoryGb(),
    isTouchDevice: isTouchDevice(),
    prefersReducedMotion:
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
    isTierStoredInSession: isTierStoredInSession(),
  };
};

if (typeof window !== 'undefined') {
  window.getPerformanceTierDiagnostics = getPerformanceTierDiagnostics;
}
