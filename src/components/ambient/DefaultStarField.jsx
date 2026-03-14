/**
 * DefaultStarField — Charte céleste animée pour le mood Default.
 *
 * Génère N clusters d'étoiles positionnés aléatoirement (graine fixe → stable
 * entre rendus). Chaque cluster contient 3-5 étoiles et dérive très lentement
 * (60-120 s). Les étoiles du même cluster sont reliées par de fines lignes
 * SVG (constellation chart) et scintillent indépendamment.
 *
 * Rendu via createPortal dans #ambient-root, cohérent avec les autres couches.
 * Strict no-op hors du mood 'default'.
 */

import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext.jsx';
import { getPerformanceTier } from '@/utils/performanceTier.js';

/* ── Configuration ──────────────────────────────────────────── */

const CLUSTER_COUNT = { high: 8, mid: 5, low: 3 };

/* LCG 32-bit — reproductible entre rendus (graine fixe) */
const makeRng = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/* Génère les données d'un cluster en utilisant le RNG partagé */
const buildCluster = (rng, index) => {
  const cx = rng() * 86 + 6; // centre x en %  (6 – 92)
  const cy = rng() * 78 + 6; // centre y en %  (6 – 84)
  const starCount = Math.floor(rng() * 3) + 3; // 3-5 étoiles
  const driftDuration = rng() * 60 + 60; // 60-120 s
  const driftDelay = -(rng() * 18); // décalage négatif (déjà en mouvement)

  const stars = Array.from({ length: starCount }, (_, i) => {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * 44 + 6; // 6-50 px depuis le centre du cluster
    return {
      key: `st-${index}-${i}`,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      r: rng() * 1.1 + 0.7, // rayon 0.7-1.8 px
      bright: rng() > 0.68,
      twinkleDur: (rng() * 2.5 + 1.8).toFixed(2), // 1.8-4.3 s
      twinkleDelay: -(rng() * 4).toFixed(2),
    };
  });

  return { key: `cluster-${index}`, cx, cy, stars, driftDuration, driftDelay };
};

/* ── Composant ──────────────────────────────────────────────── */

const DefaultStarField = () => {
  const { mood } = useMood();
  const tier = getPerformanceTier();

  if (mood !== 'default') return null;

  const count = CLUSTER_COUNT[tier] ?? 3;

  const clusters = useMemo(() => {
    const rng = makeRng(0xc0ffee42);
    return Array.from({ length: count }, (_, i) => buildCluster(rng, i));
  }, [count]);

  return createPortal(
    <div className="default-starfield" aria-hidden="true">
      {clusters.map((cluster) => (
        <div
          key={cluster.key}
          className="default-star-cluster"
          style={{
            left: `${cluster.cx.toFixed(2)}%`,
            top: `${cluster.cy.toFixed(2)}%`,
            '--drift-dur': `${cluster.driftDuration.toFixed(1)}s`,
            '--drift-delay': `${cluster.driftDelay.toFixed(2)}s`,
          }}
        >
          {/* SVG unique par cluster : overflow visible, ancré en (0,0) */}
          <svg
            className="default-cluster-svg"
            width="0"
            height="0"
            style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}
          >
            {/* Lignes de constellation (tracées avant les étoiles) */}
            {cluster.stars.slice(0, -1).map((star, i) => {
              const next = cluster.stars[i + 1];
              return (
                <line
                  key={`line-${cluster.key}-${i}`}
                  className="default-constellation-line"
                  x1={star.x.toFixed(1)}
                  y1={star.y.toFixed(1)}
                  x2={next.x.toFixed(1)}
                  y2={next.y.toFixed(1)}
                />
              );
            })}

            {/* Étoiles */}
            {cluster.stars.map((star) => (
              <circle
                key={star.key}
                className={`default-star${star.bright ? ' default-star--bright' : ''}`}
                cx={star.x.toFixed(1)}
                cy={star.y.toFixed(1)}
                r={star.r.toFixed(2)}
                style={{
                  '--twinkle-dur': `${star.twinkleDur}s`,
                  '--twinkle-delay': `${star.twinkleDelay}s`,
                }}
              />
            ))}
          </svg>
        </div>
      ))}
    </div>,
    document.getElementById('ambient-root') || document.body
  );
};

export default DefaultStarField;
