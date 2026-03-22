/**
 * EuropaFrost — Effets de givre décoratifs pour Europa.
 *
 * Craquelures de givre aux 4 coins du viewport (branches SVG avec
 * draw-in via stroke-dashoffset).
 *
 * L'accumulation de neige sur main/footer est gérée en CSS pur
 * (_ambient.css) via des pseudo-éléments, pour coller aux éléments
 * du DOM plutôt qu'au viewport.
 *
 * Performance-gated : high → 4 coins, mid → 2 coins, low → 0
 */

import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

/* ─── Générateur de branches ─── */
const branch = (ox: any, oy: any, angle: any, len: any) => {
  const rad = (angle * Math.PI) / 180;
  const ex = ox + Math.cos(rad) * len;
  const ey = oy + Math.sin(rad) * len;
  return { x1: ox, y1: oy, x2: ex, y2: ey, len };
};

const buildCornerBranches = (cx: any, cy: any, baseAngle: any, count: any, spread: any) => {
  const branches = [];
  for (let i = 0; i < count; i++) {
    // Add random jitter to main angle for more natural variation
    const angleJitter = (Math.random() - 0.5) * 15;
    const a = baseAngle - spread / 2 + (spread / (count - 1)) * i + angleJitter;
    const len = 5 + Math.random() * 22; // 5–27 unités du viewBox, wider range
    branches.push(branch(cx, cy, a, len));
    // Sous-branches with more randomness
    if (Math.random() > 0.35) {
      const mid = 0.35 + Math.random() * 0.4;
      const rad = (a * Math.PI) / 180;
      const mx = cx + Math.cos(rad) * len * mid;
      const my = cy + Math.sin(rad) * len * mid;
      // More varied sub-branch angles
      const subAngleVariance = 18 + Math.random() * 28; // 18–46 degrees
      const subA = a + (Math.random() > 0.5 ? subAngleVariance : -subAngleVariance);
      branches.push(branch(mx, my, subA, len * (0.3 + Math.random() * 0.3)));
    }
    // Occasional tertiary branches for extra complexity
    if (Math.random() > 0.75) {
      const mid = 0.5 + Math.random() * 0.35;
      const rad = (a * Math.PI) / 180;
      const mx = cx + Math.cos(rad) * len * mid;
      const my = cy + Math.sin(rad) * len * mid;
      const tertiaryAngle = (Math.random() - 0.5) * 60;
      branches.push(branch(mx, my, a + tertiaryAngle, len * (0.2 + Math.random() * 0.25)));
    }
  }
  return branches;
};

/* Coins : [cx, cy, baseAngle, spread] */
const CORNERS = [
  { cx: 0, cy: 0, base: 45, spread: 70 }, // haut-gauche → vers bas-droite
  { cx: 100, cy: 0, base: 135, spread: 70 }, // haut-droit → vers bas-gauche
  { cx: 0, cy: 100, base: 315, spread: 70 }, // bas-gauche → vers haut-droite
  { cx: 100, cy: 100, base: 225, spread: 70 }, // bas-droit → vers haut-gauche
];

const EuropaFrost = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();

  const elements = useMemo(() => {
    if (mood !== 'europa') return null;

    if (tier === 'low') return null;

    const cornersToRender = tier === 'high' ? CORNERS : [CORNERS[0], CORNERS[3]]; // mid = 2 coins
    const cornerEls = [];
    let idx = 0;

    for (const { cx, cy, base, spread } of cornersToRender) {
      const branches = buildCornerBranches(cx, cy, base, 7, spread);
      for (const b of branches) {
        const dashLen = b.len;
        cornerEls.push(
          <line
            key={`crack-${idx}`}
            className="europa-frost-crack"
            x1={`${b.x1}%`}
            y1={`${b.y1}%`}
            x2={`${b.x2}%`}
            y2={`${b.y2}%`}
            stroke="rgba(0, 229, 255, 0.09)"
            strokeWidth="0.12"
            strokeLinecap="round"
            style={{
              strokeDasharray: dashLen,
              strokeDashoffset: dashLen,
              animationDelay: `${idx * 120}ms`,
            }}
          />
        );
        idx++;
      }
    }

    return cornerEls;
  }, [mood, tier]);

  if (!elements) return null;

  return createPortal(
    <svg
      className="europa-frost-overlay"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {elements}
    </svg>,
    document.getElementById('ambient-root') || document.body
  );
};

export default EuropaFrost;
