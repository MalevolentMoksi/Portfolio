import { getAssetPath } from '../utils/assetPath';

interface TrackMeta {
  title: string;
  artist: string;
  pictureDataURL: string;
}

interface MusicMetadataManagerOptions {
  trackFiles: string[];
  trackMeta: TrackMeta[];
  formatTitle: (filename: string) => string;
  createFallbackMeta: (filename: string) => TrackMeta;
  onTrackMetaUpdated: (trackIndex: number) => void;
  onAllMetadataLoaded: () => void;
}

class MusicMetadataManager {
  private trackFiles: string[];
  private trackMeta: TrackMeta[];
  private formatTitle: (filename: string) => string;
  private createFallbackMeta: (filename: string) => TrackMeta;
  private onTrackMetaUpdated: (trackIndex: number) => void;
  private onAllMetadataLoaded: () => void;
  private metadataLoaded: boolean;
  private metadataTracksLoaded: Set<number>;

  constructor(options: MusicMetadataManagerOptions) {
    this.trackFiles = options.trackFiles;
    this.trackMeta = options.trackMeta;
    this.formatTitle = options.formatTitle;
    this.createFallbackMeta = options.createFallbackMeta;
    this.onTrackMetaUpdated = options.onTrackMetaUpdated;
    this.onAllMetadataLoaded = options.onAllMetadataLoaded;
    this.metadataLoaded = false;
    this.metadataTracksLoaded = new Set<number>();
  }

  scheduleCurrentTrackMetadataLoad(currentTrackIndex: number): void {
    if (!this.trackFiles.length) return;

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    };

    const start = () => {
      if (typeof idleWindow.requestIdleCallback === 'function') {
        idleWindow.requestIdleCallback(() => this.loadTrackMetadataForIndex(currentTrackIndex), {
          timeout: 2500,
        });
        return;
      }

      setTimeout(() => this.loadTrackMetadataForIndex(currentTrackIndex), 1200);
    };

    if (document.readyState === 'complete') {
      start();
      return;
    }

    window.addEventListener('load', start, { once: true });
  }

  loadTrackMetadataForIndex(trackIndex: number): void {
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

            this.onTrackMetaUpdated(trackIndex);
          },
          onError: (error: { type: string; info: string }) => {
            if (attempt < maxAttempts - 1) {
              const retryDelay = (attempt + 1) * 350;
              window.setTimeout(() => read(attempt + 1), retryDelay);
              return;
            }

            console.warn(`Failed to read metadata for ${filename}:`, error);
            this.trackMeta[trackIndex] = this.createFallbackMeta(filename);
            this.onTrackMetaUpdated(trackIndex);
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
        this.onTrackMetaUpdated(trackIndex);
      }
    };

    read(0);
  }

  loadAllMetadata(currentTrackIndex: number): void {
    if (this.metadataLoaded || !this.trackFiles.length) {
      return;
    }

    this.metadataLoaded = true;

    const loadTrack = (filename: string, idx: number, attempt = 0): Promise<void> => {
      if (this.metadataTracksLoaded.has(idx)) {
        return Promise.resolve();
      }

      const relUrl = getAssetPath(`assets/music/${filename}`);
      const url = relUrl.startsWith('http') ? relUrl : window.location.origin + relUrl;
      const maxAttempts = 3;

      return new Promise<void>(async (resolve) => {
        try {
          const jsmediatags = await import('jsmediatags');
          jsmediatags.default?.read(url, {
            onSuccess: (tag: JsMediaTagsResult) => {
              this.trackMeta[idx].title = tag.tags.title || this.formatTitle(filename);
              this.trackMeta[idx].artist = tag.tags.artist || 'Unknown Artist';

              if (tag.tags.picture) {
                const { data, format } = tag.tags.picture;
                let binary = '';
                for (let i = 0; i < data.length; i++) {
                  binary += String.fromCharCode(data[i]);
                }
                const base64String = window.btoa(binary);
                this.trackMeta[idx].pictureDataURL = `data:${format};base64,${base64String}`;
              }

              this.metadataTracksLoaded.add(idx);
              this.onTrackMetaUpdated(idx);
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
              this.metadataTracksLoaded.add(idx);
              this.onTrackMetaUpdated(idx);
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
          this.metadataTracksLoaded.add(idx);
          this.onTrackMetaUpdated(idx);
          resolve();
        }
      });
    };

    const metadataPromises: Promise<void>[] = this.trackFiles.map((filename, idx) => {
      if (idx === currentTrackIndex) {
        return loadTrack(filename, idx);
      }

      const delay = (idx < currentTrackIndex ? idx : idx - 1) * 400 + 400;
      return new Promise<void>((resolve) => {
        setTimeout(() => loadTrack(filename, idx).then(resolve, resolve), delay);
      });
    });

    Promise.all(metadataPromises).then(() => {
      this.onAllMetadataLoaded();
    });
  }
}

export default MusicMetadataManager;
