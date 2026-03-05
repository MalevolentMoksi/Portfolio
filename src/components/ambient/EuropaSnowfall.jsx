/**
 * EuropaSnowfall — Couche de flocons CSS pour le mood Europa.
 *
 * Flocons de neige lents, doux et désynchronisés qui dérivent vers le bas
 * avec un léger balancement horizontal. Simule un blizzard en profondeur
 * (les particules.js gèrent les traits horizontaux rapides au premier plan).
 *
 * Performance-gated : high → 20 flocons, mid → 10, low → 0 (return null)
 * Respecte prefers-reduced-motion via CSS (display: none dans _ambient.css)
 */

import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext.jsx';
import { getPerformanceTier } from '@/utils/performanceTier.js';

const FLAKE_COUNTS = { high: 20, mid: 10, low: 0 };

const EuropaSnowfall = () => {
  const { mood } = useMood();

  const flakes = useMemo(() => {
    if (mood !== 'europa') return null;

    const tier = getPerformanceTier();
    const count = FLAKE_COUNTS[tier] ?? 10;
    if (count === 0) return null;

    const items = [];
    for (let i = 0; i < count; i++) {
      const size = 3 + Math.random() * 5;            // 3–8 px
      const opacity = 0.15 + Math.random() * 0.35;   // 0.15–0.50
      const fallDuration = 8 + Math.random() * 12;    // 8–20 s
      const wobbleDuration = 3 + Math.random() * 4;   // 3–7 s
      const delay = -(Math.random() * fallDuration);   // départ aléatoire dans le cycle
      const left = Math.random() * 100;               // 0–100 vw

      items.push(
        <div
          key={i}
          className="europa-snowflake"
          style={{
            width: size + 'px',
            height: size + 'px',
            left: left + 'vw',
            top: '-10px',
            '--flake-opacity': opacity,
            animationDuration: `${fallDuration}s, ${wobbleDuration}s`,
            animationDelay: `${delay}s, ${delay * 0.7}s`,
          }}
        />
      );
    }
    return items;
  }, [mood]);

  if (!flakes) return null;

  return createPortal(
    <>{flakes}</>,
    document.getElementById('ambient-root') || document.body
  );
};

export default EuropaSnowfall;
