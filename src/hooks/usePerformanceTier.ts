import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getPerformanceTier,
  subscribePerformanceTierChanges,
  type PerformanceTierChangeDetail,
} from '../utils/performanceTier';
import { useToast } from '../contexts/ToastContext';

/**
 * Detects the device's performance tier once on mount and writes it as a
 * `data-perf-tier` attribute on `<body>`, enabling conditional CSS rules.
 *
 * On the very first detection of the session (not read from cache), if the
 * tier is 'mid' or 'low', an indefinite toast is shown so the user is aware
 * that visual effects have been reduced for their device.
 */
const usePerformanceTier = (): void => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const INITIAL_TOAST_KEY = 'perf-tier-initial-toast-v1';
    const DOWNGRADE_TOAST_KEY_PREFIX = 'perf-tier-downgrade-toast-v1-';

    const maybeShowTierToast = (tier: 'mid' | 'low', storageKey: string): void => {
      try {
        if (sessionStorage.getItem(storageKey)) return;
        sessionStorage.setItem(storageKey, '1');
      } catch {
        // ignore storage errors and still show the toast
      }
      showToast(t(`common.toast.performance.${tier}`), { type: 'warning', duration: 0 });
    };

    const tier = getPerformanceTier();

    if (tier === 'mid' || tier === 'low') {
      maybeShowTierToast(tier, INITIAL_TOAST_KEY);
    }

    const unsubscribe = subscribePerformanceTierChanges((detail: PerformanceTierChangeDetail) => {
      if (detail.reason !== 'fps-monitor') return;

      const hasDegraded =
        (detail.previousTier === 'high' && detail.nextTier !== 'high') ||
        (detail.previousTier === 'mid' && detail.nextTier === 'low');

      if (hasDegraded && (detail.nextTier === 'mid' || detail.nextTier === 'low')) {
        maybeShowTierToast(
          detail.nextTier,
          `${DOWNGRADE_TOAST_KEY_PREFIX}${detail.previousTier}-to-${detail.nextTier}`
        );
      }
    });

    return unsubscribe;
  }, [showToast, t]);
};

export default usePerformanceTier;
