/**
 * Visual Effects Module
 * Handles particles, parallax background, and cursor effects
 */

import { getParticlesConfig } from './effects-particles-config';
import ParallaxController from './parallax-controller';

type HoverMode = 'none' | 'grab' | 'repulse' | 'bubble';
type ClickMode = 'none' | 'push' | 'repulse' | 'bubble';
type MoveDirection =
  | 'none'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left';

interface WorkerParticleConfig {
  particleCount: number;
  colors: string[];
  opacity: number;
  opacityAnim: boolean;
  opacityAnimSpeed: number;
  opacityMin: number;
  size: number;
  sizeAnim: boolean;
  sizeAnimSpeed: number;
  sizeMin: number;
  linksEnabled: boolean;
  linkDistance: number;
  linkColor: string;
  linkOpacity: number;
  linkWidth: number;
  moveEnabled: boolean;
  moveSpeed: number;
  moveDirection: MoveDirection;
  moveRandom: boolean;
  moveStraight: boolean;
  hoverEnabled: boolean;
  hoverMode: HoverMode;
  clickEnabled: boolean;
  clickMode: ClickMode;
  grabDistance: number;
  grabOpacity: number;
  bubbleDistance: number;
  bubbleSize: number;
  bubbleDuration: number;
  bubbleOpacity: number;
  bubbleSpeed: number;
  repulseDistance: number;
  repulseDuration: number;
  pushCount: number;
}

type WorkerMessage =
  | {
      type: 'init';
      canvas: OffscreenCanvas;
      width: number;
      height: number;
      dpr: number;
      config: WorkerParticleConfig;
    }
  | { type: 'resize'; width: number; height: number; dpr: number }
  | { type: 'mouse'; x: number; y: number }
  | { type: 'click'; x: number; y: number }
  | { type: 'updateConfig'; config: WorkerParticleConfig }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'destroy' };

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const asBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const asString = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

const asStringArray = (value: unknown, fallback: string[]): string[] => {
  if (Array.isArray(value)) {
    const filtered = value.filter((entry): entry is string => typeof entry === 'string');
    if (filtered.length) return filtered;
  }

  if (typeof value === 'string') {
    return [value];
  }

  return fallback;
};

const normalizeDirection = (value: unknown): MoveDirection => {
  const direction = asString(value, 'none') as MoveDirection;
  switch (direction) {
    case 'left':
    case 'right':
    case 'top':
    case 'bottom':
    case 'top-right':
    case 'top-left':
    case 'bottom-right':
    case 'bottom-left':
      return direction;
    default:
      return 'none';
  }
};

const normalizeHoverMode = (value: unknown): HoverMode => {
  const mode = asString(value, 'none');
  if (mode === 'grab' || mode === 'repulse' || mode === 'bubble') {
    return mode;
  }
  return 'none';
};

const normalizeClickMode = (value: unknown): ClickMode => {
  const mode = asString(value, 'none');
  if (mode === 'push' || mode === 'repulse' || mode === 'bubble') {
    return mode;
  }
  return 'none';
};

