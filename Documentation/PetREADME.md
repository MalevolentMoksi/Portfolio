# Pet Robot Component Module

This directory contains the modularized pet robot companion component, split from the original 1599-line monolith for maintainability and AI collaboration efficiency.

## File Overview

### Core Files

#### `petConstants.js` (~50 lines)
**Exports**: All shared constants, localStorage keys, and utility functions.
- **Physics constants**: `PET_SIZE`, `BASE_SPEED`, `MAX_SPEED`, `MAGNET_RADIUS`, `BOUNCE_RESTITUTION`, `THROW_SPEED_CAP`
- **Timings**: `DECAY_MS` (8s), `REACTION_MS` (2s), `SLEEP_IDLE_MS` (60s)
- **Utilities**: `clamp()`, `readLS()`, `getMood()` (hunger/happiness → expression), `pickRandom()`
- **localStorage keys**: `LS.hunger`, `LS.happiness`, `LS.spawned`

#### `petData.jsx` (~105 lines)
**Exports**: Expression data pools and SVG symbols.
- `MOOD_TEXT_POOL`: Dictionary of expression → random speech lines (11 keys: happy, content, sad, scared, excited, petted, play, eat, sleep, woozy, dizzy)
- `FACE_COMBOS`: Expression → `{ eyes, mouth }` variants (7 eye types × mouth paths)
- `THOUGHT_SYMBOLS`: SVG JSX for bubbles (7: heart, star, note, bolt, zzz, dots, exclaim)
- `THOUGHT_POOLS`: Expression → thought symbol array (for mood-aware thoughts)

#### `RobotFace.jsx` (~280 lines)
**Props**: `expression`, `eyeState`, `mouthExpr`, `gazeX`, `gazeY`  
**Renders**: 48×48 SVG robot face with:
- Eyes that track gaze and respond to expression (happy-open, sad, scared, etc.)
- Animated mouth using Framer Motion spring transitions
- Blush effect (pink cheeks when happy/petted/playing)
- Seamless morphing between expressions

#### `ThoughtBubbleQueue.jsx` (~150 lines)
**Exports**: Default component `ThoughtBubbleQueue`, named export `normalizeThought`  
**Props**: `queue` (array of thoughts), `petX`, `petY`  
**Renders**: Portal-based queue of up to 3 concurrent thought bubbles above the pet, each with:
- **3 types**: `symbol` (3.5s SVG icon), `text` (2.0s pill), `reaction` (2.5s action feedback with SVG icons)
- **Staggered pos**: Concurrent bubbles offset horizontally/vertically for visual clarity
- **Animations**: Entry pop + rise + fade using CSS keyframes (`pet-thought-rise`, `pet-thought-pop-rise`)
- **SVG icons**: Reaction symbols (feed, petted, play, excited) rendered inline instead of emoji
- **Backward compat**: `normalizeThought()` accepts string (`'heart'`) or object (`{type, content, duration}`) for flexible API

#### `WanderingPet.jsx` (~550 lines)
**Props**: (from PetButton via AnimatePresence)
- `stats` { hunger, happiness }, `expression`, `eyeState`, `mouthExpr`, `petMood`
- `onInteract(action)`, `onBehavior(reaction)`, `onThought(thoughtObj)`, `onHoverPet()`
- `cooldowns`, `thoughtQueue` (array), `hudThought`, `sizeScale`, `speedMult`, `isSleeping`, `moodSpinActive`

**Core features**:
- **Physics RAF loop** (~60fps): Organic wander, wall bounce with restitution, cursor magnet/repulsion (mood-aware)
- **Drag & throw**: Pointer capture drag, fast-drag rotation scale, throw momentum with THROW_SPEED_CAP bypass
- **Scroll detection**: Back-and-forth scroll triggers dizzy, idle scroll → rest/sit behavior (2.5–10s timer)
- **Behaviors**: Dwell excitement, sudden approach scare, high-speed bursts, proximity avoidance when sad
- **HUD dialog** (Framer Motion): Floating stats with animated bars, action buttons (Feed/Câliner/Jouer) with SVG icons, contextual tips with SVG hint icons, cooldown ring (SVG circle with stroke-dasharray animation)
- **Hover-to-pet**: Sustained pointer hover (1.5s) triggers petted reaction + cascading hearts
- **Facing & gaze**: Hysteresis-smoothed direction flip, iris pupils follow cursor

