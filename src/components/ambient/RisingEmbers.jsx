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
import { useMood } from '@/contexts/MoodContext.jsx';
import { getPerformanceTier } from '@/utils/performanceTier.js';

const MAX_EMBERS = { high: 42, mid: 18, low: 0 };
const SPAWN_MIN_MS = 550;
const SPAWN_MAX_MS = 1200;

let _emberId = 0;

const RisingEmbers = () => {
  const { mood } = useMood();
  const [embers, setEmbers] = useState([]);
  const timerRef = useRef(null);

  const maxCount = MAX_EMBERS[getPerformanceTier()] ?? 5;
  const active = mood === 'industrial' && maxCount > 0;

  const spawnEmber = useCallback(() => {
    const id = ++_emberId;
    const isSpark = Math.random() < 0.28; // 28 % → plus d'étincelles horizontales

    // Couleur : orange dominant, parfois jaune ou rouge foncé
    const colors = ['#FF5722', '#FF8A65', '#FFD600', '#FF6E40', '#BF360C'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    let ember;
    if (isSpark) {
      const width = 24 + Math.random() * 48;     // 24–72 px
      const left = 10 + Math.random() * 80;      // 10–90 vw
      const top = 20 + Math.random() * 60;       // 20–80 vh
      const duration = 0.25 + Math.random() * 0.35; // 0.25–0.6 s
      const direction = Math.random() > 0.5 ? 1 : -1;
      ember = { id, spark: true, width, left, top, duration, color, direction };
    } else {
      const size = 3 + Math.random() * 4.5;      // 3–7.5 px
      const left = 5 + Math.random() * 90;       // 5–95 vw
      const duration = 5 + Math.random() * 5;    // 5–10 s
      ember = { id, spark: false, size, left, duration, color };
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
              background: e.color,
              boxShadow: `0 0 10px ${e.color}, 0 0 20px rgba(255, 87, 34, 0.55)`,
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
              background: e.color,
              boxShadow: `0 0 ${e.size * 3}px ${e.color}, 0 0 ${e.size * 6}px rgba(255, 87, 34, 0.55)`,
              animationDuration: e.duration + 's',
            }}
          />
        ),
      )}
    </>,
    document.getElementById('ambient-root') || document.body
  );
};

export default RisingEmbers;
