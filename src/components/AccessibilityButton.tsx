import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import type { FontSize } from '@/types';
import Tooltip from './Tooltip';

const FONT_OPTIONS: FontSize[] = ['normal', 'lg', 'xl'];

interface PanelPosition {
  top: number;
  left: number;
}

const AccessibilityButton = () => {
  const { t } = useTranslation();
  const { settings, toggleSetting, setSetting } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelDivRef = useRef<HTMLDivElement | null>(null);
  const [panelPos, setPanelPos] = useState<PanelPosition | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !(panelDivRef.current && panelDivRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handle);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    // Right-align the panel to the button, but clamp so it never overflows either edge
    const approxPanelWidth = Math.min(340, window.innerWidth * 0.92);
    const rawLeft = rect.right - approxPanelWidth;
    const safeLeft = Math.max(8, Math.min(rawLeft, window.innerWidth - approxPanelWidth - 8));
    setPanelPos({ top: rect.bottom + 8, left: safeLeft });
  }, [isOpen]);

  return (
    <div className="accessibility-wrapper" ref={panelRef}>
      <Tooltip text={t('common.accessibility.tooltip')} position="bottom">
        <button
          className="header-action-btn accessibility-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={t('common.accessibility.ariaLabel')}
          aria-expanded={isOpen}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="7" r="1.6" fill="currentColor" stroke="none" />
            <path d="M7.2 11.2h9.6" />
            <path d="M12 8.6v8.6" />
            <path d="M8.6 19.2 12 14.6l3.4 4.6" />
          </svg>
        </button>
      </Tooltip>

      {isOpen &&
        createPortal(
          <div
            ref={panelDivRef}
            className="accessibility-panel"
            role="dialog"
            aria-label={t('common.accessibility.title')}
            style={panelPos ? { top: `${panelPos.top}px`, left: `${panelPos.left}px` } : {}}
          >
            <div className="accessibility-panel-title">{t('common.accessibility.title')}</div>

            <label className="a11y-toggle">
              <input
                className="a11y-toggle__input"
                type="checkbox"
                checked={settings.noMotion}
                onChange={() => toggleSetting('noMotion')}
              />
              <span className="a11y-toggle__switch" aria-hidden="true" />
              <span className="a11y-toggle__label">
                {t('common.accessibility.options.noMotion')}
              </span>
            </label>

            <label className="a11y-toggle">
              <input
                className="a11y-toggle__input"
                type="checkbox"
                checked={settings.highContrast}
                onChange={() => toggleSetting('highContrast')}
              />
              <span className="a11y-toggle__switch" aria-hidden="true" />
              <span className="a11y-toggle__label">
                {t('common.accessibility.options.highContrast')}
              </span>
            </label>

            <div className="a11y-font-size">
              <div className="a11y-font-size__label">
                {t('common.accessibility.options.fontSize')}
              </div>
              <div
                className="a11y-font-size__controls"
                role="radiogroup"
                aria-label={t('common.accessibility.options.fontSize')}
              >
                {FONT_OPTIONS.map((size) => {
                  const active = settings.fontSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`a11y-font-btn ${active ? 'a11y-font-btn--active' : ''}`}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSetting('fontSize', size as FontSize)}
                    >
                      {t(`common.accessibility.fontSize.${size}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="a11y-toggle">
              <input
                className="a11y-toggle__input"
                type="checkbox"
                checked={settings.dyslexiaFont}
                onChange={() => toggleSetting('dyslexiaFont')}
              />
              <span className="a11y-toggle__switch" aria-hidden="true" />
              <span className="a11y-toggle__label">
                {t('common.accessibility.options.dyslexia')}
              </span>
            </label>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AccessibilityButton;
