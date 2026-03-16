/**
 * DistantSilhouettes — Couche de profondeur : silhouettes lointaines
 * qui dérivent lentement derrière le contenu, devant le fond.
 *
 * Les formes changent selon le mood :
 *  - default    → nuées d'oiseaux en V (naturel, contemplatif)
 *  - hacker     → flux de données horizontaux (terminal, digital)
 *  - vaporwave  → petits vaisseaux / drones dérivants (sci-fi, rêveur)
 *
 * Quantité adaptée au tier de performance :
 *  - high → 3 silhouettes
 *  - mid  → 1 silhouette
 *  - low  → aucune (composant retourne null)
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';

/* ─── SVG Shape Banks ─── */

/**
 * Nuée d'oiseaux (mood: default) — 5 oiseaux avec vrai battement d'ailes.
 * Chaque oiseau est un <g> avec deux ailes (gauche/droite) qui pivotent
 * en sens opposé autour du point central (le corps), donnant un vrai
 * mouvement de battement plutôt qu'un simple scaleY.
 */
const BirdFlock = ({ size = 100 }) => (
  <svg
    width={size}
    height={size * 0.6}
    viewBox="0 0 60 36"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Oiseau central (apex à 24,16) */}
    <g className="sil-bird">
      <path
        className="sil-wing sil-wing--left"
        d="M24 16 L18 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        className="sil-wing sil-wing--right"
        d="M24 16 L30 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </g>
    {/* Oiseau gauche (apex à 11,13) */}
    <g className="sil-bird">
      <path
        className="sil-wing sil-wing--left"
        d="M11 13 L6 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        className="sil-wing sil-wing--right"
        d="M11 13 L16 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
    {/* Oiseau droit (apex à 39,13) */}
    <g className="sil-bird">
      <path
        className="sil-wing sil-wing--left"
        d="M39 13 L34 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        className="sil-wing sil-wing--right"
        d="M39 13 L44 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
    {/* Oiseau arrière-gauche (apex à 17,23) — plus petit */}
    <g className="sil-bird" opacity="0.7">
      <path
        className="sil-wing sil-wing--left"
        d="M17 23 L13 20"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        className="sil-wing sil-wing--right"
        d="M17 23 L21 20"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </g>
    {/* Oiseau arrière-droit (apex à 47,19) — le plus loin */}
    <g className="sil-bird" opacity="0.6">
      <path
        className="sil-wing sil-wing--left"
        d="M47 19 L43 16"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        className="sil-wing sil-wing--right"
        d="M47 19 L51 16"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

/** Flux de données (mood: hacker) — lignes glitchées avec noeuds pulsants */
const DataStream = ({ size = 100 }) => (
  <svg
    width={size}
    height={size * 0.2}
    viewBox="0 0 100 20"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Ligne de données 1 — rapide, dashes serrés */}
    <g className="sil-data-line sil-data-line--1">
      <line
        x1="0"
        y1="4"
        x2="100"
        y2="4"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="6 4 2 4"
      />
      <circle className="sil-data-node" cx="25" cy="4" r="1.5" fill="currentColor" />
      <circle className="sil-data-node" cx="72" cy="4" r="1" fill="currentColor" />
    </g>
    {/* Ligne de données 2 — plus lente, espacée */}
    <g className="sil-data-line sil-data-line--2">
      <line
        x1="10"
        y1="10"
        x2="90"
        y2="10"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="3 6 1 4"
      />
      <circle className="sil-data-node" cx="60" cy="10" r="1" fill="currentColor" />
      <circle className="sil-data-node" cx="35" cy="10" r="0.8" fill="currentColor" />
    </g>
    {/* Ligne de données 3 — rythme intermédiaire */}
    <g className="sil-data-line sil-data-line--3">
      <line
        x1="5"
        y1="16"
        x2="95"
        y2="16"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="8 3 2 5"
      />
      <circle className="sil-data-node" cx="80" cy="16" r="1.2" fill="currentColor" />
      <circle className="sil-data-node" cx="42" cy="16" r="0.9" fill="currentColor" />
    </g>
  </svg>
);

/** Vaisseau / drone (mood: vaporwave) — hover indépendant + réacteurs pulsants */
const DriftingShip = ({ size = 50 }) => (
  <svg
    width={size}
    height={size * 0.75}
    viewBox="0 0 50 32"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Corps + cockpit — hover oscillant */}
    <g className="sil-ship-body">
      <path
        d="M5 18 L25 8 L45 18 L35 20 L15 20 Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <ellipse
        cx="25"
        cy="15"
        rx="4"
        ry="2"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.6"
      />
    </g>
    {/* Réacteur gauche — pulse indépendant */}
    <g className="sil-ship-reactor sil-ship-reactor--left">
      <line x1="14" y1="20" x2="12" y2="27" stroke="currentColor" strokeWidth="0.8" />
      <line x1="16" y1="20" x2="14" y2="26" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
    </g>
    {/* Réacteur droit — pulse décalé */}
    <g className="sil-ship-reactor sil-ship-reactor--right">
      <line x1="36" y1="20" x2="38" y2="27" stroke="currentColor" strokeWidth="0.8" />
      <line x1="34" y1="20" x2="36" y2="26" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
    </g>
  </svg>
);

