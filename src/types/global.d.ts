/* ══════════════════════════════════════════════
   Global type augmentations
   ══════════════════════════════════════════════ */

export {};

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }

  interface ImgHTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}

declare global {
  /* ── Worker-based particles types ── */
  type ParticleWorkerCommandType =
    | 'init'
    | 'resize'
    | 'mouse'
    | 'click'
    | 'updateConfig'
    | 'pause'
    | 'resume'
    | 'destroy';

  interface ParticleWorkerController {
    pauseForNavigation?: () => void;
    resumeAfterNavigation?: () => void;
    setAnimationsEnabled?: (enabled: boolean) => void;
    updateParticlesMood?: (mood: string) => void;
    reconfigureParticles?: (mood: string) => void;
    destroy?: () => void;
  }

  /* Legacy particles.js shape kept for optional compatibility in existing effects helpers. */
  interface PJSDomEntry {
    pJS: {
      fn: {
        vendors: {
          destroypJS: () => void;
        };
        modes: {
          pushParticles: (count: number, options?: { pos_x: number; pos_y: number }) => void;
        };
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  }

  /* ── jsmediatags CDN global ── */
  interface JsMediaTagsResult {
    tags: {
      title?: string;
      artist?: string;
      picture?: {
        data: number[];
        format: string;
      };
      [key: string]: unknown;
    };
  }

  interface JsMediaTagsCallbacks {
    onSuccess: (tag: JsMediaTagsResult) => void;
    onError: (error: { type: string; info: string }) => void;
  }

  interface JsMediaTags {
    read: (url: string, callbacks: JsMediaTagsCallbacks) => void;
  }

  interface Window {
    /* Toast system — exposed by ToastContext for legacy JS modules */
    showToast?: (
      message: string,
      options?: { type?: 'success' | 'error' | 'info' | 'warning' | 'music'; duration?: number }
    ) => number;
    testToast?: {
      success: () => void;
      error: () => void;
      info: () => void;
      warning: () => void;
      music: () => void;
    };

    /* Particle effects — exposed by effects.ts for MoodContext */
    reconfigureParticles?: (mood: string) => void;
    updateParticlesMood?: (mood: string) => void;
    visualEffectsInstance?: ParticleWorkerController;

    /* Legacy particles.js CDN DOM array */
    pJSDom?: PJSDomEntry[];

    /* jsmediatags CDN — ID3 tag reader (removed: now an npm module) */
    // jsmediatags?: JsMediaTags;

    /* WebKit AudioContext (Safari fallback) */
    webkitAudioContext?: typeof AudioContext;

    /* Pet debug/dev APIs */
    petReact?: (reaction: string) => void;
    getPetStats?: () => { hunger: number; happiness: number; mood: string } | null;
    petGravity?: (duration: number) => void;
    petAttract?: (x: number, y: number, duration: number) => void;

    /* Ambient debug APIs */
    testSilhouettes?: (testMood: string) => void;
    spawnWalker?: (scriptId?: string) => void;
    spawnCommuter?: (type?: 'spacecraft' | 'satellite' | 'rover') => void;
    getWalkerState?: () => unknown;

    /* Performance-tier diagnostics */
    getPerformanceTierDiagnostics?: () => unknown;
  }
}
