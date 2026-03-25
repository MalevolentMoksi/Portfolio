# 🏗️ Performance Overhaul Plan — Revised & Hardened

This is a precision rewrite of the original plan, incorporating post-mortem analysis of the GPT-Codex-5.3 failure. Every section documents WHY each detail matters to avoid repeating the same bugs.

---

## 🔴 Post-mortem: Why Codex Failed

Four classes of bugs destroyed the previous attempt:

| Bug | Root cause |
|---|---|
| Particles too big / irregular | DPR scaling wrong: worker drew in CSS pixels on a device-pixel canvas, so particles appeared inflated by `devicePixelRatio` |
| Mouse interaction misaligned | Used `e.clientX/clientY` (viewport coords) instead of `e.offsetX/offsetY` (canvas-local coords that account for the CSS parallax transform on the canvas element) |
| Wrong visuals per mood | Codex re-implemented the physics config from memory instead of importing `effects-particles-config.ts` directly |
| ParticlesButton completely broken | All four effects (`explode`, `attract`, `storm`, `gravity`) mutate `window.pJSDom[0].pJS.particles.array` directly — that global no longer exists in a worker model |

This plan eliminates all four failure classes.

---

## 📐 Coordinate System — The Single Most Important Detail

**Rule: all coordinates stored inside the worker are in DEVICE pixels.**

`particles.js` with `retina_detect: true` does this too. The canvas `width`/`height` attributes are set to `cssSize * DPR`. Particle positions, velocities, sizes, distances, and line widths are all in device pixels.

**Rule: all coordinates sent FROM the main thread to the worker are in CSS pixels.** The worker multiplies by its stored DPR internally.

**Rule: mouse events MUST use `e.offsetX / e.offsetY` on the canvas element, NOT `e.clientX / e.clientY`.**

Why: the parallax controller applies `canvas.style.transform = 'scale(1.08) translate(Xpx, Ypx)'`. This shifts the canvas visually. `e.clientX/clientY` are viewport-relative and ignore the transform — they point to the wrong location in canvas space. `e.offsetX/offsetY` are computed by the browser relative to the target element's padding edge accounting for CSS transforms, which is exactly what particles.js CDN used (`e.offsetX` on its internal canvas).

The canvas must have `pointer-events: auto` for this to work (it already does in the existing CSS via `#particles-js { pointer-events: auto }`).

---

## 📋 Full Implementation Plan

### Summary of files

| File | Action |
|---|---|
| `src/workers/particles.worker.ts` | **New** — full off-thread particle engine |
| `src/scripts/effects.ts` | **Rewrite** — Worker controller; no more CDN particles.js |
| `src/scripts/effects-particles-config.ts` | **No change** — worker imports this directly |
| `src/index.html` | **Modify** — remove CDN particles.js injection block |
| `src/components/Layout.tsx` | **Modify** — `<div id="particles-js">` → `<canvas id="particles-canvas">` |
| `src/styles/_layout.css` | **Modify** — rename all `#particles-js` selectors to `#particles-canvas` |
| `src/styles/components/_accessibility-overrides.css` | **Modify** — rename `#particles-js` selector |
| `src/scripts/parallax-controller.ts` | **Modify** — `getElementById('particles-js')` → `getElementById('particles-canvas')` |
| `src/components/ParticlesButton.tsx` | **Modify** — replace all `pJSDom` access with worker message API |
| `src/components/ambient/DigitalRain.tsx` | **Rewrite** — canvas-based single RAF loop |
| `src/hooks/usePortfolioModules.ts` | **Modify** — dynamic imports + navigation pause/resume |
| `src/types/global.d.ts` | **Modify** — remove `particlesJS` + `pJSDom`, add `particleWorker` types |
| `vite.config.ts` | **Modify** — chunk splitting (no extra plugin needed for workers) |

---

### Change 1 — `src/workers/particles.worker.ts` *(new file)*

A self-contained particle engine that runs entirely off the main thread. No dependency on particles.js CDN.

#### 1a. Imports and types

```ts
import { getParticlesConfig, getMoodColor, moodNeedsFullReconfigure } from '../scripts/effects-particles-config';
import { getPerformanceTier } from '../utils/performanceTier';
```

**Critical**: import the config functions directly. Do NOT rewrite the configs. `effects-particles-config.ts` is the single source of truth for all 6 mood configurations.

