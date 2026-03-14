/**
 * Visual Effects Module
 * Handles particles, parallax background, and cursor effects
 */

import { getPerformanceTier, byTier } from '../utils/performanceTier';

class VisualEffects {
  private background: HTMLElement | null;
  private _parallaxRafId: number | null;
  private _mouseMoveHandler: ((e: MouseEvent) => void) | null;
  private _visibilityHandler: (() => void) | null;
  private _parallaxRunning: boolean;

  constructor() {
    this.background = document.getElementById('background');
    this._parallaxRafId = null;
    this._mouseMoveHandler = null;
    this._visibilityHandler = null;
    this._parallaxRunning = false;
    this.init();
  }

  private init(): void {
    this.initParticles();
    if (this.background) {
      this.initParallax();
    }
  }

  private initParticles(): void {
    // Respecter prefers-reduced-motion : pas de particules
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    // Check if particles.js is loaded
    if (typeof particlesJS === 'undefined') {
      console.warn('particles.js not loaded');
      return;
    }

    const currentMood: string = document.body.getAttribute('data-mood') || 'default';
    this._applyParticlesConfig(currentMood);

    // Exposer les fonctions globales pour les composants React
    window.updateParticlesMood = (mood: string) => this.updateParticlesMood(mood);
    window.reconfigureParticles = (mood: string) => this.reconfigureParticles(mood);
  }

  /**
   * Construit la config particles.js adaptée au mood.
   * Europa → blizzard horizontal (blanc/cyan, rapide, traits fins)
   * Industrial → cendres flottantes (orange, lent, remontée verticale)
   * Autres → particules dorées classiques (ou recolorées)
   */
  private _getParticlesConfig(mood: string): Record<string, unknown> {
    const tier = getPerformanceTier();
    const isMobile: boolean = window.innerWidth <= 768;
    const retinaDetect: boolean = tier === 'high';
    const enableAnims: boolean = tier !== 'low';

    if (mood === 'europa') {
      // Blizzard horizontal — traits blancs/cyan rapides
      const count = byTier({
        high: isMobile ? 60 : 120,
        mid: isMobile ? 40 : 80,
        low: isMobile ? 25 : 45,
      });
      return {
        particles: {
          number: { value: count, density: { enable: true, value_area: 800 } },
          color: { value: ['#ffffff', '#E0F2FE', '#7DD3FC', '#00E5FF'] },
          shape: { type: 'edge', stroke: { width: 0, color: '#000' } },
          opacity: {
            value: 0.5,
            random: true,
            anim: { enable: enableAnims, speed: 1.2, opacity_min: 0.1, sync: false },
          },
          size: { value: 2.5, random: true, anim: { enable: false } },
          line_linked: { enable: true, distance: 80, color: '#7DD3FC', opacity: 0.08, width: 0.3 },
          move: {
            enable: true,
            speed: byTier({ high: 4, mid: 3, low: 2 }),
            direction: 'left',
            random: true,
            straight: true,
            out_mode: 'out',
            bounce: false,
          },
        },
        interactivity: {
          detect_on: 'canvas',
          events: { onhover: { enable: false }, onclick: { enable: false }, resize: true },
          modes: {},
        },
        retina_detect: retinaDetect,
      };
    }

    if (mood === 'industrial') {
      // Cendres/poussière flottante — orange, lent, montée verticale
      const count = byTier({
        high: isMobile ? 12 : 22,
        mid: isMobile ? 8 : 15,
        low: isMobile ? 5 : 10,
      });
      return {
        particles: {
          number: { value: count, density: { enable: true, value_area: 1200 } },
          color: { value: ['#FF5722', '#FF8A65', '#FFD600', '#BF360C'] },
          shape: { type: 'edge', stroke: { width: 0, color: '#000' } },
          opacity: {
            value: 0.35,
            random: true,
            anim: { enable: enableAnims, speed: 0.4, opacity_min: 0.05, sync: false },
          },
          size: {
            value: 3.2,
            random: true,
            anim: { enable: enableAnims, speed: 0.8, size_min: 0.8, sync: false },
          },
          line_linked: { enable: false },
          move: {
            enable: true,
            speed: byTier({ high: 0.7, mid: 0.5, low: 0.3 }),
            direction: 'top',
            random: true,
            straight: false,
            out_mode: 'out',
            bounce: false,
          },
        },
        interactivity: {
          detect_on: 'canvas',
          events: { onhover: { enable: false }, onclick: { enable: false }, resize: true },
          modes: {},
        },
        retina_detect: retinaDetect,
      };
    }

    // Default / hacker / vaporwave — config classique
    const MOOD_COLORS: Record<string, string> = {
      default: '#d4af37',
      hacker: '#00ff41',
      vaporwave: '#ff71ce',
    };
    const color: string = MOOD_COLORS[mood] || MOOD_COLORS.default;
    const particleCount = byTier({
      high: isMobile ? 42 : 85,
      mid: isMobile ? 30 : 60,
      low: isMobile ? 20 : 35,
    });
    const linkDistance = byTier({ high: 160, mid: 145, low: 120 });

    return {
      particles: {
        number: { value: particleCount, density: { enable: true, value_area: 950 } },
        color: { value: color },
        shape: { type: 'circle', stroke: { width: 0, color: '#000000' } },
        opacity: {
          value: 0.4,
          random: true,
          anim: { enable: enableAnims, speed: 0.6, opacity_min: 0.08, sync: false },
        },
        size: {
          value: 4.8,
          random: true,
          anim: { enable: enableAnims, speed: 1.5, size_min: 1.2, sync: false },
        },
        line_linked: { enable: true, distance: linkDistance, color, opacity: 0.18, width: 0.6 },
        move: {
          enable: true,
          speed: 1,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false,
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: enableAnims, mode: 'grab' },
          onclick: { enable: true, mode: 'push' },
          resize: true,
        },
        modes: {
          grab: { distance: 160, line_linked: { opacity: 0.35 } },
          push: { particles_nb: byTier({ high: 3, mid: 2, low: 1 }) },
        },
      },
      retina_detect: retinaDetect,
    };
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

