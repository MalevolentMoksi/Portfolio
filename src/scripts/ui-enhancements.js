/**
 * UI Enhancements Module
 * Handles typing effect, email glitch, back-to-top, and video hover
 */

class UIEnhancements {
  constructor() {
    this.init();
  }

  init() {
    this.initTypingEffect();
    this.initEmailGlitch();
    this.initBackToTop();
    this.initVideoHover();
    this.initFooterClock();
  }

  // Appelé à chaque changement de route (même instance réutilisée)
  reinit() {
    this.initTypingEffect();
    this.initVideoHover();
  }

  initTypingEffect() {
    const element = document.getElementById('main-title');
    if (!element) return;

    // Annuler toute animation en cours avant d'en démarrer une nouvelle,
    // pour éviter que deux chaînes de setTimeout tournent en parallèle.
    if (this._typingTimeout) {
      clearTimeout(this._typingTimeout);
      this._typingTimeout = null;
    }

    // Toujours lire le texte courant défini par React; ne pas réutiliser
    // dataset.originalText qui peut contenir le texte d'une page précédente.
    const currentText = element.textContent.trim();
    const fullText = currentText || element.dataset.originalText || '';
    element.dataset.originalText = fullText;
    if (element.dataset.typedText === fullText && element.dataset.typed === 'true') {
      return;
    }
    element.dataset.typed = 'false';
    element.dataset.typedText = fullText;
    // Pin layout height before clearing to prevent scroll-anchor adjustments
    const measuredH = element.getBoundingClientRect().height;
    if (measuredH > 0) element.style.minHeight = measuredH + 'px';
    element.textContent = '';
    element.classList.add('typing');

    let i = 0;
    const typeLetter = () => {
      if (i <= fullText.length) {
        element.textContent = fullText.slice(0, i);
        i++;
        this._typingTimeout = setTimeout(typeLetter, 50);
      } else {
        this._typingTimeout = null;
        element.style.minHeight = '';
        element.classList.remove('typing');
        element.dataset.typed = 'true';
      }
    };

    typeLetter();
  }

  initEmailGlitch() {
    const target = document.querySelector('.local-part');
    if (!target || target.dataset.glitchInit === 'true') return;
    target.dataset.glitchInit = 'true';

    const GLITCH_LENGTH = 10;
    const GLITCH_CHARS = '█▓▒░';
    const INTERVAL = 400;

    const randomString = (n) =>
      Array.from(
        { length: n },
        () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      ).join('');

    this._glitchInterval = setInterval(() => {
      target.textContent = randomString(GLITCH_LENGTH);
    }, INTERVAL);
  }

  initBackToTop() {
    const button = document.getElementById('back-to-top');
    if (!button || button.dataset.backToTopInit === 'true') return;
    button.dataset.backToTopInit = 'true';

    // Show/hide based on scroll position
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        button.classList.add('show');
      } else {
        button.classList.remove('show');
      }
    };

    // Throttled scroll listener
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          toggleVisibility();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Scroll to top (using CSS scroll-behavior: smooth for global smoothing)
    button.addEventListener('click', () => {
      window.scrollTo(0, 0);
    });

    // Initial check
    toggleVisibility();
  }

  initVideoHover() {
    const hoverVideos = document.querySelectorAll('.hover-play');

    hoverVideos.forEach((video) => {
      if (video.dataset.hoverInit === 'true') return;
      video.dataset.hoverInit = 'true';
      const progressBar = video.closest('.video-item')?.querySelector('.progress');
      if (!progressBar) return;

      video.addEventListener('mouseenter', () => {
        video.play().catch(() => {
          // Playback failed
        });
      });

      video.addEventListener('mouseleave', () => {
        video.pause();
      });

      video.addEventListener('timeupdate', () => {
        if (!video.duration) return;
        const percentage = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percentage}%`;
      });

      video.addEventListener('loadedmetadata', () => {
        progressBar.style.width = '0%';
      });

      // Reset progress on loop
      video.addEventListener('timeupdate', () => {
        if (video.currentTime >= video.duration - 0.05) {
          progressBar.style.width = '0%';
        }
      });
    });

    // Touch device fallback: tap to play
    if ('ontouchstart' in window) {
      hoverVideos.forEach((video) => {
        video.addEventListener('click', () => {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        });
      });
    }
  }

  initFooterClock() {
    const clockElement = document.getElementById('footer-clock');
    if (!clockElement || clockElement.dataset.clockInit === 'true') return;
    clockElement.dataset.clockInit = 'true';

    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    };

    updateClock();
    this._clockInterval = setInterval(updateClock, 1000);
  }

  destroy() {
    clearInterval(this._glitchInterval);
    clearInterval(this._clockInterval);
    if (this._typingTimeout) clearTimeout(this._typingTimeout);
  }
}

export default UIEnhancements;
