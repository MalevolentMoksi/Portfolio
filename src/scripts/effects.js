/**
 * Visual Effects Module
 * Handles particles, parallax background, and cursor effects
 */

class VisualEffects {
  constructor() {
    this.background = document.getElementById('background');
    this.particlesLoaded = false;
    this.init();
  }

  init() {
    this.initParticles();
    if (this.background) {
      this.initParallax();
    }
  }

  initParticles() {
    // Check if particles.js is loaded
    if (typeof particlesJS === 'undefined') {
      console.warn('particles.js not loaded');
      return;
    }

    // Réduit le nombre de particules sur mobile pour les performances
    const isMobile = window.innerWidth <= 768;
    const particleCount = isMobile ? 40 : 80;

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
          distance: 150,
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
          push: { particles_nb: 4 },
        },
      },
      retina_detect: true,
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
    window.addEventListener('mousemove', (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleMouseMove(e);
          ticking = false;
        });
        ticking = true;
      }
    });

    // Smooth animation loop
    const updateParallax = () => {
      posX += (mouseX - posX) * friction;
      posY += (mouseY - posY) * friction;
      this.background.style.transform = `scale(1.15) translate(${posX}px, ${posY}px)`;
      this.background.style.filter = 'blur(4px)';
      requestAnimationFrame(updateParallax);
    };

    updateParallax();
  }
}

export default VisualEffects;
