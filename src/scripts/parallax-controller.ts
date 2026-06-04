class ParallaxController {
  private background: HTMLElement;
  private rafId: number | null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null;
  private visibilityHandler: (() => void) | null;
  private running: boolean;

  constructor(background: HTMLElement) {
    this.background = background;
    this.rafId = null;
    this.mouseMoveHandler = null;
    this.visibilityHandler = null;
    this.running = false;
  }

  start(): void {
    if (window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches) {
      return;
    }

    const parallaxLayersEnabled = true;

    let mouseX = 0;
    let mouseY = 0;
    let posX = 0;
    let posY = 0;

    const friction = 1 / 12;
    const depth = 0.06;
    const particlesDepthRatio = 0.5;
    let particlesPosX = 0;
    let particlesPosY = 0;
    const particlesCanvas: HTMLElement | null = parallaxLayersEnabled
      ? document.getElementById('particles-canvas')
      : null;

    const updateParallax = (): void => {
      if (document.body?.classList.contains('a11y--no-motion')) {
        this.rafId = null;
        this.running = false;
        return;
      }

      posX += (mouseX - posX) * friction;
      posY += (mouseY - posY) * friction;
      this.background.style.transform = `scale(1.15) translate(${posX}px, ${posY}px)`;

      if (particlesCanvas) {
        const targetPX = mouseX * particlesDepthRatio;
        const targetPY = mouseY * particlesDepthRatio;
        particlesPosX += (targetPX - particlesPosX) * friction;
        particlesPosY += (targetPY - particlesPosY) * friction;
        particlesCanvas.style.transform = `scale(1.08) translate(${particlesPosX}px, ${particlesPosY}px)`;
      }

      const settleThreshold = 0.05;
      const bgSettled =
        Math.abs(mouseX - posX) < settleThreshold && Math.abs(mouseY - posY) < settleThreshold;
      const pxSettled =
        !particlesCanvas ||
        (Math.abs(mouseX * particlesDepthRatio - particlesPosX) < settleThreshold &&
          Math.abs(mouseY * particlesDepthRatio - particlesPosY) < settleThreshold);

      if (bgSettled && pxSettled) {
        this.rafId = null;
        this.running = false;
        return;
      }

      this.rafId = requestAnimationFrame(updateParallax);
    };

    const handleMouseMove = (e: MouseEvent): void => {
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      mouseX = x * depth;
      mouseY = y * depth;

      const isNoMotion: boolean = document.body?.classList.contains('a11y--no-motion') ?? false;
      if (isNoMotion && this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.running = false;
        return;
      }

      if (!this.running && !isNoMotion) {
        this.running = true;
        this.rafId = requestAnimationFrame(updateParallax);
      }
    };

    let ticking = false;
    this.mouseMoveHandler = (e: MouseEvent): void => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleMouseMove(e);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });

    this.running = true;
    this.rafId = requestAnimationFrame(updateParallax);

    this.visibilityHandler = (): void => {
      if (document.hidden) {
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        this.running = false;
      } else if (!this.running) {
        this.running = true;
        this.rafId = requestAnimationFrame(updateParallax);
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.running = false;
  }
}

export default ParallaxController;
