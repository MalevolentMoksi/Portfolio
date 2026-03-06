/**
 * ObservationDrone — Drone d'observation flottant style « Ghost » (Destiny)
 * ou « Pod » (Nier: Automata).
 *
 * Un petit SVG géométrique octogonal avec un œil lumineux et un anneau orbital
 * qui dérive occasionnellement depuis la marge latérale de <main>, projette
 * un cône de scan translucide, clignote, puis se rétracte.
 *
 * Toujours actif — les couleurs s'adaptent automatiquement au mood via
 * `var(--color-primary)` / `currentColor` (zéro lecture JS des couleurs).
 *
 * Phase machine pilotée par des timers JS + transitions CSS (même pattern
 * qu'OccasionalCommuter). Aucun re-render React après le mount.
 *
 * Performance-gated : high/mid → actif, low → return null.
 * Garde mobile : skip si la marge latérale < 70 px.
 */

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getPerformanceTier } from '@/utils/performanceTier.js';

/* ═══════════════════════════════════════════
   Constantes
   ═══════════════════════════════════════════ */

/** Délai avant la première apparition (ms) */
const FIRST_DELAY_MS = 12_000;

/** Fourchette d'attente entre deux visites (ms) */
const MIN_GAP_MS = 50_000;
const MAX_GAP_MS = 120_000;

/** Marge latérale minimale requise (px) pour que le drone apparaisse */
const MIN_MARGIN_PX = 70;

/** Offset du drone par rapport au bord de <main> (px) */
const DRONE_OFFSET = 44;

/** Taille de la zone SVG */
const DRONE_SIZE = 48;

/* ═══════════════════════════════════════════
   SVG — Drone octogonal avec œil et anneau
   ═══════════════════════════════════════════ */

const DroneSVG = () => (
  <svg
    className="obs-drone-body"
    viewBox="0 0 48 48"
    width={DRONE_SIZE}
    height={DRONE_SIZE}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="obs-eye-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="60%" stopColor="currentColor" stopOpacity="0.6" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Octogone principal — corps métallique */}
    <polygon
      className="obs-drone-hull"
      points="18,4 30,4 40,14 40,34 30,44 18,44 8,34 8,14"
      fill="rgba(20,20,20,0.85)"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />

    {/* Détails intérieurs — panneaux */}
    <line x1="18" y1="4" x2="18" y2="44" stroke="currentColor" strokeWidth="0.25" opacity="0.3" />
    <line x1="30" y1="4" x2="30" y2="44" stroke="currentColor" strokeWidth="0.25" opacity="0.3" />
    <line x1="8" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="0.25" opacity="0.3" />

    {/* Anneau orbital — dashed, tourne lentement */}
    <circle
      className="obs-drone-ring"
      cx="24"
      cy="24"
      r="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.6"
      strokeDasharray="4 6"
      opacity="0.4"
    />

    {/* Œil central lumineux */}
    <circle
      className="obs-drone-eye"
      cx="24"
      cy="24"
      r="6"
      fill="url(#obs-eye-glow)"
    />
    <circle
      cx="24"
      cy="24"
      r="2.5"
      fill="currentColor"
      opacity="0.95"
    />

    {/* Ailettes — 3 nubs aux sommets alternés */}
    <polygon points="18,4 16,0 20,0" fill="currentColor" opacity="0.5" />
    <polygon points="40,14 44,12 44,16" fill="currentColor" opacity="0.5" />
    <polygon points="40,34 44,32 44,36" fill="currentColor" opacity="0.5" />
  </svg>
);

/* ─── Cône de scan (triangle pointant vers l'intérieur) ─── */
const ScanCone = () => (
  <svg
    className="obs-drone-cone"
    viewBox="0 0 80 48"
    width="80"
    height="48"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="obs-cone-grad" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </linearGradient>
    </defs>
    <polygon
      points="0,10 80,0 80,48 0,38"
      fill="url(#obs-cone-grad)"
    />
    {/* Lignes de scan horizontales */}
    <line x1="4" y1="18" x2="60" y2="14" stroke="currentColor" strokeWidth="0.4" opacity="0.15" />
    <line x1="4" y1="24" x2="70" y2="24" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    <line x1="4" y1="30" x2="60" y2="34" stroke="currentColor" strokeWidth="0.4" opacity="0.15" />
  </svg>
);

/* ═══════════════════════════════════════════
   Composant principal
   ═══════════════════════════════════════════ */

