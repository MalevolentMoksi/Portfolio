/**
 * Music Player Module
 * Handles persistent background music with localStorage state management
 */

import { getAssetPath } from '../utils/assetPath.js';

class MusicPlayer {
  constructor(trackFiles) {
    this.trackFiles = trackFiles;
    this.currentTrackIndex = 0;
    this.audio = new Audio();
    this.isPaused = false;
    this.isLoading = false;
    this.isMuted = false;
    this.savedVolume = 0.7; // Default volume
    
    // Storage keys
    this.STORAGE_KEYS = {
      TRACK_INDEX: 'music-currentTrack',
      CURRENT_TIME: 'music-currentTime',
      IS_PAUSED: 'music-isPaused',
      VOLUME: 'music-volume',
      MUTED: 'music-muted',
    };
    
    // Track metadata cache
    this.trackMeta = trackFiles.map((filename) => this.createFallbackMeta(filename));
    
    // DOM elements (initialized after render)
    this.elements = {};
    
    this.init();
  }
  
  init() {
    this.loadState();
    this.setupAudio();
    this.loadAllMetadata();
    this.render();
    this.attachEventListeners();
  }
  
  loadState() {
    // Load saved track index
    const savedIndex = parseInt(localStorage.getItem(this.STORAGE_KEYS.TRACK_INDEX), 10);
    if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < this.trackFiles.length) {
      this.currentTrackIndex = savedIndex;
    }
    
    // Load saved time
    const savedTime = parseFloat(localStorage.getItem(this.STORAGE_KEYS.CURRENT_TIME));
    this.savedTime = !isNaN(savedTime) && savedTime >= 0 ? savedTime : 0;
    
    // Load paused state
    this.isPaused = localStorage.getItem(this.STORAGE_KEYS.IS_PAUSED) === 'true';
    
    // Load volume state
    const savedVolume = parseFloat(localStorage.getItem(this.STORAGE_KEYS.VOLUME));
    this.savedVolume = !isNaN(savedVolume) && savedVolume >= 0 && savedVolume <= 1 ? savedVolume : 0.7;
    
