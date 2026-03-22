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
  // 1. prefers-reduced-motion → forcer 'low' (accessibilité, W3C standard)
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
    return 'low';
  }

  // 2. hardwareConcurrency — seul signal hardware retenu
  const cores = navigator.hardwareConcurrency || 0;

  if (cores === 0) {
    // API non disponible (très rare) → prudence
    return 'mid';
  }

  // Moins de 4 cœurs logiques → machine clairement faible
  if (cores < 4) return 'low';

  // Sur mobile/tactile, même avec ≥ 4 cœurs, on plafonne à 'mid' :
  // les téléphones haut de gamme n'ont pas la GPU/batterie d'un desktop
  // et souffriraient avec les particules + effets haute qualité.
  if (isTouchDevice()) return 'mid';

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
  if (_cached) return _cached;

  // Vérifier si déjà mesuré/abaissé dans cette session (protéger l'accès)
  const stored = safeSessionGet(SS_KEY);
  if (stored === 'high' || stored === 'mid' || stored === 'low') {
    _cached = stored;
    return _cached;
  }

  _cached = detectTierSync();
  safeSessionSet(SS_KEY, _cached);
  return _cached;
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
  sampleFrames = 90,
  fpsThreshold = 35,
  delayMs = 5000,
  warmupFrames = 10,
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
          _cached = degraded;
          safeSessionSet(SS_KEY, degraded);

          // Notification si dégradation
          try {
            if (degraded !== current && (degraded === 'mid' || degraded === 'low')) {
              if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                const msg =
                  'Performance réduite : une version allégée du site a été activée en raison des capacités de votre appareil. Certaines animations et effets ont été réduits pour améliorer la fluidité.';
                window.showToast(msg, { type: 'warning', duration: 0 });
              }
            }
          } catch {
            // ignore errors when showing toast
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
