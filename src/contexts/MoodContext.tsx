import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { safeLocalGet, safeLocalSet } from '@/utils/safeStorage';
import { useAccessibility } from './AccessibilityContext';
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

export const MOOD_ORDER: MoodKey[] = [
  'default',
  'hacker',
  'vaporwave',
  'europa',
  'industrial',
  'nightshade',
];

/* Niveau de brutalisme pour le mood Industrial : 'full' | 'moderate' | 'minimal' */
export const INDUSTRIAL_BRUTALIST_LEVEL = 'minimal';

const BRUTALIST_CLASSES = ['brutalist-full', 'brutalist-moderate', 'brutalist-minimal'] as const;

const applyMoodAttributesToElement = (element: HTMLElement, mood: MoodKey): void => {
  element.setAttribute('data-mood', mood);
  element.classList.remove(...BRUTALIST_CLASSES);
  if (mood === 'industrial') {
    element.classList.add(`brutalist-${INDUSTRIAL_BRUTALIST_LEVEL}`);
  }
};

interface MoodContextValue {
  mood: MoodKey;
  setMood: (mood: MoodKey) => void;
  cycleMood: () => void;
  MOODS: MoodMap;
}

export const MoodContext = createContext<MoodContextValue>({
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
  const { settings: a11ySettings } = useAccessibility();
  const [mood, setMoodState] = useState<MoodKey>(() => {
    const saved = safeLocalGet('portfolio-mood');
    return isMoodKey(saved) ? saved : 'default';
  });

  /* ── Appliquer le mood au DOM ── */
  const applyMood = useCallback((m: MoodKey) => {
    applyMoodAttributesToElement(document.body, m);

    const moodStages = document.querySelectorAll<HTMLElement>('.mood-stage');
    moodStages.forEach((stage) => applyMoodAttributesToElement(stage, m));

    // Reconfigurer les particules (physique + couleurs) pour le nouveau mood
    const reconfigureIfAvailable = (): boolean => {
      if (typeof window.reconfigureParticles === 'function') {
        window.reconfigureParticles(m);
        return true;
      } else if (typeof window.updateParticlesMood === 'function') {
        window.updateParticlesMood(m);
        return true;
      }
      return false;
    };

    reconfigureIfAvailable();
  }, []);

  const setMood = useCallback(
    (newMood: MoodKey) => {
      if (!MOODS[newMood]) return;
      // Enforce default mood when high contrast is on
      const effectiveMood = a11ySettings.highContrast ? 'default' : newMood;
      setMoodState(effectiveMood);
      safeLocalSet('portfolio-mood', effectiveMood);
      applyMood(effectiveMood);
    },
    [applyMood, a11ySettings.highContrast]
  );

  const cycleMood = useCallback(() => {
    setMoodState((prev) => {
      const idx = MOOD_ORDER.indexOf(prev);
      const next = MOOD_ORDER[(idx + 1) % MOOD_ORDER.length];
      // Enforce default mood when high contrast is on
      const effectiveMood = a11ySettings.highContrast ? 'default' : next;
      safeLocalSet('portfolio-mood', effectiveMood);
      applyMood(effectiveMood);
      return effectiveMood;
    });
  }, [applyMood, a11ySettings.highContrast]);

  /* ── Appliquer le mood initial au montage et respecter les changements d'accessibilité ── */
  useEffect(() => {
    const currentMoodOnDom = document.body.getAttribute('data-mood') as MoodKey | null;
    
    // If high contrast is on and current mood is not default, force default
    if (a11ySettings.highContrast && mood !== 'default') {
      setMoodState('default');
      safeLocalSet('portfolio-mood', 'default');
      applyMood('default');
    } else if (currentMoodOnDom !== mood) {
      // Only apply mood if it's different from what's already on the DOM
      // (avoid double-initialization during page load when VisualEffects just set it)
      applyMood(mood);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a11ySettings.highContrast]);

  return (
    <MoodContext.Provider value={{ mood, setMood, cycleMood, MOODS }}>
      {children}
    </MoodContext.Provider>
  );
};

export default MoodContext;
