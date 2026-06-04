import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';

// `fr` is the default + fallback language, so it is bundled eagerly. Every other
// language is fetched on demand (as its own chunk) so a French visitor never
// downloads the English dictionary on first load, and vice-versa. This roughly
// halves the locale payload on the initial load for the default-language audience.
const lazyLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('./locales/en.json'),
};

const loadedLanguages = new Set<string>(['fr']);

/**
 * Ensures a language's translation bundle is registered before it is used. Safe to
 * call repeatedly; resolves immediately for already-loaded (or eagerly-bundled)
 * languages. Call this before `i18n.changeLanguage(lng)` so the switch never lands
 * on missing keys.
 */
export const ensureLanguageLoaded = async (lng: string): Promise<void> => {
  const base = (lng || 'fr').split('-')[0];
  if (loadedLanguages.has(base) || !lazyLoaders[base]) return;
  const resource = await lazyLoaders[base]();
  i18n.addResourceBundle(base, 'translation', resource.default, true, true);
  loadedLanguages.add(base);
};

/**
 * Resolves once i18n is initialised AND the detected language's bundle is loaded.
 * `main.tsx` awaits this before the first render so a non-default-language visitor
 * never sees a flash of fallback (French) copy.
 */
export const i18nReady: Promise<unknown> = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
    },
    showSupportNotice: false,
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    // Allow language bundles to be added after init (see ensureLanguageLoaded).
    partialBundledLanguages: true,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })
  .then(() => ensureLanguageLoaded(i18n.language));

export default i18n;
