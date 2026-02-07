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
    this.isQueueOpen = false; // Track queue menu state
    
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

    // Visualizer state
    this.visualizer = {
      initialized: false,
      rafId: null,
      analyser: null,
      audioContext: null,
      mediaSource: null,
      ctx: null,
      bufferLength: 0,
      dataArray: null,
      width: 0,
      height: 0,
      reducedMotion: false,
    };
    
    this.init();
  }
  
  init() {
    this.loadState();
    this.setupAudio();
    this.loadAllMetadata();
    this.render();
    this.setupVisualizer();
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
    this.stopVisualizer();
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
    this.stopVisualizer();
  }
  
  onPlay() {
    this.isPaused = false;
    localStorage.setItem(this.STORAGE_KEYS.IS_PAUSED, 'false');
    this.updatePlayPauseButton();
    this.startVisualizer();
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
    
    // Fetch all tracks in parallel immediately
    const metadataPromises = this.trackFiles.map((filename, idx) => {
      const url = getAssetPath(`assets/music/${filename}`);
      
      return fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          return new Promise((resolve) => {
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
                  
                  // Refresh queue menu if open to show updated metadata
                  if (this.isQueueOpen) {
                    this.populateQueueMenu();
                  }
                  
                  resolve();
                },
                onError: (error) => {
                  console.warn(`Failed to read metadata for ${filename}:`, error);
                  this.trackMeta[idx] = this.createFallbackMeta(filename);
                  if (idx === this.currentTrackIndex) {
                    this.updateTrackInfo();
                  }
                  if (this.isQueueOpen) {
                    this.populateQueueMenu();
                  }
                  resolve();
                },
              });
            } catch (error) {
              console.warn(`Failed to initialize metadata reader for ${filename}:`, error);
              this.trackMeta[idx] = this.createFallbackMeta(filename);
              if (idx === this.currentTrackIndex) {
                this.updateTrackInfo();
              }
              resolve();
            }
          });
        })
        .catch((error) => {
          console.warn(`Failed to fetch metadata for ${filename}:`, error);
          this.trackMeta[idx] = this.createFallbackMeta(filename);
          if (idx === this.currentTrackIndex) {
            this.updateTrackInfo();
          }
          if (this.isQueueOpen) {
            this.populateQueueMenu();
          }
        });
    });
    
    // Once all metadata completes, refresh queue to show all loaded data
    Promise.all(metadataPromises).then(() => {
      if (this.isQueueOpen) {
        this.populateQueueMenu();
      }
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
      <div class="visualizer" aria-hidden="true">
        <canvas class="music-visualizer"></canvas>
      </div>
      <div class="controls">
        <button id="queue-btn" aria-label="Afficher la file de lecture" class="icon-btn" title="File de lecture">
          <i class="fa-solid fa-list"></i>
        </button>
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
      <div class="queue-menu" style="display: none;">
        <div class="queue-list" role="listbox" aria-label="Liste des pistes">
          <!-- Populated dynamically -->
        </div>
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
      queueBtn: container.querySelector('#queue-btn'),
      muteBtn: container.querySelector('#mute-btn'),
      volumeSlider: container.querySelector('#volume-slider'),
      volumeControlContainer: container.querySelector('.volume-control-container'),
      queueMenu: container.querySelector('.queue-menu'),
      queueList: container.querySelector('.queue-list'),
      loadingIndicator: container.querySelector('.loading-indicator'),
      currentTime: container.querySelector('.current-time'),
      duration: container.querySelector('.duration'),
      progressBar: container.querySelector('.progress'),
      progressContainer: container.querySelector('.progress-container'),
      visualizerCanvas: container.querySelector('.music-visualizer'),
      visualizerContainer: container.querySelector('.visualizer'),
    };
    
    this.updateTrackInfo();
    this.updatePlayPauseButton();
    this.updateVolumeButton();
    this.populateQueueMenu();
  }
  
  attachEventListeners() {
    this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
    this.elements.queueBtn.addEventListener('click', () => this.toggleQueue());
    this.elements.muteBtn.addEventListener('click', () => this.toggleMute());
    this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
    this.elements.muteBtn.addEventListener('mouseenter', () => {
      this.elements.volumeControlContainer.style.display = 'block';
    });
    this.elements.volumeControlContainer.addEventListener('mouseleave', () => {
      this.elements.volumeControlContainer.style.display = 'none';
    });
    this.elements.progressContainer.addEventListener('click', (e) => this.seek(e));
    
    // Close queue menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isQueueOpen && !e.target.closest('#music-player')) {
        this.closeQueue();
      }
    });
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

  setupVisualizer() {
    if (this.visualizer.initialized) return;
    if (!this.elements.visualizerCanvas) return;

    this.visualizer.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.visualizer.ctx = this.elements.visualizerCanvas.getContext('2d');
    this.visualizer.initialized = true;

    this.resizeVisualizer();
    this.renderIdleWave();

    this.visualizer.handleResize = () => this.resizeVisualizer();
    window.addEventListener('resize', this.visualizer.handleResize);
  }

  ensureVisualizerContext() {
    if (this.visualizer.audioContext || this.visualizer.reducedMotion) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.visualizer.audioContext = new AudioContext();
    this.visualizer.analyser = this.visualizer.audioContext.createAnalyser();
    this.visualizer.analyser.fftSize = 2048;
    this.visualizer.analyser.smoothingTimeConstant = 0.75;
    this.visualizer.analyser.minDecibels = -90;
    this.visualizer.analyser.maxDecibels = -5;

    this.visualizer.mediaSource = this.visualizer.audioContext.createMediaElementSource(this.audio);
    this.visualizer.mediaSource.connect(this.visualizer.analyser);
    this.visualizer.analyser.connect(this.visualizer.audioContext.destination);

    this.visualizer.bufferLength = this.visualizer.analyser.frequencyBinCount;
    this.visualizer.dataArray = new Uint8Array(this.visualizer.bufferLength);
    this.visualizer.freqData = new Uint8Array(this.visualizer.bufferLength);
  }

  resizeVisualizer() {
    if (!this.visualizer.ctx || !this.elements.visualizerCanvas) return;

    const rect = this.elements.visualizerCanvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    this.elements.visualizerCanvas.width = Math.floor(width * pixelRatio);
    this.elements.visualizerCanvas.height = Math.floor(height * pixelRatio);
    this.visualizer.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    this.visualizer.width = width;
    this.visualizer.height = height;
    this.renderIdleWave();
  }

  renderIdleWave() {
    if (!this.visualizer.ctx) return;

    const { ctx, width, height } = this.visualizer;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  startVisualizer() {
    if (this.visualizer.reducedMotion) return;
    if (!this.visualizer.ctx) return;

    this.ensureVisualizerContext();
    if (!this.visualizer.analyser || !this.visualizer.dataArray) return;

    if (this.visualizer.audioContext?.state === 'suspended') {
      this.visualizer.audioContext.resume().catch(() => {});
    }

    if (this.visualizer.rafId) return;

    const draw = () => {
      this.visualizer.rafId = window.requestAnimationFrame(draw);
      this.visualizer.analyser.getByteTimeDomainData(this.visualizer.dataArray);
      this.visualizer.analyser.getByteFrequencyData(this.visualizer.freqData);

      const { ctx, width, height, bufferLength, dataArray, freqData } = this.visualizer;
      let sum = 0;

      for (let i = 0; i < bufferLength; i++) {
        sum += freqData[i];
      }

      const energy = Math.min(1, sum / (bufferLength * 180));
      const amplitude = height * (0.2 + energy * 0.9);

      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 2.2 + energy * 2.2;
      ctx.strokeStyle = `rgba(212, 175, 55, ${0.6 + energy * 0.4})`;
      ctx.shadowBlur = 10 + energy * 18;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.85)';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] - 128) / 128;
        const y = height / 2 + v * amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    this.visualizer.rafId = window.requestAnimationFrame(draw);
  }

  stopVisualizer() {
    if (this.visualizer.rafId) {
      window.cancelAnimationFrame(this.visualizer.rafId);
      this.visualizer.rafId = null;
    }
    this.renderIdleWave();
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

  toggleQueue() {
    if (this.isQueueOpen) {
      this.closeQueue();
    } else {
      this.openQueue();
    }
  }

  openQueue() {
    this.isQueueOpen = true;
    this.elements.queueMenu.style.display = 'block';
    this.elements.queueBtn.setAttribute('aria-expanded', 'true');
    this.elements.queueMenu.classList.add('open');
    // Force refresh queue to show latest metadata
    this.populateQueueMenu();
    this.updateQueueHighlight();
  }

  closeQueue() {
    this.isQueueOpen = false;
    this.elements.queueMenu.classList.remove('open');
    this.elements.queueBtn.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      this.elements.queueMenu.style.display = 'none';
    }, 300); // Wait for animation to finish
  }

  populateQueueMenu() {
    if (!this.elements.queueList) return;
    
    this.elements.queueList.innerHTML = this.trackFiles.map((filename, index) => {
      const meta = this.trackMeta[index];
      const isCurrentTrack = index === this.currentTrackIndex;
      const liClass = isCurrentTrack ? 'queue-item current' : 'queue-item';
      
      // Build aria-label from current metadata
      const ariaLabel = isCurrentTrack ? `${meta.title} (actuellement en cours de lecture)` : meta.title;
      
      return `
        <div class="${liClass}" 
             role="option" 
             aria-label="${ariaLabel}"
             data-track-index="${index}" 
             style="cursor: pointer; padding: 8px 10px; border-left: 3px solid transparent; display: flex; align-items: center; gap: 8px;">
          <img src="${meta.pictureDataURL}" alt="" style="width: 40px; height: 40px; border-radius: 4px; flex-shrink: 0; object-fit: cover;">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--color-primary); font-weight: 600; font-size: 0.8rem; flex-shrink: 0;">${index === this.currentTrackIndex ? '▶' : ''}</span>
              <div style="min-width: 0; flex: 1;">
                <div style="font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${meta.title}</div>
                <div style="font-size: 0.8rem; color: rgba(212, 175, 55, 0.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${meta.artist}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Add click listeners to queue items
    this.elements.queueList.querySelectorAll('.queue-item').forEach(item => {
      item.addEventListener('click', () => {
        const trackIndex = parseInt(item.dataset.trackIndex, 10);
        this.selectTrack(trackIndex);
      });
    });
    
    this.updateQueueHighlight();
  }

  selectTrack(trackIndex) {
    if (trackIndex < 0 || trackIndex >= this.trackFiles.length) return;
    
    this.currentTrackIndex = trackIndex;
    localStorage.setItem(this.STORAGE_KEYS.TRACK_INDEX, trackIndex.toString());
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_TIME, '0');
    this.savedTime = 0; // Reset saved time so onLoadedMetadata doesn't restore old time
    
    this.audio.src = getAssetPath(`assets/music/${this.trackFiles[this.currentTrackIndex]}`);
    this.audio.currentTime = 0; // Reset playback to start of track
    this.updateTrackInfo();
    this.populateQueueMenu();
    
    if (!this.isPaused) {
      this.audio.play().catch(() => {
        // Playback failed
      });
    }
  }

  updateQueueHighlight() {
    const queueItems = this.elements.queueList.querySelectorAll('.queue-item');
    queueItems.forEach((item, index) => {
      if (index === this.currentTrackIndex) {
        item.classList.add('current');
        item.style.borderLeftColor = 'var(--color-primary)';
        item.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
      } else {
        item.classList.remove('current');
        item.style.borderLeftColor = 'transparent';
        item.style.backgroundColor = 'transparent';
      }
    });
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
