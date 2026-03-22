/**
 * RisingEmbers — Braises montantes + étincelles horizontales pour Industrial.
 *
 * Petits carrés orange lumineux qui s'élèvent depuis le bas de l'écran,
 * simulant des étincelles de forge. ~20 % de chance de spawner une étincelle
 * horizontale (spark) au lieu d'une braise verticale.
 *
 * Performance-gated : high → 42 braises, mid → 18, low → 0
 * Spawn continu via useEffect + interval (une braise toutes les ~0.5–1.2 s).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

const MAX_EMBERS = { high: 42, mid: 18, low: 0 };
const SPAWN_MIN_MS = 550;
const SPAWN_MAX_MS = 1200;

let _emberId = 0;

const EMBER_PALETTE = [
  {
    core: 'var(--color-primary)',
    glow: 'rgba(var(--color-primary-rgb), 0.55)',
  },
  {
    core: 'color-mix(in srgb, var(--color-primary) 72%, var(--color-accent-light) 28%)',
    glow: 'rgba(var(--color-primary-rgb), 0.42)',
  },
  {
    core: 'var(--color-accent-pale)',
    glow: 'rgba(var(--color-accent-pale-rgb), 0.5)',
  },
  {
    core: 'color-mix(in srgb, var(--color-primary) 78%, var(--color-accent-pale) 22%)',
    glow: 'rgba(var(--color-primary-rgb), 0.48)',
  },
  {
    core: 'color-mix(in srgb, var(--color-primary) 58%, var(--color-secondary) 42%)',
    glow: 'rgba(var(--color-primary-rgb), 0.34)',
  },
];

const RisingEmbers = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();
  const [embers, setEmbers] = useState<any[]>([]);
  const timerRef = useRef<any>(null);

  const maxCount = MAX_EMBERS[tier] ?? 5;
  const active = mood === 'industrial' && maxCount > 0;

  const spawnEmber = useCallback(() => {
    const id = ++_emberId;
    const isSpark = Math.random() < 0.28; // 28 % → plus d'étincelles horizontales

    const palette = EMBER_PALETTE[Math.floor(Math.random() * EMBER_PALETTE.length)];

    let ember: any;
    if (isSpark) {
      const width = 24 + Math.random() * 48; // 24–72 px
      const left = 10 + Math.random() * 80; // 10–90 vw
      const top = 20 + Math.random() * 60; // 20–80 vh
      const duration = 0.25 + Math.random() * 0.35; // 0.25–0.6 s
      const direction = Math.random() > 0.5 ? 1 : -1;
      ember = { id, spark: true, width, left, top, duration, palette, direction };
    } else {
      const size = 3 + Math.random() * 4.5; // 3–7.5 px
      const left = 5 + Math.random() * 90; // 5–95 vw
      const duration = 5 + Math.random() * 5; // 5–10 s
      ember = { id, spark: false, size, left, duration, palette };
    }

    setEmbers((prev) => {
      // Limiter le nombre max
      const next = [...prev, ember];
      return next.length > maxCount ? next.slice(-maxCount) : next;
    });

    // Retirer après sa fin d'animation
    const removeDelay = ember.spark ? ember.duration * 1000 + 200 : ember.duration * 1000 + 200;
    setTimeout(() => {
      setEmbers((prev) => prev.filter((e) => e.id !== id));
    }, removeDelay);
  }, [maxCount]);

  useEffect(() => {
    if (!active) {
      setEmbers([]);
      return;
    }

    const scheduleNext = () => {
      const delay = SPAWN_MIN_MS + Math.random() * (SPAWN_MAX_MS - SPAWN_MIN_MS);
      timerRef.current = setTimeout(() => {
        spawnEmber();
        scheduleNext();
      }, delay);
    };

    // Spawn initial + lancer le cycle
    spawnEmber();
    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, spawnEmber]);

  if (!active || embers.length === 0) return null;

  return createPortal(
    <>
      {embers.map((e) =>
        e.spark ? (
          <div
            key={e.id}
            className="industrial-spark"
            style={{
              width: e.width + 'px',
              height: '2px',
              left: e.left + 'vw',
              top: e.top + 'vh',
              background: e.palette.core,
              boxShadow: `0 0 10px ${e.palette.core}, 0 0 20px ${e.palette.glow}`,
              animationDuration: e.duration + 's',
              '--spark-dir': e.direction,
            }}
          />
        ) : (
          <div
            key={e.id}
            className="industrial-ember"
            style={{
              width: e.size + 'px',
              height: e.size + 'px',
              left: e.left + 'vw',
              bottom: '5%',
              background: e.palette.core,
              boxShadow: `0 0 ${e.size * 3}px ${e.palette.core}, 0 0 ${e.size * 6}px ${e.palette.glow}`,
              animationDuration: e.duration + 's',
            }}
          />
        )
      )}
    </>,
    document.getElementById('ambient-root') || document.body
  );
};

export default RisingEmbers;