#### 1b. Particle data model

```ts
interface Particle {
  x: number;            // device pixels
  y: number;            // device pixels
  vx: number;           // device pixels per frame at 60fps
  vy: number;           // device pixels per frame
  colorHex: string;     // e.g. '#d4af37'
  r: number; g: number; b: number;  // pre-parsed RGB
  opacity: number;      // current opacity
  opacityBase: number;  // reset target
  size: number;         // current radius, device pixels
  sizeBase: number;     // reset target, device pixels
  shape: 'circle' | 'edge';
  // opacity animation
  opacityAnimDir: number;  // +1 or -1
  // size animation
  sizeAnimDir: number;     // +1 or -1
}
```

#### 1c. Particle initialization — replicating particles.js exactly

This is where Codex got the sizes wrong. Follow this exactly:

```
sizeBase = config.particles.size.value * dpr
           (if config.particles.size.random: multiply by Math.random(), so range is [0..value])

opacityBase = config.particles.opacity.value
              (if config.particles.opacity.random: multiply by Math.random())

velocity direction (particles.js model):
  - direction 'none': vx = (Math.random()-0.5) * speed/3 * dpr
                      vy = (Math.random()-0.5) * speed/3 * dpr
  - direction 'left': vx = -speed/6 * dpr (plus random scatter if move.random=true)
                      vy = (Math.random()-0.5) * speed/3 * dpr
  - direction 'top':  vx = (Math.random()-0.5) * speed/3 * dpr
                      vy = -speed/6 * dpr
  - direction 'top-right': vx = +speed/6 * dpr, vy = -speed/6 * dpr
  (and so on for all 8 directions)

  if move.random=true, multiply the directional component(s) by Math.random()*1.7+0.3
  (particles.js clamps the random factor to [0.3, 1.7])

initial position: x = Math.random() * canvasWidth, y = Math.random() * canvasHeight
```

Color selection: if `config.particles.color.value` is an array (europa, industrial, nightshade), pick one at random per particle. If it's a string (default, hacker, vaporwave), use it for all particles.

Shape selection: if `config.particles.shape.type` is an array (industrial: `['circle', 'edge']`), pick one at random per particle. If it's a string, use it for all.

#### 1d. Physics update loop (per-frame, inside RAF)

```
For each particle:
  1. Move: p.x += p.vx; p.y += p.vy;

  2. Boundary (out_mode: 'out'): if particle exits canvas bounds on any side,
     teleport to the opposite side with the same velocity
     (particles.js 'out' mode: particle wraps around)

  3. Opacity animation (if enabled):
     p.opacity += p.opacityAnimDir * config.particles.opacity.anim.speed * 0.01
     if p.opacity <= config.particles.opacity.anim.opacity_min: p.opacityAnimDir = +1
     if p.opacity >= config.particles.opacity.value: p.opacityAnimDir = -1
     clamp p.opacity to [opacity_min, opacity.value]

  4. Size animation (if enabled):
     p.size += p.sizeAnimDir * config.particles.size.anim.speed * 0.01 * dpr
     if p.size <= config.particles.size.anim.size_min * dpr: p.sizeAnimDir = +1
     if p.size >= sizeBase: p.sizeAnimDir = -1
     clamp p.size to [size_min*dpr, sizeBase]
```

#### 1e. Rendering (per-frame, inside RAF)

```
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Draw line links (draw BEFORE particles so particles render on top)
for each particle A:
  for each particle B where B.index > A.index:  // avoid duplicate pairs
    dist = distance(A, B)
    if dist <= config.particles.line_linked.distance * dpr:
      linkColor = config.particles.line_linked.color  // hex
      linkOpacity = config.particles.line_linked.opacity * (1 - dist / (config.particles.line_linked.distance * dpr))
      ctx.strokeStyle = hexToRgba(linkColor, linkOpacity)
      ctx.lineWidth = config.particles.line_linked.width * dpr
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke()

// Draw grab interaction lines (if mode is 'grab' and mouse is active)
if interactivity mode is 'grab' and mousePos is known:
  for each particle:
    dist = distance(particle, mousePos)
    if dist <= config.interactivity.modes.grab.distance * dpr:
      lineOpacity = config.interactivity.modes.grab.line_linked.opacity * (1 - dist / (grabDistance * dpr))
      draw line from particle to mousePos with lineOpacity

// Draw particles
for each particle:
  ctx.globalAlpha = p.opacity
  if p.shape === 'circle':
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = p.colorHex
    ctx.fill()
  if p.shape === 'edge':  // rectangle — this is how particles.js renders 'edge'
    ctx.fillStyle = p.colorHex
    ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2)

ctx.globalAlpha = 1.0  // reset
```

