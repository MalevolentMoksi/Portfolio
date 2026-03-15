/**
 * UI Enhancements Module
 * Handles typing effect, email glitch, back-to-top, and video hover
 */

class UIEnhancements {
  private _typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private _typingRunId = 0;
  private _glitchInterval: ReturnType<typeof setInterval> | null = null;
  private _clockInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.initTypingEffect();
    this.initEmailGlitch();
    this.initBackToTop();
    this.initVideoHover();
    this.initFooterClock();
  }

  // Appelé à chaque changement de route (même instance réutilisée)
  reinit(): void {
    this.initTypingEffect();
    this.initVideoHover();
  }

  cancelTypingEffect(): void {
    this._typingRunId += 1;
    if (this._typingTimeout) {
      clearTimeout(this._typingTimeout);
      this._typingTimeout = null;
    }

    const element = document.getElementById('main-title');
    if (!element) return;
    element.style.minHeight = '';
    element.classList.remove('typing');
    element.dataset.typed = 'false';
  }

  private initTypingEffect(): void {
    // Annuler toute animation en cours avant d'en démarrer une nouvelle,
    // pour éviter que deux chaînes de setTimeout tournent en parallèle.
    this.cancelTypingEffect();
    const runId = this._typingRunId;

    const startTyping = (attempt = 0): void => {
      if (runId !== this._typingRunId) return;

      const element = document.getElementById('main-title');
      if (!element) return;

      // Le titre peut être vide pendant un bref instant lors d'un changement
      // de route rapide: réessayer plutôt que de reprendre un ancien texte.
      const fullText = (element.dataset.typingText ?? element.textContent ?? '').trim();
      if (!fullText) {
        if (attempt < 10) {
          this._typingTimeout = setTimeout(() => {
            startTyping(attempt + 1);
          }, 25);
        }
        return;
      }

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

      // When reduced-motion is active (either user-set or auto-detected for
      // low-end devices), skip the letter-by-letter animation entirely and
      // reveal the full text immediately — guaranteed smooth on any device.
      const noMotion =
        document.body?.classList.contains('a11y--no-motion') ||
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (noMotion) {
        element.textContent = fullText;
        element.style.minHeight = '';
        element.classList.remove('typing');
        element.dataset.typed = 'true';
        return;
      }

      let i = 0;
      const typeLetter = (): void => {
        // Ignore callbacks from older runs if route changed mid-animation.
        if (runId !== this._typingRunId || !element.isConnected) {
          return;
        }

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
    };

    startTyping();
  }

  private initEmailGlitch(): void {
    const target = document.querySelector('.local-part') as HTMLElement | null;
    if (!target || target.dataset.glitchInit === 'true') return;
    target.dataset.glitchInit = 'true';

    const GLITCH_LENGTH = 10;
    const GLITCH_CHARS = '\u2588\u2593\u2592\u2591';
    const INTERVAL = 400;

    const randomString = (n: number): string =>
      Array.from(
        { length: n },
        () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      ).join('');

    this._glitchInterval = setInterval(() => {
      target.textContent = randomString(GLITCH_LENGTH);
    }, INTERVAL);
  }

  private initBackToTop(): void {
    const button = document.getElementById('back-to-top');
    if (!button || button.dataset.backToTopInit === 'true') return;
    button.dataset.backToTopInit = 'true';

    // Show/hide based on scroll position
    const toggleVisibility = (): void => {
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

  private initVideoHover(): void {
    const hoverVideos = document.querySelectorAll<HTMLVideoElement>('.hover-play');

    hoverVideos.forEach((video) => {
      if (video.dataset.hoverInit === 'true') return;
      video.dataset.hoverInit = 'true';
      const progressBar = video
        .closest('.video-item')
        ?.querySelector('.progress') as HTMLElement | null;
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

  private initFooterClock(): void {
    const clockElement = document.getElementById('footer-clock');
    if (!clockElement || clockElement.dataset.clockInit === 'true') return;
    clockElement.dataset.clockInit = 'true';

    const updateClock = (): void => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    };

    updateClock();
    this._clockInterval = setInterval(updateClock, 1000);
  }

  destroy(): void {
    if (this._glitchInterval) clearInterval(this._glitchInterval);
    if (this._clockInterval) clearInterval(this._clockInterval);
    this.cancelTypingEffect();
  }
}

export default UIEnhancements;
