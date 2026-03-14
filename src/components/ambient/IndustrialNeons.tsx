/**
 * IndustrialNeons — Enseignes néon sur supports métalliques pour Industrial.
 *
 * Chaque enseigne est suspendue à un bras/potence métallique qui part du bord
 * de l'écran (hors champ), donnant l'impression de structures murales réelles.
 *
 *  1. Triangle de danger "!" — potence horizontale depuis la gauche → #ambient-root
 *  2. Éclair ⚡ — potence en L depuis la droite (bas)               → #ambient-root
 *  3. Bande "CAUTION" — suspendue sous le <header> collant           → portail <header>
 *
 * Performance-gated : high → 3 enseignes, mid → 2, low → CSS-only (return null)
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { getPerformanceTier } from '@/utils/performanceTier';

const SIGN_COUNTS = { high: 3, mid: 2, low: 0 };

/* ─── Enseigne : triangle de danger sur potence gauche ─── */
const HazardSign = ({ style }: any) => (
  <svg
    className="industrial-neon-sign industrial-neon-sign--hazard"
    viewBox="-50 -10 120 75"
    style={style}
    aria-hidden="true"
  >
    {/* Bras métallique horizontal venant de la gauche (hors-champ) */}
    <line x1="-50" y1="0" x2="30" y2="0" stroke="#4a4a4a" strokeWidth="3" />
    {/* Support vertical descendant vers l'enseigne */}
    <line x1="30" y1="0" x2="30" y2="10" stroke="#4a4a4a" strokeWidth="2.5" />
    {/* Plaque de fixation */}
    <rect
      x="24"
      y="-3"
      width="12"
      height="6"
      rx="1"
      fill="#3a3a3a"
      stroke="#555"
      strokeWidth="0.5"
    />
    {/* Boulon */}
    <circle cx="30" cy="0" r="2" fill="#555" stroke="#666" strokeWidth="0.5" />

    {/* Triangle néon */}
    <g transform="translate(0, 12)">
      <polygon
        points="30,2 56,48 4,48"
        fill="none"
        stroke="#FF5722"
        strokeWidth="2"
        strokeLinejoin="round"
        className="neon-stroke"
      />
      <polygon
        points="30,12 48,44 12,44"
        fill="none"
        stroke="rgba(255, 87, 34, 0.4)"
        strokeWidth="0.8"
        className="neon-stroke"
      />
      <line
        x1="30"
        y1="22"
        x2="30"
        y2="34"
        stroke="#FFD600"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="neon-stroke neon-stroke--accent"
      />
      <circle cx="30" cy="40" r="1.8" fill="#FFD600" className="neon-stroke neon-stroke--accent" />
    </g>
  </svg>
);

/* ─── Enseigne : éclair sur potence droite en L ─── */
const BoltSign = ({ style }: any) => (
  <svg
    className="industrial-neon-sign industrial-neon-sign--bolt"
    viewBox="-5 -10 80 80"
    style={style}
    aria-hidden="true"
  >
    {/* Bras métallique horizontal venant de la droite (hors-champ) */}
    <line x1="75" y1="0" x2="20" y2="0" stroke="#4a4a4a" strokeWidth="3" />
    {/* Coude en L descendant */}
    <line x1="20" y1="0" x2="20" y2="12" stroke="#4a4a4a" strokeWidth="2.5" />
    {/* Plaque de fixation */}
    <rect
      x="14"
      y="-3"
      width="12"
      height="6"
      rx="1"
      fill="#3a3a3a"
      stroke="#555"
      strokeWidth="0.5"
    />
    <circle cx="20" cy="0" r="2" fill="#555" stroke="#666" strokeWidth="0.5" />

    {/* Éclair néon */}
    <g transform="translate(0, 10)">
      <polyline
        points="22,2 10,28 20,28 14,58 34,22 22,22 30,2"
        fill="none"
        stroke="#FFD600"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="neon-stroke neon-stroke--accent"
      />
      <polyline
        points="22,2 10,28 20,28 14,58 34,22 22,22 30,2"
        fill="none"
        stroke="rgba(255, 214, 0, 0.2)"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

/* ─── Enseigne : CAUTION suspendue sous le header collant ─── */
const CautionSign = () => (
  <svg
    className="industrial-neon-sign industrial-neon-sign--caution"
    viewBox="0 -30 140 60"
    style={{
      position: 'absolute',
      top: '100%',
      right: '30px',
      pointerEvents: 'none',
      zIndex: 10,
      animationDelay: '2.4s',
    }}
    aria-hidden="true"
  >
    {/* Rail métallique horizontal en haut (dépasse l'écran) */}
    <line x1="-20" y1="-28" x2="160" y2="-28" stroke="#4a4a4a" strokeWidth="3" />

    {/* Chaîne gauche — maillons alternés */}
    {[0, 5, 10, 15, 20].map((y, i) => (
      <rect
        key={`cl-${i}`}
        x="18"
        y={-26 + y}
        width="4"
        height="4"
        rx="1"
        fill="none"
        stroke="#666"
        strokeWidth="0.8"
      />
    ))}
    {/* Chaîne droite */}
    {[0, 5, 10, 15, 20].map((y, i) => (
      <rect
        key={`cr-${i}`}
        x="118"
        y={-26 + y}
        width="4"
        height="4"
        rx="1"
        fill="none"
        stroke="#666"
        strokeWidth="0.8"
      />
    ))}

    {/* Plaque du panneau */}
    <rect
      x="0"
      y="0"
      width="140"
      height="24"
      rx="2"
      fill="rgba(26, 26, 26, 0.8)"
      stroke="#4a4a4a"
      strokeWidth="1"
    />
    {/* Bordure néon */}
    <rect
      x="2"
      y="2"
      width="136"
      height="20"
      rx="1.5"
      fill="none"
      stroke="#FF5722"
      strokeWidth="1.2"
      className="neon-stroke"
    />
    {/* Texte néon */}
    <text
      x="70"
      y="16"
      textAnchor="middle"
      fontFamily="monospace"
      fontSize="12"
      fontWeight="bold"
      fill="#FF5722"
      letterSpacing="4"
      className="neon-text"
    >
      CAUTION
    </text>
  </svg>
);

const IndustrialNeons = () => {
  const { mood } = useMood();
  const [headerEl, setHeaderEl] = useState<any>(null);

  useEffect(() => {
    setHeaderEl(document.querySelector('header.header--main') || document.querySelector('header'));
  }, []);

  if (mood !== 'industrial') return null;

  const count = SIGN_COUNTS[getPerformanceTier()] ?? 2;
  if (count === 0) return null;

  const ambientRoot = document.getElementById('ambient-root') || document.body;

  return (
    <>
      {count >= 1 &&
        createPortal(
          <HazardSign style={{ top: '18%', left: '-10px', animationDelay: '0s' }} />,
          ambientRoot
        )}
      {count >= 2 &&
        createPortal(
          <BoltSign style={{ top: '65%', right: '-10px', animationDelay: '1.2s' }} />,
          ambientRoot
        )}
      {count >= 3 && headerEl && createPortal(<CautionSign />, headerEl)}
    </>
  );
};

export default IndustrialNeons;
