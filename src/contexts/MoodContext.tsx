import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { safeLocalGet, safeLocalSet } from '@/utils/safeStorage';
import type { MoodKey, MoodMap } from '@/types';

/* ── Configuration des moods ─────────────────────── */
export const MOODS: MoodMap = {
  default: { label: 'Default', emoji: '◆', color: '#d4af37', rgb: '212, 175, 55' },
  hacker: { label: 'Terminal', emoji: '>', color: '#00ff41', rgb: '0, 255, 65' },
  vaporwave: { label: 'Vaporwave', emoji: '~', color: '#ff71ce', rgb: '255, 113, 206' },
  europa: { label: 'Europa', emoji: '❄', color: '#00E5FF', rgb: '0, 229, 255' },
  industrial: { label: 'Industriel', emoji: '⚙', color: '#FF5722', rgb: '255, 87, 34' },
  nightshade: { label: 'Nightshade', emoji: '⚘', color: '#A366FF', rgb: '163, 102, 255' },
};

const MOOD_ORDER: MoodKey[] = [
  'default',
  'hacker',
  'vaporwave',
  'europa',
  'industrial',
  'nightshade',
];

/* Niveau de brutalisme pour le mood Industrial : 'full' | 'moderate' | 'minimal' */
const INDUSTRIAL_BRUTALIST_LEVEL = 'minimal';

interface MoodContextValue {
  mood: MoodKey;
  setMood: (mood: MoodKey) => void;
  cycleMood: () => void;
  MOODS: MoodMap;
}

const MoodContext = createContext<MoodContextValue>({
  mood: 'default',
  setMood: () => {},
  cycleMood: () => {},
  MOODS,
});

export const useMood = () => useContext(MoodContext);

const isMoodKey = (value: string | null): value is MoodKey => value !== null && value in MOODS;

interface MoodProviderProps {
  children: ReactNode;
}

export const MoodProvider = ({ children }: MoodProviderProps) => {
  const [mood, setMoodState] = useState<MoodKey>(() => {
    const saved = safeLocalGet('portfolio-mood');
    return isMoodKey(saved) ? saved : 'default';
  });

  /* ── Appliquer le mood au DOM ── */
  const applyMood = useCallback((m: MoodKey) => {
    document.body.setAttribute('data-mood', m);

    // Gérer la classe brutalist pour le mood Industrial
    document.body.classList.remove('brutalist-full', 'brutalist-moderate', 'brutalist-minimal');
    if (m === 'industrial') {
      document.body.classList.add(`brutalist-${INDUSTRIAL_BRUTALIST_LEVEL}`);
    }

    // Reconfigurer les particules (physique + couleurs) pour le nouveau mood
    const tryReconfigure = (): void => {
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

  const setMood = useCallback(
    (newMood: MoodKey) => {
      if (!MOODS[newMood]) return;
      setMoodState(newMood);
      safeLocalSet('portfolio-mood', newMood);
      applyMood(newMood);
    },
    [applyMood]
  );

  const cycleMood = useCallback(() => {
    setMoodState((prev) => {
      const idx = MOOD_ORDER.indexOf(prev);
      const next = MOOD_ORDER[(idx + 1) % MOOD_ORDER.length];
      safeLocalSet('portfolio-mood', next);
      applyMood(next);
      return next;
    });
  }, [applyMood]);

  /* ── Appliquer le mood initial au montage ── */
  useEffect(() => {
    applyMood(mood);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MoodContext.Provider value={{ mood, setMood, cycleMood, MOODS }}>
      {children}
    </MoodContext.Provider>
  );
};

export default MoodContext;
