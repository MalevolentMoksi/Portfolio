/**
 * Lightbox Module
 * Handles image zoom functionality for gallery images
 */

class Lightbox {
  constructor() {
    this.overlay = null;
    this.img = null;
    this.caption = null;
    this.closeBtn = null;
    this.currentImageIndex = -1;
    this.galleryImages = [];
    this.init();
  }

  init() {
    // Create lightbox elements if they don't exist
    if (!document.getElementById('lightbox-overlay')) {
      this.createLightbox();
    }

    // Get elements
    this.overlay = document.getElementById('lightbox-overlay');
    this.img = document.getElementById('lightbox-img');
    this.caption = document.getElementById('lightbox-caption');
    this.closeBtn = document.getElementById('lightbox-close');

    // Attach event listeners
    this.attachListeners();
  }

  createLightbox() {
    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.className = 'hidden';
    overlay.innerHTML = `
      <button id="lightbox-close" aria-label="Fermer la lightbox" class="lightbox-close-btn">&times;</button>
      <button id="lightbox-prev" aria-label="Image précédente" class="lightbox-nav lightbox-prev">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      <img id="lightbox-img" src="" alt="">
      <button id="lightbox-next" aria-label="Image suivante" class="lightbox-nav lightbox-next">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
      <p id="lightbox-caption"></p>
    `;
    document.body.appendChild(overlay);
  }

  attachListeners() {
    // Zoomable images
    document.querySelectorAll('.zoomable').forEach((img) => {
      if (img.dataset.lightboxInit === 'true') return;
      img.dataset.lightboxInit = 'true';
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        // Build gallery from all zoomable images in the same container
        const gallery = img.closest('section') || img.closest('article') || document.body;
        this.galleryImages = Array.from(gallery.querySelectorAll('.zoomable'));
        this.currentImageIndex = this.galleryImages.indexOf(img);
        this._triggerElement = img;
        this.open(img);
      });
      // Make zoomable images keyboard-accessible
      if (!img.hasAttribute('tabindex')) img.setAttribute('tabindex', '0');
      if (!img.getAttribute('role')) img.setAttribute('role', 'button');
      if (!img.getAttribute('aria-label')) {
        img.setAttribute('aria-label', `Agrandir : ${img.alt || 'image'}`);
      }
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          img.click();
        }
      });
    });

    // Close button
    if (this.closeBtn && this.closeBtn.dataset.lightboxInit !== 'true') {
      this.closeBtn.dataset.lightboxInit = 'true';
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // Navigation buttons
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    if (prevBtn && prevBtn.dataset.lightboxInit !== 'true') {
      prevBtn.dataset.lightboxInit = 'true';
      prevBtn.addEventListener('click', () => this.showPrevious());
    }
    if (nextBtn && nextBtn.dataset.lightboxInit !== 'true') {
      nextBtn.dataset.lightboxInit = 'true';
      nextBtn.addEventListener('click', () => this.showNext());
    }

    // Click outside to close
    if (this.overlay && this.overlay.dataset.lightboxInit !== 'true') {
      this.overlay.dataset.lightboxInit = 'true';
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    // Keyboard navigation (ESC, Arrow keys)
    if (document.documentElement.dataset.lightboxKeyInit !== 'true') {
      document.documentElement.dataset.lightboxKeyInit = 'true';
      document.addEventListener('keydown', (e) => {
        if (this.overlay.classList.contains('hidden')) return;

        if (e.key === 'Escape') {
          this.close();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.showPrevious();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.showNext();
        } else if (e.key === 'Tab') {
          // Focus trap: keep Tab within lightbox
          const focusable = this.overlay.querySelectorAll(
            'button, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      });
    }
  }

  open(img) {
    this.img.src = img.src;
    this.img.alt = img.alt || '';

    // Get caption from next element if it exists
    const captionElement = img.nextElementSibling;
    this.caption.textContent = captionElement?.textContent || img.alt || '';

    this.overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scroll

    // Move focus into lightbox for keyboard access
    this.closeBtn?.focus();

    // Update nav button visibility
    this.updateNavVisibility();
  }

  close() {
    this.overlay.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scroll
    this.currentImageIndex = -1;
    // Restore focus to the image that triggered the lightbox
    if (this._triggerElement) {
      this._triggerElement.focus();
      this._triggerElement = null;
    }
    this.galleryImages = [];
  }

  showPrevious() {
    if (this.galleryImages.length === 0 || this.currentImageIndex === -1) return;
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
    this.open(this.galleryImages[this.currentImageIndex]);
  }

  showNext() {
    if (this.galleryImages.length === 0 || this.currentImageIndex === -1) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.galleryImages.length;
    this.open(this.galleryImages[this.currentImageIndex]);
  }

  updateNavVisibility() {
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    if (this.galleryImages.length <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    } else {
      if (prevBtn) prevBtn.style.display = 'block';
      if (nextBtn) nextBtn.style.display = 'block';
    }
  }
}

export default Lightbox;