**Note on `edge` shape**: particles.js's `edge` shape draws a rectangle (square) with side length `2 * radius`. This is how the Europa snow looks like ice crystals/flakes. Do NOT use `ctx.arc` for the `edge` shape.

#### 1f. Interactivity modes (per-frame)

**grab** (default, hacker, vaporwave):
- Every frame, if mouse position is known, for each particle within `grabDistance * dpr` pixels of mouse, draw a line from particle to mouse (handled in rendering step above).

**repulse** (nightshade):
- Every frame, if mouse position is known, for each particle within `repulseDistance * dpr` of mouse:
  - `dx = p.x - mouseX; dy = p.y - mouseY; dist = sqrt(dx²+dy²)`
  - `force = (repulseDistance * dpr - dist) / (repulseDistance * dpr)` (normalized)
  - `p.vx += (dx/dist) * force * 3 * dpr`
  - `p.vy += (dy/dist) * force * 3 * dpr`

**bubble** (industrial):
- Every frame, if mouse position is known, for each particle within `bubbleDistance * dpr`:
  - Scale particle size toward `config.interactivity.modes.bubble.size * dpr` based on proximity

**push** (onclick — all modes that enable it):
- On click message: spawn `particles_nb` new particles at the click position

#### 1g. Worker message protocol

**Incoming messages (main thread → worker):**

```ts
// Initialization — sent with OffscreenCanvas as Transferable
{ type: 'init'; cssWidth: number; cssHeight: number; dpr: number; mood: string }
// Note: the OffscreenCanvas is passed as the second argument of postMessage's transfer list,
// NOT inside the message data. Receive it as: self.onmessage = (e) => { canvas = e.data.canvas ?? storedCanvas }
// Actually: worker.postMessage({ type: 'init', canvas: offscreen, cssWidth, cssHeight, dpr, mood }, [offscreen])
// Worker receives: const { canvas, cssWidth, cssHeight, dpr, mood } = e.data

{ type: 'resize'; cssWidth: number; cssHeight: number; dpr: number }

// Mouse position — CSS pixel coords, worker scales by DPR
{ type: 'mouse'; x: number; y: number }

// Click — CSS pixel coords
{ type: 'click'; x: number; y: number }

// Mood change — worker re-reads config from effects-particles-config.ts and reinitializes
{ type: 'updateConfig'; mood: string }

// Navigation: pause RAF while React reconciles
{ type: 'pause' }
{ type: 'resume' }

// Accessibility
{ type: 'setAnimationsEnabled'; enabled: boolean }

// Cleanup
{ type: 'destroy' }

// UI query
{ type: 'get_count' }

// ParticlesButton effect API:
{ type: 'push_particles'; positions: Array<{ x: number; y: number }> }  // CSS pixels

{ type: 'set_velocity_radial_burst';
  origin: { x: number; y: number };  // CSS pixels
  burstBase: number;
  burstRange: number;
  burstMult: number; }

{ type: 'set_velocity_uniform_speed'; speed: number }  // device pixels per frame

{ type: 'start_attract';
  target: { x: number; y: number };  // CSS pixels
  pullForce: number;
  pullCap: number; }

{ type: 'stop_attract' }

{ type: 'start_gravity';
  gravityAccel: number;  // device pixels per frame² (caller sends already scaled: accel * dpr)
  bounceDamp: number; }  // negative multiplier e.g. -0.55

{ type: 'stop_gravity' }

{ type: 'smooth_restore'; duration: number }  // ms; worker calculates baseSpeed from its own config

{ type: 'cancel_smooth_restore' }

{ type: 'trim_particles'; targetCount: number }  // trim array to this length
```

**Outgoing messages (worker → main thread):**

```ts
{ type: 'count'; value: number }  // response to get_count
```

#### 1h. Effect implementations inside the worker

