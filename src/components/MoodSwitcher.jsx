import { useState, useEffect, useRef, useCallback } from 'react';
import { useMood, MOODS } from '../contexts/MoodContext.jsx';

const MOOD_KEYS = Object.keys(MOODS);

const MoodSwitcher = () => {
  const { mood, setMood } = useMood();
  const [isOpen, setIsOpen] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const panelRef = useRef(null);

  /* ── Fermer au clic extérieur ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
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

  /* ── Changer de mood avec animation ── */
  const handleMoodChange = useCallback((newMood) => {
    if (newMood === mood) return;
    setMood(newMood);
    // Incrémenter spinKey : React remonte le SVG et l'animation rejoue depuis 0%
    setSpinKey((k) => k + 1);
  }, [mood, setMood]);

  const currentMood = MOODS[mood];

  return (
    <div className="mood-switcher-wrapper" ref={panelRef}>
      {/* Bouton icône */}
      <button
        className="header-action-btn mood-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Changer l'ambiance visuelle"
        aria-expanded={isOpen}
        title={`Mood : ${currentMood.label}`}
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

      {/* Panneau de sélection */}
      {isOpen && (
        <div className="mood-panel" role="radiogroup" aria-label="Choisir une ambiance">
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
        </div>
      )}
    </div>
  );
};

export default MoodSwitcher;
