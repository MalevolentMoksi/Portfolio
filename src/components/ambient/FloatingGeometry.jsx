import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext.jsx';
import { getPerformanceTier } from '@/utils/performanceTier.js';

const SHAPE_TYPES = ['orb', 'diamond', 'triangle', 'ring', 'bar'];
const SHAPE_COUNT = { high: 5, mid: 3, low: 2 };

const randomInRange = (min, max) => min + Math.random() * (max - min);

const FloatingGeometry = () => {
  const { mood } = useMood();
  const tier = getPerformanceTier();

  if (mood !== 'default') return null;

  const count = SHAPE_COUNT[tier] ?? 2;

  const shapes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        key: `geo-${i}`,
        type: SHAPE_TYPES[i % SHAPE_TYPES.length],
        top: randomInRange(12, 82),
        left: randomInRange(6, 92),
        size: randomInRange(34, 86),
        drift: randomInRange(18, 34),
        rotate: randomInRange(14, 28),
        delay: randomInRange(-10, 0),
        opacity: randomInRange(0.2, 0.44),
      })),
    [count],
  );

  return createPortal(
    <div className={`default-floating-geometry default-floating-geometry--${tier}`} aria-hidden="true">
      {shapes.map((shape) => (
        <span
          key={shape.key}
          className={`default-floating-shape default-floating-shape--${shape.type}`}
          style={{
            top: `${shape.top.toFixed(2)}%`,
            left: `${shape.left.toFixed(2)}%`,
            width: `${shape.size.toFixed(1)}px`,
            height: `${shape.size.toFixed(1)}px`,
            opacity: shape.opacity,
            '--float-drift': `${shape.drift.toFixed(1)}s`,
            '--float-rotate': `${shape.rotate.toFixed(1)}s`,
            '--float-delay': `${shape.delay.toFixed(2)}s`,
          }}
        />
      ))}
    </div>,
    document.getElementById('ambient-root') || document.body,
  );
};

export default FloatingGeometry;
