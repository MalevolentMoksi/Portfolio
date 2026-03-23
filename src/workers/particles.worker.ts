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

interface InitMessage {
  type: 'init';
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  dpr: number;
  config: WorkerParticleConfig;
}

interface ResizeMessage {
  type: 'resize';
  width: number;
  height: number;
  dpr: number;
}

interface MouseMessage {
  type: 'mouse';
  x: number;
  y: number;
}

interface ClickMessage {
  type: 'click';
  x: number;
  y: number;
}

interface UpdateConfigMessage {
  type: 'updateConfig';
  config: WorkerParticleConfig;
}

interface PauseMessage {
  type: 'pause';
}

interface ResumeMessage {
  type: 'resume';
}

interface DestroyMessage {
  type: 'destroy';
}

type WorkerMessage =
  | InitMessage
  | ResizeMessage
  | MouseMessage
  | ClickMessage
  | UpdateConfigMessage
  | PauseMessage
  | ResumeMessage
  | DestroyMessage;

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface WorkerLikeGlobal {
  onmessage: ((event: MessageEvent<WorkerMessage>) => void) | null;
  requestAnimationFrame?: (callback: (time: number) => void) => number;
  cancelAnimationFrame?: (handle: number) => void;
}

const workerGlobal = globalThis as unknown as WorkerLikeGlobal;

const TAU = Math.PI * 2;
const MOUSE_ACTIVE_MS = 260;
const CLICK_BURST_RADIUS = 36;
const WRAP_PADDING = 24;

const DIRECTION_VECTORS: Record<MoveDirection, { x: number; y: number }> = {
  none: { x: 0, y: 0 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  'top-right': { x: 0.7071, y: -0.7071 },
  'top-left': { x: -0.7071, y: -0.7071 },
  'bottom-right': { x: 0.7071, y: 0.7071 },
  'bottom-left': { x: -0.7071, y: 0.7071 },
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

const parseColor = (input: string): RgbColor => {
  const value = input.trim();
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  const rgbMatch = value.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: clamp(parseInt(rgbMatch[1], 10), 0, 255),
      g: clamp(parseInt(rgbMatch[2], 10), 0, 255),
      b: clamp(parseInt(rgbMatch[3], 10), 0, 255),
    };
  }

  return { r: 212, g: 175, b: 55 };
};

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let viewportWidth = 1;
let viewportHeight = 1;
let devicePixelRatioValue = 1;
let config: WorkerParticleConfig | null = null;
let palette: RgbColor[] = [{ r: 212, g: 175, b: 55 }];
let linkColor: RgbColor = { r: 212, g: 175, b: 55 };

let posX = new Float32Array(0);
let posY = new Float32Array(0);
let velX = new Float32Array(0);
let velY = new Float32Array(0);
let baseSize = new Float32Array(0);
let baseOpacity = new Float32Array(0);
let sizePhase = new Float32Array(0);
let opacityPhase = new Float32Array(0);
let colorIndex = new Uint8Array(0);
let particleCount = 0;

let running = false;
let frameHandle: number | null = null;
let lastTick = 0;

let mouseX = -9999;
let mouseY = -9999;
let lastMouseAt = 0;
let clickX = -9999;
let clickY = -9999;
let clickActiveUntil = 0;

const requestFrame = (callback: (time: number) => void): number => {
  if (typeof workerGlobal.requestAnimationFrame === 'function') {
    return workerGlobal.requestAnimationFrame(callback);
  }

  return setTimeout(() => callback(performance.now()), 16) as unknown as number;
};

const cancelFrame = (handle: number): void => {
  if (typeof workerGlobal.cancelAnimationFrame === 'function') {
    workerGlobal.cancelAnimationFrame(handle);
    return;
  }

  clearTimeout(handle);
};

const updateCanvasSize = (width: number, height: number, dpr: number): void => {
  viewportWidth = Math.max(1, width);
  viewportHeight = Math.max(1, height);
  devicePixelRatioValue = clamp(dpr || 1, 1, 3);

  if (!canvas || !ctx) {
    return;
  }

  canvas.width = Math.floor(viewportWidth * devicePixelRatioValue);
  canvas.height = Math.floor(viewportHeight * devicePixelRatioValue);
  ctx.setTransform(devicePixelRatioValue, 0, 0, devicePixelRatioValue, 0, 0);
};