**`start_attract`**: Worker runs a per-frame pull loop (alongside the normal RAF tick):
```
each frame while attract is active:
  target in device pixels = { x: cssPx.x * dpr, y: cssPx.y * dpr }
  for each particle:
    dx = target.x - p.x; dy = target.y - p.y; dist = sqrt(dx²+dy²) || 1
    p.vx += (dx/dist) * pullForce
    p.vy += (dy/dist) * pullForce
    speed = sqrt(p.vx²+p.vy²)
    if speed > pullCap: p.vx *= pullCap/speed; p.vy *= pullCap/speed
```

**`start_gravity`**: Worker runs a per-frame gravity loop:
```
each frame while gravity is active:
  floor = canvas.height - 4
  for each particle:
    p.vy += gravityAccel
    if p.y >= floor: p.vy *= bounceDamp; p.y = floor
```

**`smooth_restore`**: Worker runs its own restore loop:
```
baseSpeed = config.particles.move.speed * 0.22 * dpr  // worker knows its DPR
frames = duration * 0.06
k = pow(0.05, 1/frames)
each frame:
  elapsed = now - start
  done = elapsed >= duration
  for each particle:
    mag = sqrt(p.vx²+p.vy²)
    if mag < 0.001: continue
    targetMag = done ? baseSpeed : baseSpeed + (mag - baseSpeed) * k
    ratio = targetMag / mag
    p.vx *= ratio; p.vy *= ratio
```

**`set_velocity_radial_burst`**: one-shot, no loop:
```
originDevX = origin.x * dpr; originDevY = origin.y * dpr
for each particle:
  dx = p.x - originDevX; dy = p.y - originDevY; dist = sqrt(dx²+dy²) || 1
  burst = (burstBase + Math.random() * burstRange) * burstMult
  p.vx = (dx/dist) * burst
  p.vy = (dy/dist) * burst
```

#### 1i. Canvas setup in worker

```ts
// On 'init' message:
const canvas = event.data.canvas as OffscreenCanvas;
canvas.width = event.data.cssWidth * event.data.dpr;
canvas.height = event.data.cssHeight * event.data.dpr;
const ctx = canvas.getContext('2d')!;

// On 'resize' message:
canvas.width = cssWidth * dpr;
canvas.height = cssHeight * dpr;
// Re-clamp all particle positions to new bounds
```

---

### Change 2 — `src/scripts/effects.ts` *(rewrite)*

Replace the class body entirely. Keep the class interface identical so `usePortfolioModules.ts` requires no changes.

