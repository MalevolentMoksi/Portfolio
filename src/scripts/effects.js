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
          value: 0.5,
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
          opacity: 0.4,
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
      requestAnimationFrame(updateParallax);
    };
    
    updateParallax();
  }
}

export default VisualEffects;
