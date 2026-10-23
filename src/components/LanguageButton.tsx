import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ensureLanguageLoaded, LANGUAGE_STORAGE_KEY } from '@/i18n';
import { useToast } from '@/contexts/ToastContext';
import { reloadForStaleBuild } from '@/utils/appUpdate';
import {
  safeLocalSet,
  safeSessionGet,
  safeSessionRemove,
  safeSessionSet,
} from '@/utils/safeStorage';
import Tooltip from './Tooltip';

const LANGS = ['fr', 'en'] as const;
type LanguageKey = (typeof LANGS)[number];
const LANGUAGE_FADE_LEAD_MS = 220;
// Language a failed switch reloaded the page for, checked once the new page is up.
const PENDING_SWITCH_KEY = 'language-switch-pending';

const LanguageButton = () => {
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const resolvedLang = i18n.resolvedLanguage ?? 'fr';
  const currentLang: LanguageKey = LANGS.includes(resolvedLang as LanguageKey)
    ? (resolvedLang as LanguageKey)
    : 'fr';

  // After a reload meant to finish a switch: say so if it still did not go through.
  useEffect(() => {
    const pending = safeSessionGet(PENDING_SWITCH_KEY);
    if (!pending) return;
    safeSessionRemove(PENDING_SWITCH_KEY);
    if (pending !== currentLang) {
      showToast(t('common.language.switchFailed'), { type: 'error', duration: 6000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback(
    async (lng: LanguageKey) => {
      // Also compare the requested language: after a failed load it can differ from
      // the displayed one, and picking the displayed one must still settle it.
      if (lng === currentLang && lng === i18n.language) {
        return;
      }
      // Emit event to trigger fade in parent Layout
      window.dispatchEvent(new CustomEvent('portfolioLanguageChanging'));
      const noMotionEnabled = document.body.classList.contains('a11y--no-motion');
      if (!noMotionEnabled) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, LANGUAGE_FADE_LEAD_MS);
        });
      }
      try {
        // Lazy locale: make sure the target language's bundle is registered before
        // switching, otherwise the switch would briefly render missing/fallback keys.
        await ensureLanguageLoaded(lng);
        await i18n.changeLanguage(lng);
      } catch {
        // The fade above hides all text until `languageChanged` fires: end it now.
        window.dispatchEvent(new CustomEvent('portfolioLanguageChangeFailed'));
        // Online, a missing locale chunk means this tab runs a build that has since
        // been redeployed: reload into the new build, already in the chosen language.
        safeLocalSet(LANGUAGE_STORAGE_KEY, lng);
        safeSessionSet(PENDING_SWITCH_KEY, lng);
        if (reloadForStaleBuild()) return;
        safeSessionRemove(PENDING_SWITCH_KEY);
        safeLocalSet(LANGUAGE_STORAGE_KEY, currentLang);
        showToast(t('common.language.switchFailed'), { type: 'error', duration: 6000 });
      }
    },
    [currentLang, i18n, showToast, t]
  );

  return (
    <div className="language-switcher-wrapper">
      <Tooltip text={t('common.language.tooltip')} position="bottom">
        <div
          className="language-segmented"
          data-current={currentLang}
          role="group"
          aria-label={t('common.language.ariaLabel')}
        >
          {LANGS.map((lng) => {
            const active = currentLang === lng;
            return (
              <button
                key={lng}
                type="button"
                className={`language-segmented__btn ${active ? 'language-segmented__btn--active' : ''}`}
                onClick={() => handleSelect(lng)}
                aria-pressed={active}
                aria-label={t(`common.language.names.${lng}`)}
              >
                {lng.toUpperCase()}
              </button>
            );
          })}
        </div>
      </Tooltip>
    </div>
  );
};

export default LanguageButton;
