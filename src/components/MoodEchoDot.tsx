import { useState, useRef, useEffect } from 'react';
import { useMood, MOODS } from '@/contexts/MoodContext';
import type { MoodKey } from '@/types';

/* Ordre canonique d'affichage des thèmes */
const MOOD_ORDER: MoodKey[] = ['default', 'hacker', 'vaporwave', 'europa', 'industrial'];

/**
 * MoodEchoDot — Pastille interactive reflétant le thème actif.
 * Pulsation colorée selon le mood courant ; clic ouvre un mini-panel
 * permettant de basculer vers n'importe quel thème.
 */
const MoodEchoDot = () => {
  const { mood, setMood } = useMood();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<any>(null);

  /* Fermer le panel au clic extérieur */
  useEffect(() => {
    if (!open) return;
    const handler = (e: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  /* Fermer avec Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: any) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const currentMood = MOODS[mood];

  return (
    <div className="mood-echo" ref={wrapperRef}>
      <button
        className={`mood-echo__dot${open ? ' mood-echo__dot--open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Thème actif : ${currentMood.label}. Cliquer pour changer`}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          '--echo-color': currentMood.color,
          '--echo-rgb': currentMood.rgb,
        }}
      >
        <span className="mood-echo__glow" aria-hidden="true" />
      </button>

      {open && (
        <div className="mood-echo__panel" role="listbox" aria-label="Choisir un thème">
          {MOOD_ORDER.map((key: MoodKey) => {
            const m = MOODS[key];
            const isActive = key === mood;
            return (
              <button
                key={key}
                role="option"
                aria-selected={isActive}
                className={`mood-echo__swatch${isActive ? ' mood-echo__swatch--active' : ''}`}
                style={{ '--swatch-color': m.color, '--swatch-rgb': m.rgb }}
                onClick={() => {
                  setMood(key);
                  setOpen(false);
                }}
                aria-label={`${m.label}${isActive ? ' (actif)' : ''}`}
              >
                <span className="mood-echo__swatch-dot" aria-hidden="true" />
                <span className="mood-echo__swatch-name">{m.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MoodEchoDot;
