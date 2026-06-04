/**
 * Visual Effects Module — Worker-based particle engine + parallax
 *
 * Replaces the CDN particles.js library with a Web Worker + OffscreenCanvas
 * architecture. Physics and rendering run entirely off the main thread.
 * The main thread only forwards mouse events and config updates.
 */

import { getParticlesConfig } from './effects-particles-config';
import ParallaxController from './parallax-controller';

class VisualEffects {
  private background: HTMLElement | null;
  private parallaxController: ParallaxController | null;
  private worker: Worker | null;
  private canvas: HTMLCanvasElement | null;
  private dpr: number;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null;
  private mouseLeaveHandler: (() => void) | null;
  private clickHandler: ((e: MouseEvent) => void) | null;
  private resizeHandler: (() => void) | null;
  private visibilityHandler: (() => void) | null;

  constructor() {
    this.background = document.getElementById('background');
    this.parallaxController = null;
    this.worker = null;
    this.canvas = null;
    this.dpr = 1;
    this.mouseMoveHandler = null;
    this.mouseLeaveHandler = null;
    this.clickHandler = null;
    this.resizeHandler = null;
    this.visibilityHandler = null;
    this.init();
  }

  private init(): void {
    this.initParticlesWorker();
    if (this.background) {
      this.parallaxController = new ParallaxController(this.background);
      this.parallaxController.start();
    }
  }

  private initParticlesWorker(): void {
    // Respect prefers-reduced-motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

    // Skip on touch/mobile devices
    if (window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches) return;

    // OffscreenCanvas required for worker-based rendering
    if (!('OffscreenCanvas' in window)) {
      console.warn('OffscreenCanvas not supported — particles disabled');
      return;
    }

    this.canvas = document.getElementById('particles-canvas') as HTMLCanvasElement | null;
    if (!this.canvas) return;

    this.dpr = window.devicePixelRatio || 1;
    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;

    // Canvas must have valid dimensions for transferControlToOffscreen.
    // If dimensions aren't ready, defer initialization.
    if (cssW === 0 || cssH === 0) {
      requestAnimationFrame(() => this.initParticlesWorker());
      return;
    }

    const mood =
      document.querySelector('.mood-stage')?.getAttribute('data-mood') ||
      document.body.getAttribute('data-mood') ||
      'default';

    const config = getParticlesConfig(mood);

    // Create worker and transfer canvas control
    this.worker = new Worker(
      new URL('../workers/particles.worker.ts', import.meta.url),
      { type: 'module' }
    );

    try {
      const offscreen = this.canvas.transferControlToOffscreen();
      this.worker.postMessage(
        { type: 'init', canvas: offscreen, cssWidth: cssW, cssHeight: cssH, dpr: this.dpr, config },
        [offscreen]
      );
    } catch (err) {
      console.error('Failed to initialize particle worker:', err);
      this.worker.terminate();
      this.worker = null;
      return;
    }

    // Listen for worker responses (particle count updates)
    this.worker.onmessage = (e) => {
      if (e.data.type === 'count') {
        window._particleCount = e.data.value;
      }
    };

    // Mouse events: MUST use offsetX/offsetY (canvas-local coords accounting for
    // CSS parallax transform) — this is exactly what particles.js CDN did.
    this.mouseMoveHandler = (e: MouseEvent) => {
      this.worker?.postMessage({ type: 'mouse', x: e.offsetX, y: e.offsetY });
    };
    this.mouseLeaveHandler = () => {
      this.worker?.postMessage({ type: 'mouseleave' });
    };
    this.clickHandler = (e: MouseEvent) => {
      this.worker?.postMessage({ type: 'click', x: e.offsetX, y: e.offsetY });
    };
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.canvas.addEventListener('click', this.clickHandler);

    // Resize: update worker canvas dimensions
    this.resizeHandler = () => {
      if (!this.canvas) return;
      this.dpr = window.devicePixelRatio || 1;
      this.worker?.postMessage({
        type: 'resize',
        cssWidth: this.canvas.clientWidth,
        cssHeight: this.canvas.clientHeight,
        dpr: this.dpr,
      });
    };
    window.addEventListener('resize', this.resizeHandler);

    // Pause the worker simulation while the tab is hidden. The worker double-guards
    // (running && !paused), clamps dt to [0,3], and resets its frame clock on resume,
    // so this is jump-free. Route-transition pause/resume only happens while visible,
    // so the two pause sources don't meaningfully conflict.
    this.visibilityHandler = () => {
      this.worker?.postMessage({ type: document.hidden ? 'pause' : 'resume' });
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Expose globals for MoodContext and ParticlesButton
    window.particleWorker = this.worker;
    window.updateParticlesMood = (mood: string) => this.updateParticlesMood(mood);
    window.reconfigureParticles = (mood: string) => this.reconfigureParticles(mood);
  }

  /**
   * Update particles for a new mood.
   * Always does a full reconfigure via worker (destroy + reinit).
   */
  updateParticlesMood(mood: string): void {
    const config = getParticlesConfig(mood);
    this.worker?.postMessage({ type: 'updateConfig', config });
  }

  /**
   * Full reconfigure for a mood change.
   */
  reconfigureParticles(mood: string): void {
    const config = getParticlesConfig(mood);
    this.worker?.postMessage({ type: 'updateConfig', config });
  }

  /**
   * Disable/enable all particle animations (accessibility noMotion).
   */
  setAnimationsEnabled(enabled: boolean): void {
    this.worker?.postMessage({ type: 'setAnimationsEnabled', enabled });
  }

  /**
   * Pause the particle RAF loop during React route transitions.
   */
  pauseForNavigation(): void {
    this.worker?.postMessage({ type: 'pause' });
  }

  /**
   * Resume the particle RAF loop after route transition completes.
   */
  resumeAfterNavigation(): void {
    this.worker?.postMessage({ type: 'resume' });
  }

  /**
   * Cleanup all resources (worker, RAF, event listeners).
   * Called on hook unmount via usePortfolioModules.
   */
  destroy(): void {
    if (this.canvas) {
      if (this.mouseMoveHandler) {
        this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
      }
      if (this.mouseLeaveHandler) {
        this.canvas.removeEventListener('mouseleave', this.mouseLeaveHandler);
      }
      if (this.clickHandler) {
        this.canvas.removeEventListener('click', this.clickHandler);
      }
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.worker?.postMessage({ type: 'destroy' });
    this.worker?.terminate();
    this.worker = null;
    this.parallaxController?.destroy();
    this.parallaxController = null;
    delete window.particleWorker;
  }
}

export default VisualEffects;
