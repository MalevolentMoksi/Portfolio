/**
 * AmbientBoids — Simulation de flocking (algorithme de Boids) sur un canvas
 * plein écran. 25 petits triangles lumineux simulant des oiseaux/nanobots
 * qui nagent de manière fluide en arrière-plan.
 *
 * Forces appliquées :
 *   1. Séparation (éviter les voisins proches)
 *   2. Alignement (vitesse moyenne des voisins)
 *   3. Cohésion (centre de masse local)
 *   4. Répulsion souris (les boids fuient le curseur)
 *   5. Évitement du bloc <main> (force de répulsion par bord)
 *
 * Wrapping toroïdal — les boids sortent d'un côté, rentrent de l'autre.
 *
 * Couleurs réactives au mood via lecture de --color-primary-rgb sur changement.
 *
 * Performance-gated : high → 25 boids, mid → 12, low → 0 (return null).
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/* ═══════════════════════════════════════════
   Constantes
   ═══════════════════════════════════════════ */

const BOID_COUNTS = { high: 25, mid: 12, low: 0 };

/* Rayons de perception */
const SEPARATION_R = 45;
const ALIGNMENT_R = 100;
const COHESION_R = 150;
const MOUSE_R = 220;
const MAIN_AVOID_R = 90;

/* Poids des forces */
const W_SEPARATION = 1.5;
const W_ALIGNMENT = 0.7;
const W_COHESION = 0.3;
const W_MOUSE = 3.5;
const W_MAIN_AVOID = 2.5;

/* Vitesse */
const SPEED_MIN = 0.8;
const SPEED_MAX = 3.0;

/* Rendu */
const BOID_LENGTH = 9;
const BOID_HALF_W = 4;
const SHADOW_BLUR = 8;
const BOID_OPACITY = 0.65;

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */

/** Distance au carré entre deux points */
const dist2 = (ax: number, ay: number, bx: number, by: number): number =>
  (ax - bx) ** 2 + (ay - by) ** 2;

/** Clamp la magnitude d'un vecteur [vx, vy] */
const clampSpeed = (vx: number, vy: number): [number, number] => {
  const mag = Math.sqrt(vx * vx + vy * vy) || 1;
  if (mag < SPEED_MIN) return [(vx / mag) * SPEED_MIN, (vy / mag) * SPEED_MIN];
  if (mag > SPEED_MAX) return [(vx / mag) * SPEED_MAX, (vy / mag) * SPEED_MAX];
  return [vx, vy];
};

/** Crée un boid avec position et vitesse aléatoires */
const makeBoid = (w: number, h: number): Boid => ({
  x: Math.random() * w,
  y: Math.random() * h,
  vx: (Math.random() - 0.5) * 2,
  vy: (Math.random() - 0.5) * 2,
});

/** Répulsion depuis un segment de rect (un seul bord) */
const edgeRepulsion = (
  bx: number,
  by: number,
  ex: number,
  ey: number,
  nx: number,
  ny: number
): [number, number] => {
  // Projette le boid sur le bord le plus proche et calcule la distance
  // nx, ny = normale sortante du bord
  // ex, ey = point le plus proche sur le bord
  const dx = bx - ex;
  const dy = by - ey;
  const dot = dx * nx + dy * ny;
  if (dot < 0 || dot > MAIN_AVOID_R) return [0, 0];
  const strength = 1 - dot / MAIN_AVOID_R;
  return [nx * strength * W_MAIN_AVOID, ny * strength * W_MAIN_AVOID];
};

/* ═══════════════════════════════════════════
   Composant
   ═══════════════════════════════════════════ */

