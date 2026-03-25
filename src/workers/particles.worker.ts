/**
 * Particle Engine — Web Worker + OffscreenCanvas
 *
 * Replicates particles.js v2.0.0 behavior faithfully while running
 * entirely off the main thread. Physics, rendering, and interactivity
 * all happen here. The main thread only forwards mouse events and
 * configuration updates via postMessage.
 *
 * Coordinate convention:
 *   - All internal coordinates (particle positions, velocities, sizes,
 *     distances) are in DEVICE PIXELS.
 *   - All incoming coordinates from the main thread are in CSS PIXELS;
 *     the worker multiplies them by DPR on receipt.
 */

/* ══════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════ */

interface ParticleConfig {
  particles: {
    number: { value: number; density: { enable: boolean; value_area: number } };
    color: { value: string | string[] };
    shape: { type: string | string[]; stroke: { width: number; color: string } };
    opacity: {
      value: number;
      random: boolean;
      anim: { enable: boolean; speed: number; opacity_min: number; sync: boolean };
    };
    size: {
      value: number;
      random: boolean;
      anim: { enable: boolean; speed?: number; size_min?: number; sync?: boolean };
    };
    line_linked: {
      enable: boolean;
      distance: number;
      color: string;
      opacity: number;
      width: number;
    };
    move: {
      enable: boolean;
      speed: number;
      direction: string;
      random: boolean;
      straight: boolean;
      out_mode: string;
      bounce: boolean;
    };
  };
  interactivity: {
    detect_on: string;
    events: {
      onhover: { enable: boolean; mode?: string };
      onclick: { enable: boolean; mode?: string };
      resize: boolean;
    };
    modes: {
      grab?: { distance: number; line_linked: { opacity: number } };
      push?: { particles_nb: number };
      repulse?: { distance: number; duration: number };
      bubble?: {
        distance: number;
        size: number;
        duration: number;
        opacity: number;
        speed: number;
      };
    };
  };
  retina_detect: boolean;
}

interface Particle {
  x: number;
  y: number;
  /** Velocity multiplier — actual displacement is vx * scaledSpeed / 2 */
  vx: number;
  /** Velocity multiplier */
  vy: number;
  colorHex: string;
  r: number;
  g: number;
  b: number;
  opacity: number;
  opacityBase: number;
  size: number;
  sizeBase: number;
  shape: 'circle' | 'edge';
  // Animation state
  opacityAnimDir: number;
  opacityAnimSpeed: number;
  sizeAnimDir: number;
  sizeAnimSpeed: number;
  sizeAnimMin: number;
  // Bubble interactivity state
  radiusBubble: number | null;
  opacityBubble: number | null;
}

/* ══════════════════════════════════════════════
   State
   ══════════════════════════════════════════════ */

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let dpr = 1;
let canvasW = 0;
let canvasH = 0;
let config: ParticleConfig | null = null;
let particles: Particle[] = [];
let animationsEnabled = true;

// Mouse state (device pixels)
const mouse = { x: -9999, y: -9999, active: false };

// Loop control
let running = false;
let paused = false;
let frameId: number | null = null;
let lastFrameTime = 0;

// Scaled config values (device pixels) — recomputed on init/resize/configUpdate
let scaledSpeed = 1;
let scaledLinkDistance = 0;
let scaledLinkWidth = 0;
let scaledGrabDistance = 0;
let scaledRepulseDistance = 0;
let scaledBubbleDistance = 0;
let scaledBubbleSize = 0;
let linkColorRgb = { r: 212, g: 175, b: 55 };

// Active effects from ParticlesButton
let attractActive = false;
let attractTargetX = 0;
let attractTargetY = 0;
let attractForce = 0;
let attractCap = 0;

let gravityActive = false;
let gravityAccel = 0;
let gravityDamp = 0;

let smoothRestoreActive = false;
let smoothRestoreStart = 0;
let smoothRestoreDuration = 0;
let smoothRestoreK = 0;
let smoothRestoreBaseSpeed = 0;

/* ══════════════════════════════════════════════
   Utilities
   ══════════════════════════════════════════════ */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16) || 0,
    g: parseInt(clean.slice(2, 4), 16) || 0,
    b: parseInt(clean.slice(4, 6), 16) || 0,
  };
}

