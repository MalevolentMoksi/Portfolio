/**
 * Music Player Module
 * Handles persistent background music with localStorage state management
 */

import { getAssetPath } from '../utils/assetPath';
import { isLowTier } from '../utils/performanceTier';
import { safeLocalGet, safeLocalSet } from '../utils/safeStorage';

interface StorageKeys {
  TRACK_INDEX: string;
  CURRENT_TIME: string;
  IS_PAUSED: string;
  VOLUME: string;
  MUTED: string;
  RETRACTED: string;
}

interface TrackMeta {
  title: string;
  artist: string;
  pictureDataURL: string;
}

interface MusicPlayerElements {
  container: HTMLDivElement;
  albumArt: HTMLImageElement;
  title: HTMLSpanElement;
  artist: HTMLSpanElement;
  playPauseBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  queueBtn: HTMLButtonElement;
  muteBtn: HTMLButtonElement;
  retractBtn: HTMLButtonElement;
  peekBtn: HTMLButtonElement;
  volumeSlider: HTMLInputElement;
  volumeWrapper: HTMLDivElement;
  volumePopup: HTMLDivElement;
  volumeFill: HTMLDivElement;
  queueMenu: HTMLDivElement;
  queueList: HTMLDivElement;
  loadingIndicator: HTMLDivElement;
  currentTime: HTMLSpanElement;
  duration: HTMLSpanElement;
  progressBar: HTMLDivElement;
  progressContainer: HTMLDivElement;
  visualizerCanvas: HTMLCanvasElement;
  visualizerContainer: HTMLDivElement;
}

interface VisualizerState {
  initialized: boolean;
  rafId: number | null;
  analyser: AnalyserNode | null;
  audioContext: AudioContext | null;
  mediaSource: MediaElementAudioSourceNode | null;
  ctx: CanvasRenderingContext2D | null;
  bufferLength: number;
  dataArray: Uint8Array<ArrayBuffer> | null;
  freqData: Uint8Array<ArrayBuffer> | null;
  width: number;
  height: number;
  reducedMotion: boolean;
  handleResize?: () => void;
}

/* ── Inline SVG icons (replaces Font Awesome CDN) ── */
const ICON_CHEVRON_LEFT =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>';
const ICON_CHEVRON_RIGHT =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>';
const ICON_LIST =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M40 48C26.7 48 16 58.7 16 72v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V72c0-13.3-10.7-24-24-24H40zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zM16 232v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V232c0-13.3-10.7-24-24-24H40c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V392c0-13.3-10.7-24-24-24H40z"/></svg>';
const ICON_FORWARD_STEP =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416V96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4L224 214.3V96c0-17.7 14.3-32 32-32s32 14.3 32 32V416c0 17.7-14.3 32-32 32s-32-14.3-32-32V297.7L52.5 440.6z"/></svg>';
const ICON_VOLUME_HIGH =
  '<svg class="volume-high" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M533.6 32.5C598.5 85.2 640 165.8 640 256s-41.5 170.7-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.6 34.4-5.3z"/></svg>';
const ICON_VOLUME_LOW =
  '<svg class="volume-low" style="display:none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.6 34.4-5.3zM412.6 181.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5z"/></svg>';
const ICON_VOLUME_MUTED =
  '<svg class="volume-muted" style="display:none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.6 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z"/></svg>';

class MusicPlayer {
  private trackFiles: string[];
  private currentTrackIndex: number;
  private audio: HTMLAudioElement;
  private isPaused: boolean;
  private isLoading: boolean;
  private isMuted: boolean;
  private savedVolume: number;
  private isQueueOpen: boolean;
  private isRetracted: boolean;
  private metadataLoaded: boolean;
  private metadataTracksLoaded: Set<number>;
  private savedTime: number;
  private lastSaveTime: number | null;
  private readonly STORAGE_KEYS: StorageKeys;
  private trackMeta: TrackMeta[];
  private elements!: MusicPlayerElements;
  private visualizer: VisualizerState;

  constructor(trackFiles: string[]) {
    this.trackFiles = Array.isArray(trackFiles) ? trackFiles : [];
    this.currentTrackIndex = this.getPreferredDefaultTrackIndex();
    this.audio = new Audio();
    this.isPaused = false;
    this.isLoading = false;
    this.isMuted = false;
    this.savedVolume = 0.7; // Default volume
    this.isQueueOpen = false; // Track queue menu state
    this.isRetracted = false; // Track retract/collapse state
    this.metadataLoaded = false;
    this.metadataTracksLoaded = new Set<number>();
    this.savedTime = 0;
    this.lastSaveTime = null;

    // Storage keys
    this.STORAGE_KEYS = {
      TRACK_INDEX: 'music-currentTrack',
      CURRENT_TIME: 'music-currentTime',
      IS_PAUSED: 'music-isPaused',
      VOLUME: 'music-volume',
      MUTED: 'music-muted',
      RETRACTED: 'music-retracted',
    };

    // Track metadata cache
    this.trackMeta = this.trackFiles.map((filename) => this.createFallbackMeta(filename));

    // DOM elements (initialized after render)
    this.elements = {} as MusicPlayerElements;

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
      freqData: null,
      width: 0,
      height: 0,
      reducedMotion: false,
    };

