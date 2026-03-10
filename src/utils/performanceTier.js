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
 *
 * Critères — uniquement basés sur des APIs standardisées et fiables :
 *
 * 1. prefers-reduced-motion (W3C Media Queries Level 5)
 *    → Respecte les préférences du système d'exploitation.
 *      Forcé à 'low' pour garantir l'accessibilité.
 *
 * 2. navigator.hardwareConcurrency (HTML Living Standard)
 *    → Nombre de processeurs logiques disponibles.
 *      Standardisé, supporté depuis Chrome 37 / Firefox 48 / Safari 10.1.
 *      Seul signal hardware retenu — navigator.deviceMemory est délibérément
 *      imprécis (Chrome le bucketise à 0.25/0.5/1/2/4/8 et le plafonne à 8
 *      pour limiter le fingerprinting) et n'est pas disponible sur Firefox.
 *
 * Seuils hardwareConcurrency (desktop ET mobile) :
 *  - < 4 cœurs → 'low'  (mono/dual-core, machines très anciennes)
 *  - ≥ 4 cœurs → 'high' (quad-core et plus — desktop & mobile modernes)
 *    Le mobile n'est plus plafonné à 'mid' : les SoC modernes (Apple Silicon,
 *    Snapdragon) gèrent très bien les particules et effets WebGL.
 *    Le FPS monitor prendra le relais pour dégrader si nécessaire.
 */

const SS_KEY = 'perf-tier-v3'; // v3 : seuil abaissé à 4 cœurs, cap mobile supprimé
const SS_FPS_KEY = 'perf-fps-v3';

// Safe sessionStorage helpers — some environments (privacy extensions)
// may throw on access to storage. We silently ignore failures.
const safeSessionGet = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeSessionSet = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    // ignore
  }
};

/* ────────────────────────────────────────────
   Détection synchrone basée sur les hints hardware
   ──────────────────────────────────────────── */

/**
 * Évalue le tier de performance à partir des APIs navigateur disponibles.
 * Retourne 'high', 'mid' ou 'low'.
 */
const detectTierSync = () => {
  // 1. prefers-reduced-motion → forcer 'low' (accessibilité, W3C standard)
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
    return 'low';
  }

  // 2. hardwareConcurrency — seul signal hardware retenu
  // Retourne 0 ou undefined si non supporté → fallback grace: 'mid'
  const cores = navigator.hardwareConcurrency || 0;

  if (cores === 0) {
    // API non disponible (très rare) → prudence
    return 'mid';
  }

  // Moins de 4 cœurs logiques → machine clairement faible
  if (cores < 4) return 'low';

  // ≥ 4 cœurs : 'high' sur desktop ET mobile.
  // Les SoC mobiles modernes (Apple Silicon, Snapdragon) ont d'excellentes
  // performances single-thread et GPU. On laisse le FPS monitor dégrader
  // si le device chauffe ou lag réellement.
  return 'high';
};

/* ────────────────────────────────────────────
   Cache session + API publique
   ──────────────────────────────────────────── */

let _cached = null;
let _fpsRunning = false;

/**
 * Retourne le tier de performance courant (sync, pas de mesure).
 * Le résultat est mis en cache dans sessionStorage pour éviter
 * les recalculs à chaque navigation SPA.
 *
 * @returns {'high' | 'mid' | 'low'}
 */
export const getPerformanceTier = () => {
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

/**
 * Mesure le FPS réel sur les N premières frames.
 * Si le FPS moyen est inférieur à `threshold`, abaisse le tier :
 *   - 'high' → 'mid', 'mid' → 'low'
 *
 * Cette mesure ne s'exécute qu'UNE fois par session (flag sessionStorage).
 * Elle est différée pour ne pas interférer avec l'hydratation React.
 *
 * @param {object} [opts]
 * @param {number} [opts.sampleFrames=90]  — nombre de frames à échantillonner
 * @param {number} [opts.fpsThreshold=35]  — seuil en dessous duquel on abaisse
 * @param {number} [opts.delayMs=5000]     — délai avant de commencer la mesure
 *                                           (5 s pour laisser React s'hydrater
 *                                           et l'app SPA se stabiliser)
 */
export const startFpsMonitor = ({
  sampleFrames = 90,
  fpsThreshold = 35,
  delayMs = 5000,
  warmupFrames = 10,
} = {}) => {
  // Ne mesurer qu'une fois par session (flag stocké) — accès protégé
  if (safeSessionGet(SS_FPS_KEY)) return;
  if (_fpsRunning) return;

  const startRun = () => {
    _fpsRunning = true;
    let frameIndex = 0; // total frames seen (including warmup)
    let count = 0; // frames counted toward sampleFrames
    let start = 0;

    const cleanup = () => {
      _fpsRunning = false;
    };

    const tick = (now) => {
      // If page hidden, abort sampling — we'll try again next session/visibility
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
          let degraded = 'low';
          if (current === 'high') degraded = 'mid';
          else if (current === 'mid') degraded = 'low';

          // Mettre à jour le cache et le sessionStorage (protégé)
          _cached = degraded;
          safeSessionSet(SS_KEY, degraded);

          // Si le tier a été abaissé, afficher une notification persistante
          // pour informer l'utilisateur qu'une version dégradée du site est
          // activée afin d'améliorer la fluidité.
          try {
            if (degraded !== current && (degraded === 'mid' || degraded === 'low')) {
              if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                const msg =
                  'Performance réduite : une version allégée du site a été activée en raison des capacités de votre appareil. Certaines animations et effets ont été réduits pour améliorer la fluidité.';
                // duration = 0 -> persistent (user must dismiss)
                window.showToast(msg, { type: 'warning', duration: 0 });
              }
            }
          } catch (e) {
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
    const onVis = () => {
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

/** @returns {boolean} true si le tier est 'low' */
export const isLowTier = () => getPerformanceTier() === 'low';

/** @returns {boolean} true si le tier est 'high' */
export const isHighTier = () => getPerformanceTier() === 'high';

/**
 * Raccourci : retourne `v` selon le tier.
 * @template T
 * @param {{ high: T, mid: T, low: T }} map
 * @returns {T}
 */
export const byTier = (map) => map[getPerformanceTier()];