**Key refs**: `posRef`, `velRef`, `desiredVRef` (wander target), `rafRef` (animation loop), `proximityRef` (behavior cooldowns), `throwActiveRef` (bypass speed cap during throw decay)

#### `PetButton.jsx` (~290 lines)
**Context**: Reads `mood` from `MoodContext`  
**Renders**: Header button + AnimatePresence wrapper around WanderingPet

**State management**:
- `stats` { hunger, happiness } — resets ~50% on each page load (synchronous)
- `reaction` — temporary expression (2s timeout via `REACTION_MS`)
- `faceCombo` — `{ eyes, mouth }` from `FACE_COMBOS`
- `thoughtQueue` (array) — queue of up to 3 concurrent floating thoughts; `thoughtQueueRef`, `thoughtTimersRef` for lifecycle + `_thoughtIdCounter` for unique IDs
- `hudThought` — current HUD text feedback
- `isSleeping`, `moodSpinActive` — state flags
- `cdEnds` — cooldown timestamps for feed/pet/play actions

**Effects**:
1. **Persistence**: localStorage sync for stats, spawn state
2. **Spawn reactions**: First spawn boosts to 80/80; every spawn triggers woozy
3. **Stat decay**: Every 8s, decline hunger by 2 and happiness by 1 (halved if thriving: hunger>85 AND happiness>85)
4. **Idle micro-reactions**: Every 13–33s, random expression + ~40% thought bubble
5. **Neglect escalation**: If sad for 28s, trigger dizzy reaction
6. **Sleep on inactivity**: No mouse/key/pointer for 60s → sleep state + sleep reaction; activity wakes + woozy
7. **Mood flourish**: Site mood change → excited + spin animation (0.9s)
8. **Global API**: `window.petReact(reaction)`, `window.getPetStats()`
9. **Interaction combo**: 3 actions within 7s → bonus happiness + excited
10. **Neglect escalation** (fixed): Tracks `sadSinceRef` timestamp + setInterval (not stat-dependent) — if sad >28s, triggers dizzy
11. **Sleep expression sync** (fixed): `isSleeping` flag drives expression formula; dedicated sync useEffect ensures face is correct
12. **Combo streak** (fixed): Reduced reaction flicker by shortening combo window (now `REACTION_MS - 100 = 1900ms`)

**Callbacks**:
- `handleInteract(action)` — feed/pet/play with stat changes, reactions, cooldown
- `handleThought(input)` — normalizes input (string or object), queues thought (max 3), auto-removes after duration
- `handleHoverPet()` — +5 happiness on sustained hover
- `toggleSpawn()` — toggle visibility, recharge low stats (<10)

## Data Flow

```
PetButton (orchestrator, state holder)
  │
  ├─ useState: stats, reaction, faceCombo, thoughtQueue, hudThought, isSleeping, moodSpinActive
  ├─ useRef: thoughtQueueRef, thoughtTimersRef, _thoughtIdCounter, sadSinceRef, isSleepingRef
  │
  ├─ useEffect × 10: persistence, spawn, decay, idle, neglect (ref-based), sleep, mood flourish, API, thought cleanup, face sync
  │
  └─ AnimatePresence
       └─ WanderingPet (if isSpawned)
            │
            ├─ RAF tick loop: physics, behaviors, speed limiting, wall bounce
            ├─ Drag: pointer capture, throw momentum (uses throwActiveRef)
            ├─ Scroll: dizzy detection, idle → rest steering
            ├─ Effects: hover-to-pet, HUD positioning, focus trap
            │
            └─ Portals (at document.body):
                 ├─ motion.div wanderer (with RobotFace child)
                 ├─ ThoughtBubbleQueue (queue of symbols/text/reactions with SVG icons, staggered, auto-remove)
                 └─ HUD dialog (Framer Motion AnimatePresence, SVG icons, animated bars, SVG cooldown ring)
```

## Key Patterns

### Physics Loop (WanderingPet RAF)
- **Frame-based state**: `posRef`, `velRef`, `desiredVRef` updated every frame in RAF callback
- **Speed capping**: Normal wander uses `MAX_SPEED * speedMult`; throw uses `throwActiveRef` to bypass until momentum decays
- **Friction**: All velocity × 0.984 per frame; desired velocity steered toward (0.035 lerp)
- **Wall bounce**: Velocity reversed to ±restitution when boundary crossed
- **Speed level**: Every 2 frames, calculate and emit to component state for render