/** Cristal de glace (mood: europa) — formation géométrique givrée avec reflets */
const IceShard = ({ size = 80 }) => (
  <svg
    width={size}
    height={size * 1.2}
    viewBox="0 0 40 48"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cristal principal — forme hexagonale allongée */}
    <g className="sil-ice-facet">
      <polygon
        points="20,2 32,14 32,34 20,46 8,34 8,14"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.7"
      />
    </g>
    {/* Facettes internes — reflets géométriques */}
    <g className="sil-ice-facet sil-ice-facet--inner">
      <line x1="20" y1="2" x2="20" y2="46" stroke="currentColor" strokeWidth="0.4" opacity="0.25" />
      <line x1="8" y1="14" x2="32" y2="34" stroke="currentColor" strokeWidth="0.3" opacity="0.2" />
      <line x1="32" y1="14" x2="8" y2="34" stroke="currentColor" strokeWidth="0.3" opacity="0.2" />
    </g>
    {/* Petit éclat satellite */}
    <polygon
      className="sil-ice-facet"
      points="35,8 39,14 35,20 31,14"
      stroke="currentColor"
      strokeWidth="0.5"
      fill="none"
      opacity="0.4"
    />
    {/* Micro-cristal */}
    <polygon
      className="sil-ice-facet sil-ice-facet--inner"
      points="5,36 2,42 8,42"
      stroke="currentColor"
      strokeWidth="0.4"
      fill="none"
      opacity="0.3"
    />
  </svg>
);

/** Engrenage mécanique (mood: industrial) — cog avec dents visibles */
const GearMachine = ({ size = 70 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Grand engrenage — rotation lente */}
    <g className="sil-gear">
      <circle
        cx="24"
        cy="24"
        r="14"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />
      <circle
        cx="24"
        cy="24"
        r="5"
        stroke="currentColor"
        strokeWidth="0.6"
        fill="none"
        opacity="0.4"
      />
      {/* Dents (8 dents réparties sur 360°) */}
      <rect
        x="22"
        y="6"
        width="4"
        height="5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.5"
      />
      <rect
        x="22"
        y="37"
        width="4"
        height="5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.5"
      />
      <rect
        x="6"
        y="22"
        width="5"
        height="4"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.5"
      />
      <rect
        x="37"
        y="22"
        width="5"
        height="4"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.5"
      />
      <rect
        x="10"
        y="10"
        width="4"
        height="4"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
        transform="rotate(45 12 12)"
      />
      <rect
        x="34"
        y="10"
        width="4"
        height="4"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
        transform="rotate(45 36 12)"
      />
      <rect
        x="10"
        y="34"
        width="4"
        height="4"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
        transform="rotate(45 12 36)"
      />
      <rect
        x="34"
        y="34"
        width="4"
        height="4"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
        transform="rotate(45 36 36)"
      />
    </g>
    {/* Petit engrenage — rotation inverse */}
    <g className="sil-gear sil-gear--reverse" style={{ transformOrigin: '40px 12px' }}>
      <circle
        cx="40"
        cy="12"
        r="6"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.35"
      />
      <circle
        cx="40"
        cy="12"
        r="2"
        stroke="currentColor"
        strokeWidth="0.4"
        fill="none"
        opacity="0.25"
      />
      <rect
        x="39"
        y="4"
        width="2"
        height="3"
        rx="0.3"
        stroke="currentColor"
        strokeWidth="0.4"
        fill="none"
        opacity="0.3"
      />
      <rect
        x="39"
        y="17"
        width="2"
        height="3"
        rx="0.3"
        stroke="currentColor"
        strokeWidth="0.4"
        fill="none"
        opacity="0.3"
      />
      <rect
        x="32"
        y="11"
        width="3"
        height="2"
        rx="0.3"
        stroke="currentColor"
        strokeWidth="0.4"
        fill="none"
        opacity="0.3"
      />
    </g>
  </svg>
);

/* ─── Configuration par silhouette ─── */

/**
 * Positions verticales exprimées en fraction (0–1) de la hauteur
 * totale du document — les silhouettes se répartissent sur toute la page
 * au lieu d'être collées au viewport.
 */
const SILHOUETTE_CONFIGS = [
  { topFrac: 0.15, duration: '55s', delay: '0s', drift: 'drift-diagonal' },
  { topFrac: 0.45, duration: '70s', delay: '12s', drift: 'drift-rtl-slow' },
  { topFrac: 0.72, duration: '48s', delay: '25s', drift: 'drift-diagonal' },
];

