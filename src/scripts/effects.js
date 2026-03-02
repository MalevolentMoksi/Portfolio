/**
 * Visual Effects Module
 * Handles particles, parallax background, and cursor effects
 */

import { getPerformanceTier, byTier } from '../utils/performanceTier.js';

class VisualEffects {
  constructor() {
    this.background = document.getElementById('background');
    this.particlesLoaded = false;
    this._parallaxRafId = null;
    this._mouseMoveHandler = null;
    this._visibilityHandler = null;
    this._parallaxRunning = false;
    this.init();
  }

  init() {
    this.initParticles();
    if (this.background) {
      this.initParallax();
    }
  }

  initParticles() {
    // Respecter prefers-reduced-motion : pas de particules
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    // Check if particles.js is loaded
    if (typeof particlesJS === 'undefined') {
      console.warn('particles.js not loaded');
      return;
    }

    const tier = getPerformanceTier();
    const isMobile = window.innerWidth <= 768;

    // Adapter le nombre de particules au tier de performance
    const particleCount = byTier({
      high: isMobile ? 40 : 80,
      mid: isMobile ? 30 : 60,
      low: isMobile ? 20 : 35,
    });

    // retina_detect ON uniquement sur tier 'high' — quadruple la surface canvas sinon
    const retinaDetect = tier === 'high';

    // Réduire la distance de liaison sur low tier (moins de calculs de proximité)
    const linkDistance = byTier({ high: 150, mid: 150, low: 120 });

    particlesJS('particles-js', {
      particles: {
        number: {
          value: particleCount,
          density: { enable: true, value_area: 800 },
        },
        color: { value: '#d4af37' },
        shape: {
          type: 'circle',
          stroke: { width: 0, color: '#000000' },
        },
        opacity: {
          value: 0.7,
          random: true,
          anim: { enable: false },
        },
        size: {
          value: 3,
          random: true,
          anim: { enable: false },
        },
        line_linked: {
          enable: true,
          distance: linkDistance,
          color: '#d4af37',
          opacity: 0.55,
          width: 1,
        },
        move: {
          enable: true,
          speed: 2,
          direction: 'none',
          random: false,
          straight: false,
          out_mode: 'out',
          bounce: false,
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onclick: { enable: true, mode: 'push' },
          resize: true,
        },
        modes: {
          push: { particles_nb: byTier({ high: 4, mid: 3, low: 2 }) },
        },
      },
      retina_detect: retinaDetect,
    });

    this.particlesLoaded = true;

    // Appliquer le mood sauvegardé si les particules viennent de charger
    const currentMood = document.body.getAttribute('data-mood');
    if (currentMood && currentMood !== 'default') {
      this.updateParticlesMood(currentMood);
    }

    // Exposer les fonctions globales pour les composants React
    window.updateParticlesMood = (mood) => this.updateParticlesMood(mood);
  }

  /**
   * Met à jour les couleurs des particules selon le mood actif
   */
  updateParticlesMood(mood) {
    const MOOD_COLORS = {
      default: '#d4af37',
      hacker: '#00ff41',
      vaporwave: '#ff71ce',
    };

    const color = MOOD_COLORS[mood] || MOOD_COLORS.default;

    try {
      const pJS = window.pJSDom?.[0]?.pJS;
      if (!pJS) return;

      // Mettre à jour la config pour les futures particules
      pJS.particles.color.value = color;
      pJS.particles.line_linked.color = color;

      // Convertir hex en RGB
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const rgb = { r, g, b };

      // Mettre à jour chaque particule existante
      pJS.particles.array.forEach((p) => {
        p.color.value = color;
        p.color.rgb = rgb;
      });

      // Mettre à jour la couleur de la config line_linked pour le rendu
      pJS.particles.line_linked.color_rgb_line = rgb;
    } catch (e) {
      console.warn('Impossible de mettre à jour les couleurs des particules:', e);
    }
  }

  initParallax() {
    let mouseX = 0;
    let mouseY = 0;
    let posX = 0;
    let posY = 0;

    const friction = 1 / 12; // Easing factor
    const depth = 0.06; // Movement intensity

    // Track mouse position
    const handleMouseMove = (e) => {
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      mouseX = x * depth;
      mouseY = y * depth;
    };

    // Throttle mousemove for performance
    let ticking = false;
    this._mouseMoveHandler = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleMouseMove(e);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('mousemove', this._mouseMoveHandler);

    // Smooth animation loop — with visibility-aware pause
    const updateParallax = () => {
      posX += (mouseX - posX) * friction;
      posY += (mouseY - posY) * friction;
      this.background.style.transform = `scale(1.15) translate(${posX}px, ${posY}px)`;
      this._parallaxRafId = requestAnimationFrame(updateParallax);
    };

    this._parallaxRunning = true;
    this._parallaxRafId = requestAnimationFrame(updateParallax);

    // Pause la boucle RAF quand l'onglet est masqué (économie CPU)
    this._visibilityHandler = () => {
      if (document.hidden) {
        if (this._parallaxRafId) {
          cancelAnimationFrame(this._parallaxRafId);
          this._parallaxRafId = null;
        }
        this._parallaxRunning = false;
      } else if (!this._parallaxRunning && this.background) {
        this._parallaxRunning = true;
        this._parallaxRafId = requestAnimationFrame(updateParallax);
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  /**
   * Nettoie toutes les ressources (RAF, listeners).
   * Appelé lors du démontage du hook usePortfolioModules.
   */
  destroy() {
    if (this._parallaxRafId) {
      cancelAnimationFrame(this._parallaxRafId);
      this._parallaxRafId = null;
    }
    if (this._mouseMoveHandler) {
      window.removeEventListener('mousemove', this._mouseMoveHandler);
    }
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
    }
    this._parallaxRunning = false;
  }
}

export default VisualEffects;
