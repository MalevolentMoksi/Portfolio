import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { safeLocalGet, safeLocalSet } from '@/utils/safeStorage';
import { getPerformanceTier } from '@/utils/performanceTier';
import type { AccessibilitySettings, FontSize } from '@/types';

const STORAGE_KEY = 'portfolio-a11y-settings';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  noMotion: false,
  highContrast: false,
  fontSize: 'normal',
  dyslexiaFont: false,
};

const FONT_SIZES = new Set<FontSize>(['normal', 'lg', 'xl']);

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  setSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  toggleSetting: (key: keyof AccessibilitySettings) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  settings: DEFAULT_SETTINGS,
  setSetting: () => {},
  toggleSetting: () => {},
});

const readSettings = (): AccessibilitySettings => {
  try {
    const raw = safeLocalGet(STORAGE_KEY);
    let settings: AccessibilitySettings;

    if (!raw) {
      // First visit — auto-enable noMotion on low-end touch devices.
      // Uses the same (hover: none) + (pointer: coarse) heuristic as
      // performanceTier so the detection is consistent.
      const isLowEndMobile =
        typeof window !== 'undefined' &&
        (window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches ?? false) &&
        getPerformanceTier() === 'low';
      // Honor an OS-level "reduce motion" preference on first visit: it's a strong
      // accessibility signal, and it also hands those users the lighter (smoother)
      // render path automatically. Once any setting is saved, the in-app choice
      // becomes the source of truth, so this never overrides an explicit selection.
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);
      settings = { ...DEFAULT_SETTINGS, noMotion: isLowEndMobile || prefersReducedMotion };
    } else {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const safeFont = FONT_SIZES.has(parsed.fontSize as FontSize)
        ? (parsed.fontSize as FontSize)
        : 'normal';
      settings = {
        // Migrate: old `reduceEffects` flag is folded into `noMotion`
        noMotion: !!(parsed.noMotion || parsed.reduceEffects),
        highContrast: !!parsed.highContrast,
        fontSize: safeFont,
        dyslexiaFont: !!parsed.dyslexiaFont,
      };
    }

    // Apply body classes synchronously here, before React renders.
    // This ensures `a11y--no-motion` (and friends) are on <body> when the
    // first useLayoutEffect fires in Layout.tsx — preventing the race where
    // UIEnhancements starts the typing animation before the class is set.
    if (typeof document !== 'undefined') applyBodyClasses(settings);

    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const applyBodyClasses = (settings: AccessibilitySettings): void => {
  const body = document.body;
  const root = document.documentElement;
  if (!body) return;

  body.classList.toggle('a11y--no-motion', settings.noMotion);
  // reduce-effects is driven by noMotion (merged toggle)
  body.classList.toggle('a11y--reduce-effects', settings.noMotion);
  body.classList.toggle('a11y--high-contrast', settings.highContrast);
  body.classList.toggle('a11y--dyslexia', settings.dyslexiaFont);

  body.classList.remove('a11y--font-lg', 'a11y--font-xl');
  if (settings.fontSize === 'lg') body.classList.add('a11y--font-lg');
  if (settings.fontSize === 'xl') body.classList.add('a11y--font-xl');

  // Rem-based typography scales from html font-size, not body font-size.
  if (root) {
    if (settings.fontSize === 'lg') {
      root.style.fontSize = '112.5%';
    } else if (settings.fontSize === 'xl') {
      root.style.fontSize = '125%';
    } else {
      root.style.fontSize = '';
    }
  }
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => readSettings());

  const setSetting = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((prev) => {
        if (!(key in prev)) return prev;
        return { ...prev, [key]: value };
      });
    },
    []
  );

  const toggleSetting = useCallback((key: keyof AccessibilitySettings) => {
    setSettings((prev) => {
      if (!(key in prev)) return prev;
      if (typeof prev[key] !== 'boolean') return prev;
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  useEffect(() => {
    applyBodyClasses(settings);
    safeLocalSet(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    applyBodyClasses(settings);
    return () => {
      const body = document.body;
      const root = document.documentElement;
      if (!body) return;
      body.classList.remove(
        'a11y--no-motion',
        'a11y--high-contrast',
        'a11y--font-lg',
        'a11y--font-xl',
        'a11y--dyslexia',
        'a11y--reduce-effects'
      );
      if (root) root.style.fontSize = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show Toast when noMotion is auto-enabled on first visit (low-end mobile detection).
  // Only fires once per session to avoid spamming the user.
  useEffect(() => {
    const alreadyNotified = sessionStorage.getItem('a11y-auto-noMotion-notified');
    if (alreadyNotified || !settings.noMotion) return;

    // Check if this is a first visit with auto-detection:
    // - noMotion is true (user has it enabled)
    // - No localStorage key means readSettings() auto-detected it on first visit
    // - Device is touch-only (hover: none) and low-end (< 4 cores)
    const isFirstVisit = !safeLocalGet(STORAGE_KEY);
    const isLowEndMobile =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches ?? false) &&
      getPerformanceTier() === 'low';

    if (isFirstVisit && isLowEndMobile && typeof window !== 'undefined' && window.showToast) {
      sessionStorage.setItem('a11y-auto-noMotion-notified', 'true');
      window.showToast(
        "Optimisations d'accessibilité : les animations ont été réduites pour améliorer la performance et l'accessibilité sur votre appareil.",
        { type: 'info', duration: 0 }
      );
    }
  }, [settings.noMotion]);

  const value = useMemo(
    () => ({ settings, setSetting, toggleSetting }),
    [settings, setSetting, toggleSetting]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export const useAccessibility = () => useContext(AccessibilityContext);

export default AccessibilityContext;
