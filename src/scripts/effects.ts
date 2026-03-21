/**
 * Visual Effects Module
 * Handles particles, parallax background, and cursor effects
 */

import {
  getMoodColor,
  getParticlesConfig,
  moodNeedsFullReconfigure,
} from './effects-particles-config';
import ParallaxController from './parallax-controller';

class VisualEffects {
  private background: HTMLElement | null;
  private parallaxController: ParallaxController | null;

  constructor() {
    this.background = document.getElementById('background');
    this.parallaxController = null;
    this.init();
  }

  private init(): void {
    this.initParticles();
    if (this.background) {
      this.parallaxController = new ParallaxController(this.background);
      this.parallaxController.start();
    }
  }

  private initParticles(): void {
    // Respecter prefers-reduced-motion : pas de particules
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    // Pas de particules sur mobile/tactile — coût GPU/batterie prohibitif
    if (window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches) {
      return;
    }

    // Check if particles.js is loaded
    if (typeof particlesJS === 'undefined') {
      console.warn('particles.js not loaded');
      return;
    }

    const currentMood: string =
      document.querySelector('.mood-stage')?.getAttribute('data-mood') ||
      document.body.getAttribute('data-mood') ||
      'default';
    this._applyParticlesConfig(currentMood);

    // Exposer les fonctions globales pour les composants React
    window.updateParticlesMood = (mood: string) => this.updateParticlesMood(mood);
    window.reconfigureParticles = (mood: string) => this.reconfigureParticles(mood);
  }

  /**
   * Applique une config particles.js (destroy puis reinit)
   */
  private _applyParticlesConfig(mood: string): void {
    // Détruire l'instance existante
    try {
      if (window.pJSDom?.[0]?.pJS) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
      }
    } catch {
      /* ignore */
    }

    const config = getParticlesConfig(mood);
    particlesJS('particles-js', config);
  }

  /**
   * Met à jour les couleurs des particules selon le mood actif.
   * Pour les moods standard (default, hacker, vaporwave) — simple recoloration.
   * Pour europa/industrial — délègue à reconfigureParticles() car la physique change.
   */
  updateParticlesMood(mood: string): void {
    if (moodNeedsFullReconfigure(mood)) {
      this.reconfigureParticles(mood);
      return;
    }

    const color = getMoodColor(mood);

    try {
      const pJS = window.pJSDom?.[0]?.pJS;
      if (!pJS) return;

      // Mettre à jour la config pour les futures particules
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pJSAny = pJS as any;
      pJSAny.particles.color.value = color;
      pJSAny.particles.line_linked.color = color;

      // Convertir hex en RGB
      const r: number = parseInt(color.slice(1, 3), 16);
      const g: number = parseInt(color.slice(3, 5), 16);
      const b: number = parseInt(color.slice(5, 7), 16);
      const rgb = { r, g, b };

      // Mettre à jour chaque particule existante
      pJSAny.particles.array.forEach(
        (p: { color: { value: string; rgb: { r: number; g: number; b: number } } }) => {
          p.color.value = color;
          p.color.rgb = rgb;
        }
      );

      // Mettre à jour la couleur de la config line_linked pour le rendu
      pJSAny.particles.line_linked.color_rgb_line = rgb;
    } catch (e) {
      console.warn('Impossible de mettre à jour les couleurs des particules:', e);
    }
  }

  /**
   * Reconfigure complètement particles.js pour un mood donné.
   * Détruit l'instance existante et réinitialise avec la config adaptée.
   * Nécessaire pour europa (blizzard) et industrial (cendres) qui changent
   * la physique des particules, pas seulement les couleurs.
   */
  reconfigureParticles(mood: string): void {
    if (typeof particlesJS === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    this._applyParticlesConfig(mood);
  }

  /**
   * Disable/enable all particle animations based on accessibility noMotion setting.
   * Called when accessibility context's noMotion changes.
   */
  setAnimationsEnabled(enabled: boolean): void {
    if (typeof particlesJS === 'undefined') return;
    try {
      const pJS = (window as any).pJSDOM?.[0]?.pJS;
      if (!pJS) return;

      // Disable/enable animations across all particle properties
      if (pJS.particles?.opacity?.anim) {
        pJS.particles.opacity.anim.enable = enabled;
      }
      if (pJS.particles?.size?.anim) {
        pJS.particles.size.anim.enable = enabled;
      }
      if (pJS.particles?.color?.anim) {
        pJS.particles.color.anim.enable = enabled;
      }
      if (pJS.particles?.move) {
        pJS.particles.move.enable = enabled;
      }
    } catch (e) {
      console.warn('Could not update particle animations:', e);
    }
  }

  /**
   * Nettoie toutes les ressources (RAF, listeners).
   * Appelé lors du démontage du hook usePortfolioModules.
   */
  destroy(): void {
    this.parallaxController?.destroy();
    this.parallaxController = null;
  }
}

export default VisualEffects;
