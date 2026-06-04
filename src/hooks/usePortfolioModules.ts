import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UIEnhancements from '../scripts/ui-enhancements';
import { startFpsMonitor } from '../utils/performanceTier';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let musicPlayerInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let visualEffectsInstance: any = null;
let uiEnhancementsInstance: UIEnhancements | null = null;

const scheduleWhenPageReady = (callback: () => void): (() => void) => {
  let firstRaf: number | null = null;
  let secondRaf: number | null = null;

  const run = () => {
    firstRaf = requestAnimationFrame(() => {
      secondRaf = requestAnimationFrame(callback);
    });
  };

  const cancel = () => {
    if (firstRaf !== null) cancelAnimationFrame(firstRaf);
    if (secondRaf !== null) cancelAnimationFrame(secondRaf);
  };

  if (document.readyState === 'complete') {
    run();
    return cancel;
  }

  const handleLoad = () => {
    window.removeEventListener('load', handleLoad);
    run();
  };

  window.addEventListener('load', handleLoad);

  return () => {
    window.removeEventListener('load', handleLoad);
    cancel();
  };
};

const usePortfolioModules = (trackFiles: string[]): void => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const hasHandledInitialLanguageSync = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const cancelSchedule = scheduleWhenPageReady(async () => {
      // Dynamic imports — loaded after first paint, ~0 cost on TTI. The callback is
      // async, so an await can span an unmount; re-check `cancelled` after every await
      // before creating module-level singletons / writing globals.
      if (cancelled) return;
      if (!musicPlayerInstance) {
        const { default: MusicPlayer } = await import('../scripts/music-player');
        if (cancelled) return;
        musicPlayerInstance = new MusicPlayer(trackFiles, i18n);
      }
      if (!visualEffectsInstance) {
        const { default: VisualEffects } = await import('../scripts/effects');
        if (cancelled) return;
        visualEffectsInstance = new VisualEffects();
        // Expose globally for accessibility hook
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).visualEffectsInstance = visualEffectsInstance;
      }

      // Lancer le monitoring FPS passif (une seule fois par session)
      startFpsMonitor();
    });

    return () => {
      cancelled = true;
      cancelSchedule();
      // Tear down the persistent music player so its document/window listeners and
      // MutationObserver don't accumulate across StrictMode re-mounts / HMR reloads.
      // Null it so it is cleanly re-created if the hook re-runs.
      musicPlayerInstance?.destroy?.();
      musicPlayerInstance = null;
    };
  }, [trackFiles]);

  useLayoutEffect(() => {
    // Pause particles while React reconciles the new page
    visualEffectsInstance?.pauseForNavigation?.();

    // Annuler immédiatement toute frappe en cours lors d'un changement de route
    uiEnhancementsInstance?.cancelTypingEffect();

    if (!uiEnhancementsInstance) {
      uiEnhancementsInstance = new UIEnhancements();
    } else {
      uiEnhancementsInstance.reinit();
    }

    // Lazy-load Lightbox only when zoomable images are present
    if (document.querySelector('.zoomable')) {
      import('../scripts/lightbox').then(({ default: Lightbox }) => new Lightbox());
    }

    // Resume particles after the browser has painted the new page
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        visualEffectsInstance?.resumeAfterNavigation?.();
      });
    });

    return () => {
      uiEnhancementsInstance?.cancelTypingEffect();
    };
  }, [location.pathname]);

  useLayoutEffect(() => {
    if (!hasHandledInitialLanguageSync.current) {
      hasHandledInitialLanguageSync.current = true;
      return;
    }

    // Language changes update title text outside the typing pipeline; resync
    uiEnhancementsInstance?.cancelTypingEffect();
    uiEnhancementsInstance?.syncTypingSnapshotFromDom(i18n.resolvedLanguage || 'fr');
  }, [i18n.resolvedLanguage]);
};

export default usePortfolioModules;
