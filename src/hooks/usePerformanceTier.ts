import { useEffect } from 'react';
import { getPerformanceTier } from '../utils/performanceTier';

/**
 * Detects the device's performance tier once on mount and writes it as a
 * `data-perf-tier` attribute on `<body>`, enabling conditional CSS rules.
 */
const usePerformanceTier = (): void => {
  useEffect(() => {
    const tier = getPerformanceTier();
    document.body.setAttribute('data-perf-tier', tier);

    const moodStages = document.querySelectorAll<HTMLElement>('.mood-stage');
    moodStages.forEach((stage) => {
      stage.setAttribute('data-perf-tier', tier);
    });
  }, []);
};

export default usePerformanceTier;