```ts
class VisualEffects {
  private worker: Worker | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private parallaxController: ParallaxController | null = null;
  private dpr: number = 1;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private resizeHandler: (() => void) | null = null;

  constructor() {
    this.background = document.getElementById('background');
    this.init();
  }

  private init(): void {
    this.initParticlesWorker();
    const bg = document.getElementById('background');
    if (bg) {
      this.parallaxController = new ParallaxController(bg);
      this.parallaxController.start();
    }
  }

  private initParticlesWorker(): void {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    if (window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches) return;
    if (!('OffscreenCanvas' in window)) {
      console.warn('OffscreenCanvas not supported');
      return;
    }

    this.canvas = document.getElementById('particles-canvas') as HTMLCanvasElement | null;
    if (!this.canvas) return;

    this.dpr = window.devicePixelRatio || 1;
    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;
    this.canvas.width = cssW * this.dpr;
    this.canvas.height = cssH * this.dpr;

    const mood = document.querySelector('.mood-stage')?.getAttribute('data-mood')
      || document.body.getAttribute('data-mood')
      || 'default';

    this.worker = new Worker(new URL('../workers/particles.worker.ts', import.meta.url), { type: 'module' });
    const offscreen = this.canvas.transferControlToOffscreen();
    this.worker.postMessage(
      { type: 'init', canvas: offscreen, cssWidth: cssW, cssHeight: cssH, dpr: this.dpr, mood },
      [offscreen]
    );

    // Worker sends count updates; route to any registered listener
    this.worker.onmessage = (e) => {
      if (e.data.type === 'count') {
        window._particleCount = e.data.value;
      }
    };

    // Mouse events: MUST use offsetX/offsetY (canvas-local, accounts for parallax transform)
    this.mouseMoveHandler = (e: MouseEvent) => {
      this.worker?.postMessage({ type: 'mouse', x: e.offsetX, y: e.offsetY });
    };
    this.clickHandler = (e: MouseEvent) => {
      this.worker?.postMessage({ type: 'click', x: e.offsetX, y: e.offsetY });
    };
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.addEventListener('click', this.clickHandler);

    // Resize
    this.resizeHandler = () => {
      if (!this.canvas) return;
      const dpr = window.devicePixelRatio || 1;
      this.dpr = dpr;
      this.worker?.postMessage({ type: 'resize', cssWidth: this.canvas.clientWidth, cssHeight: this.canvas.clientHeight, dpr });
    };
    window.addEventListener('resize', this.resizeHandler);

    // Expose globals for MoodContext and ParticlesButton
    window.particleWorker = this.worker;
    window.updateParticlesMood = (mood: string) => this.updateParticlesMood(mood);
    window.reconfigureParticles = (mood: string) => this.reconfigureParticles(mood);
  }

  updateParticlesMood(mood: string): void {
    this.worker?.postMessage({ type: 'updateConfig', mood });
  }

  reconfigureParticles(mood: string): void {
    this.worker?.postMessage({ type: 'updateConfig', mood });
  }

  setAnimationsEnabled(enabled: boolean): void {
    this.worker?.postMessage({ type: 'setAnimationsEnabled', enabled });
  }

  pauseForNavigation(): void {
    this.worker?.postMessage({ type: 'pause' });
  }

  resumeAfterNavigation(): void {
    this.worker?.postMessage({ type: 'resume' });
  }

  destroy(): void {
    if (this.canvas && this.mouseMoveHandler) {
      this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    }
    if (this.canvas && this.clickHandler) {
      this.canvas.removeEventListener('click', this.clickHandler);
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.worker?.postMessage({ type: 'destroy' });
    this.worker?.terminate();
    this.worker = null;
    this.parallaxController?.destroy();
    this.parallaxController = null;
    delete window.particleWorker;
  }
}
```

---

### Change 3 — `src/index.html` *(modify)*

Remove the entire `<script>` block that conditionally injects the particles.js CDN tag (lines 59–74 in the current file). The worker approach has no CDN dependency.

Keep all other `<head>` content and the `<link rel="preconnect">` to `cdn.jsdelivr.net` only if it's also used for jsmediatags or other CDN libs — otherwise remove the preconnect too.

---

### Change 4 — `src/components/Layout.tsx` *(modify)*

Replace:
```tsx
<div id="particles-js" aria-hidden="true"></div>
```
With:
```tsx
<canvas ref={particlesRef} id="particles-canvas" aria-hidden="true"></canvas>
```

No `ref` is strictly necessary here since `effects.ts` uses `getElementById` — keep it consistent with how the background element is accessed. A `ref` is optional.

The canvas element naturally renders as an inline element by default — CSS will override this (the `#particles-canvas` CSS rule takes care of positioning, same rules as the former `#particles-js`).

---

### Change 5 — CSS *(modify two files)*

**`src/styles/_layout.css`**: Replace both occurrences:
- `#particles-js {` → `#particles-canvas {`
- `#particles-js.particles-foreground {` → `#particles-canvas.particles-foreground {`

**`src/styles/components/_accessibility-overrides.css`**: Replace:
- `body.a11y--reduce-effects #particles-js,` → `body.a11y--reduce-effects #particles-canvas,`

All CSS property values remain IDENTICAL — only the selector IDs change.

---

### Change 6 — `src/scripts/parallax-controller.ts` *(modify)*

One line change in `start()`:
```ts
// Before:
const particlesCanvas: HTMLElement | null = parallaxLayersEnabled
  ? document.getElementById('particles-js')
  : null;

// After:
const particlesCanvas: HTMLElement | null = parallaxLayersEnabled
  ? document.getElementById('particles-canvas')
  : null;
```

All transform logic stays identical.

---

### Change 7 — `src/components/ParticlesButton.tsx` *(modify)*

This is the most invasive change. Every access to `window.pJSDom` must be replaced. There are six patterns:

**7a. Replace `getPJS()` helper**

Current:
```ts
const getPJS = () => {
  try { return window.pJSDom?.[0]?.pJS ?? null; } catch { return null; }
};
```

Replace with:
```ts
const getWorker = (): Worker | null => (window.particleWorker as Worker | undefined) ?? null;
const isParticlesActive = (): boolean => getWorker() !== null;
```

