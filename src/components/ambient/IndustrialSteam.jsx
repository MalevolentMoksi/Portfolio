/**
 * IndustrialSteam — Jets de vapeur depuis quatre tuyaux sur le footer.
 *
 * Des tuyaux métalliques fixes dépassent du bord supérieur du footer.
 * Positions aléatoires dans la zone centrale [24 %, 76 %] pour éviter
 * les silhouettes-dioramas placées dans les flancs [0–22 %] et [78–100 %].
 *
 * Performance-gated : high → 6 tuyaux, mid → 3, low → 0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext.jsx';
import { getPerformanceTier } from '@/utils/performanceTier.js';

const VENT_COUNTS = { high: 6, mid: 3, low: 0 };
const PUFF_INTERVAL_MIN = 2600;  // 2.6 s
const PUFF_INTERVAL_MAX = 7000; // 7 s

/* Zone centrale du footer (%) — évite les flancs des dioramas [1–22] et [78–99] */
const PIPE_ZONE_MIN = 24;
const PIPE_ZONE_MAX = 76;
const MIN_PIPE_GAP = 7; // % de la largeur du footer

function pickPipePositions(count) {
  if (count === 0) return [];
  const positions = [];
  let attempts = 0;
  while (positions.length < count && attempts < 300) {
    attempts++;
    const x = PIPE_ZONE_MIN + Math.random() * (PIPE_ZONE_MAX - PIPE_ZONE_MIN);
    if (positions.every((p) => Math.abs(p - x) >= MIN_PIPE_GAP)) {
      positions.push(x);
    }
  }
  return positions.sort((a, b) => a - b);
}

/* ─── SVG d'un tuyau industriel ─── */
const PipeFixture = ({ x }) => (
  <div
    className="industrial-pipe-fixture"
    style={{ left: `${x}%` }}
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 48" width="24" height="48">
      {/* Corps du tuyau — cylindre métallique */}
      <rect x="6" y="12" width="12" height="36" rx="1"
        fill="#3a3a3a" stroke="#555" strokeWidth="0.8" />
      {/* Collerette/bride en haut */}
      <rect x="3" y="10" width="18" height="5" rx="1"
        fill="#4a4a4a" stroke="#666" strokeWidth="0.6" />
      {/* Boulons sur la bride */}
      <circle cx="6" cy="12.5" r="1.2" fill="#555" />
      <circle cx="18" cy="12.5" r="1.2" fill="#555" />
      {/* Ouverture / buse en haut */}
      <ellipse cx="12" cy="10" rx="6" ry="2"
        fill="#2a2a2a" stroke="#555" strokeWidth="0.5" />
      {/* Rivets latéraux */}
      <circle cx="8" cy="24" r="0.8" fill="#666" />
      <circle cx="16" cy="24" r="0.8" fill="#666" />
      <circle cx="8" cy="34" r="0.8" fill="#666" />
      <circle cx="16" cy="34" r="0.8" fill="#666" />
    </svg>
  </div>
);

let _puffId = 0;

const IndustrialSteam = () => {
  const { mood } = useMood();
  const [puffs, setPuffs] = useState([]);
  const [footerEl, setFooterEl] = useState(null);
  const timersRef = useRef([]);

  const ventCount = VENT_COUNTS[getPerformanceTier()] ?? 2;
  const active = mood === 'industrial' && ventCount > 0;

  /* Positions aléatoires stables dans la zone centrale du footer */
  const vents = useMemo(() => pickPipePositions(ventCount), [ventCount]);

  useEffect(() => {
    setFooterEl(document.querySelector('footer'));
  }, []);

  const spawnPuff = useCallback((ventX) => {
    const id = ++_puffId;
    const size = 20 + Math.random() * 22;       // 20–42 px
    const duration = 4.2 + Math.random() * 2.6; // 4.2–6.8 s
    const xJitter = (Math.random() - 0.5) * 2;   // ±1 % de décalage

    const puff = { id, x: ventX + xJitter, size, duration };

    setPuffs((prev) => [...prev, puff]);

    setTimeout(() => {
      setPuffs((prev) => prev.filter((p) => p.id !== id));
    }, duration * 1000 + 300);
  }, []);

  useEffect(() => {
    if (!active) {
      setPuffs([]);
      return;
    }

    const timers = [];

    for (const ventX of vents) {
      const scheduleNext = () => {
        const delay = PUFF_INTERVAL_MIN + Math.random() * (PUFF_INTERVAL_MAX - PUFF_INTERVAL_MIN);
        const t = setTimeout(() => {
          spawnPuff(ventX);
          scheduleNext();
        }, delay);
        timers.push(t);
      };
      const initDelay = Math.random() * 3000;
      const t = setTimeout(() => {
        spawnPuff(ventX);
        scheduleNext();
      }, initDelay);
      timers.push(t);
    }

    timersRef.current = timers;

    return () => {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
    };
  }, [active, vents, spawnPuff]);

  if (!active || !footerEl) return null;

  return createPortal(
    <>
      {/* Tuyaux fixes dépassant du bord supérieur du footer */}
      {vents.map((x) => (
        <PipeFixture key={`pipe-${x}`} x={x} />
      ))}
      {/* Bouffées de vapeur émanant des tuyaux */}
      {puffs.map((p) => (
        <div
          key={p.id}
          className="industrial-steam-puff"
          style={{
            left: p.x + '%',
            width: p.size + 'px',
            height: p.size + 'px',
            animationDuration: p.duration + 's',
          }}
        />
      ))}
    </>,
    footerEl,
  );
};

export default IndustrialSteam;
