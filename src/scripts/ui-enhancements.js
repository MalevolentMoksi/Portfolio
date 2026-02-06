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
    this.initViewTransitions();
  }
  
  initTypingEffect() {
    const element = document.getElementById('main-title');
    if (!element) return;
    
    const fullText = element.dataset.originalText || element.textContent;
    element.dataset.originalText = fullText;
    if (element.dataset.typedText === fullText && element.dataset.typed === 'true') {
      return;
    }
    element.dataset.typedText = fullText;
    element.textContent = '';
    element.classList.add('typing');
    
    let i = 0;
    const typeLetter = () => {
      if (i <= fullText.length) {
        element.textContent = fullText.slice(0, i);
        i++;
        setTimeout(typeLetter, 50);
      } else {
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
      Array.from({ length: n }, () =>
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      ).join('');
    
    setInterval(() => {
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
    
    // Smooth scroll to top
    button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
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
    setInterval(updateClock, 1000);
  }
  
  initViewTransitions() {
    // Native View Transition API for Chrome/Edge
    if (!document.startViewTransition) return;
    if (document.documentElement.dataset.spaMode === 'true') return;
    if (document.documentElement.dataset.viewTransitionInit === 'true') return;
    document.documentElement.dataset.viewTransitionInit = 'true';
    
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      const url = new URL(link.href, location);
      
      // Only handle same-origin, not anchors, not new tabs
      if (
        url.origin !== location.origin ||
        link.target === '_blank' ||
        link.href.includes('#') ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      
      e.preventDefault();
      
      document.startViewTransition(() => {
        window.location = link.href;
      });
    });
  }
}

export default UIEnhancements;