const spawnParticle = (index: number, aroundX?: number, aroundY?: number): void => {
  if (!config) {
    return;
  }

  const direction = DIRECTION_VECTORS[config.moveDirection];
  const speed = config.moveSpeed * randomBetween(0.35, 0.95);
  const randomFactor = config.moveRandom ? 0.9 : 0.3;

  if (typeof aroundX === 'number' && typeof aroundY === 'number') {
    posX[index] = aroundX + randomBetween(-CLICK_BURST_RADIUS, CLICK_BURST_RADIUS);
    posY[index] = aroundY + randomBetween(-CLICK_BURST_RADIUS, CLICK_BURST_RADIUS);
  } else {
    posX[index] = randomBetween(0, viewportWidth);
    posY[index] = randomBetween(0, viewportHeight);
  }

  velX[index] = direction.x * speed + randomBetween(-1, 1) * speed * randomFactor;
  velY[index] = direction.y * speed + randomBetween(-1, 1) * speed * randomFactor;
  baseSize[index] = Math.max(0.6, config.size * randomBetween(0.6, 1.35));
  baseOpacity[index] = clamp(config.opacity * randomBetween(0.7, 1.25), config.opacityMin, 1);
  sizePhase[index] = randomBetween(0, TAU);
  opacityPhase[index] = randomBetween(0, TAU);
  colorIndex[index] = Math.floor(Math.random() * palette.length) % 255;
};

const resetParticles = (count: number): void => {
  const safeCount = Math.max(0, Math.floor(count));
  posX = new Float32Array(safeCount);
  posY = new Float32Array(safeCount);
  velX = new Float32Array(safeCount);
  velY = new Float32Array(safeCount);
  baseSize = new Float32Array(safeCount);
  baseOpacity = new Float32Array(safeCount);
  sizePhase = new Float32Array(safeCount);
  opacityPhase = new Float32Array(safeCount);
  colorIndex = new Uint8Array(safeCount);
  particleCount = safeCount;

  for (let i = 0; i < safeCount; i++) {
    spawnParticle(i);
  }
};

const appendParticles = (count: number, aroundX: number, aroundY: number): void => {
  const addCount = Math.max(0, Math.floor(count));
  if (addCount === 0 || !config) {
    return;
  }

  const nextCount = particleCount + addCount;

  const nextPosX = new Float32Array(nextCount);
  const nextPosY = new Float32Array(nextCount);
  const nextVelX = new Float32Array(nextCount);
  const nextVelY = new Float32Array(nextCount);
  const nextBaseSize = new Float32Array(nextCount);
  const nextBaseOpacity = new Float32Array(nextCount);
  const nextSizePhase = new Float32Array(nextCount);
  const nextOpacityPhase = new Float32Array(nextCount);
  const nextColorIndex = new Uint8Array(nextCount);

  nextPosX.set(posX);
  nextPosY.set(posY);
  nextVelX.set(velX);
  nextVelY.set(velY);
  nextBaseSize.set(baseSize);
  nextBaseOpacity.set(baseOpacity);
  nextSizePhase.set(sizePhase);
  nextOpacityPhase.set(opacityPhase);
  nextColorIndex.set(colorIndex);

  posX = nextPosX;
  posY = nextPosY;
  velX = nextVelX;
  velY = nextVelY;
  baseSize = nextBaseSize;
  baseOpacity = nextBaseOpacity;
  sizePhase = nextSizePhase;
  opacityPhase = nextOpacityPhase;
  colorIndex = nextColorIndex;

  for (let i = particleCount; i < nextCount; i++) {
    spawnParticle(i, aroundX, aroundY);
  }

  particleCount = nextCount;
};

const applyConfig = (nextConfig: WorkerParticleConfig): void => {
  config = nextConfig;
  palette = (nextConfig.colors.length ? nextConfig.colors : ['#d4af37']).map(parseColor);
  linkColor = parseColor(nextConfig.linkColor || nextConfig.colors[0] || '#d4af37');
  resetParticles(nextConfig.particleCount);
};

