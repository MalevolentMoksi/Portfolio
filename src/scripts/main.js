/**
 * Main Application Entry Point
 * Initializes all modules and handles page-wide functionality
 */

import MusicPlayer from './music-player.js';
import VisualEffects from './effects.js';
import UIEnhancements from './ui-enhancements.js';
import Lightbox from './lightbox.js';

class Portfolio {
  constructor() {
    this.trackFiles = ['deepstone.m4a', 'browser.m4a', 'wildriver.m4a'];
    this.init();
  }
  
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initModules());
    } else {
      this.initModules();
    }
  }
  
  initModules() {
    // Initialize music player
    this.musicPlayer = new MusicPlayer(this.trackFiles);
    
    // Initialize visual effects
    this.effects = new VisualEffects();
    
    // Initialize UI enhancements
    this.ui = new UIEnhancements();
    
    // Initialize lightbox (for gallery pages)
    if (document.querySelector('.zoomable')) {
      this.lightbox = new Lightbox();
    }
    
    // Add skip-to-content link for accessibility
    this.addSkipLink();
    
    // Set current page indicator in navigation
    this.setCurrentPage();
  }
  
  addSkipLink() {
    // Check if already exists
    if (document.querySelector('.skip-to-content')) return;
    
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Aller au contenu principal';
    document.body.prepend(skipLink);
    
    // Ensure main has id
    const main = document.querySelector('main');
    if (main && !main.id) {
      main.id = 'main';
    }
  }
  
  setCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach((link) => {
      const linkPath = new URL(link.href).pathname;
      if (currentPath === linkPath || currentPath.endsWith(linkPath)) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }
}

// Initialize application
new Portfolio();
