/**
 * Lightbox Module
 * Handles image zoom functionality for gallery images
 */

class Lightbox {
  private overlay: HTMLElement | null = null;
  private img: HTMLImageElement | null = null;
  private caption: HTMLParagraphElement | null = null;
  private closeBtn: HTMLButtonElement | null = null;
  private currentImageIndex = -1;
  private galleryImages: HTMLElement[] = [];
  private _triggerElement: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // Create lightbox elements if they don't exist
    if (!document.getElementById('lightbox-overlay')) {
      this.createLightbox();
    }

    // Get elements
    this.overlay = document.getElementById('lightbox-overlay');
    this.img = document.getElementById('lightbox-img') as HTMLImageElement | null;
    this.caption = document.getElementById('lightbox-caption') as HTMLParagraphElement | null;
    this.closeBtn = document.getElementById('lightbox-close') as HTMLButtonElement | null;

    // Attach event listeners
    this.attachListeners();
  }

  private createLightbox(): void {
    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.className = 'hidden';
    overlay.innerHTML = `
      <button id="lightbox-close" aria-label="Fermer la lightbox" class="lightbox-close-btn">&times;</button>
      <button id="lightbox-prev" aria-label="Image pr\u00e9c\u00e9dente" class="lightbox-nav lightbox-prev">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <img id="lightbox-img" src="" alt="">
      <button id="lightbox-next" aria-label="Image suivante" class="lightbox-nav lightbox-next">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <p id="lightbox-caption"></p>
    `;
    document.body.appendChild(overlay);
  }

  private attachListeners(): void {
    // Zoomable images
    document.querySelectorAll<HTMLElement>('.zoomable').forEach((img) => {
      if (img.dataset.lightboxInit === 'true') return;
      img.dataset.lightboxInit = 'true';
      (img as HTMLElement).style.cursor = 'pointer';
      img.addEventListener('click', () => {
        // Build gallery from all zoomable images in the same container
        const gallery = img.closest('section') || img.closest('article') || document.body;
        this.galleryImages = Array.from(gallery.querySelectorAll<HTMLElement>('.zoomable'));
        this.currentImageIndex = this.galleryImages.indexOf(img);
        this._triggerElement = img;
        this.open(img as HTMLImageElement);
      });
      // Make zoomable images keyboard-accessible
      if (!img.hasAttribute('tabindex')) img.setAttribute('tabindex', '0');
      if (!img.getAttribute('role')) img.setAttribute('role', 'button');
      if (!img.getAttribute('aria-label')) {
        img.setAttribute('aria-label', `Agrandir : ${(img as HTMLImageElement).alt || 'image'}`);
      }
      img.addEventListener('keydown', (e: KeyboardEvent) => {
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
    const prevBtn = document.getElementById('lightbox-prev') as HTMLButtonElement | null;
    const nextBtn = document.getElementById('lightbox-next') as HTMLButtonElement | null;
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
      this.overlay.addEventListener('click', (e: MouseEvent) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    // Keyboard navigation (ESC, Arrow keys)
    if (document.documentElement.dataset.lightboxKeyInit !== 'true') {
      document.documentElement.dataset.lightboxKeyInit = 'true';
      document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (!this.overlay || this.overlay.classList.contains('hidden')) return;

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
          const focusable = this.overlay.querySelectorAll<HTMLElement>(
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

  private open(img: HTMLImageElement): void {
    if (!this.img || !this.caption || !this.overlay || !this.closeBtn) return;

    // Prefer the full-resolution source (set via data-full) so the grid can use a
    // lightweight thumbnail while the lightbox still shows the original artwork.
    this.img.src = img.dataset.full || img.src;
    this.img.decoding = 'async';
    this.img.alt = img.alt || '';

    // Get caption from next element if it exists
    const captionElement = img.nextElementSibling;
    this.caption.textContent = captionElement?.textContent || img.alt || '';

    this.overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scroll

    // Move focus into lightbox for keyboard access
    this.closeBtn.focus();

    // Update nav button visibility
    this.updateNavVisibility();
  }

  private close(): void {
    if (!this.overlay) return;

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

  private showPrevious(): void {
    if (this.galleryImages.length === 0 || this.currentImageIndex === -1) return;
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
    this.open(this.galleryImages[this.currentImageIndex] as HTMLImageElement);
  }

  private showNext(): void {
    if (this.galleryImages.length === 0 || this.currentImageIndex === -1) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.galleryImages.length;
    this.open(this.galleryImages[this.currentImageIndex] as HTMLImageElement);
  }

  private updateNavVisibility(): void {
    const prevBtn = document.getElementById('lightbox-prev') as HTMLElement | null;
    const nextBtn = document.getElementById('lightbox-next') as HTMLElement | null;

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
