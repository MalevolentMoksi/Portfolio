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
    
    // Storage keys
    this.STORAGE_KEYS = {
      TRACK_INDEX: 'music-currentTrack',
      CURRENT_TIME: 'music-currentTime',
      IS_PAUSED: 'music-isPaused',
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
  }
  
  setupAudio() {
    this.audio.preload = 'metadata';
    this.audio.src = getAssetPath(`assets/music/${this.trackFiles[this.currentTrackIndex]}`);
    this.audio.muted = true; // Start muted for autoplay policy
    
    // Event listeners
    this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('pause', () => this.onPause());
    this.audio.addEventListener('play', () => this.onPlay());
    this.audio.addEventListener('ended', () => this.nextTrack());
    
    // Save state before unload
    window.addEventListener('beforeunload', () => this.saveState());
    
    // Auto-unmute on user interaction
    document.addEventListener('click', () => this.attemptAutoplay(), { once: true });
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
        </div>
      </div>
      <div class="controls">
        <button id="play-pause-btn" aria-label="Lecture/Pause">❚❚</button>
        <button id="next-btn" aria-label="Piste suivante">»</button>
      </div>
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
      progressBar: container.querySelector('.progress'),
      progressContainer: container.querySelector('.progress-container'),
    };
    
    this.updateTrackInfo();
    this.updatePlayPauseButton();
  }
  
  attachEventListeners() {
    this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
    this.elements.progressContainer.addEventListener('click', (e) => this.seek(e));
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
    this.elements.playPauseBtn.textContent = this.audio.paused ? '►' : '❚❚';
    this.elements.playPauseBtn.setAttribute(
      'aria-label',
      this.audio.paused ? 'Lecture' : 'Pause'
    );
  }
  
  updateProgressBar() {
    if (!this.elements.progressBar) return;
    if (!this.audio.duration || this.audio.duration === Infinity) return;
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    this.elements.progressBar.style.width = `${percent}%`;
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
