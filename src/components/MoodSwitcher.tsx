import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMood, MOODS, MOOD_ORDER } from '../contexts/MoodContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import Tooltip from './Tooltip';
import type { MoodKey } from '@/types';

type SelectorMode = 'dropdown' | 'rotaryCylinder' | 'hexGrid' | 'analogTuner';
const ACTIVE_SELECTOR_MODE = 'dropdown' as SelectorMode;

const createVhsOverlay = (newMood: MoodKey): HTMLDivElement => {
  const overlay = document.createElement('div');
  overlay.className = 'mood-vhs-overlay';
  overlay.style.setProperty('--vhs-color', MOODS[newMood].color);
  document.body.appendChild(overlay);

  const stripCount = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < stripCount; i++) {
    const strip = document.createElement('div');
    strip.className = 'vhs-strip';
    const topPct = Math.random() * 88;
    const heightPct = 3 + Math.random() * 18;
    const offsetX = (Math.random() - 0.5) * 90;
    const delay = Math.round(Math.random() * 80);

    strip.style.cssText = [
      `top: ${topPct.toFixed(1)}%`,
      `height: ${heightPct.toFixed(1)}%`,
      `transform: translateX(${offsetX.toFixed(0)}px)`,
      `background: ${MOODS[newMood].color}`,
      `animation-delay: ${delay}ms`,
    ].join('; ');

    overlay.appendChild(strip);
  }

  return overlay;
};

