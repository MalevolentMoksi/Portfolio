import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

const COLUMN_COUNT = { high: 8, mid: 4, low: 0 };
const CHARSET = '01ABCDEF#@$%&*+=<>/\\[]{}|';

interface RainColumn {
  x: number;
  headY: number;
  speed: number;
  fontSize: number;
  trail: number;
  glyphs: string[];
  shuffleEvery: number;
  lastShuffleAt: number;
}

const pickGlyph = (): string => CHARSET[Math.floor(Math.random() * CHARSET.length)];

const makeColumn = (index: number, count: number, width: number, height: number, tier: string): RainColumn => {
  const step = width / Math.max(1, count);
  const xJitter = (Math.random() - 0.5) * step * 0.55;
  const fontSize = tier === 'high' ? 9 + Math.random() * 1.8 : 8 + Math.random() * 1.2;
  const trail = tier === 'high' ? 22 + Math.floor(Math.random() * 10) : 16 + Math.floor(Math.random() * 8);
  const speed = tier === 'high' ? 58 + Math.random() * 26 : 46 + Math.random() * 20;

  return {
    x: step * (index + 0.5) + xJitter,
    headY: -Math.random() * height,
    speed,
    fontSize,
    trail,
    glyphs: Array.from({ length: trail }, () => pickGlyph()),
    shuffleEvery: 70 + Math.random() * 80,
    lastShuffleAt: performance.now(),
  };
};

const DigitalRain = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const count = mood === 'hacker' ? (COLUMN_COUNT[tier] ?? 0) : 0;

  useEffect(() => {
    if (count === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number | null = null;
    let lastFrameAt = performance.now();
    let width = 0;
    let height = 0;
    let columns: RainColumn[] = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = 'top';
      ctx.font = `${tier === 'high' ? 10 : 9}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      columns = Array.from({ length: count }, (_, index) => makeColumn(index, count, width, height, tier));
    };

    resize();

    const tick = (timestamp: number) => {
      const dt = Math.min((timestamp - lastFrameAt) / 1000, 0.05);
      lastFrameAt = timestamp;

      ctx.clearRect(0, 0, width, height);

      for (const column of columns) {
        column.headY += column.speed * dt;

        if (timestamp - column.lastShuffleAt >= column.shuffleEvery) {
          const changes = Math.max(1, Math.floor(column.trail * 0.12));
          for (let i = 0; i < changes; i++) {
            const index = Math.floor(Math.random() * column.trail);
            column.glyphs[index] = pickGlyph();
          }
          column.lastShuffleAt = timestamp;
        }

        for (let j = 0; j < column.trail; j++) {
          const y = column.headY - j * (column.fontSize * 1.2);
          if (y < -column.fontSize || y > height + column.fontSize) continue;

          const fade = 1 - j / column.trail;
          const alpha = j === 0 ? 0.7 : 0.45 * fade;
          const glyph = column.glyphs[(j + Math.floor(timestamp / 80)) % column.glyphs.length];

          if (j === 0) {
            ctx.fillStyle = `rgba(175, 255, 205, ${alpha.toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(0, 255, 65, ${alpha.toFixed(3)})`;
          }

          ctx.font = `${column.fontSize.toFixed(1)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
          ctx.fillText(glyph, column.x, y);
        }

        if (column.headY - column.trail * (column.fontSize * 1.2) > height + 30) {
          column.headY = -Math.random() * (height * 0.7);
          column.x += (Math.random() - 0.5) * 14;
          if (column.x < 0) column.x = Math.random() * 20;
          if (column.x > width) column.x = width - Math.random() * 20;
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [count, tier]);

  if (mood !== 'hacker' || count === 0) return null;

  return createPortal(
    <div className={`hacker-digital-rain hacker-digital-rain--${tier}`} aria-hidden="true">
      <canvas ref={canvasRef} className="hacker-digital-rain-canvas" />
    </div>,
    document.getElementById('ambient-root') || document.body
  );
};

export default DigitalRain;