const AmbientBoids = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boidsRef = useRef<Boid[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const mainRectRef = useRef<DOMRect | null>(null);
  const colorRef = useRef('212, 175, 55');
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const count = BOID_COUNTS[tier] ?? 12;

  /* ── Lecture de la couleur mood ── */
  useEffect(() => {
    const rgb = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary-rgb')
      .trim();
    if (rgb) colorRef.current = rgb;
  }, [mood]);

  /* ── Boucle principale ── */
  useEffect(() => {
    if (count === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* ── Dimensionnement ── */
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      sizeRef.current = { w, h };
    };
    resize();

    /* ── Initialisation des boids ── */
    const { w, h } = sizeRef.current;
    boidsRef.current = Array.from({ length: count }, () => makeBoid(w, h));

    /* ── Rect <main> (pas chaque frame) ── */
    const updateMainRect = () => {
      const main = document.querySelector('main');
      if (main) mainRectRef.current = main.getBoundingClientRect();
    };
    updateMainRect();

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('resize', updateMainRect, { passive: true });
    window.addEventListener('scroll', updateMainRect, { passive: true });

    /* ── Souris ── */
    const onMouse = (e: MouseEvent): void => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    /* ── RAF ── */
    let prevTime = 0;

    const tick = (ts: number): void => {
      const dt = Math.min((ts - prevTime) / 16.67, 3); // normaliser ~1 par frame @60fps, cap à 3
      prevTime = ts;

      const { w: cw, h: ch } = sizeRef.current;
      const boids = boidsRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mr = mainRectRef.current;

      /* ── Mise à jour des forces ── */
      for (let i = 0; i < boids.length; i++) {
        const bi = boids[i];
        let ax = 0,
          ay = 0;

        // Compteurs pour les 3 forces de flock
        let sepX = 0,
          sepY = 0,
          sepN = 0;
        let aliVx = 0,
          aliVy = 0,
          aliN = 0;
        let cohX = 0,
          cohY = 0,
          cohN = 0;

        for (let j = 0; j < boids.length; j++) {
          if (i === j) continue;
          const bj = boids[j];
          const d2 = dist2(bi.x, bi.y, bj.x, bj.y);

          // Séparation
          if (d2 < SEPARATION_R * SEPARATION_R && d2 > 0) {
            const d = Math.sqrt(d2);
            sepX += (bi.x - bj.x) / d;
            sepY += (bi.y - bj.y) / d;
            sepN++;
          }

          // Alignement
          if (d2 < ALIGNMENT_R * ALIGNMENT_R) {
            aliVx += bj.vx;
            aliVy += bj.vy;
            aliN++;
          }

          // Cohésion
          if (d2 < COHESION_R * COHESION_R) {
            cohX += bj.x;
            cohY += bj.y;
            cohN++;
          }
        }

        // Application des forces de flocking
        if (sepN > 0) {
          ax += (sepX / sepN) * W_SEPARATION;
          ay += (sepY / sepN) * W_SEPARATION;
        }
        if (aliN > 0) {
          ax += (aliVx / aliN - bi.vx) * W_ALIGNMENT;
          ay += (aliVy / aliN - bi.vy) * W_ALIGNMENT;
        }
        if (cohN > 0) {
          ax += (cohX / cohN - bi.x) * W_COHESION * 0.01;
          ay += (cohY / cohN - bi.y) * W_COHESION * 0.01;
        }

        // Répulsion souris
        const md2 = dist2(bi.x, bi.y, mx, my);
        if (md2 < MOUSE_R * MOUSE_R && md2 > 0) {
          const md = Math.sqrt(md2);
          const strength = (1 - md / MOUSE_R) * W_MOUSE;
          ax += ((bi.x - mx) / md) * strength;
          ay += ((bi.y - my) / md) * strength;
        }

        // Évitement de <main>
        if (mr) {
          // Bord gauche
          if (
            bi.x > mr.left - MAIN_AVOID_R &&
            bi.x < mr.left &&
            bi.y > mr.top &&
            bi.y < mr.bottom
          ) {
            const [fx, fy] = edgeRepulsion(bi.x, bi.y, mr.left, bi.y, -1, 0);
            ax += fx;
            ay += fy;
          }
          // Bord droit
          if (
            bi.x > mr.right &&
            bi.x < mr.right + MAIN_AVOID_R &&
            bi.y > mr.top &&
            bi.y < mr.bottom
          ) {
            const [fx, fy] = edgeRepulsion(bi.x, bi.y, mr.right, bi.y, 1, 0);
            ax += fx;
            ay += fy;
          }
          // Bord haut
          if (bi.y > mr.top - MAIN_AVOID_R && bi.y < mr.top && bi.x > mr.left && bi.x < mr.right) {
            const [fx, fy] = edgeRepulsion(bi.x, bi.y, bi.x, mr.top, 0, -1);
            ax += fx;
            ay += fy;
          }
          // Bord bas
          if (
            bi.y > mr.bottom &&
            bi.y < mr.bottom + MAIN_AVOID_R &&
            bi.x > mr.left &&
            bi.x < mr.right
          ) {
            const [fx, fy] = edgeRepulsion(bi.x, bi.y, bi.x, mr.bottom, 0, 1);
            ax += fx;
            ay += fy;
          }

          // Si un boid est À L'INTÉRIEUR de <main>, forte poussée vers l'extérieur
          if (bi.x > mr.left && bi.x < mr.right && bi.y > mr.top && bi.y < mr.bottom) {
            const cx = (mr.left + mr.right) / 2;
            const cy = (mr.top + mr.bottom) / 2;
            const dx = bi.x - cx;
            const dy = bi.y - cy;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            ax += (dx / d) * W_MAIN_AVOID * 3;
            ay += (dy / d) * W_MAIN_AVOID * 3;
          }
        }

        // Appliquer accélération
        bi.vx += ax * 0.05 * dt;
        bi.vy += ay * 0.05 * dt;

        // Clamp vitesse
        [bi.vx, bi.vy] = clampSpeed(bi.vx, bi.vy);

        // Mise à jour position
        bi.x += bi.vx * dt;
        bi.y += bi.vy * dt;

        // Wrapping toroïdal
        if (bi.x < -20) bi.x = cw + 20;
        else if (bi.x > cw + 20) bi.x = -20;
        if (bi.y < -20) bi.y = ch + 20;
        else if (bi.y > ch + 20) bi.y = -20;
      }

      /* ── Rendu ── */
      ctx.clearRect(0, 0, cw, ch);
      const rgb = colorRef.current;

      for (const b of boids) {
        const angle = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(angle);
        ctx.shadowColor = `rgba(${rgb}, 0.5)`;
        ctx.shadowBlur = SHADOW_BLUR;
        ctx.fillStyle = `rgba(${rgb}, ${BOID_OPACITY})`;
        ctx.beginPath();
        ctx.moveTo(BOID_LENGTH, 0);
        ctx.lineTo(-BOID_HALF_W, -BOID_HALF_W);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-BOID_HALF_W, BOID_HALF_W);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', updateMainRect);
      window.removeEventListener('scroll', updateMainRect);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [count]);

  if (count === 0) return null;

  return createPortal(
    <canvas ref={canvasRef} className="ambient-boids-canvas" aria-hidden="true" />,
    document.getElementById('ambient-root') || document.body
  );
};

export default AmbientBoids;
