/**
 * Performance Tier Detection
 *
 * Détermine le niveau de performance du client pour adapter la qualité
 * visuelle (particules, retina, effets).
 *
 * Tiers :
 *  - 'high' : machine puissante → qualité maximale, retina ON
 *  - 'mid'  : machine intermédiaire → qualité réduite, retina OFF
 *  - 'low'  : machine faible → qualité minimale, retina OFF
 *
 * Critères — uniquement basés sur des APIs standardisées et fiables :
 *
 *  1. prefers-reduced-motion (W3C Media Queries Level 5)
 *     → Respecte les préférences du système d'exploitation.
 *        Forcé à 'low' pour garantir l'accessibilité.
 *
 *  2. navigator.hardwareConcurrency (HTML Living Standard)
 *     → Nombre de processeurs logiques disponibles.
 *        Standardisé, supporté depuis Chrome 37 / Firefox 48 / Safari 10.1.
 *        Seul signal hardware retenu — navigator.deviceMemory est délibérément
 *        imprécis (Chrome le bucketise à 0.25/0.5/1/2/4/8 et le plafonne à 8
 *        pour limiter le fingerprinting) et n'est pas disponible sur Firefox.
 *
 * Seuils hardwareConcurrency :
 *  - < 4 cœurs  → 'low'  (mono/dual-core, machines très anciennes)
 *  - 4–7 cœurs  → 'mid'  (quad-core : ère 2015-2019 typique, mobile actuel)
 *  - ≥ 8 cœurs  → 'high' sur desktop, 'mid' sur mobile
 *                 (les CPU mobiles avec 8 cœurs restent limités thermiquement)
 */

const SS_KEY = 'perf-tier-v2'; // v2 : supprime deviceMemory, invalide l'ancien cache
const SS_FPS_KEY = 'perf-fps-v2';

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
  //    Retourne 0 ou undefined si non supporté → fallback grace: 'mid'
  const cores = navigator.hardwareConcurrency || 0;
  const isMobile = window.innerWidth <= 768;

  if (cores === 0) {
    // API non disponible (très rare) → prudence
    return isMobile ? 'low' : 'mid';
  }

  // Moins de 4 cœurs logiques → machine clairement faible
  if (cores < 4) return 'low';

  // 4–7 cœurs : mid sur desktop et mobile
  if (cores < 8) return 'mid';

  // ≥ 8 cœurs : high sur desktop, mid sur mobile
  // (les SoC mobiles avec 8 cœurs ont des contraintes thermiques importantes)
  return isMobile ? 'mid' : 'high';
};

/* ────────────────────────────────────────────
   Cache session + API publique
   ──────────────────────────────────────────── */

let _cached = null;

/**
 * Retourne le tier de performance courant (sync, pas de mesure).
 * Le résultat est mis en cache dans sessionStorage pour éviter
 * les recalculs à chaque navigation SPA.
 *
 * @returns {'high' | 'mid' | 'low'}
 */
export const getPerformanceTier = () => {
  if (_cached) return _cached;

  // Vérifier si déjà mesuré/abaissé dans cette session
  const stored = sessionStorage.getItem(SS_KEY);
  if (stored === 'high' || stored === 'mid' || stored === 'low') {
    _cached = stored;
    return _cached;
  }

  _cached = detectTierSync();
  sessionStorage.setItem(SS_KEY, _cached);
  return _cached;
};

/* ────────────────────────────────────────────
   Monitoring FPS passif (optionnel, non-bloquant)
   ──────────────────────────────────────────── */

/**
 * Mesure le FPS réel sur les N premières frames.
 * Si le FPS moyen est inférieur à `threshold`, abaisse le tier :
 *  - 'high' → 'mid',  'mid' → 'low'
 *
 * Cette mesure ne s'exécute qu'UNE fois par session (flag sessionStorage).
 * Elle est différée pour ne pas interférer avec l'hydratation React.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.sampleFrames=90] — nombre de frames à échantillonner
 * @param {number}  [opts.fpsThreshold=35] — seuil en dessous duquel on abaisse
 * @param {number}  [opts.delayMs=2000]    — délai avant de commencer la mesure
 */
export const startFpsMonitor = ({ sampleFrames = 90, fpsThreshold = 35, delayMs = 2000 } = {}) => {
  // Ne mesurer qu'une fois par session
  if (sessionStorage.getItem(SS_FPS_KEY)) return;

  const run = () => {
    let count = 0;
    let start = 0;

    const tick = (now) => {
      if (count === 0) {
        start = now;
      }
      count++;
      if (count >= sampleFrames) {
        const elapsed = now - start;
        const avgFps = (sampleFrames / elapsed) * 1000;
        sessionStorage.setItem(SS_FPS_KEY, avgFps.toFixed(1));

        if (avgFps < fpsThreshold) {
          const current = getPerformanceTier();
          let degraded;
          if (current === 'high') degraded = 'mid';
          else if (current === 'mid') degraded = 'low';
          else degraded = 'low';

          // Mettre à jour le cache et le sessionStorage
          _cached = degraded;
          sessionStorage.setItem(SS_KEY, degraded);
        }
        return; // Fin de la mesure
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  // Différer pour ne pas rivaliser avec l'hydratation initiale
  setTimeout(run, delayMs);
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