/** RAF with fallback to setTimeout for workers that lack rAF */
const scheduleFrame: (cb: (now: number) => void) => number =
  typeof requestAnimationFrame !== 'undefined'
    ? (cb) => requestAnimationFrame(cb)
    : (cb) => self.setTimeout(() => cb(performance.now()), 16) as unknown as number;

const cancelFrame: (id: number) => void =
  typeof cancelAnimationFrame !== 'undefined'
    ? (id) => cancelAnimationFrame(id)
    : (id) => self.clearTimeout(id);

/* ══════════════════════════════════════════════
   Scaled value computation
   ══════════════════════════════════════════════ */

function computeScaledValues(): void {
  if (!config) return;
  const effectiveDpr = config.retina_detect ? dpr : 1;

  scaledSpeed = config.particles.move.speed * effectiveDpr;

  scaledLinkDistance = config.particles.line_linked.distance * effectiveDpr;
  scaledLinkWidth = config.particles.line_linked.width * effectiveDpr;
  linkColorRgb = hexToRgb(config.particles.line_linked.color);

  scaledGrabDistance = (config.interactivity.modes.grab?.distance ?? 160) * effectiveDpr;
  scaledRepulseDistance =
    (config.interactivity.modes.repulse?.distance ?? 170) * effectiveDpr;
  scaledBubbleDistance =
    (config.interactivity.modes.bubble?.distance ?? 170) * effectiveDpr;
  scaledBubbleSize =
    (config.interactivity.modes.bubble?.size ?? 4) * effectiveDpr;
}

/* ══════════════════════════════════════════════
   Density-based particle count
   (replicates particles.js densityAutoParticles)
   ══════════════════════════════════════════════ */

function computeTargetCount(): number {
  if (!config) return 0;
  const numCfg = config.particles.number;
  if (!numCfg.density.enable) return numCfg.value;

  let area = (canvasW * canvasH) / 1000;
  // particles.js divides retina area by (pxratio * 2) so density is DPR-independent
  if (config.retina_detect && dpr > 1) {
    area = area / (dpr * 2);
  }
  return Math.round((area * numCfg.value) / numCfg.density.value_area);
}

/* ══════════════════════════════════════════════
   Particle creation — faithfully matches particles.js
   ══════════════════════════════════════════════ */