const moveParticles = (dt: number, now: number): void => {
  if (!config) {
    return;
  }

  const direction = DIRECTION_VECTORS[config.moveDirection];
  const mouseActive = now - lastMouseAt < MOUSE_ACTIVE_MS;
  const clickRepulseActive =
    config.clickEnabled && config.clickMode === 'repulse' && now < clickActiveUntil;

  for (let i = 0; i < particleCount; i++) {
    if (config.moveEnabled) {
      const directionalStrength = config.moveStraight ? 0.09 : 0.035;
      velX[i] += direction.x * directionalStrength * config.moveSpeed * dt;
      velY[i] += direction.y * directionalStrength * config.moveSpeed * dt;

      if (config.moveRandom) {
        velX[i] += randomBetween(-1, 1) * 0.07 * config.moveSpeed * dt;
        velY[i] += randomBetween(-1, 1) * 0.07 * config.moveSpeed * dt;
      }
    } else {
      velX[i] *= 0.94;
      velY[i] *= 0.94;
    }

    if (mouseActive && config.hoverEnabled) {
      const dx = posX[i] - mouseX;
      const dy = posY[i] - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      if (config.hoverMode === 'repulse' && distance < config.repulseDistance) {
        const pull = (1 - distance / config.repulseDistance) * 0.7 * config.moveSpeed;
        velX[i] += (dx / distance) * pull * dt;
        velY[i] += (dy / distance) * pull * dt;
      }

      if (config.hoverMode === 'bubble' && distance < config.bubbleDistance) {
        const nudge = (1 - distance / config.bubbleDistance) * 0.03;
        velX[i] += (dx / distance) * nudge * dt;
        velY[i] += (dy / distance) * nudge * dt;
      }
    }

    if (clickRepulseActive) {
      const dx = posX[i] - clickX;
      const dy = posY[i] - clickY;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      if (distance < config.repulseDistance) {
        const push = (1 - distance / config.repulseDistance) * 1.1 * config.moveSpeed;
        velX[i] += (dx / distance) * push * dt;
        velY[i] += (dy / distance) * push * dt;
      }
    }

    const speed = Math.sqrt(velX[i] * velX[i] + velY[i] * velY[i]) || 1;
    const maxSpeed = Math.max(1.4, config.moveSpeed * 5);
    if (speed > maxSpeed) {
      const ratio = maxSpeed / speed;
      velX[i] *= ratio;
      velY[i] *= ratio;
    }

    posX[i] += velX[i] * dt;
    posY[i] += velY[i] * dt;

    if (posX[i] < -WRAP_PADDING) posX[i] = viewportWidth + WRAP_PADDING;
    else if (posX[i] > viewportWidth + WRAP_PADDING) posX[i] = -WRAP_PADDING;

    if (posY[i] < -WRAP_PADDING) posY[i] = viewportHeight + WRAP_PADDING;
    else if (posY[i] > viewportHeight + WRAP_PADDING) posY[i] = -WRAP_PADDING;
  }
};