    const config = this._getParticlesConfig(mood);
    particlesJS('particles-js', config);
  }

  /**
   * Met à jour les couleurs des particules selon le mood actif.
   * Pour les moods standard (default, hacker, vaporwave) — simple recoloration.
   * Pour europa/industrial — délègue à reconfigureParticles() car la physique change.
   */
  updateParticlesMood(mood: string): void {
    // Europa et Industrial nécessitent une reconfiguration complète
    if (mood === 'europa' || mood === 'industrial') {
      this.reconfigureParticles(mood);
      return;
    }

    const MOOD_COLORS: Record<string, string> = {
      default: '#d4af37',
      hacker: '#00ff41',
      vaporwave: '#ff71ce',
      europa: '#00E5FF',
      industrial: '#FF5722',
    };

    const color: string = MOOD_COLORS[mood] || MOOD_COLORS.default;

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

  private initParallax(): void {
    // ── Toggle 3 plans de profondeur ──────────────────────
    // true  = fond + particules bougent à vitesses différentes (3 plans de profondeur)
    // false = comportement original (seul le fond bouge, particules immobiles)
    const PARALLAX_LAYERS_ENABLED = true;

    let mouseX = 0;
    let mouseY = 0;
    let posX = 0;
    let posY = 0;

    const friction: number = 1 / 12; // Easing factor
    const depth: number = 0.06; // Movement intensity
    const particlesDepthRatio: number = 0.5; // Particules bougent 2× moins que le fond
    let particlesPosX = 0;
    let particlesPosY = 0;
    const particlesCanvas: HTMLElement | null = PARALLAX_LAYERS_ENABLED
      ? document.getElementById('particles-js')
      : null;

    // Track mouse position
    const handleMouseMove = (e: MouseEvent): void => {
      const x: number = e.clientX - window.innerWidth / 2;
      const y: number = e.clientY - window.innerHeight / 2;
      mouseX = x * depth;
      mouseY = y * depth;

      // Relancer le RAF s'il s'est arrêté après convergence
      // BUT: ne pas relancer si a11y--no-motion est actif (animation réduite)
      const isNoMotion: boolean = document.body?.classList.contains('a11y--no-motion') ?? false;
      if (isNoMotion && this._parallaxRafId) {
        cancelAnimationFrame(this._parallaxRafId);
        this._parallaxRafId = null;
        this._parallaxRunning = false;
        return;
      }
      if (!this._parallaxRunning && this.background && !isNoMotion) {
        this._parallaxRunning = true;
        this._parallaxRafId = requestAnimationFrame(updateParallax);
      }
    };

    // Throttle mousemove for performance
    let ticking = false;
    this._mouseMoveHandler = (e: MouseEvent): void => {
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
    // Seuil de convergence : en-dessous de cette valeur la différence est
    // sub-pixel et invisible, mais le RAF continuait quand même à tourner
    // à 60 fps en invalidant l'arbre de composition. Le loop redémarre
    // automatiquement sur le prochain mousemove.
    const SETTLE_THRESHOLD = 0.05;

    const updateParallax = (): void => {
      // Check if no-motion is active — stop parallax immediately
      if (document.body?.classList.contains('a11y--no-motion')) {
        this._parallaxRafId = null;
        this._parallaxRunning = false;
        return;
      }

      posX += (mouseX - posX) * friction;
      posY += (mouseY - posY) * friction;
      this.background!.style.transform = `scale(1.15) translate(${posX}px, ${posY}px)`;

      // Plan intermédiaire : particules à demi-profondeur
      if (particlesCanvas) {
        const targetPX: number = mouseX * particlesDepthRatio;
        const targetPY: number = mouseY * particlesDepthRatio;
        particlesPosX += (targetPX - particlesPosX) * friction;
        particlesPosY += (targetPY - particlesPosY) * friction;
        particlesCanvas.style.transform = `scale(1.08) translate(${particlesPosX}px, ${particlesPosY}px)`;
      }

      // Arrêter le RAF quand la position a convergé (aucun mouvement perceptible)
      const bgSettled: boolean =
        Math.abs(mouseX - posX) < SETTLE_THRESHOLD && Math.abs(mouseY - posY) < SETTLE_THRESHOLD;
      const pxSettled: boolean =
        !particlesCanvas ||
        (Math.abs(mouseX * particlesDepthRatio - particlesPosX) < SETTLE_THRESHOLD &&
          Math.abs(mouseY * particlesDepthRatio - particlesPosY) < SETTLE_THRESHOLD);

      if (bgSettled && pxSettled) {
        // Loop en pause — reprendra sur le prochain mousemove
        this._parallaxRafId = null;
        this._parallaxRunning = false;
        return;
      }

      this._parallaxRafId = requestAnimationFrame(updateParallax);
    };

    this._parallaxRunning = true;
    this._parallaxRafId = requestAnimationFrame(updateParallax);

    // Pause la boucle RAF quand l'onglet est masqué (économie CPU)
    this._visibilityHandler = (): void => {
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
  destroy(): void {
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
