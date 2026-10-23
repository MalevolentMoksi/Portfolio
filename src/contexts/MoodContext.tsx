import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
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

const MOOD_STORAGE_KEY = 'portfolio-mood';

// Own keys only: `in` would also accept inherited names such as "toString".
const isMoodKey = (value: string | null): value is MoodKey =>
  value !== null && Object.prototype.hasOwnProperty.call(MOODS, value);

interface MoodProviderProps {
  children: ReactNode;
}

export const MoodProvider = ({ children }: MoodProviderProps) => {
  const { settings: a11ySettings } = useAccessibility();
  // The visitor's chosen mood, persisted as is. High contrast only overrides what is
  // displayed: turning it off brings the chosen mood back instead of losing it.
  const [preferredMood, setPreferredMood] = useState<MoodKey>(() => {
    const saved = safeLocalGet(MOOD_STORAGE_KEY);
    return isMoodKey(saved) ? saved : 'default';
  });
  const mood: MoodKey = a11ySettings.highContrast ? 'default' : preferredMood;

  /* ── Appliquer le mood au DOM ── */
  const applyMood = useCallback((m: MoodKey) => {
    applyMoodAttributesToElement(document.body, m);

    const moodStages = document.querySelectorAll<HTMLElement>('.mood-stage');
    moodStages.forEach((stage) => applyMoodAttributesToElement(stage, m));

    // Tint the mobile browser chrome (theme-color) to match the active mood.
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', MOODS[m]?.color ?? '#050400');

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
    
    // Only retry if particles weren't available on first call
    if (!reconfigureIfAvailable()) {
      setTimeout(reconfigureIfAvailable, 500);
    }
  }, []);

  const setMood = useCallback(
    (newMood: MoodKey) => {
      if (!isMoodKey(newMood)) return;
      // High contrast pins the displayed mood to default (the switcher is disabled).
      if (a11ySettings.highContrast) return;
      setPreferredMood(newMood);
      safeLocalSet(MOOD_STORAGE_KEY, newMood);
      applyMood(newMood);
    },
    [applyMood, a11ySettings.highContrast]
  );

  const cycleMood = useCallback(() => {
    const idx = MOOD_ORDER.indexOf(preferredMood);
    setMood(MOOD_ORDER[(idx + 1) % MOOD_ORDER.length]);
  }, [preferredMood, setMood]);

  /* ── Appliquer le mood affiché au montage et quand le contraste élevé change ── */
  useEffect(() => {
    // setMood already applied it synchronously; this covers the initial mount and
    // high contrast being toggled (which changes the displayed mood only).
    if (document.body.getAttribute('data-mood') !== mood) {
      applyMood(mood);
    }
  }, [mood, applyMood]);

  // Memoize so consumers (Layout, every ambient layer, MoodSwitcher, useDynamicFavicon…)
  // don't re-render on unrelated provider re-renders. setMood/cycleMood are already
  // useCallback-stable and MOODS is a module constant, so this only changes on `mood`.
  const value = useMemo(
    () => ({ mood, setMood, cycleMood, MOODS }),
    [mood, setMood, cycleMood]
  );

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
};

export default MoodContext;
