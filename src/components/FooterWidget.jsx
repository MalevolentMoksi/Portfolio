import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { safeSessionGet } from '@/utils/safeStorage.js';

/**
 * FooterWidget — Cycles between three states every 4.5 seconds:
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
const SessionTimer = () => {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = parseInt(safeSessionGet('session-start') || '0', 10);
    if (!startTime) return;

    const updateTimer = () => {
      setElapsed(Date.now() - startTime);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="footer-widget-state footer-widget-timer"
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
const StatusBadge = () => {
  const { t } = useTranslation();
  // Injected at build time via Vite's define config
  const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'N/A';

  return (
    <div className="footer-widget-state footer-widget-badge" aria-label={t('common.footerWidget.deploymentStatus')}>
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
const CosmicSatellite = () => {
  const { t } = useTranslation();
  return (
    <div className="footer-widget-state footer-widget-orbit" aria-label={t('common.footerWidget.cosmicSatellite')}>
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
    </div>
  );
};

/**
 * Main widget — cycles through states with fade transitions
 */
const FooterWidget = () => {
  const [currentState, setCurrentState] = useState('timer');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentState((prev) => {
        const idx = STATES.indexOf(prev);
        return STATES[(idx + 1) % STATES.length];
      });
    }, CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="footer-widget" role="status" aria-live="polite" aria-atomic="true">
      {currentState === 'timer' && <SessionTimer />}
      {currentState === 'badge' && <StatusBadge />}
      {currentState === 'orbit' && <CosmicSatellite />}
    </div>
  );
};

export default FooterWidget;