    this.init();
  }

  private getPreferredDefaultTrackIndex(): number {
    if (!this.trackFiles.length) return 0;
    const lunarIndex = this.trackFiles.findIndex((filename) => /lunar/i.test(filename));
    return lunarIndex >= 0 ? lunarIndex : 0;
  }

  private parseStoredBoolean(value: string | null, fallbackValue: boolean): boolean {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallbackValue;
  }

  private isStoredBoolean(value: string | null): boolean {
    return value === 'true' || value === 'false';
  }

  private init(): void {
    this.loadState();
    this.setupAudio();
    this.render();
    this.setupVisualizer();
    this.scheduleCurrentTrackMetadataLoad();
    this.attachEventListeners();
    this.setupMoodListener();
  }

  private loadState(): void {
    // Load saved track index
    const savedIndex = parseInt(safeLocalGet(this.STORAGE_KEYS.TRACK_INDEX) ?? '', 10);
    if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < this.trackFiles.length) {
      this.currentTrackIndex = savedIndex;
    }

    // Load saved time
    const savedTime = parseFloat(safeLocalGet(this.STORAGE_KEYS.CURRENT_TIME) ?? '');
    this.savedTime = !isNaN(savedTime) && savedTime >= 0 ? savedTime : 0;

    // Load paused state
    // Première visite (clé absente) => lecteur arrêté par défaut (pas d'autoplay).
    const savedPausedState = safeLocalGet(this.STORAGE_KEYS.IS_PAUSED);
    this.isPaused = this.parseStoredBoolean(savedPausedState, true);
    if (!this.isStoredBoolean(savedPausedState)) {
      safeLocalSet(this.STORAGE_KEYS.IS_PAUSED, this.isPaused.toString());
    }

    // Load volume state
    const savedVolume = parseFloat(safeLocalGet(this.STORAGE_KEYS.VOLUME) ?? '');
    this.savedVolume =
      !isNaN(savedVolume) && savedVolume >= 0 && savedVolume <= 1 ? savedVolume : 0.7;

    // Load muted state
    const savedMutedState = safeLocalGet(this.STORAGE_KEYS.MUTED);
    this.isMuted = this.parseStoredBoolean(savedMutedState, false);
    if (!this.isStoredBoolean(savedMutedState)) {
      safeLocalSet(this.STORAGE_KEYS.MUTED, this.isMuted.toString());
    }

    // Load retracted state — caché par défaut à la première visite
    const savedRetracted = safeLocalGet(this.STORAGE_KEYS.RETRACTED);
    this.isRetracted = this.parseStoredBoolean(savedRetracted, true);
    if (!this.isStoredBoolean(savedRetracted)) {
      safeLocalSet(this.STORAGE_KEYS.RETRACTED, this.isRetracted.toString());
    }
  }

  private setupAudio(): void {
    if (!this.trackFiles.length) {
      this.isPaused = true;
      return;
    }

    // Avoid early media downloads on first paint: only attach src immediately
    // when playback should resume from a previous session.
    this.audio.preload = this.isPaused ? 'none' : 'metadata';
    if (!this.isPaused) {
      this.ensureAudioSourceLoaded();
    }
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

  private getCurrentTrackUrl(): string {
    return getAssetPath(`assets/music/${this.trackFiles[this.currentTrackIndex]}`);
  }

  private ensureAudioSourceLoaded(): void {
    if (!this.trackFiles.length) return;

    const targetSrc = this.getCurrentTrackUrl();
    const absoluteTarget = new URL(targetSrc, window.location.origin).href;
    if (this.audio.src !== absoluteTarget) {
      this.audio.src = targetSrc;
    }
  }

  private scheduleCurrentTrackMetadataLoad(): void {
    if (!this.trackFiles.length) return;

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    };

    const start = () => {
      if (typeof idleWindow.requestIdleCallback === 'function') {
        idleWindow.requestIdleCallback(
          () => this.loadTrackMetadataForIndex(this.currentTrackIndex),
          {
            timeout: 2500,
          }
        );
        return;
      }
      setTimeout(() => this.loadTrackMetadataForIndex(this.currentTrackIndex), 1200);
    };

    if (document.readyState === 'complete') {
      start();
      return;
    }

    window.addEventListener('load', start, { once: true });
  }

  private loadTrackMetadataForIndex(trackIndex: number): void {
    if (!this.trackFiles.length) return;
    if (trackIndex < 0 || trackIndex >= this.trackFiles.length) return;
    if (this.metadataTracksLoaded.has(trackIndex)) return;

    this.metadataTracksLoaded.add(trackIndex);

    const filename = this.trackFiles[trackIndex];
    const relUrl = getAssetPath(`assets/music/${filename}`);
    const url = relUrl.startsWith('http') ? relUrl : window.location.origin + relUrl;
    const maxAttempts = 3;

    const read = async (attempt: number) => {
      try {
        const jsmediatags = await import('jsmediatags');
        jsmediatags.default?.read(url, {
          onSuccess: (tag: JsMediaTagsResult) => {
            this.trackMeta[trackIndex].title = tag.tags.title || this.formatTitle(filename);
            this.trackMeta[trackIndex].artist = tag.tags.artist || 'Unknown Artist';

            if (tag.tags.picture) {
              const { data, format } = tag.tags.picture;
              let binary = '';
              for (let i = 0; i < data.length; i++) {
                binary += String.fromCharCode(data[i]);
              }
              const base64String = window.btoa(binary);
              this.trackMeta[trackIndex].pictureDataURL = `data:${format};base64,${base64String}`;
            }

            if (trackIndex === this.currentTrackIndex && this.elements.title) {
              this.updateTrackInfo();
            }

            if (this.isQueueOpen && this.elements.queueList) {
              this.populateQueueMenu();
            }
          },
          onError: (error: { type: string; info: string }) => {
            if (attempt < maxAttempts - 1) {
              const retryDelay = (attempt + 1) * 350;
              window.setTimeout(() => read(attempt + 1), retryDelay);
              return;
            }

            console.warn(`Failed to read metadata for ${filename}:`, error);
            this.trackMeta[trackIndex] = this.createFallbackMeta(filename);
            if (trackIndex === this.currentTrackIndex && this.elements.title) {
              this.updateTrackInfo();
            }
            if (this.isQueueOpen && this.elements.queueList) {
              this.populateQueueMenu();
            }
          },
        });
      } catch (error: unknown) {
        if (attempt < maxAttempts - 1) {
          const retryDelay = (attempt + 1) * 350;
          window.setTimeout(() => read(attempt + 1), retryDelay);
          return;
        }

        console.warn(`Failed to initialize metadata reader for ${filename}:`, error);
        this.trackMeta[trackIndex] = this.createFallbackMeta(filename);
        if (trackIndex === this.currentTrackIndex && this.elements.title) {
          this.updateTrackInfo();
        }
      }
    };

    read(0);
  }

  private onLoadStart(): void {
    this.isLoading = true;
    this.updateLoadingState();
  }

  private onError(): void {
    console.error(
      `Erreur lors du chargement de la piste: ${this.trackFiles[this.currentTrackIndex]}`
    );
    this.isLoading = false;
    this.updateLoadingState();
    this.stopVisualizer();
    window.showToast?.('Impossible de charger la piste audio', { type: 'error', duration: 4000 });
  }

  private handleKeyboardShortcuts(e: KeyboardEvent): void {
    const target = e.target as Element | null;
    if (!target) return;

    // Évite les raccourcis si on tape dans un input ou si le focus est sur un élément interactif
    if (
      target.matches(
        'input, textarea, select, button, a, [contenteditable], [role="textbox"], [role="searchbox"]'
      )
    )
      return;
    // Évite les raccourcis si le focus est dans un dialog (terminal, lightbox, etc.)
    if (target.closest('[role="dialog"]')) return;

    switch (e.code) {
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

  private seekRelative(seconds: number): void {
    this.audio.currentTime = Math.max(
      0,
      Math.min(this.audio.duration, this.audio.currentTime + seconds)
    );
  }

  private toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;
    safeLocalSet(this.STORAGE_KEYS.MUTED, this.isMuted.toString());
    this.updateVolumeButton();
  }

  private setVolume(value: string | number): void {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(parsed)) return;

    const volume = Math.max(0, Math.min(1, parsed));
    this.audio.volume = volume;
    this.savedVolume = volume;
    safeLocalSet(this.STORAGE_KEYS.VOLUME, volume.toString());

    // Auto-unmute if volume > 0
    if (volume > 0 && this.isMuted) {
      this.toggleMute();
    }
    this.updateVolumeButton();
  }

  // Throttled time update to avoid excessive localStorage writes
  private onTimeUpdate(): void {
    const now = Date.now();
    if (!this.lastSaveTime || now - this.lastSaveTime > 1000) {
      safeLocalSet(this.STORAGE_KEYS.CURRENT_TIME, this.audio.currentTime.toString());
      this.lastSaveTime = now;
    }
    this.updateProgressBar();
  }

  private onPause(): void {
    this.isPaused = true;
    safeLocalSet(this.STORAGE_KEYS.IS_PAUSED, 'true');
    this.updatePlayPauseButton();
    this.stopVisualizer();
  }

  private onPlay(): void {
    this.isPaused = false;
    safeLocalSet(this.STORAGE_KEYS.IS_PAUSED, 'false');
    this.updatePlayPauseButton();
    this.startVisualizer();
  }

  private attemptAutoplay(): void {
    if (!this.isPaused && this.audio.paused) {
      this.ensureAudioSourceLoaded();
      this.audio
        .play()
        .then(() => {
          if (!this.isMuted) this.audio.muted = false;
        })
        .catch(() => {
          // Still blocked
        });
    }
  }

  private loadAllMetadata(): void {
    if (this.metadataLoaded || !this.trackFiles.length) {
      return;
    }

    // Check if jsmediatags is available
    this.metadataLoaded = true;

    // jsmediatags.read() accepte une URL directement : il utilise des requêtes
    // HTTP Range pour ne télécharger que les octets des tags ID3, sans récupérer
    // l'intégralité du fichier audio.

    const loadTrack = (filename: string, idx: number, attempt = 0): Promise<void> => {
      if (this.metadataTracksLoaded.has(idx)) {
        return Promise.resolve();
      }

      const relUrl = getAssetPath(`assets/music/${filename}`);
      // jsmediatags XhrFileReader requires an absolute URL (http/https)
      const url = relUrl.startsWith('http') ? relUrl : window.location.origin + relUrl;
      const maxAttempts = 3;

      return new Promise<void>(async (resolve) => {
        try {
          const jsmediatags = await import('jsmediatags');
          jsmediatags.default?.read(url, {
            onSuccess: (tag: JsMediaTagsResult) => {
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

              if (idx === this.currentTrackIndex && this.elements.title) {
                this.updateTrackInfo();
              }

              // Refresh queue menu if open to show updated metadata
              if (this.isQueueOpen && this.elements.queueList) {
                this.populateQueueMenu();
              }

              this.metadataTracksLoaded.add(idx);

              resolve();
            },
            onError: (error: { type: string; info: string }) => {
              if (attempt < maxAttempts - 1) {
                const retryDelay = (attempt + 1) * 350;
                window.setTimeout(() => {
                  loadTrack(filename, idx, attempt + 1).then(resolve, resolve);
                }, retryDelay);
                return;
              }

              console.warn(`Failed to read metadata for ${filename}:`, error);
              this.trackMeta[idx] = this.createFallbackMeta(filename);
              if (idx === this.currentTrackIndex && this.elements.title) {
                this.updateTrackInfo();
              }
              if (this.isQueueOpen && this.elements.queueList) {
                this.populateQueueMenu();
              }
              this.metadataTracksLoaded.add(idx);
              resolve();
            },
          });
        } catch (error: unknown) {
          if (attempt < maxAttempts - 1) {
            const retryDelay = (attempt + 1) * 350;
            window.setTimeout(() => {
              loadTrack(filename, idx, attempt + 1).then(resolve, resolve);
            }, retryDelay);
            return;
          }

          console.warn(`Failed to initialize metadata reader for ${filename}:`, error);
          this.trackMeta[idx] = this.createFallbackMeta(filename);
          if (idx === this.currentTrackIndex && this.elements.title) {
            this.updateTrackInfo();
          }
          this.metadataTracksLoaded.add(idx);
          resolve();
        }
      });
    };

    // Piste courante chargée immédiatement, les autres décalées de 400ms chacune
    // pour ne pas concurrencer le rendu React et le chargement des assets visuels
    const metadataPromises: Promise<void>[] = this.trackFiles.map((filename, idx) => {
      if (idx === this.currentTrackIndex) {
        return loadTrack(filename, idx);
      }
      // Stagger : la 1ère piste non-courante attend 400ms, la 2ème 800ms, etc.
      const delay = (idx < this.currentTrackIndex ? idx : idx - 1) * 400 + 400;
      return new Promise<void>((resolve) => {
        setTimeout(() => loadTrack(filename, idx).then(resolve, resolve), delay);
      });
    });

    // Once all metadata completes, refresh queue to show all loaded data
    Promise.all(metadataPromises).then(() => {
      if (this.isQueueOpen) {
        this.populateQueueMenu();
      }
    });
  }

  private render(): void {
    const container = document.createElement('div');
    container.id = 'music-player';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Lecteur de musique');

    container.innerHTML = `
      <button id="player-retract-btn" aria-label="R\u00e9duire le lecteur" title="R\u00e9duire">
        ${ICON_CHEVRON_LEFT}
      </button>
      <div class="player-main">
        <img class="album-art" src="" alt="Pochette de l'album" width="60" height="60" />
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
          ${ICON_LIST}
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
          ${ICON_FORWARD_STEP}
        </button>
        <div class="volume-wrapper">
          <button id="mute-btn" aria-label="Couper le son" class="icon-btn">
            ${ICON_VOLUME_HIGH}
            ${ICON_VOLUME_LOW}
            ${ICON_VOLUME_MUTED}
          </button>
          <div class="volume-popup">
            <div class="volume-popup-track">
              <div class="volume-popup-fill"></div>
              <input type="range" id="volume-slider" class="volume-slider-vertical" min="0" max="100" value="70" orient="vertical" aria-label="Volume">
            </div>
          </div>
        </div>
      </div>
      <div class="queue-menu" style="display: none;">
        <div class="queue-list" role="listbox" aria-label="Liste des pistes">
          <!-- Populated dynamically -->
        </div>
      </div>
      <div class="time-display"><span class="current-time">0:00</span> / <span class="duration">0:00</span></div>
      <div class="progress-container" role="progressbar" aria-label="Progression de la piste">
        <div class="progress"></div>
      </div>
    `;

    // Apply retracted state BEFORE inserting into DOM so the CSS transition doesn't fire
    if (this.isRetracted) {
      container.classList.add('retracted');
    }

    document.body.appendChild(container);

    // Peek tab — separate fixed element shown when player is retracted
    const peekBtn = document.createElement('button');
    peekBtn.id = 'player-peek-btn';
    peekBtn.setAttribute('aria-label', 'Afficher le lecteur');
    peekBtn.setAttribute('title', 'Afficher le lecteur');
    peekBtn.innerHTML = ICON_CHEVRON_RIGHT;
    document.body.appendChild(peekBtn);

    // Cache DOM elements
    this.elements = {
      container,
      albumArt: container.querySelector<HTMLImageElement>('.album-art')!,
      title: container.querySelector<HTMLSpanElement>('.title')!,
      artist: container.querySelector<HTMLSpanElement>('.artist')!,
      playPauseBtn: container.querySelector<HTMLButtonElement>('#play-pause-btn')!,
      nextBtn: container.querySelector<HTMLButtonElement>('#next-btn')!,
      queueBtn: container.querySelector<HTMLButtonElement>('#queue-btn')!,
      muteBtn: container.querySelector<HTMLButtonElement>('#mute-btn')!,
      retractBtn: container.querySelector<HTMLButtonElement>('#player-retract-btn')!,
      peekBtn,
      volumeSlider: container.querySelector<HTMLInputElement>('#volume-slider')!,
      volumeWrapper: container.querySelector<HTMLDivElement>('.volume-wrapper')!,
      volumePopup: container.querySelector<HTMLDivElement>('.volume-popup')!,
      volumeFill: container.querySelector<HTMLDivElement>('.volume-popup-fill')!,
      queueMenu: container.querySelector<HTMLDivElement>('.queue-menu')!,
      queueList: container.querySelector<HTMLDivElement>('.queue-list')!,
      loadingIndicator: container.querySelector<HTMLDivElement>('.loading-indicator')!,
      currentTime: container.querySelector<HTMLSpanElement>('.current-time')!,
      duration: container.querySelector<HTMLSpanElement>('.duration')!,
      progressBar: container.querySelector<HTMLDivElement>('.progress')!,
      progressContainer: container.querySelector<HTMLDivElement>('.progress-container')!,
      visualizerCanvas: container.querySelector<HTMLCanvasElement>('.music-visualizer')!,
      visualizerContainer: container.querySelector<HTMLDivElement>('.visualizer')!,
    };

    this.updateTrackInfo();
    this.updatePlayPauseButton();
    this.updateVolumeButton();
    this.populateQueueMenu();
    this.setControlsDisabled(!this.trackFiles.length);

    // Sync peek-btn and retract-btn visuals with initial retracted state
    if (this.isRetracted) {
      this.elements.peekBtn.classList.add('visible');
      this.elements.retractBtn.setAttribute('aria-label', 'Afficher le lecteur');
      this.elements.retractBtn.innerHTML = ICON_CHEVRON_RIGHT;
    }
  }

  private setControlsDisabled(disabled: boolean): void {
    const controls = [
      this.elements.playPauseBtn,
      this.elements.nextBtn,
      this.elements.queueBtn,
      this.elements.muteBtn,
      this.elements.volumeSlider,
    ];

    controls.forEach((element: HTMLButtonElement | HTMLInputElement) => {
      if (!element) return;
      if ('disabled' in element) {
        element.disabled = disabled;
      }
      if (disabled) {
        element.setAttribute('aria-disabled', 'true');
      } else {
        element.removeAttribute('aria-disabled');
      }
    });
  }

  private attachEventListeners(): void {
    this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
    this.elements.queueBtn.addEventListener('click', () => this.toggleQueue());
    this.elements.muteBtn.addEventListener('click', () => this.toggleMute());
    this.elements.volumeSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement | null;
      if (!target) return;
      this.setVolume(Number(target.value) / 100);
      this.updateVolumeFill();
    });
    // Show/hide vertical volume popup on wrapper hover
    this.elements.volumeWrapper.addEventListener('mouseenter', () => {
      this.elements.volumePopup.classList.add('open');
    });
    this.elements.volumeWrapper.addEventListener('mouseleave', () => {
      this.elements.volumePopup.classList.remove('open');
    });
    this.elements.progressContainer.addEventListener('click', (e) => this.seek(e));

    // Close queue menu when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as Element | null;
      if (this.isQueueOpen && target && !target.closest('#music-player')) {
        this.closeQueue();
      }
    });

    // Retract controls
    this.elements.retractBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleRetract();
    });
    this.elements.peekBtn.addEventListener('click', () => this.unretract());
  }

  private setupMoodListener(): void {
    // Watch for mood changes on body element and update visualizer in real-time
    const observer = new MutationObserver(() => {
      this.onMoodChange();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-mood'],
    });
  }

  private onMoodChange(): void {
    // If music is playing, the next frame will pick up the new color
    // If music is stopped, redraw the idle wave with the new color
    if (this.audio.paused || this.isPaused) {
      this.renderIdleWave();
    }
  }

  private updateLoadingState(): void {
    this.elements.loadingIndicator.style.display = this.isLoading ? 'flex' : 'none';
  }

  private updateVolumeButton(): void {
    const volumeHigh = this.elements.muteBtn.querySelector<HTMLElement>('.volume-high');
    const volumeLow = this.elements.muteBtn.querySelector<HTMLElement>('.volume-low');
    const volumeMuted = this.elements.muteBtn.querySelector<HTMLElement>('.volume-muted');
    if (!volumeHigh || !volumeLow || !volumeMuted) return;

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

    this.elements.volumeSlider.value = String(Math.round(this.audio.volume * 100));
    this.updateVolumeFill();
  }

  private updateVolumeFill(): void {
    const pct = this.isMuted ? 0 : Math.round(this.audio.volume * 100);
    this.elements.volumeFill.style.height = `${pct}%`;
  }

  private formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private togglePlayPause(): void {
    if (!this.trackFiles.length) return;

    if (this.audio.paused) {
      this.ensureAudioSourceLoaded();
      this.loadTrackMetadataForIndex(this.currentTrackIndex);
      this.audio
        .play()
        .then(() => {
          if (!this.isMuted) this.audio.muted = false;
        })
        .catch(() => {
          // Playback failed
        });
    } else {
      this.isPaused = true;
      safeLocalSet(this.STORAGE_KEYS.IS_PAUSED, 'true');
      this.audio.pause();
    }
  }

  private nextTrack(): void {
    if (!this.trackFiles.length) return;

    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.trackFiles.length;
    safeLocalSet(this.STORAGE_KEYS.TRACK_INDEX, this.currentTrackIndex.toString());
    safeLocalSet(this.STORAGE_KEYS.CURRENT_TIME, '0');
    this.savedTime = 0;

    this.ensureAudioSourceLoaded();
    this.loadTrackMetadataForIndex(this.currentTrackIndex);
    this.updateTrackInfo();
    this.showNowPlayingToast();

    if (!this.isPaused) {
      this.audio.play().catch(() => {
        // Playback failed
      });
    }
  }

  private seek(event: MouseEvent): void {
    if (!this.trackFiles.length || !this.audio.duration || !isFinite(this.audio.duration)) return;

    const rect = this.elements.progressContainer.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    this.audio.currentTime = percent * this.audio.duration;
  }

  private updateTrackInfo(): void {
    if (!this.elements.title || !this.elements.artist || !this.elements.albumArt) {
      return;
    }

    if (!this.trackFiles.length) {
      this.elements.title.textContent = 'Aucune piste disponible';
      this.elements.artist.textContent =
        'Ajoutez des fichiers .m4a ou .mp3 dans /public/assets/music';
      this.elements.albumArt.src = getAssetPath('assets/images/favicon.svg');
      return;
    }

    const currentFilename = this.trackFiles[this.currentTrackIndex];
    const meta = this.trackMeta[this.currentTrackIndex] || this.createFallbackMeta(currentFilename);
    this.elements.title.textContent = meta.title;
    this.elements.artist.textContent = meta.artist;
    this.elements.albumArt.src = meta.pictureDataURL || getAssetPath('assets/images/favicon.svg');

    // Apply scrolling animation if text overflows
    this.applyScrollIfOverflow(this.elements.title.parentElement);
    this.applyScrollIfOverflow(this.elements.artist.parentElement);
  }

  private updatePlayPauseButton(): void {
    const playIcon = this.elements.playPauseBtn.querySelector<HTMLElement>('.play-icon');
    const pauseIcon = this.elements.playPauseBtn.querySelector<HTMLElement>('.pause-icon');
    if (!playIcon || !pauseIcon) return;

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

  private updateProgressBar(): void {
    if (!this.audio.duration || this.audio.duration === Infinity) return;
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    this.elements.progressBar.style.transform = `scaleX(${percent / 100})`;

    // Update time display
    this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
    this.elements.duration.textContent = this.formatTime(this.audio.duration);
  }

  private setupVisualizer(): void {
    if (this.visualizer.initialized) return;
    this.visualizer.reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    this.visualizer.ctx = this.elements.visualizerCanvas.getContext('2d');
    this.visualizer.initialized = true;

    this.resizeVisualizer();
    this.renderIdleWave();

    this.visualizer.handleResize = () => this.resizeVisualizer();
    window.addEventListener('resize', this.visualizer.handleResize);
  }

  private ensureVisualizerContext(): void {
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

  private resizeVisualizer(): void {
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

  private getAccentRgb(): string {
    const rgb = getComputedStyle(document.body).getPropertyValue('--color-primary-rgb').trim();
    return rgb || '212, 175, 55';
  }

  private renderIdleWave(): void {
    if (!this.visualizer.ctx) return;

    const { ctx, width, height } = this.visualizer;
    const rgb = this.getAccentRgb();
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = `rgba(${rgb}, 0.45)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  private startVisualizer(): void {
    if (this.visualizer.reducedMotion) return;
    if (!this.visualizer.ctx) return;

    this.ensureVisualizerContext();
    if (!this.visualizer.analyser || !this.visualizer.dataArray || !this.visualizer.freqData)
      return;

    if (this.visualizer.audioContext?.state === 'suspended') {
      this.visualizer.audioContext.resume().catch(() => {});
    }

    if (this.visualizer.rafId) return;

    // Propriétés constantes du contexte canvas — définies une seule fois,
    // pas à chaque frame (évite des appels inutiles au GPU)
    const { ctx } = this.visualizer;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Sur machines faibles, désactiver le shadow canvas (force software rendering)
    const useShadow = !isLowTier();

    const draw = () => {
      const analyser = this.visualizer.analyser;
      const dataArray = this.visualizer.dataArray;
      const freqData = this.visualizer.freqData;
      const ctx = this.visualizer.ctx;
      if (!analyser || !dataArray || !freqData || !ctx) {
        this.visualizer.rafId = null;
        return;
      }

      this.visualizer.rafId = window.requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      analyser.getByteFrequencyData(freqData);

      const { width, height, bufferLength } = this.visualizer;
      // Read accent color each frame so mood changes apply live
      const rgb = this.getAccentRgb();
      let sum = 0;

      for (let i = 0; i < bufferLength; i++) {
        sum += freqData[i];
      }

      const energy = Math.min(1, sum / (bufferLength * 180));
      const amplitude = height * (0.2 + energy * 0.9);

      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 2.2 + energy * 2.2;
      ctx.strokeStyle = `rgba(${rgb}, ${0.6 + energy * 0.4})`;
      if (useShadow) {
        ctx.shadowBlur = 10 + energy * 18;
        ctx.shadowColor = `rgba(${rgb}, 0.85)`;
      }

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
      // Réinitialiser le shadow pour ne pas affecter d'autres dessins canvas
      if (useShadow) ctx.shadowBlur = 0;
    };

    this.visualizer.rafId = window.requestAnimationFrame(draw);
  }

  private stopVisualizer(): void {
    if (this.visualizer.rafId) {
      window.cancelAnimationFrame(this.visualizer.rafId);
      this.visualizer.rafId = null;
    }
    this.renderIdleWave();
  }

  private onLoadedMetadata(): void {
    this.isLoading = false;
    this.updateLoadingState();

    // Update duration display
    this.elements.duration.textContent = this.formatTime(this.audio.duration);

    // Clamp saved time to duration
    if (this.savedTime >= this.audio.duration) {
      this.savedTime = 0;
    }
    this.audio.currentTime = this.savedTime;

    // Attempt autoplay if not paused last session
    if (!this.isPaused) {
      this.audio
        .play()
        .then(() => {
          setTimeout(() => {
            if (!this.isMuted) this.audio.muted = false;
          }, 150);
        })
        .catch(() => {
          // Autoplay blocked, wait for user interaction
        });
    }
  }

  private applyScrollIfOverflow(wrapper: Element | null): void {
    if (!(wrapper instanceof HTMLElement)) return;
    const element = wrapper.firstElementChild;
    if (!(element instanceof HTMLElement)) return;
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

  private toggleQueue(): void {
    if (!this.trackFiles.length) return;

    if (this.isQueueOpen) {
      this.closeQueue();
    } else {
      this.openQueue();
    }
  }

  private openQueue(): void {
    this.isQueueOpen = true;
    this.elements.queueMenu.style.display = 'block';
    this.elements.queueBtn.setAttribute('aria-expanded', 'true');
    this.elements.queueMenu.classList.add('open');
    this.loadAllMetadata();
    // Force refresh queue to show latest metadata
    this.populateQueueMenu(true);
    this.updateQueueHighlight();
  }

  private closeQueue(): void {
    this.isQueueOpen = false;
    this.elements.queueMenu.classList.remove('open');
    this.elements.queueBtn.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      this.elements.queueMenu.style.display = 'none';
    }, 300); // Wait for animation to finish
  }

  private populateQueueMenu(animateItems = false): void {
    if (!this.elements.queueList) {
      return;
    }

    if (!this.trackFiles.length) {
      this.elements.queueList.innerHTML =
        '<div role="note" style="padding: 12px 10px; opacity: 0.8;">Aucune piste disponible</div>';
      return;
    }

    this.elements.queueList.innerHTML = this.trackFiles
      .map((filename, index) => {
        const meta = this.trackMeta[index] || this.createFallbackMeta(filename);
        const safeTitle = this.escapeHtml(meta.title);
        const safeArtist = this.escapeHtml(meta.artist);
        const safePictureDataURL = this.escapeHtml(
          meta.pictureDataURL || getAssetPath('assets/images/favicon.svg')
        );
        const isCurrentTrack = index === this.currentTrackIndex;
        const liClass = isCurrentTrack
          ? `queue-item current${animateItems ? ' queue-item--enter' : ''}`
          : `queue-item${animateItems ? ' queue-item--enter' : ''}`;
        const artistColor = 'rgba(var(--color-primary-rgb), 0.7)';
        const itemDelay = animateItems
          ? `style="--queue-item-delay: ${Math.min(index, 8) * 45}ms;"`
          : '';

        // Build aria-label from current metadata
        const ariaLabel = isCurrentTrack
          ? `${safeTitle} (actuellement en cours de lecture)`
          : safeTitle;

        return `
        <div class="${liClass}" 
             role="option" 
             aria-label="${ariaLabel}"
             data-track-index="${index}" 
             ${itemDelay}>
          <img src="${safePictureDataURL}" alt="" style="width: 40px; height: 40px; border-radius: 4px; flex-shrink: 0; object-fit: cover;">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--color-primary); font-weight: 600; font-size: 0.8rem; flex-shrink: 0;">${index === this.currentTrackIndex ? '▶' : ''}</span>
              <div style="min-width: 0; flex: 1;">
                <div style="font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${safeTitle}</div>
                <div style="font-size: 0.8rem; color: ${artistColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${safeArtist}</div>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    // Add click listeners to queue items
    this.elements.queueList.querySelectorAll<HTMLElement>('.queue-item').forEach((item) => {
      item.addEventListener('click', () => {
        const trackIndex = parseInt(item.dataset.trackIndex ?? '', 10);
        this.selectTrack(trackIndex);
      });
    });

    this.updateQueueHighlight();
  }

  private selectTrack(trackIndex: number): void {
    if (!this.trackFiles.length) return;
    if (trackIndex < 0 || trackIndex >= this.trackFiles.length) return;

    this.currentTrackIndex = trackIndex;
    safeLocalSet(this.STORAGE_KEYS.TRACK_INDEX, trackIndex.toString());
    safeLocalSet(this.STORAGE_KEYS.CURRENT_TIME, '0');
    this.savedTime = 0; // Reset saved time so onLoadedMetadata doesn't restore old time

    this.ensureAudioSourceLoaded();
    this.loadTrackMetadataForIndex(this.currentTrackIndex);
    this.audio.currentTime = 0; // Reset playback to start of track
    this.updateTrackInfo();
    this.populateQueueMenu();
    this.showNowPlayingToast();

    if (!this.isPaused) {
      this.audio.play().catch(() => {
        // Playback failed
      });
    }
  }

  private updateQueueHighlight(): void {
    const queueItems = this.elements.queueList.querySelectorAll<HTMLElement>('.queue-item');
    queueItems.forEach((item, index) => {
      if (index === this.currentTrackIndex) {
        item.classList.add('current');
        item.style.borderLeftColor = 'var(--color-primary)';
        item.style.backgroundColor = 'rgba(var(--color-primary-rgb), 0.1)';
      } else {
        item.classList.remove('current');
        item.style.borderLeftColor = 'transparent';
        item.style.backgroundColor = 'transparent';
      }
    });
  }

  private toggleRetract(): void {
    if (this.isRetracted) {
      this.unretract();
    } else {
      this.retract();
    }
  }

  private retract(): void {
    this.isRetracted = true;
    this.elements.container.classList.add('retracted');
    this.elements.peekBtn.classList.add('visible');
    this.elements.retractBtn.setAttribute('aria-label', 'Afficher le lecteur');
    this.elements.retractBtn.innerHTML = ICON_CHEVRON_RIGHT;
    safeLocalSet(this.STORAGE_KEYS.RETRACTED, 'true');
    // Close queue if open while retracting
    if (this.isQueueOpen) this.closeQueue();
  }

  private unretract(): void {
    this.isRetracted = false;
    this.elements.container.classList.remove('retracted');
    this.elements.peekBtn.classList.remove('visible');
    this.elements.retractBtn.setAttribute('aria-label', 'R\u00e9duire le lecteur');
    this.elements.retractBtn.innerHTML = ICON_CHEVRON_LEFT;
    safeLocalSet(this.STORAGE_KEYS.RETRACTED, 'false');
  }

  private saveState(): void {
    safeLocalSet(this.STORAGE_KEYS.CURRENT_TIME, this.audio.currentTime.toString());
    safeLocalSet(this.STORAGE_KEYS.IS_PAUSED, this.audio.paused.toString());
    safeLocalSet(this.STORAGE_KEYS.TRACK_INDEX, this.currentTrackIndex.toString());
    safeLocalSet(this.STORAGE_KEYS.VOLUME, this.audio.volume.toString());
    safeLocalSet(this.STORAGE_KEYS.MUTED, this.isMuted.toString());
    safeLocalSet(this.STORAGE_KEYS.RETRACTED, this.isRetracted.toString());
  }

  private formatTitle(filename: string): string {
    if (!filename) return 'Unknown Track';
    const baseName = filename.replace(/\.[^/.]+$/, '');
    return baseName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase());
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private createFallbackMeta(filename: string): TrackMeta {
    if (/lunar/i.test(filename)) {
      return {
        title: 'Lunar',
        artist: 'Anthemics',
        pictureDataURL: getAssetPath('assets/images/favicon.svg'),
      };
    }

    return {
      title: this.formatTitle(filename),
      artist: 'Unknown Artist',
      pictureDataURL: getAssetPath('assets/images/favicon.svg'),
    };
  }

  private showNowPlayingToast(): void {
    const currentFilename = this.trackFiles[this.currentTrackIndex];
    const meta = this.trackMeta[this.currentTrackIndex] || this.createFallbackMeta(currentFilename);
    const title = meta?.title || this.formatTitle(currentFilename);
    const artist = meta?.artist && meta.artist !== 'Unknown Artist' ? ` - ${meta.artist}` : '';

    window.showToast?.(`En lecture: ${title}${artist}`, {
      type: 'music',
      duration: 3200,
    });
  }
}

export default MusicPlayer;