function createParticle(posX?: number, posY?: number): Particle {
  if (!config) throw new Error('no config');
  const effectiveDpr = config.retina_detect ? dpr : 1;

  // --- Color ---
  const colors = Array.isArray(config.particles.color.value)
    ? config.particles.color.value
    : [config.particles.color.value];
  const colorHex = colors[Math.floor(Math.random() * colors.length)];
  const { r, g, b } = hexToRgb(colorHex);

  // --- Shape ---
  const shapes = Array.isArray(config.particles.shape.type)
    ? config.particles.shape.type
    : [config.particles.shape.type];
  const shape = (shapes[Math.floor(Math.random() * shapes.length)] === 'edge'
    ? 'edge'
    : 'circle') as 'circle' | 'edge';

  // --- Size (device pixels) ---
  // particles.js: radius = (random ? Math.random() : 1) * size.value
  // then size.value is scaled by pxratio during retinaInit
  // A minimum random fraction of 0.35 ensures no particle starts invisibly small
  const sizeBase =
    (config.particles.size.random ? 0.35 + Math.random() * 0.65 : 1) *
    config.particles.size.value *
    effectiveDpr;

  // --- Opacity ---
  const opacityBase =
    (config.particles.opacity.random ? Math.random() : 1) *
    config.particles.opacity.value;

  // --- Opacity animation ---
  const oAnim = config.particles.opacity.anim;
  // particles.js: vo = anim.speed / 100; if !sync: vo *= Math.random()
  // Note: particles.js does NOT scale opacity anim speed by pxratio (opacity is dimensionless)
  const opacityAnimSpeed = oAnim.enable
    ? (oAnim.speed / 100) * (oAnim.sync ? 1 : Math.random() || 0.1)
    : 0;

  // --- Size animation ---
  const sAnim = config.particles.size.anim;
  const sizeAnimEnabled = sAnim?.enable ?? false;
  // particles.js: vs = anim.speed * pxratio / 100; if !sync: vs *= Math.random()
  const sizeAnimSpeed = sizeAnimEnabled
    ? ((sAnim!.speed ?? 0) / 100) * effectiveDpr * (sAnim!.sync ? 1 : Math.random() || 0.1)
    : 0;
  const sizeAnimMin = (sAnim?.size_min ?? 0) * effectiveDpr;

  // --- Velocity (multiplier model, same as particles.js) ---
  const dir = config.particles.move.direction;
  let velBaseX = 0;
  let velBaseY = 0;
  switch (dir) {
    case 'top':
      velBaseY = -1;
      break;
    case 'top-right':
      velBaseX = 0.5;
      velBaseY = -0.5;
      break;
    case 'right':
      velBaseX = 1;
      break;
    case 'bottom-right':
      velBaseX = 0.5;
      velBaseY = 0.5;
      break;
    case 'bottom':
      velBaseY = 1;
      break;
    case 'bottom-left':
      velBaseX = -0.5;
      velBaseY = 0.5;
      break;
    case 'left':
      velBaseX = -1;
      break;
    case 'top-left':
      velBaseX = -0.5;
      velBaseY = -0.5;
      break;
    // 'none' → 0, 0
  }

  let vx: number;
  let vy: number;
  if (config.particles.move.straight) {
    vx = velBaseX;
    vy = velBaseY;
    if (config.particles.move.random) {
      vx *= Math.random();
      vy *= Math.random();
    }
  } else {
    vx = velBaseX + Math.random() - 0.5;
    vy = velBaseY + Math.random() - 0.5;
  }

  // --- Position (device pixels) ---
  const x = posX !== undefined ? posX : Math.random() * canvasW;
  const y = posY !== undefined ? posY : Math.random() * canvasH;

  return {
    x,
    y,
    vx,
    vy,
    colorHex,
    r,
    g,
    b,
    opacity: opacityBase,
    opacityBase,
    size: sizeBase,
    sizeBase,
    shape,
    opacityAnimDir: Math.random() > 0.5 ? 1 : -1,
    opacityAnimSpeed,
    sizeAnimDir: Math.random() > 0.5 ? 1 : -1,
    sizeAnimSpeed,
    sizeAnimMin,
    radiusBubble: null,
    opacityBubble: null,
  };
}

/* ══════════════════════════════════════════════
   Initialization
   ══════════════════════════════════════════════ */

function initParticles(): void {
  particles = [];
  const count = computeTargetCount();
  for (let i = 0; i < count; i++) {
    particles.push(createParticle());
  }
}

/* ══════════════════════════════════════════════
   Physics update (per frame)
   ══════════════════════════════════════════════ */

function update(dt: number): void {
  if (!config) return;
  const moveEnabled = config.particles.move.enable && animationsEnabled;
  const halfSpeed = scaledSpeed / 2;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // --- Movement ---
    if (moveEnabled) {
      p.x += p.vx * halfSpeed * dt;
      p.y += p.vy * halfSpeed * dt;
    }

    // --- Boundary: out_mode 'out' → wrap around ---
    if (p.x < -p.sizeBase * 2) p.x = canvasW + p.sizeBase;
    else if (p.x > canvasW + p.sizeBase * 2) p.x = -p.sizeBase;
    if (p.y < -p.sizeBase * 2) p.y = canvasH + p.sizeBase;
    else if (p.y > canvasH + p.sizeBase * 2) p.y = -p.sizeBase;

    // --- Opacity animation ---
    if (p.opacityAnimSpeed > 0 && animationsEnabled) {
      p.opacity += p.opacityAnimDir * p.opacityAnimSpeed * dt;
      const opMin = config.particles.opacity.anim.opacity_min;
      const opMax = config.particles.opacity.value;
      if (p.opacity <= opMin) {
        p.opacity = opMin;
        p.opacityAnimDir = 1;
      } else if (p.opacity >= opMax) {
        p.opacity = opMax;
        p.opacityAnimDir = -1;
      }
    }

    // --- Size animation ---
    if (p.sizeAnimSpeed > 0 && animationsEnabled) {
      p.size += p.sizeAnimDir * p.sizeAnimSpeed * dt;
      if (p.size <= p.sizeAnimMin) {
        p.size = p.sizeAnimMin;
        p.sizeAnimDir = 1;
      } else if (p.size >= p.sizeBase) {
        p.size = p.sizeBase;
        p.sizeAnimDir = -1;
      }
    }

    // Reset bubble state each frame (recomputed during interactivity)
    p.radiusBubble = null;
    p.opacityBubble = null;
  }

  // --- Active effects ---
  if (attractActive) updateAttract(dt);
  if (gravityActive) updateGravity(dt);
  if (smoothRestoreActive) updateSmoothRestore(dt);

  // --- Interactivity: repulse / bubble (per-frame, hover-based) ---
  if (mouse.active && config.interactivity.events.onhover.enable && animationsEnabled) {
    const mode = config.interactivity.events.onhover.mode;
    if (mode === 'repulse') updateRepulse(dt);
    if (mode === 'bubble') updateBubble(); // pure positional override — dt-independent
  }
}

