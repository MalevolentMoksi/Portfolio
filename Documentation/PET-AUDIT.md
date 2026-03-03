# Pet System — Full Behavior & Expression Audit

> Generated 2026-03-01

---

## 1. Expression States

The pet has **3 base moods** (derived from stats) and **9 temporary reactions** (override mood for 2 s):

| Expression | Type | Eyes | Mouth | CSS class | Thought pool |
|---|---|---|---|---|---|
| **happy** | base mood | `happy-closed` / `happy-open` | narrow smile | — | heart, star, note, bolt |
| **content** | base mood | `default` (blink) | flat line | — | note, dots |
| **sad** | base mood | `sad` / `angry` / `tired` | narrow frown | — | dots, zzz |
| **excited** | reaction | `happy-closed` | wide smile | `--antenna-spin` | star, bolt |
| **eat** | reaction | `default` (blink) | wide-open arc | `--bounce` | heart |
| **petted** | reaction | `happy-closed` | narrow smile + blush | `--bounce` | heart, star |
| **play** | reaction | `happy-open` | wide smile | `--bounce`, `--antenna-spin` | star, bolt |
| **scared** | reaction | dilated pupils | pursed gasp | `--shake` | exclaim |
| **woozy** | reaction | X~X crossed | wavy ~~ | `--woozy` | zzz, dots |
| **dizzy** | reaction | X~X crossed | shallow frown | — | zzz |
| **sleep** | reaction | `tired` (half-lid) | flat line | `--sleep` | zzz |

Base mood thresholds (`getMood`):
- **happy**: hunger > 60 AND happiness > 60
- **content**: hunger > 30 AND happiness > 30
- **sad**: either ≤ 30

---

## 2. Trigger Hierarchy

### A. Spawn / Despawn
| Trigger | Reaction | Notes |
|---|---|---|
| First spawn ever | stats → 80/80, then `woozy` | via `setTimeout(…, 0)` |
| Subsequent spawn | stats bumped if < 10, then `woozy` | same path |
| Despawn | AnimatePresence exit | spin-out animation |

### B. Stat Decay (every 8 s while spawned)
- hunger −2, happiness −1
- If *thriving* (both > 85): 80% chance to skip tick (≈5× slower decay)

### C. HUD Interactions
| Action | Stat change | Reaction | Cooldown |
|---|---|---|---|
| Feed | hunger +25 | `eat` | 2 s |
| Pet | happiness +20 | `petted` | 2 s |
| Play | hunger +10, happiness +10 | `play` | 3 s |
| **Combo** (3 in 7 s) | happiness +8 | `excited` after `REACTION_MS - 100` ms | — |

### D. Proximity Behaviors (RAF loop, checked every 2 frames)
| Condition | Reaction/Thought | Cooldown (frames) |
|---|---|---|
| Cursor within 130 px for 90+ frames, not sad | `excited` | 300 |
| Cursor jumps 80+ px closer in one frame, within 160 px | `scared` | 180 |
| Speed > 82% of max, not sad | `excited` | 240 |
| Sad + cursor within 120 px for 30+ frames | `exclaim` thought | 360 |

### E. Drag
| Stage | Reaction |
|---|---|
| First real move (> 4 px) | `scared` |
| Fast drag (> 8 px/frame) | visual stretch + rotation (no reaction) |
| Release with throw (speed > 1.5) | `excited` |
| Release gentle | — |

### F. Scroll
| Condition | Reaction | Cooldown |
|---|---|---|
| 3+ direction reversals in 1500 ms | `dizzy` + zzz thought | 8 s |
| Scroll idle 2.5–10 s → rest on footer/main edge | zzz thought on arrival | auto-cancel 10 s |

### G. Wall Bounce
| Condition | Reaction | Cooldown |
|---|---|---|
| Bounce speed > 1.8 px/frame | `dizzy` | 120 frames |

### H. Hover-to-Pet (1500 ms sustained hover)
| Condition | Reaction | Cooldown |
|---|---|---|
| Not dragging, not sleeping, cooldown expired | `petted` + happiness +5 + 3× heart cascade | 360 frames |

### I. Idle Micro-reactions (every 13–33 s)
- Only fires if `reaction === null` and pet is **not sleeping**
- Picks from mood-appropriate pool: happy→[happy, excited], content→[content], sad→[sad]
- 40% chance to also emit a matching thought bubble

### J. Neglect Escalation
- If mood has been continuously sad for 28 s → `dizzy`
- Uses a ref-based sad-entry timestamp so stat decay does not reset the timer

### K. Sleep / Wake
| Event | Reaction |
|---|---|
| 60 s no mouse/key/pointer → sleep | sets `isSleeping` (persistent, not a timed reaction) |
| Any activity while sleeping | clear sleep → `woozy` |

Expression while sleeping is derived directly from `isSleeping` flag, not from `triggerReaction('sleep')`, so it persists until explicitly cleared.

### L. Site Mood Switch
- Triggers `excited` + 900 ms spin flourish on MoodSwitcher cycle

### M. External APIs
| API | Effect |
|---|---|
| `window.petReact(r)` | triggers any reaction |
| `window.petGravity(ms)` | pulls pet downward |
| `window.petAttract(x, y, ms)` | attracts to point + excited |

---

## 3. Bugs
---

---

### Minor Issues (documented, not auto-fixed)

- **Scared fires on every drag** with no cross-session cooldown. Could feel unnatural after repeated drags but is arguably intentional.
- **Wake-from-sleep woozy overwrites first interaction**. The `mousemove` → wake → `woozy` path fires before any HUD button reaction, causing a brief woozy flash before the intended expression.