const ObservationDrone = () => {
  const tier = getPerformanceTier();
  const containerRef = useRef(null);
  const mainRectRef = useRef(null);
  const timerRef = useRef(null);
  const phaseTimerRef = useRef(null);
  const activeRef = useRef(true);

  /* ── Mise à jour du rect de <main> (pas à chaque frame) ── */
  const updateMainRect = useCallback(() => {
    const main = document.querySelector('main');
    if (main) {
      mainRectRef.current = main.getBoundingClientRect();
    }
  }, []);

  useEffect(() => {
    if (tier === 'low') return;
    activeRef.current = true;

    updateMainRect();

    // Écoute resize + scroll (passive) pour recalculer le rect
    const onResize = () => updateMainRect();
    const onScroll = () => updateMainRect();
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ── Phase machine ── */
    const runVisit = () => {
      if (!activeRef.current) return;

      updateMainRect();
      const rect = mainRectRef.current;
      const vw = window.innerWidth;
      if (!rect) { scheduleNext(); return; }

      // Garde mobile — marge trop petite
      const marginLeft = rect.left;
      const marginRight = vw - rect.right;
      if (marginLeft < MIN_MARGIN_PX && marginRight < MIN_MARGIN_PX) {
        scheduleNext();
        return;
      }

      const el = containerRef.current;
      if (!el) { scheduleNext(); return; }

      // Choisir le côté (préférer le plus large, aléatoire si les deux ok)
      let side;
      if (marginLeft < MIN_MARGIN_PX) side = 'right';
      else if (marginRight < MIN_MARGIN_PX) side = 'left';
      else side = Math.random() > 0.5 ? 'left' : 'right';

      // Position Y aléatoire (25–65% du viewport)
      const topY = window.scrollY + window.innerHeight * (0.25 + Math.random() * 0.4);

      // Positions X
      const offScreenX = side === 'right' ? vw + 80 : -80 - DRONE_SIZE;
      const visibleX = side === 'right'
        ? rect.right + DRONE_OFFSET
        : rect.left - DRONE_OFFSET - DRONE_SIZE;

      // Orientation du cône
      const coneEl = el.querySelector('.obs-drone-cone');
      if (coneEl) {
        coneEl.style.transform = side === 'right'
          ? 'scaleX(1)'       // cône pointe vers la droite
          : 'scaleX(-1)';     // cône pointe vers la gauche
        // Positionner le cône à la droite ou gauche du drone
        coneEl.style.left = side === 'right' ? `${DRONE_SIZE - 4}px` : 'auto';
        coneEl.style.right = side === 'left' ? `${DRONE_SIZE - 4}px` : 'auto';
      }

      // Phase 1 : position initiale hors-écran
      el.style.top = `${topY}px`;
      el.style.left = `${offScreenX}px`;
      el.style.opacity = '0';
      el.classList.add('obs-drone--active');

      // Phase 2 : émergence (rAF pour laisser le navigateur appliquer la position initiale)
      requestAnimationFrame(() => {
        if (!activeRef.current) return;
        el.style.opacity = '1';
        el.style.left = `${visibleX}px`;

        // Phase 3 : flottement + scan après l'arrivée (1.8s transition)
        phaseTimerRef.current = setTimeout(() => {
          if (!activeRef.current) return;
          el.classList.add('obs-drone--scanning');

          // Phase 4 : fin de scan → retraite
          const scanDuration = 3000 + Math.random() * 2000; // 3–5s
          phaseTimerRef.current = setTimeout(() => {
            if (!activeRef.current) return;
            el.classList.remove('obs-drone--scanning');

            // Phase 5 : retraite hors-écran
            requestAnimationFrame(() => {
              if (!activeRef.current) return;
              el.style.left = `${offScreenX}px`;
              el.style.opacity = '0';

              // Nettoyage post-retraite
              phaseTimerRef.current = setTimeout(() => {
                if (!activeRef.current) return;
                el.classList.remove('obs-drone--active');
                scheduleNext();
              }, 1400);
            });
          }, scanDuration);
        }, 1900);
      });
    };

    const scheduleNext = () => {
      if (!activeRef.current) return;
      const gap = MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
      timerRef.current = setTimeout(runVisit, gap);
    };

    // Première visite après délai initial
    timerRef.current = setTimeout(runVisit, FIRST_DELAY_MS);

    return () => {
      activeRef.current = false;
      clearTimeout(timerRef.current);
      clearTimeout(phaseTimerRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [tier, updateMainRect]);

  if (tier === 'low') return null;

  return createPortal(
    <div
      ref={containerRef}
      className="obs-drone"
      aria-hidden="true"
    >
      <DroneSVG />
      <ScanCone />
    </div>,
    document.getElementById('ambient-root') || document.body,
  );
};

export default ObservationDrone;
