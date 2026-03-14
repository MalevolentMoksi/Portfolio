import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { safeSessionGet } from '@/utils/safeStorage.js';

/**
 * FooterWidget — Cycles between three states every 6.5 seconds:
 * 1. Session Timer — elapsed time on portfolio this session
 * 2. Status Badge — portfolio build date
 * 3. Cosmic Satellite — decorative orbiting dot
 */

const CYCLE_INTERVAL = 6500; // 6.5 seconds (slower)
const STATES = ['timer', 'badge', 'orbit'];

/**
 * Format elapsed milliseconds as "5m 24s" or "45s"
 */
const formatElapsedTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

/**
 * Session Timer — shows elapsed time
 */
const SessionTimer = ({ isActive }) => {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = parseInt(safeSessionGet('session-start') || '0', 10);
    if (!startTime || !isActive) return undefined;

    const updateTimer = () => {
      setElapsed(Date.now() - startTime);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div
      className={`footer-widget-state footer-widget-timer${isActive ? ' is-active' : ''}`}
      aria-hidden={!isActive}
      aria-label={t('common.footerWidget.timeOnPortfolio')}
    >
      <span className="footer-widget-icon" aria-hidden="true">
        ⏱
      </span>
      <span className="footer-widget-text">{formatElapsedTime(elapsed)}</span>
    </div>
  );
};

/**
 * Status Badge — shows build/deployment info
 */
const StatusBadge = ({ isActive }) => {
  const { t } = useTranslation();
  // Injected at build time via Vite's define config
  const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'N/A';

  return (
    <div
      className={`footer-widget-state footer-widget-badge${isActive ? ' is-active' : ''}`}
      aria-hidden={!isActive}
      aria-label={t('common.footerWidget.deploymentStatus')}
    >
      <span className="footer-widget-icon" aria-hidden="true">
        ✓
      </span>
      <span className="footer-widget-text">{t('common.footerWidget.lastBuild', { buildDate })}</span>
    </div>
  );
};

/**
 * Cosmic Satellite — multi-orbit system with satellites and depth effects
 */
const CosmicSatellite = ({ isActive, onSpin, orbitBoostKey, isReducedMotion }) => {
  const { t } = useTranslation();
  const shouldBoost = !isReducedMotion && orbitBoostKey > 0;

  return (
    <div
      className={`footer-widget-state footer-widget-orbit${isActive ? ' is-active' : ''}`}
      aria-hidden={!isActive}
      aria-label={t('common.footerWidget.cosmicSatellite')}
    >
      <button
        type="button"
        className="footer-widget-orbit-trigger"
        onClick={onSpin}
        aria-label={t('common.footerWidget.spinOrbit')}
      >
        <svg
          className="footer-widget-orbit-svg"
          viewBox="0 0 40 40"
          width="56"
          height="56"
          aria-hidden="true"
        >
          {/* Outer glow ring (static) */}
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
            opacity="0.08"
          />

          <g
            key={orbitBoostKey}
            className={`footer-widget-orbit-system${shouldBoost ? ' footer-widget-orbit-system--boost' : ''}`}
          >
            {/* Third orbit (outermost) — slowest rotation */}
            <circle
              cx="20"
              cy="20"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.4"
              opacity="0.15"
            />

            {/* Satellite 3a on outermost orbit */}
            <g className="footer-widget-orbit-3">
              <circle cx="20" cy="6" r="0.8" fill="currentColor" opacity="0.7" />
            </g>

            {/* Satellite 3b on outermost orbit (opposite) */}
            <g className="footer-widget-orbit-3">
              <circle cx="20" cy="34" r="0.6" fill="currentColor" opacity="0.4" />
            </g>

            {/* Second orbit (middle) — medium rotation */}
            <circle
              cx="20"
              cy="20"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.25"
            />

            {/* Satellite 2a on middle orbit */}
            <g className="footer-widget-orbit-2">
              <circle cx="20" cy="10" r="1" fill="currentColor" />
            </g>

            {/* Satellite 2b on middle orbit (offset) */}
            <g className="footer-widget-orbit-2">
              <circle cx="30" cy="20" r="0.7" fill="currentColor" opacity="0.6" />
            </g>

            {/* First orbit (innermost) — fastest rotation */}
            <circle
              cx="20"
              cy="20"
              r="6"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
              opacity="0.35"
            />

            {/* Satellite 1 on inner orbit */}
            <g className="footer-widget-orbit-1">
              <circle cx="20" cy="14" r="1.2" fill="currentColor" />
            </g>
          </g>

          {/* Central core — glowing planet */}
          <circle cx="20" cy="20" r="1.5" fill="currentColor" opacity="0.8" />
          <circle
            cx="20"
            cy="20"
            r="2.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
            opacity="0.3"
          />
        </svg>
      </button>
    </div>
  );
};

/**
 * Main widget — cycles through states with fade transitions
 */
const FooterWidget = () => {
  const { t } = useTranslation();
  const [currentState, setCurrentState] = useState('timer');
  const [orbitBoostKey, setOrbitBoostKey] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => {
      setIsReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMotionPreference);
      return () => mediaQuery.removeEventListener('change', updateMotionPreference);
    }

    mediaQuery.addListener(updateMotionPreference);
    return () => mediaQuery.removeListener(updateMotionPreference);
  }, []);

  useEffect(() => {
    if (isReducedMotion) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCurrentState((prev) => {
        const idx = STATES.indexOf(prev);
        return STATES[(idx + 1) % STATES.length];
      });
    }, CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, [isReducedMotion]);

  const handleStateSelect = (state) => {
    setCurrentState(state);
  };

  const handleOrbitSpin = () => {
    setCurrentState('orbit');
    setOrbitBoostKey((prev) => prev + 1);
  };

  return (
    <div className="footer-widget" role="group" aria-label={t('common.footerWidget.widgetLabel')}>
      <div className="footer-widget-stage" role="status" aria-live="polite" aria-atomic="true">
        <SessionTimer isActive={currentState === 'timer'} />
        <StatusBadge isActive={currentState === 'badge'} />
        <CosmicSatellite
          isActive={currentState === 'orbit'}
          onSpin={handleOrbitSpin}
          orbitBoostKey={orbitBoostKey}
          isReducedMotion={isReducedMotion}
        />
      </div>

{/*       <div className="footer-widget-dots" role="group" aria-label={t('common.footerWidget.stateSelector')}>
        {STATES.map((state) => (
          <button
            key={state}
            type="button"
            className={`footer-widget-dot${currentState === state ? ' is-active' : ''}`}
            onClick={() => handleStateSelect(state)}
            aria-label={t(`common.footerWidget.show${state.charAt(0).toUpperCase()}${state.slice(1)}`)}
            aria-pressed={currentState === state}
          />
        ))}
      </div> */}
    </div>
  );
};

export default FooterWidget;
