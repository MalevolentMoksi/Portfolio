import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MusicPlayer from '../scripts/music-player.js';
import VisualEffects from '../scripts/effects.js';
import UIEnhancements from '../scripts/ui-enhancements.js';
import Lightbox from '../scripts/lightbox.js';

let musicPlayerInstance = null;
let visualEffectsInstance = null;

const usePortfolioModules = (trackFiles) => {
  const location = useLocation();

  useEffect(() => {
    if (!musicPlayerInstance) {
      musicPlayerInstance = new MusicPlayer(trackFiles);
    }
    if (!visualEffectsInstance) {
      visualEffectsInstance = new VisualEffects();
    }
  }, [trackFiles]);

  useEffect(() => {
    new UIEnhancements();

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
