import { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

const COLUMN_COUNT = { high: 8, mid: 4, low: 0 };
const CHARSET = '01ABCDEF#@$%&*+=<>/\\[]{}|';

/** Fraction of the cycle during which the column is falling (visible). */
const VISIBLE_FRACTION = 0.40;
/** Character shuffle probability per character per ~100 ms tick. */
const SHUFFLE_PROB = 0.05;
/** Approximate interval between character shuffles (ms). */
const SHUFFLE_INTERVAL_MS = 100;

interface ColumnState {
  /** Horizontal position as fraction 0..1. */
  leftFrac: number;
  /** Total animation cycle (seconds). */
  duration: number;
  /** Cycle offset (seconds, negative = started earlier). */
  delay: number;
  /** Font size (px). */
  fontSize: number;
  /** Character array (mutable, shuffled in-place). */
  chars: string[];
  /** Precomputed line strings for drawing (rows separated by `\n`). */
  lines: string[];
  /** Time since last shuffle tick (ms). */
  shuffleAccum: number;
}

function buildChars(length: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < length; i++) {
    out.push(CHARSET[Math.floor(Math.random() * CHARSET.length)]);
  }
  return out;
}

/** Convert flat char array to lines (groups of 3 separated by spaces). */
function charsToLines(chars: string[]): string[] {
  const lines: string[] = [];
  let line = '';
  for (let i = 0; i < chars.length; i++) {
    line += chars[i];
    if (i % 3 === 2) {
      lines.push(line);
      line = '';
    } else {
      line += ' ';
    }
  }
  if (line) lines.push(line);
  return lines;
}

const DigitalRain = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const count = mood === 'hacker' ? (COLUMN_COUNT[tier] ?? 0) : 0;

  const columns = useMemo<ColumnState[]>(() => {
    if (count === 0) return [];
    return Array.from({ length: count }).map((_, i) => {
      const charLen = tier === 'high' ? 56 : 38;
      const chars = buildChars(charLen);
      return {
        leftFrac: (4 + i * (92 / Math.max(1, count - 1)) + (Math.random() - 0.5) * 6) / 100,
        delay: -(Math.random() * 20),
        duration: 18 + Math.random() * 10,
        fontSize: tier === 'high' ? 8.5 + Math.random() * 1.5 : 8 + Math.random() * 0.8,
        chars,
        lines: charsToLines(chars),
        shuffleAccum: 0,
      };
    });
  }, [count, tier]);

  useEffect(() => {
    if (mood !== 'hacker' || count === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let prevTime = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = (now: number) => {
      const dt = now - prevTime;
      prevTime = now;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);

      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];

        // Shuffle characters periodically (no React state updates!)
        col.shuffleAccum += dt;
        if (col.shuffleAccum >= SHUFFLE_INTERVAL_MS) {
          col.shuffleAccum -= SHUFFLE_INTERVAL_MS;
          let changed = false;
          for (let i = 0; i < col.chars.length; i++) {
            if (Math.random() < SHUFFLE_PROB) {
              col.chars[i] = CHARSET[Math.floor(Math.random() * CHARSET.length)];
              changed = true;
            }
          }
          if (changed) {
            col.lines = charsToLines(col.chars);
          }
        }

        // Animation phase: replicate CSS keyframes hacker-rain-fall
        // t = (now/1000 + delay) mod duration → fraction 0..1
        const tSec = (now / 1000 + col.delay) % col.duration;
        const phase = (tSec < 0 ? tSec + col.duration : tSec) / col.duration;

        // Keyframe mapping:
        //   0%..4%   → fade in,  translateY from -100% → ≈ -90%
        //   4%..34%  → main fall, opacity ≈ 0.24–0.28
        //   34%..40% → fade out
        //   40%..100% → dormant (invisible)
        if (phase > VISIBLE_FRACTION) continue; // dormant

        let opacity: number;
        let yFrac: number; // 0 = off-screen top, 1 = off-screen bottom

        if (phase < 0.04) {
          // Fade in
          const p = phase / 0.04;
          opacity = 0.28 * p;
          yFrac = p * (0.04 / VISIBLE_FRACTION);
        } else if (phase < 0.34) {
          // Main fall
          opacity = 0.24 + (0.04 / (0.34 - 0.04)) * (0.34 - phase) * (0.28 - 0.24);
          yFrac = (phase - 0.0) / VISIBLE_FRACTION;
        } else {
          // Fade out
          const p = (phase - 0.34) / (VISIBLE_FRACTION - 0.34);
          opacity = 0.24 * (1 - p);
          yFrac = (phase - 0.0) / VISIBLE_FRACTION;
        }

        const isMid = tier === 'mid';
        const drawOpacity = isMid ? opacity * 0.73 : opacity;
        if (drawOpacity <= 0.01) continue;

        // Map yFrac to translateY range: from -columnHeight to 108vh
        const lineHeight = col.fontSize * 1.05;
        const columnHeight = col.lines.length * lineHeight;
        // translateY(-100%) means the bottom of the text is at y=0 (off-screen top)
        // translateY(108vh) means the top of the text is at y = 1.08 * h
        const yStart = -columnHeight;
        const yEnd = h * 1.08;
        const yPos = yStart + yFrac * (yEnd - yStart);

        const x = col.leftFrac * w;

        ctx.save();
        ctx.globalAlpha = drawOpacity;
        ctx.font = `${col.fontSize}px monospace`;
        // Text color + glow
        if (isMid) {
          ctx.fillStyle = 'rgba(0, 255, 65, 0.38)';
          ctx.shadowColor = 'rgba(0, 255, 65, 0.25)';
          ctx.shadowBlur = 3;
        } else {
          ctx.fillStyle = 'rgba(0, 255, 65, 0.5)';
          ctx.shadowColor = 'rgba(0, 255, 65, 0.35)';
          ctx.shadowBlur = 4;
        }

        for (let l = 0; l < col.lines.length; l++) {
          const ly = yPos + l * lineHeight;
          // Skip lines completely off-screen
          if (ly > h + lineHeight || ly + lineHeight < 0) continue;
          ctx.fillText(col.lines[l], x, ly);
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafRef.current === null) {
        // Reset the clock so the long hidden gap doesn't produce a giant dt.
        prevTime = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const stopLoop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // Pause the canvas loop entirely while the tab is hidden (it's purely decorative);
    // the animation phase is driven by absolute time, so it resumes seamlessly.
    const handleVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    startLoop();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopLoop();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', resize);
    };
  }, [mood, count, tier, columns]);

  if (mood !== 'hacker' || count === 0) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      className="hacker-digital-rain"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 'var(--z-ambient, 0)' as any }}
    />,
    document.getElementById('ambient-root') || document.body
  );
};

export default DigitalRain;