const MoodSwitcher = () => {
  const { t } = useTranslation();
  const { mood, setMood } = useMood();
  const { settings: a11ySettings } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelDivRef = useRef<HTMLDivElement>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);

  const isContrastMode = a11ySettings.highContrast;

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);

    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const clearScheduledTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const commitMood = useCallback(
    (newMood: MoodKey, options?: { delayBeforeCommit?: number }) => {
      const delayBeforeCommit = options?.delayBeforeCommit ?? 0;

      const runCommit = () => {
        if (newMood !== mood) {
          const overlay = createVhsOverlay(newMood);
          schedule(() => {
            setMood(newMood);
          }, 60);
          schedule(() => {
            overlay.remove();
          }, 200);
          setSpinKey((key) => key + 1);
        }

        closePanel();
      };

      if (delayBeforeCommit > 0) {
        schedule(runCommit, delayBeforeCommit);
      } else {
        runCommit();
      }
    },
    [closePanel, mood, schedule, setMood]
  );

  useEffect(() => {
    return () => {
      clearScheduledTimeouts();
    };
  }, [clearScheduledTimeouts]);

  /* ── Fermer au clic extérieur ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      const targetNode = e.target as Node | null;
      if (
        panelRef.current &&
        !panelRef.current.contains(targetNode) &&
        !(panelDivRef.current && panelDivRef.current.contains(targetNode))
      ) {
        closePanel();
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handle);
    };
  }, [closePanel, isOpen]);

  /* ── Fermer avec Escape ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [closePanel, isOpen]);

  /* —— Position du panneau (portal → coordonnées viewport) —— */
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const updatePanelPosition = () => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      setPanelPos({
        top: Math.max(12, rect.bottom + 12),
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };

    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);

    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !panelDivRef.current) return;
    schedule(() => panelDivRef.current?.focus(), 0);
  }, [isOpen, schedule]);

  const renderDropdownSelector = () => (
    <>
      <div className="mood-panel-title">{t('common.mood.title')}</div>
      {MOOD_ORDER.map((key) => {
        const m = MOODS[key];
        const isActive = key === mood;
        return (
          <button
            key={key}
            className={`mood-option ${isActive ? 'mood-option--active' : ''}`}
            onClick={() => commitMood(key)}
            role="radio"
            aria-checked={isActive}
            style={{ '--mood-color': m.color } as CSSProperties}
          >
            <span className="mood-swatch" style={{ background: m.color }} />
            <span className="mood-label">
              <span className="mood-emoji">{m.emoji}</span> {t(`common.mood.names.${key}`)}
            </span>
            {isActive && (
              <span className="mood-check" aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </>
  );

  const renderActiveSelector = () => {
    const renderers: Record<SelectorMode, () => ReactElement> = {
      dropdown: renderDropdownSelector,
      rotaryCylinder: renderDropdownSelector, // TODO: implement
      hexGrid: renderDropdownSelector, // TODO: implement
      analogTuner: renderDropdownSelector, // TODO: implement
    };

    return renderers[ACTIVE_SELECTOR_MODE]();
  };

  const currentMood = MOODS[mood];
  const currentMoodLabel = t(`common.mood.names.${mood}`);
  const buttonTooltip = isContrastMode
    ? t('common.mood.contrastModeDisabled')
    : t('common.mood.tooltip', { mood: currentMoodLabel });

  return (
    <div className="mood-switcher-wrapper" ref={panelRef}>
      {/* Bouton icône */}
      <Tooltip text={buttonTooltip} position="bottom">
        <button
          className="header-action-btn mood-btn"
          onClick={() => !isContrastMode && setIsOpen((prev) => !prev)}
          aria-label={t('common.mood.ariaLabel')}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          disabled={isContrastMode}
          title={isContrastMode ? t('common.mood.contrastModeDisabled') : undefined}
        >
          <svg
            key={spinKey}
            className={`mood-icon${spinKey > 0 ? ' mood-icon--spin' : ''}`}
            viewBox="0 0 24 24"
            width="17"
            height="17"
            aria-hidden="true"
          >
            {/* Orbe central — couleur = mood actif */}
            <circle
              className="mood-orb"
              cx="12"
              cy="12"
              r="5"
              fill={currentMood.color}
              stroke={currentMood.color}
              strokeWidth="0.5"
              strokeOpacity="0.6"
            />
            {/* 6 satellites orbitaux — hexagone régulier (r=9.5, centre 12,12) */}
            <circle
              className="mood-dot mood-dot--1"
              cx="12"
              cy="2.5"
              r="1.5"
              fill={MOODS.default.color}
              opacity={mood === 'default' ? 1 : 0.35}
            />
            <circle
              className="mood-dot mood-dot--2"
              cx="20.2"
              cy="7.25"
              r="1.5"
              fill={MOODS.hacker.color}
              opacity={mood === 'hacker' ? 1 : 0.35}
            />
            <circle
              className="mood-dot mood-dot--3"
              cx="20.2"
              cy="16.75"
              r="1.5"
              fill={MOODS.vaporwave.color}
              opacity={mood === 'vaporwave' ? 1 : 0.35}
            />
            <circle
              className="mood-dot mood-dot--4"
              cx="12"
              cy="21.5"
              r="1.5"
              fill={MOODS.europa.color}
              opacity={mood === 'europa' ? 1 : 0.35}
            />
            <circle
              className="mood-dot mood-dot--5"
              cx="3.8"
              cy="16.75"
              r="1.5"
              fill={MOODS.industrial.color}
              opacity={mood === 'industrial' ? 1 : 0.35}
            />
            <circle
              className="mood-dot mood-dot--6"
              cx="3.8"
              cy="7.25"
              r="1.5"
              fill={MOODS.nightshade.color}
              opacity={mood === 'nightshade' ? 1 : 0.35}
            />
            {/* Orbite ring */}
            <circle
              cx="12"
              cy="12"
              r="9.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="3 3"
              opacity="0.25"
            />
          </svg>
        </button>
      </Tooltip>

      {/* Panneau de sélection */}
      {isOpen &&
        createPortal(
          <div
            ref={panelDivRef}
            className={`mood-panel mood-panel--${ACTIVE_SELECTOR_MODE}`}
            role="dialog"
            aria-label={t('common.mood.chooseAria')}
            tabIndex={-1}
            style={
              panelPos
                ? {
                    top: `${panelPos.top}px`,
                    right: `${panelPos.right}px`,
                  }
                : {}
            }
          >
            {renderActiveSelector()}
          </div>,
          document.body
        )}
    </div>
  );
};

export default MoodSwitcher;
