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

import { useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext.jsx';

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
      <path className="sil-wing sil-wing--left" d="M24 16 L18 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path className="sil-wing sil-wing--right" d="M24 16 L30 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </g>
    {/* Oiseau gauche (apex à 11,13) */}
    <g className="sil-bird">
      <path className="sil-wing sil-wing--left" d="M11 13 L6 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path className="sil-wing sil-wing--right" d="M11 13 L16 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </g>
    {/* Oiseau droit (apex à 39,13) */}
    <g className="sil-bird">
      <path className="sil-wing sil-wing--left" d="M39 13 L34 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path className="sil-wing sil-wing--right" d="M39 13 L44 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </g>
    {/* Oiseau arrière-gauche (apex à 17,23) — plus petit */}
    <g className="sil-bird" opacity="0.7">
      <path className="sil-wing sil-wing--left" d="M17 23 L13 20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path className="sil-wing sil-wing--right" d="M17 23 L21 20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    </g>
    {/* Oiseau arrière-droit (apex à 47,19) — le plus loin */}
    <g className="sil-bird" opacity="0.6">
      <path className="sil-wing sil-wing--left" d="M47 19 L43 16" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path className="sil-wing sil-wing--right" d="M47 19 L51 16" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
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
      <line x1="0" y1="4" x2="100" y2="4" stroke="currentColor" strokeWidth="1" strokeDasharray="6 4 2 4" />
      <circle className="sil-data-node" cx="25" cy="4" r="1.5" fill="currentColor" />
      <circle className="sil-data-node" cx="72" cy="4" r="1" fill="currentColor" />
    </g>
    {/* Ligne de données 2 — plus lente, espacée */}
    <g className="sil-data-line sil-data-line--2">
      <line x1="10" y1="10" x2="90" y2="10" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 6 1 4" />
      <circle className="sil-data-node" cx="60" cy="10" r="1" fill="currentColor" />
      <circle className="sil-data-node" cx="35" cy="10" r="0.8" fill="currentColor" />
    </g>
    {/* Ligne de données 3 — rythme intermédiaire */}
    <g className="sil-data-line sil-data-line--3">
      <line x1="5" y1="16" x2="95" y2="16" stroke="currentColor" strokeWidth="0.8" strokeDasharray="8 3 2 5" />
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
      <path d="M5 18 L25 8 L45 18 L35 20 L15 20 Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" opacity="0.8" />
      <ellipse cx="25" cy="15" rx="4" ry="2" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
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

/* ─── Configuration par silhouette ─── */

/**
 * Chaque silhouette a une position verticale, une durée,
 * un delay et un type d'animation de dérive.
 */
const SILHOUETTE_CONFIGS = [
  { top: '18vh', duration: '55s', delay: '0s',  drift: 'drift-diagonal' },
  { top: '45vh', duration: '70s', delay: '12s', drift: 'drift-rtl-slow' },
  { top: '68vh', duration: '48s', delay: '25s', drift: 'drift-diagonal' },
];

/* Variantes ajustées pour le data-stream (hacker) — horizontal */
const HACKER_CONFIGS = [
  { top: '22vh', duration: '50s', delay: '0s',  drift: 'drift-ltr' },
  { top: '50vh', duration: '65s', delay: '15s', drift: 'drift-ltr' },
  { top: '72vh', duration: '42s', delay: '8s',  drift: 'drift-ltr' },
];

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
      default:
        return { ShapeComponent: BirdFlock, configs: SILHOUETTE_CONFIGS };
    }
  }, [mood]);

  // Commande console de test : window.testSilhouettes('default'|'hacker'|'vaporwave')
  useEffect(() => {
    window.testSilhouettes = (testMood) => {
      const validMood = ['default', 'hacker', 'vaporwave'].includes(testMood) ? testMood : mood;
      console.log(`Testing silhouettes with mood: ${validMood}`);
    };
    return () => {
      delete window.testSilhouettes;
    };
  }, [mood]);

  if (count === 0) return null;

  const silhouettes = [];
  for (let i = 0; i < count; i++) {
    const cfg = configs[i] || configs[0];
    silhouettes.push(
      <div
        key={`${mood}-sil-${i}`}
        className="ambient-silhouette"
        style={{
          top: cfg.top,
          left: 0,
          '--sil-opacity': mood === 'hacker' ? '0.18' : '0.30',
          animationName: cfg.drift,
          animationDuration: cfg.duration,
          animationDelay: cfg.delay,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationFillMode: 'both',
        }}
      >
        <ShapeComponent />
      </div>
    );
  }

  return createPortal(
    <>{silhouettes}</>,
    document.body
  );
};

export default DistantSilhouettes;