### Mood System
- `getMood(hunger, happiness)` returns one of: `'happy'` (both >80), `'content'` (both 30–80), `'sad'` (either <30)
- Affects cursor behavior: happy attracts (magnet), sad repels (softly)
- Drives expression pools (speech, face combos, thought bubbles)

### Cooldown Tracking
- `proximityRef.current`: Frame-counted buckets for behavior cooldowns (exciteCooldown, scaredCooldown, etc.)
- `cdEnds` (PetButton): Timestamp-based action cooldowns (feed/pet/play)
- Both decrement in RAF vs. timer — different cadences for different needs

### localStorage Persistence
- Sync every effect cycle: `stats` → LS, `isSpawned` → LS
- On load: hydrate from LS or init to defaults
- Keys: `pet-hunger`, `pet-happiness`, `pet-spawned`

## Common Edits

### Add a new stat or attribute
1. Add to state in `PetButton.jsx`
2. Pass as prop down to `WanderingPet`
3. Sync to localStorage in existing effect
4. Use in RAF loop or behavior logic

### Add a new behavior/reaction
1. Define speech lines in `petData.jsx` → `MOOD_TEXT_POOL[newReaction]`
2. Define eyes/mouth combos → `FACE_COMBOS[newReaction]`  
3. Define thought symbols → `THOUGHT_POOLS[newReaction]` (optional)
4. Call `triggerReaction('newReaction')` from PetButton effect or WanderingPet behavior handler
5. Optional: Add CSS class for animated styling (`_pet-button.css`)

### Adjust physics parameters
- Edit constants in `petConstants.js`: `BASE_SPEED`, `MAX_SPEED`, `BOUNCE_RESTITUTION`, etc.
- RAF loop in `WanderingPet` reads from refs, so changes apply immediately on next frame

### Add a new interaction (HUD button)
1. Add to `COOLDOWNS` dictionary in `petConstants.js`
2. Add button + handler to HUD JSX in `WanderingPet`
3. Implement case in `handleInteract(action)` in `PetButton`
4. Add stat changes and reaction trigger

## Debugging Tips

- **Pet not appearing**: Check `isSpawned` state in PetButton (button click toggles)
- **Physics feel wrong**: Inspect RAF loop refs (`posRef`, `velRef`, `speedMultRef`), frame count in console
- **Behaviors not triggering**: Check cooldown refs (`proximityRef`, `hoverCooldownRef`, `scrollDizzyCooldownRef`)
- **Expression not changing**: Verify `faceCombo` state and `FACE_COMBOS` data; check `triggerReaction` is called
- **HUD not closing**: Check focus trap and `setHudOpen(false)` click handlers
- **Throw not working**: Verify `throwActiveRef` is set true on drag end; check velocity clamping isn't killing throw earlier than expected

## CSS
- All pet styling is in `src/styles/components/_pet-button.css` (~740 lines)
- **Wanderer states**: `.pet-wanderer`, `.pet-wanderer--dragging`, `.pet-wanderer--resting`, `.pet-wanderer--sleeping`, `.pet-wanderer--mood-spin`
- **Thought bubbles**: `.pet-thought` (base) + `.pet-thought--symbol` / `.pet-thought--text` / `.pet-thought--reaction` (variants)
  - Animations: `pet-thought-rise` (scale pop + float + fade), `pet-thought-pop-rise` (more pronounced pop for reactions)
  - CSS custom property: `--tb-dur` (duration), `--tb-delay` (stagger delay per bubble)
- **HUD**: `.pet-hud`, `.pet-hud-header` (flex with SVG icons), `.pet-stats`, `.pet-actions`
  - **Cooldown ring**: `.pet-cd-ring`, `.pet-cd-ring-track`, `.pet-cd-ring-fill` (SVG circle with stroke-dasharray, `r=7`), `.pet-cd-ring-text`
  - **Action buttons**: `.pet-action-btn`, `.pet-action-btn-inner` (flex column for SVG + label), `.pet-action-label`
  - **Stat bars**: Now animated via Framer Motion (not CSS width), `.pet-stat-fill`

## Global API (Console)
```javascript
// Trigger reaction on pet
window.petReact('excited');  // available if pet is spawned

// Get current stats
window.getPetStats();  
// → { hunger: 75, happiness: 82, mood: 'happy' }
```
