/**
 * EuropaIcicles — Barre de stalactites de glace sous le header pour Europa.
 *
 * SVG fixe plein-écran : une rangée de stalactites semi-transparentes pendent
 * du haut, avec animation de cristallisation décalée et gouttes périodiques.
 *
 * Performance-gated : high → 32, mid → 16, low → 0
 */

import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

const ICICLE_COUNTS = { high: 32, mid: 16, low: 0 };

/* Couleurs glaciales semi-transparentes */
const ICE_FILLS = [
  'rgba(0, 229, 255, 0.12)',
  'rgba(173, 216, 230, 0.10)',
  'rgba(125, 211, 252, 0.14)',
  'rgba(224, 242, 254, 0.09)',
  'rgba(0, 229, 255, 0.08)',
];

const EuropaIcicles = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();

  const icicles = useMemo(() => {
    if (mood !== 'europa') return null;

    const count = ICICLE_COUNTS[tier] ?? 16;
    if (count === 0) return null;

    const items = [];
    for (let i = 0; i < count; i++) {
      const w = 4 + Math.random() * 10; // 4–14 px largeur
      const h = 20 + Math.random() * 45; // 20–65 px hauteur
      const x = (i / count) * 100 + Math.random() * (100 / count) * 0.6; // répartition uniforme + jitter
      const fill = ICE_FILLS[Math.floor(Math.random() * ICE_FILLS.length)];
      const growDelay = i * 40; // cristallisation décalée
      const dripDelay = 8 + Math.random() * 17; // 8–25 s entre gouttes
      const dripDur = 1.2 + Math.random() * 0.6; // durée de la goutte

      items.push(
        <g key={i} style={{ '--icicle-grow-delay': growDelay + 'ms' }}>
          {/* Stalactite principale */}
          <polygon
            className="europa-icicle"
            points={`${x},0 ${x - w / 2},0 ${x},${h} ${x + w / 2},0`}
            fill={fill}
            stroke="rgba(0, 229, 255, 0.18)"
            strokeWidth="0.3"
            style={{
              animationDelay: growDelay + 'ms',
            }}
          />
          {/* Goutte périodique */}
          <circle
            className="europa-icicle-drip"
            cx={x}
            cy={h}
            r="1.2"
            fill="rgba(0, 229, 255, 0.35)"
            style={{
              animationDelay: dripDelay + 's',
              animationDuration: dripDur + 's',
            }}
          />
        </g>
      );
    }
    return items;
  }, [mood, tier]);

  if (!icicles) return null;

  return createPortal(
    <svg
      className="europa-icicles-bar"
      viewBox="0 0 100 70"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {icicles}
    </svg>,
    document.getElementById('ambient-root') || document.body
  );
};

export default EuropaIcicles;
