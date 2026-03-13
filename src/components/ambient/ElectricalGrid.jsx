import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext.jsx';
import { getPerformanceTier } from '@/utils/performanceTier.js';

const ARC_PATHS = [
  'M 6 76 Q 16 60 26 76',
  'M 18 58 Q 30 44 44 58',
  'M 34 70 Q 48 50 62 70',
  'M 58 54 Q 70 42 82 54',
  'M 70 72 Q 82 58 94 72',
];

const ElectricalGrid = () => {
  const { mood } = useMood();
  const tier = getPerformanceTier();

  if (mood !== 'industrial') return null;

  const activeArcs = tier === 'high';
  const showGrid = tier === 'high' || tier === 'mid' || tier === 'low';
  if (!showGrid) return null;

  const arcStyleSeed = useMemo(
    () =>
      ARC_PATHS.map((_, index) => ({
        // Slower cadence so electrical arcs appear less often.
        animationDelay: `${(index * 1.6).toFixed(2)}s`,
        animationDuration: `${(6.8 + index * 1.1).toFixed(2)}s`,
      })),
    [],
  );

  return createPortal(
    <div
      className={`industrial-electrical-grid industrial-electrical-grid--${tier}`}
      aria-hidden="true"
    >
      <svg
        className="industrial-grid-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={8 + i * 9.2}
            x2="100"
            y2={8 + i * 9.2}
            className="industrial-grid-line industrial-grid-line--h"
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={4 + i * 8.2}
            y1="0"
            x2={4 + i * 8.2}
            y2="100"
            className="industrial-grid-line industrial-grid-line--v"
          />
        ))}
      </svg>

      {activeArcs && (
        <svg
          className="industrial-grid-arcs"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {ARC_PATHS.map((path, index) => (
            <path
              key={path}
              d={path}
              className="industrial-grid-arc"
              style={arcStyleSeed[index]}
            />
          ))}
        </svg>
      )}
    </div>,
    document.getElementById('ambient-root') || document.body,
  );
};

export default ElectricalGrid;