/* Variantes ajustées pour le data-stream (hacker) — horizontal */
const HACKER_CONFIGS = [
  { topFrac: 0.18, duration: '50s', delay: '0s', drift: 'drift-ltr' },
  { topFrac: 0.5, duration: '65s', delay: '15s', drift: 'drift-ltr' },
  { topFrac: 0.75, duration: '42s', delay: '8s', drift: 'drift-ltr' },
];

/* Europa — cristaux dérivant en diagonale, lents et majestueux */
const EUROPA_CONFIGS = [
  { topFrac: 0.12, duration: '65s', delay: '0s', drift: 'drift-diagonal' },
  { topFrac: 0.4, duration: '80s', delay: '10s', drift: 'drift-rtl-slow' },
  { topFrac: 0.68, duration: '55s', delay: '22s', drift: 'drift-diagonal' },
];

/* Industrial — engrenages montant lentement (chaleur ascendante) */
const INDUSTRIAL_CONFIGS = [
  { topFrac: 0.2, duration: '60s', delay: '0s', drift: 'drift-upward' },
  { topFrac: 0.5, duration: '75s', delay: '14s', drift: 'drift-upward' },
  { topFrac: 0.78, duration: '50s', delay: '6s', drift: 'drift-upward' },
];

const getInitialTransform = (drift: string) => {
  switch (drift) {
    case 'drift-ltr':
      return 'translateX(-100px)';
    case 'drift-upward':
      return 'translateX(-5%) translateY(0)';
    case 'drift-rtl-slow':
      return 'translate(calc(100vw + 80px), 0)';
    case 'drift-diagonal':
    default:
      return 'translate(calc(100vw + 60px), -60px)';
  }
};

/* ─── Composant ─── */

const DistantSilhouettes = () => {
  const { mood } = useMood();

  const count = 3;

  // Sélection du shape et de la config selon le mood
  const { ShapeComponent, configs } = useMemo(() => {
    switch (mood) {
      case 'hacker':
        return { ShapeComponent: DataStream, configs: HACKER_CONFIGS };
      case 'vaporwave':
        return { ShapeComponent: DriftingShip, configs: SILHOUETTE_CONFIGS };
      case 'europa':
        return { ShapeComponent: IceShard, configs: EUROPA_CONFIGS };
      case 'industrial':
        return { ShapeComponent: GearMachine, configs: INDUSTRIAL_CONFIGS };
      default:
        return { ShapeComponent: BirdFlock, configs: SILHOUETTE_CONFIGS };
    }
  }, [mood]);

  // ── Hauteur du document (pour convertir les fractions en px) ──
  // Lire la hauteur depuis #root (contenu React) et non body,
  // pour éviter une boucle : les silhouettes (portaled dans body)
  // gonflaient body.scrollHeight → ResizeObserver → repositionnement → etc.
  const getDocHeight = useCallback(() => {
    const root = document.getElementById('root');
    return Math.max(root?.scrollHeight ?? 0, window.innerHeight);
  }, []);

  const [docHeight, setDocHeight] = useState(getDocHeight);

  useEffect(() => {
    // Recalculer quand le contenu React se redimensionne
    const root = document.getElementById('root');
    const handleResize = () => setDocHeight(getDocHeight());
    handleResize(); // sync immédiat au montage / changement de mood

    if (root && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(handleResize);
      ro.observe(root);
      return () => ro.disconnect();
    }
    // Fallback pour les navigateurs sans ResizeObserver
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getDocHeight]);

  // Commande console de test : window.testSilhouettes('default'|'hacker'|'vaporwave')
  useEffect(() => {
    window.testSilhouettes = (testMood: any) => {
      const validMood = ['default', 'hacker', 'vaporwave', 'europa', 'industrial'].includes(
        testMood
      )
        ? testMood
        : mood;
      console.log(`Testing silhouettes with mood: ${validMood}`);
    };
    return () => {
      delete window.testSilhouettes;
    };
  }, [mood]);

  const silhouettes = [];
  for (let i = 0; i < count; i++) {
    const cfg = configs[i] || configs[0];
    silhouettes.push(
      <div
        key={`${mood}-sil-${i}`}
        className="ambient-silhouette"
        style={{
          top: Math.round(cfg.topFrac * docHeight) + 'px',
          left: 0,
          opacity: 0,
          transform: getInitialTransform(cfg.drift),
          '--sil-opacity': mood === 'hacker' ? '0.18' : mood === 'europa' ? '0.25' : '0.30',
          animationName: cfg.drift,
          animationDuration: cfg.duration,
          animationDelay: cfg.delay,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          // Keep pre-delay keyframe, but avoid sticky "last frame" when animation is interrupted.
          animationFillMode: 'backwards',
        }}
      >
        <ShapeComponent />
      </div>
    );
  }

  return createPortal(<>{silhouettes}</>, document.getElementById('ambient-root') || document.body);
};

export default DistantSilhouettes;