const drawLinkLines = (): void => {
  if (!ctx || !config || !config.linksEnabled || particleCount < 2) {
    return;
  }

  const maxDistance2 = config.linkDistance * config.linkDistance;
  ctx.strokeStyle = `rgb(${linkColor.r}, ${linkColor.g}, ${linkColor.b})`;
  ctx.lineWidth = Math.max(0.15, config.linkWidth);

  for (let i = 0; i < particleCount; i++) {
    const ix = posX[i];
    const iy = posY[i];

    for (let j = i + 1; j < particleCount; j++) {
      const dx = ix - posX[j];
      const dy = iy - posY[j];
      const distance2 = dx * dx + dy * dy;
      if (distance2 > maxDistance2) {
        continue;
      }

      const distance = Math.sqrt(distance2);
      const alpha = clamp(config.linkOpacity * (1 - distance / config.linkDistance), 0, 1);
      if (alpha < 0.01) {
        continue;
      }

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(posX[j], posY[j]);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
};

const drawGrabLines = (now: number): void => {
  if (!ctx || !config) {
    return;
  }

  if (!(config.hoverEnabled && config.hoverMode === 'grab' && now - lastMouseAt < MOUSE_ACTIVE_MS)) {
    return;
  }

  const maxDistance2 = config.grabDistance * config.grabDistance;
  ctx.strokeStyle = `rgb(${linkColor.r}, ${linkColor.g}, ${linkColor.b})`;
  ctx.lineWidth = Math.max(0.15, config.linkWidth);

  for (let i = 0; i < particleCount; i++) {
    const dx = posX[i] - mouseX;
    const dy = posY[i] - mouseY;
    const distance2 = dx * dx + dy * dy;
    if (distance2 > maxDistance2) {
      continue;
    }

    const distance = Math.sqrt(distance2);
    const alpha = clamp(config.grabOpacity * (1 - distance / config.grabDistance), 0, 1);
    if (alpha < 0.01) {
      continue;
    }

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(posX[i], posY[i]);
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
};

const drawParticles = (now: number): void => {
  if (!ctx || !config || particleCount === 0) {
    return;
  }

  const mouseActive = now - lastMouseAt < MOUSE_ACTIVE_MS;

  for (let i = 0; i < particleCount; i++) {
    let drawSize = baseSize[i];
    let drawOpacity = baseOpacity[i];

    if (config.sizeAnim) {
      const wave = Math.sin(now * 0.001 * config.sizeAnimSpeed + sizePhase[i]);
      const amplitude = Math.max(0.2, config.size - config.sizeMin);
      drawSize = Math.max(config.sizeMin, drawSize + wave * amplitude * 0.35);
    }

    if (config.opacityAnim) {
      const wave = Math.sin(now * 0.001 * config.opacityAnimSpeed + opacityPhase[i]);
      const amplitude = Math.max(0.05, config.opacity - config.opacityMin);
      drawOpacity = clamp(drawOpacity + wave * amplitude * 0.3, config.opacityMin, 1);
    }

    if (mouseActive && config.hoverEnabled && config.hoverMode === 'bubble') {
      const dx = posX[i] - mouseX;
      const dy = posY[i] - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < config.bubbleDistance) {
        const bubbleStrength = clamp(1 - distance / config.bubbleDistance, 0, 1);
        drawSize += (config.bubbleSize - drawSize) * bubbleStrength;
        drawOpacity = Math.max(drawOpacity, config.bubbleOpacity * bubbleStrength);
      }
    }

    const rgb = palette[colorIndex[i] % palette.length];
    ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    ctx.globalAlpha = clamp(drawOpacity, 0.02, 1);
    ctx.beginPath();
    ctx.arc(posX[i], posY[i], Math.max(0.4, drawSize), 0, TAU);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
};

const renderFrame = (now: number): void => {
  if (!ctx || !config) {
    return;
  }

  ctx.clearRect(0, 0, viewportWidth, viewportHeight);
  drawLinkLines();
  drawGrabLines(now);
  drawParticles(now);
};

const tick = (now: number): void => {
  frameHandle = null;

  if (!running) {
    return;
  }

  if (!config || !ctx) {
    running = false;
    return;
  }

  const dt = clamp((now - lastTick) / 16.67, 0.4, 2.5);
  lastTick = now;

  moveParticles(dt, now);
  renderFrame(now);

  frameHandle = requestFrame(tick);
};

const startLoop = (): void => {
  if (running || !ctx || !config) {
    return;
  }

  running = true;
  lastTick = performance.now();
  frameHandle = requestFrame(tick);
};

const stopLoop = (): void => {
  running = false;
  if (frameHandle !== null) {
    cancelFrame(frameHandle);
    frameHandle = null;
  }
};

const destroy = (): void => {
  stopLoop();
  canvas = null;
  ctx = null;
  config = null;
  particleCount = 0;
  posX = new Float32Array(0);
  posY = new Float32Array(0);
  velX = new Float32Array(0);
  velY = new Float32Array(0);
  baseSize = new Float32Array(0);
  baseOpacity = new Float32Array(0);
  sizePhase = new Float32Array(0);
  opacityPhase = new Float32Array(0);
  colorIndex = new Uint8Array(0);
};

workerGlobal.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'init': {
      canvas = message.canvas;
      ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        destroy();
        return;
      }

      updateCanvasSize(message.width, message.height, message.dpr);
      applyConfig(message.config);
      startLoop();
      break;
    }

    case 'resize': {
      updateCanvasSize(message.width, message.height, message.dpr);
      break;
    }

    case 'mouse': {
      mouseX = message.x;
      mouseY = message.y;
      lastMouseAt = performance.now();
      break;
    }

    case 'click': {
      if (!config || !config.clickEnabled) {
        break;
      }

      if (config.clickMode === 'push') {
        appendParticles(config.pushCount, message.x, message.y);
      } else if (config.clickMode === 'repulse') {
        clickX = message.x;
        clickY = message.y;
        clickActiveUntil = performance.now() + config.repulseDuration * 1000;
      }
      break;
    }

    case 'updateConfig': {
      applyConfig(message.config);
      break;
    }

    case 'pause': {
      stopLoop();
      break;
    }

    case 'resume': {
      if (ctx && config) {
        startLoop();
      }
      break;
    }

    case 'destroy': {
      destroy();
      break;
    }
  }
};
