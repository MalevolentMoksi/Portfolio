/**
 * NightshadeSpores — Tiny glowing orbs drifting upward with a slight lateral sway.
 * Only renders when mood === 'nightshade'.
 * Performance-gated: no-motion and low-tier suppressed.
 *
 * Rendering: a SINGLE full-viewport <canvas> (not one DOM node per spore).
 * Each spore is an additive ('lighter') blit of a pre-rendered radial glow
 * sprite, which reproduces the old "bright core + soft halo" look (previously a
 * box-shadow on a mix-blend-mode:screen div) at a fraction of the compositor
 * cost — 68 individually-composited layers collapse into one canvas layer.
 * Same approach the hacker DigitalRain already uses (measured ~180fps).
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

interface Spore {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  phase: number;
  twinkle: number;
  size: number;
  colorIdx: number;
}

/** Fallback RGB triples if the theme custom properties can't be read. */
const FALLBACK_RGB = ['168, 85, 247', '196, 181, 253', '221, 214, 254'];

/** Build one radial-gradient glow sprite (bright core → soft transparent halo). */
const buildGlowSprite = (rgb: string): HTMLCanvasElement => {
  const SPRITE = 64;
  const c = document.createElement('canvas');
  c.width = SPRITE;
  c.height = SPRITE;
  const g = c.getContext('2d');
  if (g) {
    const mid = SPRITE / 2;
    const grad = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
    grad.addColorStop(0, `rgba(${rgb}, 1)`);
    grad.addColorStop(0.18, `rgba(${rgb}, 0.85)`);
    grad.addColorStop(0.5, `rgba(${rgb}, 0.25)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE, SPRITE);
  }
  return c;
};

const NightshadeSpores = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);

  const reducedMotion =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const enabled = mood === 'nightshade' && tier !== 'low' && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolve theme colors → concrete RGB triples for the glow sprites.
    // Mood palettes are scoped to body[data-mood="…"], NOT :root — so read the
    // computed values from <body> (reading from documentElement yields the gold
    // :root defaults instead of nightshade's orchid).
    const themeStyle = getComputedStyle(document.body);
    const readRgb = (name: string, fallback: string): string => {
      const v = themeStyle.getPropertyValue(name).trim();
      return v || fallback;
    };
    const sprites = [
      buildGlowSprite(readRgb('--color-primary-rgb', FALLBACK_RGB[0])),
      buildGlowSprite(readRgb('--color-accent-light-rgb', FALLBACK_RGB[1])),
      buildGlowSprite(readRgb('--color-accent-pale-rgb', FALLBACK_RGB[2])),
    ];

    // Cap DPR for the spore layer: glows are soft, so extra resolution buys no
    // visible quality while doubling fill cost on retina/high-tier displays.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;
    const resize = () => {
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const count = tier === 'high' ? 68 : 42;
    const pointerRadius = tier === 'high' ? 180 : 130;
    const spores: Spore[] = [];

    const newSpore = (s?: Spore): Spore => {
      const sp = s ?? ({} as Spore);
      sp.x = Math.random() * cssW;
      sp.y = cssH + 10;
      sp.vx = (Math.random() - 0.5) * 0.45;
      sp.vy = -(0.18 + Math.random() * 0.45);
      sp.life = 0;
      sp.maxLife = 280 + Math.random() * 360;
      sp.phase = Math.random() * Math.PI * 2;
      sp.twinkle = 0.55 + Math.random() * 0.9;
      sp.size = 1.7 + Math.random() * 3.6;
      sp.colorIdx = (Math.random() * sprites.length) | 0;
      return sp;
    };

    for (let i = 0; i < count; i++) {
      const s = newSpore();
      s.y = Math.random() * cssH; // distribute initial positions vertically
      s.life = Math.random() * s.maxLife;
      spores.push(s);
    }

    const handlePointerMove = (e: MouseEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.active = true;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches.length) return;
      pointerRef.current.x = e.touches[0].clientX;
      pointerRef.current.y = e.touches[0].clientY;
      pointerRef.current.active = true;
    };
    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    const burstAt = (x: number, y: number) => {
      const burstCount = tier === 'high' ? 8 : 5;
      for (let i = 0; i < burstCount; i++) {
        const s = spores[(Math.random() * spores.length) | 0];
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const speed = 0.7 + Math.random() * 1.2;
        s.x = x + (Math.random() - 0.5) * 20;
        s.y = y + (Math.random() - 0.5) * 20;
        s.vx = Math.cos(angle) * speed * 0.7;
        s.vy = Math.sin(angle) * speed;
        s.life = 0;
        s.maxLife = 120 + Math.random() * 160;
      }
    };

    const handleClick = (e: MouseEvent) => burstAt(e.clientX, e.clientY);
    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches.length) return;
      burstAt(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('touchend', handlePointerLeave, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    const tick = () => {
      if (!activeRef.current) return;
      const pointer = pointerRef.current;

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.globalCompositeOperation = 'lighter';

      for (const s of spores) {
        s.life++;

        // Interaction bubble: repel spores around pointer for tactile feedback.
        if (pointer.active) {
          const dx = s.x - pointer.x;
          const dy = s.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.001 && dist < pointerRadius) {
            const force = (pointerRadius - dist) / pointerRadius;
            const nx = dx / dist;
            const ny = dy / dist;
            s.vx += nx * force * 0.06;
            s.vy += ny * force * 0.08;
            s.vx += -ny * force * 0.012;
          }
        }

        s.vx *= 0.986;
        s.vy = Math.max(-1.9, s.vy * 0.995);
        s.x += s.vx + Math.sin(s.life * 0.014 + s.phase) * 0.36;
        s.y += s.vy;

        if (s.life >= s.maxLife || s.y < -16 || s.x < -30 || s.x > cssW + 30) {
          newSpore(s); // respawn in place (no allocation)
          continue; // skip drawing the (now off-screen) respawned spore this frame
        }

        const progress = s.life / s.maxLife;
        const fade =
          progress < 0.15 ? progress / 0.15 : progress > 0.85 ? (1 - progress) / 0.15 : 1;
        const twinkle = 0.72 + Math.sin(s.life * 0.03 + s.phase) * 0.28;
        const scale = 0.9 + Math.sin(s.life * 0.02 + s.phase * 1.3) * 0.22;

        const alpha = fade * twinkle * s.twinkle;
        if (alpha <= 0.01) continue;

        // Glow radius mirrors the old box-shadow spread (~size * 4).
        const r = s.size * scale * 4;
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.drawImage(sprites[s.colorIdx], s.x - r, s.y - r, r * 2, r * 2);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      rafRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!activeRef.current) {
        activeRef.current = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const stopLoop = () => {
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
    // Animation is frame-based (life++, no elapsed-time math), so pausing while the
    // tab is hidden and resuming is seamless — it simply stops drawing while nobody
    // can see it.
    const handleVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    activeRef.current = true;
    rafRef.current = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopLoop();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [enabled, tier]);

  if (!enabled) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      className="nightshade-spores-canvas"
      aria-hidden="true"
    />,
    document.getElementById('ambient-root') || document.body
  );
};

export default NightshadeSpores;
