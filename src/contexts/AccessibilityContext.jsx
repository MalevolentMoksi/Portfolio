import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'portfolio-a11y-settings';

const DEFAULT_SETTINGS = {
  noMotion: false,
  highContrast: false,
  fontSize: 'normal',
  dyslexiaFont: false,
};

const FONT_SIZES = new Set(['normal', 'lg', 'xl']);

const AccessibilityContext = createContext({
  settings: DEFAULT_SETTINGS,
  setSetting: () => {},
  toggleSetting: () => {},
});

const readSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const safeFont = FONT_SIZES.has(parsed.fontSize) ? parsed.fontSize : 'normal';
    return {
      // Migrate: old `reduceEffects` flag is folded into `noMotion`
      noMotion: !!(parsed.noMotion || parsed.reduceEffects),
      highContrast: !!parsed.highContrast,
      fontSize: safeFont,
      dyslexiaFont: !!parsed.dyslexiaFont,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const applyBodyClasses = (settings) => {
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

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => readSettings());

  const setSetting = useCallback((key, value) => {
    setSettings((prev) => {
      if (!(key in prev)) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  const toggleSetting = useCallback((key) => {
    setSettings((prev) => {
      if (!(key in prev)) return prev;
      if (typeof prev[key] !== 'boolean') return prev;
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  useEffect(() => {
    applyBodyClasses(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
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
  }, []);

  const value = useMemo(() => ({ settings, setSetting, toggleSetting }), [settings, setSetting, toggleSetting]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export const useAccessibility = () => useContext(AccessibilityContext);

export default AccessibilityContext;