const toWorkerConfig = (rawConfig: Record<string, unknown>): WorkerParticleConfig => {
  const particles = asRecord(rawConfig.particles);
  const particleNumber = asRecord(particles.number);
  const particleColor = asRecord(particles.color);
  const particleOpacity = asRecord(particles.opacity);
  const particleOpacityAnim = asRecord(particleOpacity.anim);
  const particleSize = asRecord(particles.size);
  const particleSizeAnim = asRecord(particleSize.anim);
  const lineLinked = asRecord(particles.line_linked);
  const move = asRecord(particles.move);

  const interactivity = asRecord(rawConfig.interactivity);
  const events = asRecord(interactivity.events);
  const onHover = asRecord(events.onhover);
  const onClick = asRecord(events.onclick);
  const modes = asRecord(interactivity.modes);
  const grabMode = asRecord(modes.grab);
  const grabLineLinked = asRecord(grabMode.line_linked);
  const bubbleMode = asRecord(modes.bubble);
  const repulseMode = asRecord(modes.repulse);
  const pushMode = asRecord(modes.push);

  return {
    particleCount: Math.max(0, Math.floor(asNumber(particleNumber.value, 60))),
    colors: asStringArray(particleColor.value, ['#d4af37']),
    opacity: asNumber(particleOpacity.value, 0.45),
    opacityAnim: asBoolean(particleOpacityAnim.enable, false),
    opacityAnimSpeed: asNumber(particleOpacityAnim.speed, 0.6),
    opacityMin: asNumber(particleOpacityAnim.opacity_min, 0.08),
    size: asNumber(particleSize.value, 4),
    sizeAnim: asBoolean(particleSizeAnim.enable, false),
    sizeAnimSpeed: asNumber(particleSizeAnim.speed, 1),
    sizeMin: asNumber(particleSizeAnim.size_min, 1),
    linksEnabled: asBoolean(lineLinked.enable, true),
    linkDistance: asNumber(lineLinked.distance, 140),
    linkColor: asString(lineLinked.color, asStringArray(particleColor.value, ['#d4af37'])[0]),
    linkOpacity: asNumber(lineLinked.opacity, 0.12),
    linkWidth: asNumber(lineLinked.width, 0.6),
    moveEnabled: asBoolean(move.enable, true),
    moveSpeed: asNumber(move.speed, 1),
    moveDirection: normalizeDirection(move.direction),
    moveRandom: asBoolean(move.random, true),
    moveStraight: asBoolean(move.straight, false),
    hoverEnabled: asBoolean(onHover.enable, false),
    hoverMode: normalizeHoverMode(onHover.mode),
    clickEnabled: asBoolean(onClick.enable, false),
    clickMode: normalizeClickMode(onClick.mode),
    grabDistance: asNumber(grabMode.distance, 140),
    grabOpacity: asNumber(grabLineLinked.opacity, 0.28),
    bubbleDistance: asNumber(bubbleMode.distance, 160),
    bubbleSize: asNumber(bubbleMode.size, 6),
    bubbleDuration: asNumber(bubbleMode.duration, 1),
    bubbleOpacity: asNumber(bubbleMode.opacity, 0.8),
    bubbleSpeed: asNumber(bubbleMode.speed, 3),
    repulseDistance: asNumber(repulseMode.distance, 150),
    repulseDuration: asNumber(repulseMode.duration, 0.8),
    pushCount: Math.max(1, Math.floor(asNumber(pushMode.particles_nb, 2))),
  };
};

class VisualEffects {
  private background: HTMLElement | null;
  private parallaxController: ParallaxController | null;
  private particlesCanvas: HTMLCanvasElement | null;
  private worker: Worker | null;
  private resizeHandler: (() => void) | null;
  private mouseMoveHandler: ((event: MouseEvent) => void) | null;
  private clickHandler: ((event: MouseEvent) => void) | null;
  private visibilityHandler: (() => void) | null;
  private workerErrorHandler: ((event: ErrorEvent) => void) | null;
  private pendingMouseEvent: MouseEvent | null;
  private mouseRaf: number | null;
  private particlesSupported: boolean;
  private animationsEnabled: boolean;
  private navigationPaused: boolean;
  private workerPaused: boolean;

  constructor() {
    this.background = document.getElementById('background');
    this.parallaxController = null;
    this.particlesCanvas = null;
    this.worker = null;
    this.resizeHandler = null;
    this.mouseMoveHandler = null;
    this.clickHandler = null;
    this.visibilityHandler = null;
    this.workerErrorHandler = null;
    this.pendingMouseEvent = null;
    this.mouseRaf = null;
    this.particlesSupported = false;
    this.animationsEnabled = true;
    this.navigationPaused = false;
    this.workerPaused = false;
    this.init();
  }

  private init(): void {
    this.initParticles();
    if (this.background) {
      this.parallaxController = new ParallaxController(this.background);
      this.parallaxController.start();
    }
  }

  private postToWorker(message: WorkerMessage, transfer: Transferable[] = []): void {
    if (!this.worker) return;
    this.worker.postMessage(message, transfer);
  }

  private getCurrentMood(): string {
    return (
      document.querySelector('.mood-stage')?.getAttribute('data-mood') ||
      document.body.getAttribute('data-mood') ||
      'default'
    );
  }

  private getWorkerConfigForMood(mood: string): WorkerParticleConfig {
    return toWorkerConfig(getParticlesConfig(mood));
  }

