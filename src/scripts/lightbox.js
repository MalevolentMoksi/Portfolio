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
      <span id="lightbox-close" aria-label="Fermer">&times;</span>
      <img id="lightbox-img" src="" alt="">
      <p id="lightbox-caption"></p>
    `;
    document.body.appendChild(overlay);
  }
  
  attachListeners() {
    // Zoomable images
    document.querySelectorAll('.zoomable').forEach((img) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => this.open(img));
    });
    
    // Close button
    this.closeBtn.addEventListener('click', () => this.close());
    
    // Click outside to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
        this.close();
      }
    });
  }
  
  open(img) {
    this.img.src = img.src;
    this.img.alt = img.alt;
    
    // Get caption from next element if it exists
    const captionElement = img.nextElementSibling;
    this.caption.textContent = captionElement?.textContent || img.alt || '';
    
    this.overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scroll
  }
  
  close() {
    this.overlay.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scroll
  }
}

export default Lightbox;