    // Load muted state
    this.isMuted = localStorage.getItem(this.STORAGE_KEYS.MUTED) === 'true';
  }
  
  setupAudio() {
    this.audio.preload = 'metadata';
    this.audio.src = getAssetPath(`assets/music/${this.trackFiles[this.currentTrackIndex]}`);
    this.audio.muted = true; // Start muted for autoplay policy
    this.audio.volume = this.savedVolume;
    
    // Event listeners
    this.audio.addEventListener('loadstart', () => this.onLoadStart());
    this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('pause', () => this.onPause());
    this.audio.addEventListener('play', () => this.onPlay());
    this.audio.addEventListener('ended', () => this.nextTrack());
    this.audio.addEventListener('error', () => this.onError());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    
    // Save state before unload
    window.addEventListener('beforeunload', () => this.saveState());
    
    // Auto-unmute on user interaction
    document.addEventListener('click', () => this.attemptAutoplay(), { once: true });
  }
  
  onLoadStart() {
    this.isLoading = true;
    this.updateLoadingState();
  }
  
  onError() {
    console.error(`Erreur lors du chargement de la piste: ${this.trackFiles[this.currentTrackIndex]}`);
    this.isLoading = false;
    this.updateLoadingState();
  }
  
  handleKeyboardShortcuts(e) {
    // Évite les raccourcis si on tape dans un input
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    
    switch(e.code) {
      case 'Space':
        e.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.seekRelative(-5); // Reculer de 5 secondes
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.seekRelative(5); // Avancer de 5 secondes
        break;
      case 'KeyM':
        e.preventDefault();
        this.toggleMute();
        break;
      case 'KeyN':
        e.preventDefault();
        this.nextTrack();
        break;
    }
  }
  
  seekRelative(seconds) {
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, this.audio.currentTime + seconds));
  }
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;
    localStorage.setItem(this.STORAGE_KEYS.MUTED, this.isMuted.toString());
    this.updateVolumeButton();
  }
  
  setVolume(value) {
    const volume = Math.max(0, Math.min(1, parseFloat(value)));
    this.audio.volume = volume;
    this.savedVolume = volume;
    localStorage.setItem(this.STORAGE_KEYS.VOLUME, volume.toString());
    
    // Auto-unmute if volume > 0
    if (volume > 0 && this.isMuted) {
      this.toggleMute();
    }
    this.updateVolumeButton();
  }
  
  onLoadedMetadata() {
    // Clamp saved time to duration
    if (this.savedTime >= this.audio.duration) {
      this.savedTime = 0;
    }
    this.audio.currentTime = this.savedTime;
    
    // Attempt autoplay if not paused last session
    if (!this.isPaused) {
      this.audio.play()
        .then(() => {
          setTimeout(() => {
            this.audio.muted = false;
          }, 150);
        })
        .catch(() => {
          // Autoplay blocked, wait for user interaction
        });
    }
  }
  
  // Throttled time update to avoid excessive localStorage writes
  onTimeUpdate() {
    const now = Date.now();
    if (!this.lastSaveTime || now - this.lastSaveTime > 1000) {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_TIME, this.audio.currentTime.toString());
      this.lastSaveTime = now;
    }
    this.updateProgressBar();
  }
  
  onPause() {
    this.isPaused = true;
    localStorage.setItem(this.STORAGE_KEYS.IS_PAUSED, 'true');
    this.updatePlayPauseButton();
  }
  
  onPlay() {
    this.isPaused = false;
    localStorage.setItem(this.STORAGE_KEYS.IS_PAUSED, 'false');
    this.updatePlayPauseButton();
  }
  
  attemptAutoplay() {
    if (!this.isPaused && this.audio.paused) {
      this.audio.play().then(() => {
        this.audio.muted = false;
      }).catch(() => {
        // Still blocked
      });
    }
  }
  
  loadAllMetadata() {
    // Check if jsmediatags is available
    if (typeof window.jsmediatags === 'undefined') {
      console.warn('jsmediatags not loaded, skipping metadata');
      return;
    }
    
    this.trackFiles.forEach((filename, idx) => {
      const url = getAssetPath(`assets/music/${filename}`);

      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          try {
            window.jsmediatags.read(blob, {
              onSuccess: (tag) => {
                this.trackMeta[idx].title = tag.tags.title || this.formatTitle(filename);
                this.trackMeta[idx].artist = tag.tags.artist || 'Unknown Artist';

                // Extract album art
                if (tag.tags.picture) {
                  const { data, format } = tag.tags.picture;
                  let binary = '';
                  for (let i = 0; i < data.length; i++) {
                    binary += String.fromCharCode(data[i]);
                  }
                  const base64String = window.btoa(binary);
                  this.trackMeta[idx].pictureDataURL = `data:${format};base64,${base64String}`;
                }

                if (idx === this.currentTrackIndex) {
                  this.updateTrackInfo();
                }
              },
              onError: (error) => {
                console.warn(`Failed to read metadata for ${filename}:`, error);
                this.trackMeta[idx] = this.createFallbackMeta(filename);
                if (idx === this.currentTrackIndex) {
                  this.updateTrackInfo();
                }
              },
            });
          } catch (error) {
            console.warn(`Failed to initialize metadata reader for ${filename}:`, error);
            this.trackMeta[idx] = this.createFallbackMeta(filename);
            if (idx === this.currentTrackIndex) {
              this.updateTrackInfo();
            }
          }
        })
        .catch((error) => {
          console.warn(`Failed to fetch metadata for ${filename}:`, error);
          this.trackMeta[idx] = this.createFallbackMeta(filename);
          if (idx === this.currentTrackIndex) {
            this.updateTrackInfo();
          }
        });
    });
  }
  
  render() {
    const container = document.createElement('div');
    container.id = 'music-player';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Lecteur de musique');
    
    container.innerHTML = `
      <div class="player-main">
        <img class="album-art" src="" alt="Pochette de l'album" />
        <div class="track-info">
          <div class="text-wrapper">
            <span class="title"></span>
          </div>
          <div class="text-wrapper">
            <span class="artist"></span>
          </div>
          <div class="loading-indicator" style="display: none;">
            <span class="loading-spinner"></span>
            <span class="loading-text">Chargement...</span>
          </div>
        </div>
      </div>
      <div class="controls">
        <button id="play-pause-btn" aria-label="Lecture/Pause" class="icon-btn">
          <svg class="play-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg class="pause-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="display:none;">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        </button>
        <button id="next-btn" aria-label="Piste suivante" class="icon-btn">
          <i class="fa-solid fa-forward-step"></i>
        </button>
        <button id="mute-btn" aria-label="Couper le son" class="icon-btn">
          <i class="fa-solid fa-volume-high volume-high"></i>
          <i class="fa-solid fa-volume-low volume-low" style="display:none;"></i>
          <i class="fa-solid fa-volume-xmark volume-muted" style="display:none;"></i>
        </button>
      </div>
      <div class="volume-control-container" style="display: none;">
        <input type="range" id="volume-slider" class="volume-slider" min="0" max="100" value="70" aria-label="Volume">
      </div>
      <div class="time-display"><span class="current-time">0:00</span> / <span class="duration">0:00</span></div>
      <div class="progress-container" role="progressbar" aria-label="Progression de la piste">
        <div class="progress"></div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Cache DOM elements
    this.elements = {
      container,
      albumArt: container.querySelector('.album-art'),
      title: container.querySelector('.title'),
      artist: container.querySelector('.artist'),
      playPauseBtn: container.querySelector('#play-pause-btn'),
      nextBtn: container.querySelector('#next-btn'),
      muteBtn: container.querySelector('#mute-btn'),
      volumeSlider: container.querySelector('#volume-slider'),
      volumeControlContainer: container.querySelector('.volume-control-container'),
      loadingIndicator: container.querySelector('.loading-indicator'),
      currentTime: container.querySelector('.current-time'),
      duration: container.querySelector('.duration'),
      progressBar: container.querySelector('.progress'),
      progressContainer: container.querySelector('.progress-container'),
    };
    
    this.updateTrackInfo();
    this.updatePlayPauseButton();
    this.updateVolumeButton();
  }
  
  attachEventListeners() {
    this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
    this.elements.muteBtn.addEventListener('click', () => this.toggleMute());
    this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
    this.elements.muteBtn.addEventListener('mouseenter', () => {
      this.elements.volumeControlContainer.style.display = 'block';
    });
    this.elements.volumeControlContainer.addEventListener('mouseleave', () => {
      this.elements.volumeControlContainer.style.display = 'none';
    });
    this.elements.progressContainer.addEventListener('click', (e) => this.seek(e));
  }
  
  updateLoadingState() {
    if (!this.elements.loadingIndicator) return;
    this.elements.loadingIndicator.style.display = this.isLoading ? 'flex' : 'none';
  }
  
  updateVolumeButton() {
    if (!this.elements.muteBtn) return;
    
    const volumeHigh = this.elements.muteBtn.querySelector('.volume-high');
    const volumeLow = this.elements.muteBtn.querySelector('.volume-low');
    const volumeMuted = this.elements.muteBtn.querySelector('.volume-muted');
    
    // Hide all icons first
    volumeHigh.style.display = 'none';
    volumeLow.style.display = 'none';
    volumeMuted.style.display = 'none';
    
    // Show appropriate icon based on volume level
    if (this.isMuted || this.audio.volume === 0) {
      volumeMuted.style.display = 'block';
    } else if (this.audio.volume < 0.33) {
      volumeLow.style.display = 'block';
    } else {
      volumeHigh.style.display = 'block';
    }
    
    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.value = Math.round(this.audio.volume * 100);
    }
  }
  
  formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  togglePlayPause() {
    if (this.audio.paused) {
      this.audio.play().then(() => {
        this.audio.muted = false;
      }).catch(() => {
        // Playback failed
      });
    } else {
      this.isPaused = true;
      localStorage.setItem(this.STORAGE_KEYS.IS_PAUSED, 'true');
      this.audio.pause();
    }
  }
  
  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.trackFiles.length;
    localStorage.setItem(this.STORAGE_KEYS.TRACK_INDEX, this.currentTrackIndex.toString());
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_TIME, '0');
    
    this.audio.src = getAssetPath(`assets/music/${this.trackFiles[this.currentTrackIndex]}`);
    this.updateTrackInfo();
    
    if (!this.isPaused) {
      this.audio.play().catch(() => {
        // Playback failed
      });
    }
  }
  
  seek(event) {
    const rect = this.elements.progressContainer.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    this.audio.currentTime = percent * this.audio.duration;
  }
  
  updateTrackInfo() {
    if (!this.elements.title || !this.elements.artist || !this.elements.albumArt) {
      return;
    }
    const meta = this.trackMeta[this.currentTrackIndex];
    this.elements.title.textContent = meta.title;
    this.elements.artist.textContent = meta.artist;
    this.elements.albumArt.src = meta.pictureDataURL || getAssetPath('assets/images/favicon.svg');
    
    // Apply scrolling animation if text overflows
    this.applyScrollIfOverflow(this.elements.title.parentElement);
    this.applyScrollIfOverflow(this.elements.artist.parentElement);
  }
  
  updatePlayPauseButton() {
    const playIcon = this.elements.playPauseBtn.querySelector('.play-icon');
    const pauseIcon = this.elements.playPauseBtn.querySelector('.pause-icon');
    
    if (this.audio.paused) {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      this.elements.playPauseBtn.setAttribute('aria-label', 'Lecture');
    } else {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      this.elements.playPauseBtn.setAttribute('aria-label', 'Pause');
    }
  }
  
  updateProgressBar() {
    if (!this.elements.progressBar) return;
    if (!this.audio.duration || this.audio.duration === Infinity) return;
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    this.elements.progressBar.style.width = `${percent}%`;
    
    // Update time display
    if (this.elements.currentTime) {
      this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }
    if (this.elements.duration) {
      this.elements.duration.textContent = this.formatTime(this.audio.duration);
    }
  }
  
  onLoadedMetadata() {
    this.isLoading = false;
    this.updateLoadingState();
    
    // Update duration display
    if (this.elements.duration) {
      this.elements.duration.textContent = this.formatTime(this.audio.duration);
    }
    
    // Clamp saved time to duration
    if (this.savedTime >= this.audio.duration) {
      this.savedTime = 0;
    }
    this.audio.currentTime = this.savedTime;
    
    // Attempt autoplay if not paused last session
    if (!this.isPaused) {
      this.audio.play()
        .then(() => {
          setTimeout(() => {
            this.audio.muted = false;
          }, 150);
        })
        .catch(() => {
          // Autoplay blocked, wait for user interaction
        });
    }
  }
  
  applyScrollIfOverflow(wrapper) {
    const element = wrapper.firstElementChild;
    if (element.scrollWidth > wrapper.clientWidth) {
      wrapper.classList.add('scrolling');
      // Duplicate text for seamless loop
      if (!element.dataset.duplicated) {
        element.textContent = element.textContent + '  ' + element.textContent;
        element.dataset.duplicated = 'true';
      }
    } else {
      wrapper.classList.remove('scrolling');
    }
  }
  
  saveState() {
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_TIME, this.audio.currentTime.toString());
    localStorage.setItem(this.STORAGE_KEYS.IS_PAUSED, this.audio.paused.toString());
    localStorage.setItem(this.STORAGE_KEYS.TRACK_INDEX, this.currentTrackIndex.toString());
    localStorage.setItem(this.STORAGE_KEYS.VOLUME, this.audio.volume.toString());
    localStorage.setItem(this.STORAGE_KEYS.MUTED, this.isMuted.toString());
  }

  formatTitle(filename) {
    const baseName = filename.replace(/\.[^/.]+$/, '');
    return baseName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  createFallbackMeta(filename) {
    return {
      title: this.formatTitle(filename),
      artist: 'Unknown Artist',
      pictureDataURL: getAssetPath('assets/images/favicon.svg'),
    };
  }
}

export default MusicPlayer;