**7b. Replace `setParticlesForeground`**

One line change: `document.getElementById('particles-js')` → `document.getElementById('particles-canvas')`. Everything else stays the same.

**7c. Replace `getBaseSpeed()`**

Delete the `getBaseSpeed()` function entirely. The worker calculates baseSpeed from its own config. The main thread no longer needs it.

**7d. Replace `smoothRestore()` function**

Current: a function that runs a RAF loop manipulating pJSDom velocities, returns `{ cancel() }`.

Replace with:
```ts
const smoothRestore = (duration = 1500) => {
  getWorker()?.postMessage({ type: 'smooth_restore', duration });
  return {
    cancel() {
      getWorker()?.postMessage({ type: 'cancel_smooth_restore' });
    }
  };
};
```

**7e. Replace effect implementations**

All four effects currently contain RAF loops that mutate `pJSDom`. Replace each with worker message dispatch plus local timing logic:

**`explode`**:
```ts
explode(signal: EffectSignal, tier: PerformanceTier, runtimeDuration: number) {
  setParticlesForeground(true);
  const worker = getWorker();
  if (!worker) return { restoreHandle: null };
  const profile = getMoodFxProfile();

  const W = window.innerWidth;
  const H = window.innerHeight;
  const headerH = 70;
  const zoneW = W * 0.25;
  const zoneH = H * 0.35;
  const baseSpawnCount = tier === 'low' ? 8 : 15;
  const spawnCount = Math.max(6, Math.round(baseSpawnCount * profile.spawnMult));

  // Collect spawn positions in CSS pixels (worker scales by DPR internally)
  const positions: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < spawnCount; i++) {
    positions.push({ x: Math.random() * zoneW, y: headerH + Math.random() * (zoneH - headerH) });
    positions.push({ x: W - Math.random() * zoneW, y: headerH + Math.random() * (zoneH - headerH) });
  }
  worker.postMessage({ type: 'push_particles', positions });

  // Burst: radial velocity away from (W/2, H/4) — CSS pixel origin
  worker.postMessage({
    type: 'set_velocity_radial_burst',
    origin: { x: W / 2, y: H / 4 },
    burstBase: 5,
    burstRange: 5,
    burstMult: profile.burstMult,
  });

  let restoreHandle: ReturnType<typeof smoothRestore> | null = null;
  const warmupMs = Math.max(260, Math.round(runtimeDuration * 0.33));
  setTimeout(() => {
    if (!signal.cancelled) {
      restoreHandle = smoothRestore(Math.max(1200, Math.round(runtimeDuration * 0.9)));
      setParticlesForeground(false);
    }
  }, warmupMs);

  window.petReact?.('scared');
  return { get restoreHandle() { return restoreHandle; } };
},
```

**`attract`**:
```ts
attract(signal: EffectSignal, _tier: PerformanceTier, runtimeDuration: number) {
  setParticlesForeground(true);
  const worker = getWorker();
  if (!worker) return { restoreHandle: null };
  const { x: cx, y: cy } = randomEdgePoint();
  triggerPetAttract(cx, cy, runtimeDuration);
  const { pullForce, pullCap } = getMoodFxProfile();

  // Worker runs the pull loop internally
  worker.postMessage({ type: 'start_attract', target: { x: cx, y: cy }, pullForce, pullCap });

  let restoreHandle: ReturnType<typeof smoothRestore> | null = null;
  setTimeout(() => {
    signal.cancelled = true;
    worker.postMessage({ type: 'stop_attract' });
    if (!signal._unmounted) {
      restoreHandle = smoothRestore(Math.max(1000, Math.round(runtimeDuration * 0.5)));
      setParticlesForeground(false);
    }
  }, runtimeDuration);

  return { get restoreHandle() { return restoreHandle; } };
},
```

