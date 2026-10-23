import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  safeLocalGet,
  safeLocalSet,
  safeSessionGet,
  safeSessionSet,
} from '@/utils/safeStorage';
import { getPerformanceTier } from '@/utils/performanceTier';
import type { AccessibilitySettings, FontSize } from '@/types';

const STORAGE_KEY = 'portfolio-a11y-settings';
const AUTO_NO_MOTION_NOTIFIED_KEY = 'a11y-auto-noMotion-notified';

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

interface InitialSettings {
  settings: AccessibilitySettings;
  /** noMotion was switched on automatically because the device is a low-end mobile. */
  autoLowEndNoMotion: boolean;
}

const readSettings = (): InitialSettings => {
  try {
    const raw = safeLocalGet(STORAGE_KEY);
    let settings: AccessibilitySettings;
    let autoLowEndNoMotion = false;

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
      autoLowEndNoMotion = isLowEndMobile;
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

    return { settings, autoLowEndNoMotion };
  } catch {
    return { settings: DEFAULT_SETTINGS, autoLowEndNoMotion: false };
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
  const { t } = useTranslation();
  // Captured at first read: the settings are saved right after mount, so "no saved
  // settings yet" can no longer be checked later on to recognise a first visit.
  const autoLowEndNoMotionRef = useRef(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const initial = readSettings();
    autoLowEndNoMotionRef.current = initial.autoLowEndNoMotion;
    return initial.settings;
  });

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

  // Tell the visitor once per session when noMotion was auto-enabled on first visit
  // (low-end mobile detection). ToastProvider is a child, so its effect has already
  // exposed window.showToast when this one runs.
  useEffect(() => {
    if (!autoLowEndNoMotionRef.current) return;
    if (safeSessionGet(AUTO_NO_MOTION_NOTIFIED_KEY)) return;
    safeSessionSet(AUTO_NO_MOTION_NOTIFIED_KEY, 'true');
    window.showToast?.(t('common.toast.autoNoMotion'), { type: 'info', duration: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ settings, setSetting, toggleSetting }),
    [settings, setSetting, toggleSetting]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export const useAccessibility = () => useContext(AccessibilityContext);

export default AccessibilityContext;
