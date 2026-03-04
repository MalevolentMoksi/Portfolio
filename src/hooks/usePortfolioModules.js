import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MusicPlayer from '../scripts/music-player.js';
import VisualEffects from '../scripts/effects.js';
import UIEnhancements from '../scripts/ui-enhancements.js';
import Lightbox from '../scripts/lightbox.js';
import { startFpsMonitor } from '../utils/performanceTier.js';

let musicPlayerInstance = null;
let visualEffectsInstance = null;
let uiEnhancementsInstance = null;

const usePortfolioModules = (trackFiles) => {
  const location = useLocation();

  useEffect(() => {
    if (!musicPlayerInstance) {
      musicPlayerInstance = new MusicPlayer(trackFiles);
    }
    if (!visualEffectsInstance) {
      visualEffectsInstance = new VisualEffects();
    }

    // Lancer le monitoring FPS passif (une seule fois par session)
    // Différé de 2s pour ne pas rivaliser avec l'hydratation React
    startFpsMonitor();
  }, [trackFiles]);

  useEffect(() => {
    if (!uiEnhancementsInstance) {
      uiEnhancementsInstance = new UIEnhancements();
    } else {
      uiEnhancementsInstance.reinit();
    }

    // Différer au frame suivant pour que React ait fini de peupler le DOM
    const raf = requestAnimationFrame(() => {
      if (document.querySelector('.zoomable')) {
        new Lightbox();
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);
};

export default usePortfolioModules;
