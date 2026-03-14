import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Tooltip from './Tooltip.jsx';

const LANGS = ['fr', 'en'];

const LanguageButton = () => {
  const { i18n, t } = useTranslation();
  const currentLang = LANGS.includes(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'fr';

  const handleSelect = useCallback(async (lng) => {
    if (lng === currentLang) {
      return;
    }
    await i18n.changeLanguage(lng);
  }, [currentLang, i18n]);

  return (
    <div className="language-switcher-wrapper">
      <Tooltip text={t('common.language.tooltip')} position="bottom">
        <div className="language-segmented" role="group" aria-label={t('common.language.ariaLabel')}>
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
