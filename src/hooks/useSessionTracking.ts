import { useEffect } from 'react';
import { touchAnalyticsSessionActivity, upsertAnalyticsSession } from '../utils/analyticsSession';

/**
 * Tracks visit sessions with a rolling 30-minute inactivity timeout.
 * Uses localStorage to preserve a single session across tabs.
 */
const useSessionTracking = (pathname: string): void => {
  useEffect(() => {
    let lastTouchMs = 0;

    const touchActivity = () => {
      const now = Date.now();
      // Throttle writes to avoid excessive storage churn on frequent events.
      if (now - lastTouchMs < 10000) return;
      lastTouchMs = now;
      touchAnalyticsSessionActivity();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        touchActivity();
      }
    };

    const passive: AddEventListenerOptions = { passive: true };
    window.addEventListener('pointerdown', touchActivity, passive);
    window.addEventListener('keydown', touchActivity, passive);
    window.addEventListener('scroll', touchActivity, passive);
    window.addEventListener('touchstart', touchActivity, passive);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    touchActivity();

    return () => {
      window.removeEventListener('pointerdown', touchActivity);
      window.removeEventListener('keydown', touchActivity);
      window.removeEventListener('scroll', touchActivity);
      window.removeEventListener('touchstart', touchActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    upsertAnalyticsSession(pathname);
  }, [pathname]);
};

export default useSessionTracking;
