import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ── Configuration des moods ─────────────────────── */
export const MOODS = {
  default:    { label: 'Default',    emoji: '◆', color: '#d4af37', rgb: '212, 175, 55' },
  hacker:     { label: 'Terminal',   emoji: '>', color: '#00ff41', rgb: '0, 255, 65' },
  vaporwave:  { label: 'Vaporwave',  emoji: '~', color: '#ff71ce', rgb: '255, 113, 206' },
  europa:     { label: 'Europa',     emoji: '❄', color: '#00E5FF', rgb: '0, 229, 255' },
  industrial: { label: 'Industriel', emoji: '⚙', color: '#FF5722', rgb: '255, 87, 34' },
};

const MOOD_ORDER = ['default', 'hacker', 'vaporwave', 'europa', 'industrial'];

/* Niveau de brutalisme pour le mood Industrial : 'full' | 'moderate' | 'minimal' */
const INDUSTRIAL_BRUTALIST_LEVEL = 'minimal';

const MoodContext = createContext({
  mood: 'default',
  setMood: () => {},
  cycleMood: () => {},
});

export const useMood = () => useContext(MoodContext);

export const MoodProvider = ({ children }) => {
  const [mood, setMoodState] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolio-mood');
      return saved && MOODS[saved] ? saved : 'default';
    } catch {
      return 'default';
    }
  });

  /* ── Appliquer le mood au DOM ── */
  const applyMood = useCallback((m) => {
    document.body.setAttribute('data-mood', m);

    // Gérer la classe brutalist pour le mood Industrial
    document.body.classList.remove('brutalist-full', 'brutalist-moderate', 'brutalist-minimal');
    if (m === 'industrial') {
      document.body.classList.add(`brutalist-${INDUSTRIAL_BRUTALIST_LEVEL}`);
    }

    // Reconfigurer les particules (physique + couleurs) pour le nouveau mood
    const tryReconfigure = () => {
      if (typeof window.reconfigureParticles === 'function') {
        window.reconfigureParticles(m);
      } else if (typeof window.updateParticlesMood === 'function') {
        window.updateParticlesMood(m);
      }
    };
    tryReconfigure();
    // Retry si les particules ne sont pas encore chargées
    setTimeout(tryReconfigure, 500);
  }, []);

  const setMood = useCallback((newMood) => {
    if (!MOODS[newMood]) return;
    setMoodState(newMood);
    try { localStorage.setItem('portfolio-mood', newMood); } catch { /* quota */ }
    applyMood(newMood);
  }, [applyMood]);

  const cycleMood = useCallback(() => {
    setMoodState((prev) => {
      const idx = MOOD_ORDER.indexOf(prev);
      const next = MOOD_ORDER[(idx + 1) % MOOD_ORDER.length];
      try { localStorage.setItem('portfolio-mood', next); } catch { /* quota */ }
      applyMood(next);
      return next;
    });
  }, [applyMood]);

  /* ── Appliquer le mood initial au montage ── */
  useEffect(() => {
    applyMood(mood);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MoodContext.Provider value={{ mood, setMood, cycleMood, MOODS }}>
      {children}
    </MoodContext.Provider>
  );
};

export default MoodContext;