**`storm`**:
```ts
storm(signal: EffectSignal, tier: PerformanceTier, runtimeDuration: number) {
  setParticlesForeground(true);
  window.petReact?.('dizzy');
  const worker = getWorker();
  if (!worker) return { restoreHandle: null };
  const profile = getMoodFxProfile();

  const baseMaxBonus = tier === 'low' ? 20 : tier === 'mid' ? 40 : 60;
  const bonus = Math.round(baseMaxBonus * profile.stormBonusMult);

  // Spawn bonus particles at random positions
  const positions: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < bonus; i++) {
    positions.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight });
  }
  worker.postMessage({ type: 'push_particles', positions });

  // Uniformize all particle speeds
  worker.postMessage({ type: 'set_velocity_uniform_speed', speed: profile.stormSpeed });

  // Track original count for trimming later
  // Request count before spawn (use cached _particleCount):
  const originalCount = (window._particleCount ?? 0);

  let restoreHandle: ReturnType<typeof smoothRestore> | null = null;
  setTimeout(() => {
    if (signal.cancelled) return;
    // Trim bonus particles
    worker.postMessage({ type: 'trim_particles', targetCount: originalCount });
    restoreHandle = smoothRestore(Math.max(1300, Math.round(runtimeDuration * 0.72)));
    setParticlesForeground(false);
  }, runtimeDuration);

  return { get restoreHandle() { return restoreHandle; } };
},
```

**`gravity`**:
```ts
gravity(signal: EffectSignal, _tier: PerformanceTier, runtimeDuration: number) {
  setParticlesForeground(true);
  window.petReact?.('dizzy');
  window.petGravity?.(runtimeDuration);
  const worker = getWorker();
  if (!worker) return { restoreHandle: null };
  const { gravityAccel, bounceDamp } = getMoodFxProfile();

  // Worker runs the gravity loop internally
  // Note: gravityAccel and bounceDamp are passed as-is (no DPR scaling here;
  // worker applies its own DPR where appropriate)
  worker.postMessage({ type: 'start_gravity', gravityAccel, bounceDamp });

  let restoreHandle: ReturnType<typeof smoothRestore> | null = null;
  setTimeout(() => {
    signal.cancelled = true;
    worker.postMessage({ type: 'stop_gravity' });
    if (!signal._unmounted) {
      restoreHandle = smoothRestore(Math.max(1200, Math.round(runtimeDuration * 0.65)));
      setParticlesForeground(false);
    }
  }, runtimeDuration);

  return { get restoreHandle() { return restoreHandle; } };
},
```

**7f. Replace particle count polling**

Current:
```ts
const updateCount = () => {
  const p = getPJS();
  setParticleCount(p?.particles?.array?.length ?? 0);
};
updateCount();
const intervalId = window.setInterval(updateCount, 260);
```

Replace with:
```ts
const updateCount = () => {
  const worker = getWorker();
  if (worker) {
    worker.postMessage({ type: 'get_count' });
    // Response arrives via window._particleCount (set by worker.onmessage in effects.ts)
    setParticleCount(window._particleCount ?? 0);
  } else {
    setParticleCount(0);
  }
};
updateCount();
const intervalId = window.setInterval(updateCount, 260);
```

The `window._particleCount` is a cached value set by the `worker.onmessage` handler in `effects.ts`.

**7g. Guard early-return check for "particles available"**

The early-return guard `if (!pJS) return { restoreHandle: null }` in each effect becomes `if (!worker) return { restoreHandle: null }`. Already reflected in the effect code above.

---

### Change 8 — `src/types/global.d.ts` *(modify)*

Remove:
```ts
function particlesJS(tagId: string, params: Record<string, any>): void;
interface PJSDomEntry { ... }
window.pJSDom?: PJSDomEntry[];
window.reconfigureParticles?: (mood: string) => void;
window.updateParticlesMood?: (mood: string) => void;
```

Add:
```ts
window.particleWorker?: Worker;
window._particleCount?: number;
window.reconfigureParticles?: (mood: string) => void;  // keep — still used by MoodContext
window.updateParticlesMood?: (mood: string) => void;   // keep — still used by MoodContext
```

---

### Change 9 — `src/components/ambient/DigitalRain.tsx` *(rewrite)*

Replace the `RainColumn` multi-component architecture (8× `setInterval` → `setState`) with a single canvas element and a single RAF loop.

Key requirements:
- One `<canvas>` element rendered into `#ambient-root` via `createPortal` (same as before)
- One RAF loop inside a `useEffect` (pattern identical to `AmbientBoids.tsx`)
- Column state stored in plain arrays (no React state updates in the loop)
- Character positions shuffled per-column based on elapsed time (not `setInterval`)
- The same `COLUMN_COUNT`, `CHARSET`, and visual parameters (column positions, drift, font size) as the current implementation
- Conditionally render only when `mood === 'hacker'` and `count > 0` (same logic)
- The canvas must be styled identically to the current `.hacker-digital-rain` container (position, z-index, pointer-events)

