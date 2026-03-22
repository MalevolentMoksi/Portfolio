import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPerformanceTier, isTierStoredInSession } from '../utils/performanceTier';
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
    const isFirstDetection = !isTierStoredInSession();
    const tier = getPerformanceTier();

    document.body.setAttribute('data-perf-tier', tier);

    const moodStages = document.querySelectorAll<HTMLElement>('.mood-stage');
    moodStages.forEach((stage) => {
      stage.setAttribute('data-perf-tier', tier);
    });

    if (isFirstDetection && (tier === 'mid' || tier === 'low')) {
      showToast(t(`common.toast.performance.${tier}`), { type: 'warning', duration: 0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default usePerformanceTier;
