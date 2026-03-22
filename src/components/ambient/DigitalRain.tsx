import { useMemo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

// Fewer total columns — long dormant periods in the animation
// keep only ~2-3 visible at any moment
const COLUMN_COUNT = { high: 8, mid: 4, low: 0 };
const CHARSET = '01ABCDEF#@$%&*+=<>/\\[]{}|';

const buildRainString = (length: any) => {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    out += i % 3 === 2 ? '\n' : ' ';
  }
  return out;
};

// Each column handles its own subtle character-shuffling
const RainColumn = ({ style, initialText }: any) => {
  const [text, setText] = useState(initialText);
  const textRef = useRef(initialText);

  useEffect(() => {
    const id = setInterval(() => {
      const chars = textRef.current.split('');
      let changed = false;
      for (let i = 0; i < chars.length; i++) {
        if (chars[i] !== '\n' && chars[i] !== ' ' && Math.random() < 0.05) {
          chars[i] = CHARSET[Math.floor(Math.random() * CHARSET.length)];
          changed = true;
        }
      }
      if (changed) {
        textRef.current = chars.join('');
        setText(textRef.current);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="hacker-rain-column" style={style}>
      {text}
    </span>
  );
};

const DigitalRain = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();

  // Compute count before any early return (hooks ordering)
  const count = mood === 'hacker' ? (COLUMN_COUNT[tier] ?? 0) : 0;

  const columns = useMemo(
    () =>
      count === 0
        ? []
        : Array.from({ length: count }).map((_, i) => ({
            key: `rain-${i}`,
            // Spread columns unevenly — deliberate gaps feel more glitchy
            left: 4 + i * (92 / Math.max(1, count - 1)) + (Math.random() - 0.5) * 6,
            // Wide delay spread → columns rarely overlap
            delay: -(Math.random() * 20),
            // Slightly slower descent: increase base duration and spread
            duration: 18 + Math.random() * 10,
            size: tier === 'high' ? 8.5 + Math.random() * 1.5 : 8 + Math.random() * 0.8,
            text: buildRainString(tier === 'high' ? 56 : 38),
          })),
    [count, tier]
  );

  if (mood !== 'hacker' || count === 0) return null;

  return createPortal(
    <div className={`hacker-digital-rain hacker-digital-rain--${tier}`} aria-hidden="true">
      {columns.map((column) => (
        <RainColumn
          key={column.key}
          initialText={column.text}
          style={{
            left: `${column.left.toFixed(2)}%`,
            fontSize: `${column.size.toFixed(1)}px`,
            animationDelay: `${column.delay.toFixed(2)}s`,
            animationDuration: `${column.duration.toFixed(2)}s`,
          }}
        />
      ))}
    </div>,
    document.getElementById('ambient-root') || document.body
  );
};

export default DigitalRain;