  private syncWorkerPauseState(): void {
    if (!this.worker || !this.particlesSupported) return;

    const shouldPause =
      !this.animationsEnabled || this.navigationPaused || document.hidden || !this.worker;

    if (shouldPause === this.workerPaused) return;

    this.workerPaused = shouldPause;
    this.postToWorker({ type: shouldPause ? 'pause' : 'resume' });
  }

  private postResize(): void {
    if (!this.worker || !this.particlesSupported) return;
    this.postToWorker({
      type: 'resize',
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    });
  }

  private initParticles(): void {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    if (window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches) {
      return;
    }

    this.particlesCanvas = document.getElementById('particles-canvas') as HTMLCanvasElement | null;
    if (!this.particlesCanvas) {
      return;
    }

    const canUseWorker =
      typeof Worker !== 'undefined' &&
      typeof OffscreenCanvas !== 'undefined' &&
      'transferControlToOffscreen' in this.particlesCanvas;

    if (!canUseWorker) {
      console.warn('OffscreenCanvas workers are not supported in this browser.');
      return;
    }

    const transferableCanvas = this.particlesCanvas as HTMLCanvasElement & {
      transferControlToOffscreen: () => OffscreenCanvas;
    };

    this.worker = new Worker(new URL('../workers/particles.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.particlesSupported = true;

    const initialMood = this.getCurrentMood();
    const offscreenCanvas = transferableCanvas.transferControlToOffscreen();
    this.postToWorker(
      {
        type: 'init',
        canvas: offscreenCanvas,
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
        config: this.getWorkerConfigForMood(initialMood),
      },
      [offscreenCanvas]
    );

    this.resizeHandler = () => this.postResize();
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    this.mouseMoveHandler = (event: MouseEvent): void => {
      this.pendingMouseEvent = event;
      if (this.mouseRaf !== null) return;

      this.mouseRaf = window.requestAnimationFrame(() => {
        this.mouseRaf = null;
        if (!this.pendingMouseEvent) return;
        this.postToWorker({
          type: 'mouse',
          x: this.pendingMouseEvent.clientX,
          y: this.pendingMouseEvent.clientY,
        });
      });
    };
    window.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });

    this.clickHandler = (event: MouseEvent): void => {
      this.postToWorker({
        type: 'click',
        x: event.clientX,
        y: event.clientY,
      });
    };
    window.addEventListener('click', this.clickHandler, { passive: true });

    this.visibilityHandler = () => this.syncWorkerPauseState();
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.workerErrorHandler = (event: ErrorEvent): void => {
      console.warn('Particle worker error:', event.message || event.error);
    };
    this.worker.addEventListener('error', this.workerErrorHandler);

    this.syncWorkerPauseState();

    window.updateParticlesMood = (mood: string) => this.updateParticlesMood(mood);
    window.reconfigureParticles = (mood: string) => this.reconfigureParticles(mood);
  }

  private updateWorkerConfig(mood: string): void {
    if (!this.worker || !this.particlesSupported) return;
    this.postToWorker({
      type: 'updateConfig',
      config: this.getWorkerConfigForMood(mood),
    });
  }

  updateParticlesMood(mood: string): void {
    this.updateWorkerConfig(mood);
  }

  reconfigureParticles(mood: string): void {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    this.updateWorkerConfig(mood);
  }

  pauseForNavigation(): void {
    this.navigationPaused = true;
    this.syncWorkerPauseState();
  }

  resumeAfterNavigation(): void {
    this.navigationPaused = false;
    this.syncWorkerPauseState();
  }

  setAnimationsEnabled(enabled: boolean): void {
    this.animationsEnabled = enabled;
    this.syncWorkerPauseState();
  }

  destroy(): void {
    if (this.mouseRaf !== null) {
      cancelAnimationFrame(this.mouseRaf);
      this.mouseRaf = null;
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }

    if (this.clickHandler) {
      window.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.worker && this.workerErrorHandler) {
      this.worker.removeEventListener('error', this.workerErrorHandler);
      this.workerErrorHandler = null;
    }

    if (this.worker) {
      this.postToWorker({ type: 'destroy' });
      this.worker.terminate();
      this.worker = null;
    }

    this.particlesSupported = false;

    if (window.updateParticlesMood) {
      delete window.updateParticlesMood;
    }

    if (window.reconfigureParticles) {
      delete window.reconfigureParticles;
    }

    this.parallaxController?.destroy();
    this.parallaxController = null;
  }
}

export default VisualEffects;