The `RainColumn` component and its `useState` + `setInterval` are fully deleted. No React state updates ever happen at animation frame frequency.

---

### Change 10 — `src/hooks/usePortfolioModules.ts` *(modify)*

Two changes:

**10a. Dynamic imports for heavy modules:**

```ts
// Before (all land in main bundle):
import MusicPlayer from '../scripts/music-player';
import VisualEffects from '../scripts/effects';
import Lightbox from '../scripts/lightbox';

// After (loaded after first paint):
// Remove the static imports above.
// Inside the scheduleWhenPageReady callback:
const [{ default: MusicPlayer }, { default: VisualEffects }, { default: Lightbox }] =
  await Promise.all([
    import('../scripts/music-player'),
    import('../scripts/effects'),
    import('../scripts/lightbox'),
  ]);
```

`UIEnhancements` stays as a static import (needed synchronously for the typing effect on first layout).

**10b. Pause/resume particles during React navigation:**

```ts
// In the useLayoutEffect that fires on location.pathname changes:
useLayoutEffect(() => {
  // Pause particles while React reconciles the new page
  (window.visualEffectsInstance as any)?.pauseForNavigation?.();

  uiEnhancementsInstance?.cancelTypingEffect();
  // ... existing reinit logic ...

  // Resume particles after the browser has painted the new page
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      (window.visualEffectsInstance as any)?.resumeAfterNavigation?.();
    });
  });

  return () => {
    uiEnhancementsInstance?.cancelTypingEffect();
  };
}, [location.pathname]);
```

---

### Change 11 — `vite.config.ts` *(modify)*

**No extra Vite plugin needed.** Vite 4+ handles `new Worker(new URL(..., import.meta.url), { type: 'module' })` natively.

Add chunk splitting for `scripts` and `ambient`:

```ts
manualChunks(id) {
  if (id.includes('node_modules/framer-motion')) return 'framer';
  if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor';
  // New chunks:
  if (id.includes('/src/scripts/') || id.includes('/src/workers/')) return 'scripts';
  if (id.includes('/src/components/ambient/')) return 'ambient';
  if (id.includes('/src/locales/')) return 'i18n';
  return undefined;
}
```

---

## ✅ Implementation Checklist

Work in this order to be able to test incrementally:

1. **CSS rename** (`_layout.css`, `_accessibility-overrides.css`) — no runtime change, just prepares selectors
2. **Layout.tsx** — swap `div#particles-js` for `canvas#particles-canvas`
3. **parallax-controller.ts** — update `getElementById`
4. **Create `src/workers/particles.worker.ts`** — full engine
5. **Rewrite `src/effects.ts`** — Worker controller
6. **Remove CDN script from `index.html`**
7. **Update `global.d.ts`** — types
8. **Update `ParticlesButton.tsx`** — all 7 sub-changes above
9. **Rewrite `DigitalRain.tsx`**
10. **Update `usePortfolioModules.ts`** — dynamic imports + pause/resume
11. **Update `vite.config.ts`** — chunk splitting
12. **`npm run typecheck`** — must pass with zero errors before committing

---

## 🔍 Verification Points (what to check after implementation)

- Default mood: circular gold particles, line links, grab interaction follows cursor exactly
- Europa mood: white/cyan rectangles (`edge` shape) blowing leftward, no interactivity
- Industrial mood: orange/red mixed circles+rectangles floating top-right, bubble effect on hover
- Nightshade mood: purple circles drifting upward, repulse on hover
- Parallax: particles shift at half the background depth when mouse moves
- ParticlesButton > Explode: burst fires correctly from upper corners
- ParticlesButton > Attract: particles converge to edge point, smooth restore after
- ParticlesButton > Storm: speed burst, then gradual smooth restore
- ParticlesButton > Gravity: particles fall + bounce, restore afterward
- Particle count in weather panel UI updates correctly
- Mood switch: particle system instantly reconfigures (no 500ms delay)
- `noMotion` accessibility: canvas hidden via CSS, no worker RAF running
- Route navigation: no frame drops during transition
- `npm run typecheck` passes