/* ── Effect update helpers ─────────────────── */

function updateAttract(dt: number): void {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const dx = attractTargetX - p.x;
    const dy = attractTargetY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    // Add 15% tangential component for natural swirl
    // (the old code had a CSS/device-pixel mismatch that produced this organically)
    p.vx += (nx + (-ny) * 0.15) * attractForce * dt;
    p.vy += (ny + nx * 0.15) * attractForce * dt;
    const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (spd > attractCap) {
      p.vx = (p.vx / spd) * attractCap;
      p.vy = (p.vy / spd) * attractCap;
    }
  }
}

function updateGravity(dt: number): void {
  const floor = canvasH - 4;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.vy += gravityAccel * dt;
    if (p.y >= floor) {
      p.vy = Math.abs(p.vy) * gravityDamp; // gravityDamp is negative: reverses and dampens
      p.y = floor;
    }
  }
}

function updateSmoothRestore(dt: number): void {
  const elapsed = performance.now() - smoothRestoreStart;
  const done = elapsed >= smoothRestoreDuration;

  // Make exponential decay dt-independent: apply k^dt per frame
  const k = done ? 0 : Math.pow(smoothRestoreK, dt);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const mag = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (mag < 0.001) continue;

    const targetMag = done
      ? smoothRestoreBaseSpeed
      : smoothRestoreBaseSpeed + (mag - smoothRestoreBaseSpeed) * k;
    const ratio = targetMag / mag;
    p.vx *= ratio;
    p.vy *= ratio;

    // Gently scatter velocity direction during restore so particles don't
    // all drift uniformly in the effect's residual direction.
    if (!done) {
      const jitter = 0.015 * dt;
      p.vx += (Math.random() - 0.5) * jitter;
      p.vy += (Math.random() - 0.5) * jitter;
    }
  }

  if (done) {
    // Re-randomize directions to approximate the original random drift
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const angle = Math.random() * Math.PI * 2;
      p.vx = Math.cos(angle) * smoothRestoreBaseSpeed;
      p.vy = Math.sin(angle) * smoothRestoreBaseSpeed;
    }
    smoothRestoreActive = false;
  }
}

function updateRepulse(dt: number): void {
  if (!config) return;
  const repDist = scaledRepulseDistance;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > repDist || dist < 0.01) continue;

    // particles.js repulse formula:
    // factor = clamp((1/R) * (-1*(d/R)^2 + 1) * R * velocity, 0, 50)
    // Simplified: factor = clamp(100 * (1 - (d/R)^2), 0, 50)
    const ratio = dist / repDist;
    const factor = Math.min(100 * (1 - ratio * ratio), 50) * dt;
    const norm = 1 / dist;
    p.x += dx * norm * factor;
    p.y += dy * norm * factor;
  }
}

function updateBubble(): void {
  if (!config?.interactivity.modes.bubble) return;
  const bubCfg = config.interactivity.modes.bubble;
  const bubDist = scaledBubbleDistance;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > bubDist) continue;

    const ratio = 1 - dist / bubDist;
    // Size bubble
    const targetSize = p.sizeBase + (scaledBubbleSize - p.sizeBase) * ratio;
    if (targetSize >= 0) p.radiusBubble = targetSize;
    // Opacity bubble
    if (bubCfg.opacity !== config.particles.opacity.value) {
      p.opacityBubble =
        config.particles.opacity.value +
        (bubCfg.opacity - config.particles.opacity.value) * ratio;
    }
  }
}

/* ══════════════════════════════════════════════
   Rendering (per frame)
   ══════════════════════════════════════════════ */

