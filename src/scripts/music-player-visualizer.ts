import { isLowTier } from '../utils/performanceTier';

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

class MusicPlayerVisualizer {
  private audio: HTMLAudioElement;
  private canvas: HTMLCanvasElement | null;
  private visualizer: VisualizerState;
  private hasUserGesture: boolean;
  private userGestureHandler: (() => void) | null;

  private static readonly USER_GESTURE_EVENTS: ReadonlyArray<keyof DocumentEventMap> = [
    'pointerdown',
    'keydown',
    'touchstart',
    'mousedown',
    'click',
  ];

  constructor(audio: HTMLAudioElement) {
    this.audio = audio;
    this.canvas = null;
    this.hasUserGesture = false;
    this.userGestureHandler = null;
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

    this.setupUserGestureTracking();
  }

  setup(canvas: HTMLCanvasElement): void {
    if (this.visualizer.initialized) return;

    this.canvas = canvas;
    this.visualizer.reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    this.visualizer.ctx = canvas.getContext('2d');
    this.visualizer.initialized = true;

    this.resize();
    this.renderIdleWave();

    this.visualizer.handleResize = () => this.resize();
    window.addEventListener('resize', this.visualizer.handleResize);
  }

  start(): void {
    if (this.visualizer.reducedMotion) return;
    if (!this.visualizer.ctx) return;
    if (!this.canStartAudioContext()) return;

    this.ensureContext();
    if (!this.visualizer.analyser || !this.visualizer.dataArray || !this.visualizer.freqData) {
      return;
    }

    if (this.visualizer.audioContext?.state === 'suspended' && this.canStartAudioContext()) {
      this.visualizer.audioContext.resume().catch(() => {});
    }

    if (this.visualizer.rafId) return;

    const { ctx } = this.visualizer;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const useShadow = !isLowTier();

    const draw = () => {
      const analyser = this.visualizer.analyser;
      const dataArray = this.visualizer.dataArray;
      const freqData = this.visualizer.freqData;
      const context = this.visualizer.ctx;
      if (!analyser || !dataArray || !freqData || !context) {
        this.visualizer.rafId = null;
        return;
      }

      this.visualizer.rafId = window.requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      analyser.getByteFrequencyData(freqData);

      const { width, height, bufferLength } = this.visualizer;
      const rgb = this.getAccentRgb();
      let sum = 0;

      for (let i = 0; i < bufferLength; i++) {
        sum += freqData[i];
      }

      const energy = Math.min(1, sum / (bufferLength * 180));
      const amplitude = height * (0.2 + energy * 0.9);

      context.clearRect(0, 0, width, height);

      context.lineWidth = 2.2 + energy * 2.2;
      context.strokeStyle = `rgba(${rgb}, ${0.6 + energy * 0.4})`;
      if (useShadow) {
        context.shadowBlur = 10 + energy * 18;
        context.shadowColor = `rgba(${rgb}, 0.85)`;
      }

      context.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] - 128) / 128;
        const y = height / 2 + v * amplitude;

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }

        x += sliceWidth;
      }

      context.stroke();
      if (useShadow) context.shadowBlur = 0;
    };

    this.visualizer.rafId = window.requestAnimationFrame(draw);
  }

  stop(): void {
    if (this.visualizer.rafId) {
      window.cancelAnimationFrame(this.visualizer.rafId);
      this.visualizer.rafId = null;
    }
    this.renderIdleWave();
  }

  renderIdleWave(): void {
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

  destroy(): void {
    this.stop();
    this.teardownUserGestureTracking();
    if (this.visualizer.handleResize) {
      window.removeEventListener('resize', this.visualizer.handleResize);
      this.visualizer.handleResize = undefined;
    }
  }

  private ensureContext(): void {
    if (this.visualizer.audioContext || this.visualizer.reducedMotion) return;
    if (!this.canStartAudioContext()) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    try {
      this.visualizer.audioContext = new AudioContext();
    } catch {
      return;
    }

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

  private resize(): void {
    if (!this.visualizer.ctx || !this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    this.canvas.width = Math.floor(width * pixelRatio);
    this.canvas.height = Math.floor(height * pixelRatio);
    this.visualizer.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    this.visualizer.width = width;
    this.visualizer.height = height;
    this.renderIdleWave();
  }

  private getAccentRgb(): string {
    const rgb = getComputedStyle(document.body).getPropertyValue('--color-primary-rgb').trim();
    return rgb || '212, 175, 55';
  }

  private canStartAudioContext(): boolean {
    return this.hasUserGesture || !!navigator.userActivation?.hasBeenActive;
  }

  private setupUserGestureTracking(): void {
    if (this.canStartAudioContext()) {
      this.hasUserGesture = true;
      return;
    }

    this.userGestureHandler = () => {
      if (this.hasUserGesture) return;
      this.hasUserGesture = true;
      this.teardownUserGestureTracking();

      // If playback is already running (autoplay/memory restore), start visualizer now.
      if (!this.audio.paused) {
        this.start();
      }
    };

    MusicPlayerVisualizer.USER_GESTURE_EVENTS.forEach((eventName) => {
      document.addEventListener(eventName, this.userGestureHandler as EventListener, {
        capture: true,
        passive: true,
      });
    });
  }

  private teardownUserGestureTracking(): void {
    if (!this.userGestureHandler) return;

    MusicPlayerVisualizer.USER_GESTURE_EVENTS.forEach((eventName) => {
      document.removeEventListener(eventName, this.userGestureHandler as EventListener, {
        capture: true,
      });
    });

    this.userGestureHandler = null;
  }
}

export default MusicPlayerVisualizer;
