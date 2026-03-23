import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type MusicPlayer from '../scripts/music-player';
import type VisualEffects from '../scripts/effects';
import UIEnhancements from '../scripts/ui-enhancements';
import { startFpsMonitor } from '../utils/performanceTier';

let musicPlayerInstance: MusicPlayer | null = null;
let visualEffectsInstance: VisualEffects | null = null;
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

    const cancelSchedule = scheduleWhenPageReady(() => {
      void (async () => {
        const [{ default: MusicPlayerClass }, { default: VisualEffectsClass }] = await Promise.all([
          import('../scripts/music-player'),
          import('../scripts/effects'),
        ]);

        if (cancelled) return;

        if (!musicPlayerInstance) {
          musicPlayerInstance = new MusicPlayerClass(trackFiles);
        }

        if (!visualEffectsInstance) {
          visualEffectsInstance = new VisualEffectsClass();
          // Expose globally for accessibility hook
          window.visualEffectsInstance = visualEffectsInstance;
        }

        // Lancer le monitoring FPS passif (une seule fois par session)
        // Différé pour ne pas rivaliser avec le premier rendu stylé.
        startFpsMonitor();
      })();
    });

    return () => {
      cancelled = true;
      cancelSchedule();
    };
  }, [trackFiles]);

  useLayoutEffect(() => {
    visualEffectsInstance?.pauseForNavigation();

    // Annuler immédiatement toute frappe en cours lors d'un changement de route,
    // pour éviter les écritures tardives sur le titre de la nouvelle page.
    uiEnhancementsInstance?.cancelTypingEffect();

    if (!uiEnhancementsInstance) {
      uiEnhancementsInstance = new UIEnhancements();
    } else {
      uiEnhancementsInstance.reinit();
    }

    let cleanupCancelled = false;
    let lightboxInstance: { destroy?: () => void } | null = null;

    if (document.querySelector('.zoomable')) {
      void import('../scripts/lightbox').then(({ default: Lightbox }) => {
        if (cleanupCancelled) return;
        lightboxInstance = new Lightbox() as { destroy?: () => void };
      });
    }

    const resumeRaf = requestAnimationFrame(() => {
      visualEffectsInstance?.resumeAfterNavigation();
    });

    return () => {
      cleanupCancelled = true;
      cancelAnimationFrame(resumeRaf);
      visualEffectsInstance?.resumeAfterNavigation();
      uiEnhancementsInstance?.cancelTypingEffect();
      lightboxInstance?.destroy?.();
    };
  }, [location.pathname]);

  useLayoutEffect(() => {
    if (!hasHandledInitialLanguageSync.current) {
      hasHandledInitialLanguageSync.current = true;
      return;
    }

    // Language changes update title text outside the typing pipeline; resync
    // cached fragment so the next route transition erases the correct locale.
    uiEnhancementsInstance?.cancelTypingEffect();
    uiEnhancementsInstance?.syncTypingSnapshotFromDom(i18n.resolvedLanguage || 'fr');
  }, [i18n.resolvedLanguage]);
};

export default usePortfolioModules;
