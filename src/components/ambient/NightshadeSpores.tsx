/**
 * NightshadeSpores — Tiny glowing orbs drifting upward with a slight lateral sway.
 * Only renders when mood === 'nightshade'.
 * Performance-gated: no-motion and low-tier suppressed.
 */

import { useEffect, useRef } from 'react';
import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

interface Spore {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  phase: number;
  twinkle: number;
}

const SPORE_COLORS = [
  {
    core: 'var(--color-primary)',
    glow: 'rgba(var(--color-primary-rgb), 0.52)',
  },
  {
    core: 'var(--color-accent-light)',
    glow: 'rgba(var(--color-accent-light-rgb), 0.42)',
  },
  {
    core: 'var(--color-accent-pale)',
    glow: 'rgba(var(--color-accent-pale-rgb), 0.4)',
  },
  {
    core: 'color-mix(in srgb, var(--color-primary) 62%, var(--color-accent-pale) 38%)',
    glow: 'rgba(var(--color-primary-rgb), 0.32)',
  },
  {
    core: 'color-mix(in srgb, var(--color-accent-pale) 56%, var(--color-accent-light) 44%)',
    glow: 'rgba(var(--color-accent-pale-rgb), 0.34)',
  },
];

const NightshadeSpores = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);

  useEffect(() => {
    if (mood !== 'nightshade') return;
    if (tier === 'low') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const container = document.getElementById('ambient-root') || document.body;
    const wrapper = document.createElement('div');
    wrapper.className = 'nightshade-spores-wrapper';
    container.appendChild(wrapper);
    activeRef.current = true;

    const count = tier === 'high' ? 68 : 42;
    const spores: Spore[] = [];
    const pointerRadius = tier === 'high' ? 180 : 130;

    const createSpore = (x?: number, y?: number): Spore => {
      const el = document.createElement('div');
      el.className = 'nightshade-spore';
      const size = 1.7 + Math.random() * 3.6;
      const color = SPORE_COLORS[Math.floor(Math.random() * SPORE_COLORS.length)];
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color.core};
        box-shadow: 0 0 ${size * 4}px ${color.core}, 0 0 ${size * 2}px ${color.glow};
      `;
      wrapper.appendChild(el);

      return {
        el,
        x: x ?? Math.random() * window.innerWidth,
        y: y ?? window.innerHeight + 10,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -(0.18 + Math.random() * 0.45),
        life: 0,
        maxLife: 280 + Math.random() * 360,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.55 + Math.random() * 0.9,
      };
    };

    for (let i = 0; i < count; i++) {
      const s = createSpore();
      // Distribute initial positions vertically
      s.y = Math.random() * window.innerHeight;
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

        if (s.life >= s.maxLife || s.y < -16 || s.x < -30 || s.x > window.innerWidth + 30) {
          // Respawn
          s.x = Math.random() * window.innerWidth;
          s.y = window.innerHeight + 10;
          s.vx = (Math.random() - 0.5) * 0.45;
          s.vy = -(0.2 + Math.random() * 0.45);
          s.life = 0;
          s.maxLife = 280 + Math.random() * 360;
        }

        const progress = s.life / s.maxLife;
        const opacity =
          progress < 0.15 ? progress / 0.15 : progress > 0.85 ? (1 - progress) / 0.15 : 1;
        const twinkle = 0.72 + Math.sin(s.life * 0.03 + s.phase) * 0.28;
        const scale = 0.9 + Math.sin(s.life * 0.02 + s.phase * 1.3) * 0.22;

        s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) scale(${scale})`;
        s.el.style.opacity = (opacity * twinkle * s.twinkle).toString();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchstart', handleTouchStart);
      wrapper.remove();
    };
  }, [mood, tier]);

  return null;
};

export default NightshadeSpores;
