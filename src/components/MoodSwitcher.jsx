import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useMood, MOODS } from '../contexts/MoodContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import Tooltip from './Tooltip.jsx';

const MOOD_KEYS = Object.keys(MOODS);

const MoodSwitcher = () => {
  const { mood, setMood } = useMood();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const panelRef = useRef(null);
  const panelDivRef = useRef(null);
  const [panelPos, setPanelPos] = useState(null);

  /* ── Fermer au clic extérieur ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (
        (panelRef.current && !panelRef.current.contains(e.target)) &&
        !(panelDivRef.current && panelDivRef.current.contains(e.target))
      ) {
        setIsOpen(false);
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handle); };
  }, [isOpen]);

  /* ── Fermer avec Escape ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen]);
  /* —— Position du panneau (portal → coordonnées viewport) —— */
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setPanelPos({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
  }, [isOpen]);
  /* ── Changer de mood avec animation VHS ── */
  const handleMoodChange = useCallback((newMood) => {
    if (newMood === mood) return;

    // Overlay VHS flash + scanline
    const overlay = document.createElement('div');
    overlay.className = 'mood-vhs-overlay';
    // Couleur du flash = couleur du mood entrant
    overlay.style.setProperty('--vhs-color', MOODS[newMood].color);
    document.body.appendChild(overlay);

    // Changer le mood au milieu de la transition (60 ms)
    setTimeout(() => {
      setMood(newMood);
      showToast(`Ambiance : ${MOODS[newMood].label}`, { type: 'info', duration: 2500 });
    }, 60);

    // Retirer l'overlay après la fin de l'animation (200 ms)
    setTimeout(() => {
      overlay.remove();
    }, 200);

    // Incrémenter spinKey : React remonte le SVG et l'animation rejoue depuis 0%
    setSpinKey((k) => k + 1);
  }, [mood, setMood]);

  const currentMood = MOODS[mood];

  return (
    <div className="mood-switcher-wrapper" ref={panelRef}>
      {/* Bouton icône */}
      <Tooltip text={`Mood : ${currentMood.label}`} position="bottom">
      <button
        className="header-action-btn mood-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Changer l'ambiance visuelle"
        aria-expanded={isOpen}
      >
        <svg
          key={spinKey}
          className={`mood-icon${spinKey > 0 ? ' mood-icon--spin' : ''}`}
          viewBox="0 0 24 24"
          width="17"
          height="17"
          aria-hidden="true"
        >
          {/* Orbe central — couleur = mood actif */}
          <circle
            className="mood-orb"
            cx="12"
            cy="12"
            r="5"
            fill={currentMood.color}
            stroke={currentMood.color}
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />
          {/* 3 satellites orbitaux */}
          <circle className="mood-dot mood-dot--1" cx="12" cy="3.5" r="1.8"
            fill={MOODS.default.color} opacity={mood === 'default' ? 1 : 0.35} />
          <circle className="mood-dot mood-dot--2" cx="4.6" cy="17" r="1.8"
            fill={MOODS.hacker.color} opacity={mood === 'hacker' ? 1 : 0.35} />
          <circle className="mood-dot mood-dot--3" cx="19.4" cy="17" r="1.8"
            fill={MOODS.vaporwave.color} opacity={mood === 'vaporwave' ? 1 : 0.35} />
          {/* Orbite ring */}
          <circle cx="12" cy="12" r="9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="3 3"
            opacity="0.25"
          />
        </svg>
      </button>
      </Tooltip>

      {/* Panneau de sélection */}
      {isOpen && createPortal(
        <div
          ref={panelDivRef}
          className="mood-panel"
          role="radiogroup"
          aria-label="Choisir une ambiance"
          style={panelPos ? {
            top: `${panelPos.top}px`,
            right: `${panelPos.right}px`,
          } : {}}
        >
          <div className="mood-panel-title">Ambiance</div>
          {MOOD_KEYS.map((key) => {
            const m = MOODS[key];
            const isActive = key === mood;
            return (
              <button
                key={key}
                className={`mood-option ${isActive ? 'mood-option--active' : ''}`}
                onClick={() => handleMoodChange(key)}
                role="radio"
                aria-checked={isActive}
                style={{ '--mood-color': m.color }}
              >
                <span
                  className="mood-swatch"
                  style={{ background: m.color }}
                />
                <span className="mood-label">
                  <span className="mood-emoji">{m.emoji}</span> {m.label}
                </span>
                {isActive && <span className="mood-check" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};

export default MoodSwitcher;
