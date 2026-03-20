import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Tooltip from './Tooltip';

const LANGS = ['fr', 'en'] as const;
type LanguageKey = (typeof LANGS)[number];

const LanguageButton = () => {
  const { i18n, t } = useTranslation();
  const resolvedLang = i18n.resolvedLanguage ?? 'fr';
  const currentLang: LanguageKey = LANGS.includes(resolvedLang as LanguageKey)
    ? (resolvedLang as LanguageKey)
    : 'fr';
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef<number | null>(null);

  const handleSelect = useCallback(
    async (lng: LanguageKey) => {
      if (lng === currentLang) {
        return;
      }

      if (fadeTimeoutRef.current !== null) {
        window.clearTimeout(fadeTimeoutRef.current);
      }

      setIsFading(true);
      fadeTimeoutRef.current = window.setTimeout(async () => {
        await i18n.changeLanguage(lng);
        setIsFading(false);
        fadeTimeoutRef.current = null;
      }, 150);
    },
    [currentLang, i18n]
  );

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current !== null) {
        window.clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  const wrapperClassName = `language-switcher-wrapper${isFading ? ' is-fading-language' : ''}`;

  return (
    <div className={wrapperClassName}>
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