function draw(): void {
  if (!ctx || !config) return;

  ctx.clearRect(0, 0, canvasW, canvasH);

  const linkEnabled = config.particles.line_linked.enable;
  const linkOp = config.particles.line_linked.opacity;
  const lr = linkColorRgb.r;
  const lg = linkColorRgb.g;
  const lb = linkColorRgb.b;
  const linkDist = scaledLinkDistance;

  // --- Draw line links between particles ---
  if (linkEnabled) {
    ctx.lineWidth = scaledLinkWidth;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > linkDist * linkDist) continue;
        const dist = Math.sqrt(distSq);
        const opacity = linkOp * (1 - dist / linkDist);
        if (opacity <= 0) continue;
        ctx.strokeStyle = `rgba(${lr},${lg},${lb},${opacity})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  // --- Draw grab lines (mouse → nearby particles) ---
  if (
    mouse.active &&
    config.interactivity.events.onhover.enable &&
    config.interactivity.events.onhover.mode === 'grab' &&
    animationsEnabled
  ) {
    const grabDist = scaledGrabDistance;
    const grabOp = config.interactivity.modes.grab?.line_linked?.opacity ?? 0.35;
    ctx.lineWidth = scaledLinkWidth;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > grabDist * grabDist) continue;
      const dist = Math.sqrt(distSq);
      const opacity = grabOp * (1 - dist / grabDist);
      if (opacity <= 0) continue;
      ctx.strokeStyle = `rgba(${lr},${lg},${lb},${opacity})`;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.stroke();
    }
  }

  // --- Draw particles ---
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const radius = p.radiusBubble ?? p.size;
    const opacity = p.opacityBubble ?? p.opacity;
    if (radius <= 0) continue;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = p.colorHex;

    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 'edge' — rectangle (this is how particles.js renders 'edge')
      ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
    }
  }

  ctx.globalAlpha = 1;
}

/* ══════════════════════════════════════════════
   Main animation loop
   ══════════════════════════════════════════════ */

function loop(now: number): void {
  if (!running || paused) return;
  if (lastFrameTime === 0) lastFrameTime = now;
  // Normalize to 60 fps: dt=1 at 60fps, 0.5 at 120fps, 2 at 30fps.
  // Clamp to [0, 3] to avoid huge jumps after tab switches or long pauses.
  const dt = Math.min(Math.max((now - lastFrameTime) / (1000 / 60), 0), 3);
  lastFrameTime = now;
  update(dt);
  draw();
  frameId = scheduleFrame(loop);
}

function startLoop(): void {
  if (running) return;
  running = true;
  lastFrameTime = 0;
  frameId = scheduleFrame(loop);
}

function stopLoop(): void {
  running = false;
  if (frameId !== null) {
    cancelFrame(frameId);
    frameId = null;
  }
}

/* ══════════════════════════════════════════════
   Message handler
   ══════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.onmessage = (e: MessageEvent<any>) => {
  const msg = e.data;
  switch (msg.type) {
    /* ── Lifecycle ───────────────────────────── */

    case 'init': {
      canvas = msg.canvas as OffscreenCanvas;
      dpr = msg.dpr ?? 1;
      const cssW: number = msg.cssWidth;
      const cssH: number = msg.cssHeight;
      canvasW = cssW * dpr;
      canvasH = cssH * dpr;
      canvas.width = canvasW;
      canvas.height = canvasH;
      ctx = canvas.getContext('2d');
      config = msg.config as ParticleConfig;
      computeScaledValues();
      initParticles();
      startLoop();
      break;
    }

    case 'resize': {
      dpr = msg.dpr ?? dpr;
      const newW = msg.cssWidth * dpr;
      const newH = msg.cssHeight * dpr;
      if (canvas) {
        canvas.width = newW;
        canvas.height = newH;
      }
      // Clamp particles to new bounds (same as particles.js)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.x > newW) p.x = Math.random() * newW;
        if (p.y > newH) p.y = Math.random() * newH;
      }
      canvasW = newW;
      canvasH = newH;
      computeScaledValues();
      break;
    }

    case 'updateConfig': {
      config = msg.config as ParticleConfig;
      computeScaledValues();
      // Full reconfigure: destroy existing particles and create new
      initParticles();
      // Reset any active effects
      attractActive = false;
      gravityActive = false;
      smoothRestoreActive = false;
      if (!running) startLoop();
      break;
    }

    case 'pause':
      paused = true;
      break;

    case 'resume':
      if (paused) {
        paused = false;
        if (running) {
          lastFrameTime = 0; // reset so first post-pause frame doesn't spike dt
          frameId = scheduleFrame(loop);
        }
      }
      break;

    case 'destroy':
      stopLoop();
      particles = [];
      ctx = null;
      canvas = null;
      config = null;
      break;

    case 'setAnimationsEnabled':
      animationsEnabled = msg.enabled;
      break;

    /* ── Mouse interaction ───────────────────── */

    case 'mouse':
      // Incoming coordinates are CSS pixels (offsetX/offsetY from canvas)
      mouse.x = msg.x * dpr;
      mouse.y = msg.y * dpr;
      mouse.active = true;
      break;

    case 'mouseleave':
      mouse.active = false;
      break;

    case 'click': {
      if (!config) break;
      const clickX = msg.x * dpr;
      const clickY = msg.y * dpr;
      if (config.interactivity.events.onclick.enable) {
        const mode = config.interactivity.events.onclick.mode;
        if (mode === 'push') {
          const nb = config.interactivity.modes.push?.particles_nb ?? 3;
          for (let n = 0; n < nb; n++) {
            particles.push(createParticle(clickX, clickY));
          }
        }
      }
      break;
    }

    /* ── UI queries ──────────────────────────── */

    case 'get_count':
      self.postMessage({ type: 'count', value: particles.length });
      break;

    /* ── ParticlesButton effect API ──────────── */

    case 'push_particles': {
      // positions are in CSS pixels — convert to device pixels
      const positions: Array<{ x: number; y: number }> = msg.positions;
      for (let i = 0; i < positions.length; i++) {
        particles.push(createParticle(positions[i].x * dpr, positions[i].y * dpr));
      }
      break;
    }

    case 'set_velocity_radial_burst': {
      const ox = msg.origin.x * dpr;
      const oy = msg.origin.y * dpr;
      const burstBase: number = msg.burstBase;
      const burstRange: number = msg.burstRange;
      const burstMult: number = msg.burstMult;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - ox;
        const dy = p.y - oy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const burst = (burstBase + Math.random() * burstRange) * burstMult;
        p.vx = (dx / dist) * burst;
        p.vy = (dy / dist) * burst;
      }
      break;
    }

    case 'set_velocity_uniform_speed': {
      const speed: number = msg.speed;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const mag = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (mag < 0.001) {
          const angle = Math.random() * Math.PI * 2;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
        } else {
          const ratio = speed / mag;
          p.vx *= ratio;
          p.vy *= ratio;
        }
      }
      break;
    }

    case 'start_attract':
      attractActive = true;
      attractTargetX = msg.target.x * dpr;
      attractTargetY = msg.target.y * dpr;
      attractForce = msg.pullForce;
      attractCap = msg.pullCap;
      break;

    case 'stop_attract':
      attractActive = false;
      break;

    case 'start_gravity':
      gravityActive = true;
      gravityAccel = msg.gravityAccel;
      gravityDamp = msg.bounceDamp;
      break;

    case 'stop_gravity':
      gravityActive = false;
      break;

    case 'smooth_restore': {
      const duration: number = msg.duration;
      // baseSpeed: same calculation as getBaseSpeed() in the old ParticlesButton code
      // getBaseSpeed = (move.speed * 0.22)
      // scaledSpeed already includes DPR scaling, matching particles.js's pJS.particles.move.speed
      smoothRestoreBaseSpeed = scaledSpeed * 0.22;
      smoothRestoreDuration = duration;
      const frames = duration * 0.06;
      // Decay to 2% of excess velocity — more aggressive than before
      // to make the return to calm clearly visible
      smoothRestoreK = Math.pow(0.02, 1 / frames);
      smoothRestoreStart = performance.now();
      smoothRestoreActive = true;
      break;
    }

    case 'cancel_smooth_restore':
      smoothRestoreActive = false;
      break;

    case 'trim_particles': {
      const target: number = msg.targetCount;
      if (particles.length > target) {
        particles.splice(target, particles.length - target);
      }
      break;
    }
  }
};
