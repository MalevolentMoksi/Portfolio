import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ensureLanguageLoaded } from '@/i18n';
import Tooltip from './Tooltip';

const LANGS = ['fr', 'en'] as const;
type LanguageKey = (typeof LANGS)[number];
const LANGUAGE_FADE_LEAD_MS = 220;

const LanguageButton = () => {
  const { i18n, t } = useTranslation();
  const resolvedLang = i18n.resolvedLanguage ?? 'fr';
  const currentLang: LanguageKey = LANGS.includes(resolvedLang as LanguageKey)
    ? (resolvedLang as LanguageKey)
    : 'fr';

  const handleSelect = useCallback(
    async (lng: LanguageKey) => {
      if (lng === currentLang) {
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
      // Lazy locale: make sure the target language's bundle is registered before
      // switching, otherwise the switch would briefly render missing/fallback keys.
      await ensureLanguageLoaded(lng);
      await i18n.changeLanguage(lng);
    },
    [currentLang, i18n]
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
