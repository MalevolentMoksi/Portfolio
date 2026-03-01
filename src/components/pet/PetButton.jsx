/* ─────────────────────────────────────────────────
   Composant principal — bouton header + logique d'état
   ───────────────────────────────────────────────── */
import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMood } from '../../contexts/MoodContext.jsx';
import {
  LS, DECAY_MS, REACTION_MS, COOLDOWNS, SLEEP_IDLE_MS,
  clamp, readLS, getMood, pickRandom,
} from './petConstants.js';
import { MOOD_TEXT_POOL, FACE_COMBOS, THOUGHT_POOLS } from './petData.jsx';
import WanderingPet from './WanderingPet.jsx';
import { normalizeThought } from './ThoughtBubbleQueue.jsx';

const PetButton = () => {
  const { mood } = useMood();
  const [isSpawned, setIsSpawned] = useState(() => localStorage.getItem(LS.spawned) === 'true');
  const [stats, setStats] = useState(() => {
    // Réinitialise à ~50% à chaque chargement de page (synchrone, évite le délai d'un useEffect)
    const neutral = () => Math.round(50 + (Math.random() - 0.5) * 10);
    return { hunger: clamp(neutral()), happiness: clamp(neutral()) };
  });
  const [reaction, setReaction] = useState(null);
  // Timestamp (ms) when each cooldown expires; 0 = not cooling
  const [cdEnds, setCdEnds] = useState({ feed: 0, pet: 0, play: 0 });
  // Face combo — independent eyes/mouth variation
  const [faceCombo, setFaceCombo] = useState(() => {
    return pickRandom(FACE_COMBOS[getMood(50, 50)] ?? FACE_COMBOS.content);
  });
  // Floating thought bubble queue — each entry: { id, type, content, label?, duration }
  const [thoughtQueue, setThoughtQueue] = useState([]);
  const thoughtQueueRef = useRef([]);
  const thoughtTimersRef = useRef({});
  // HUD thought line — varies per expression
  const [hudThought, setHudThought] = useState(() => {
    return pickRandom(MOOD_TEXT_POOL[getMood(50, 50)] ?? MOOD_TEXT_POOL.content);
  });
  // Sleep after long idle
  const [isSleeping, setIsSleeping] = useState(false);
  // Mood switch flourish
  const [moodSpinActive, setMoodSpinActive] = useState(false);

  const reactionTimer = useRef(null);
  let _thoughtIdCounter = useRef(0);
  const decayRef = useRef(null);
  const idleTimerRef = useRef(null);
  const idleReactionRef = useRef(null);
  // Ref mirrors for stale-closure-safe reads inside timer callbacks
  const isSleepingRef = useRef(false);
  // Tracks timestamp when pet first became sad (for neglect escalation)
  const sadSinceRef = useRef(null);
  const interactionStreakRef = useRef({ count: 0, lastAt: 0 });
  const firstSpawnRef = useRef(true);
  // Track previous isSpawned to detect false→true transitions (init to current value to avoid false trigger on mount)
  const prevSpawnedRef = useRef(isSpawned);
  // Sleep/idle tracking
  const lastActivityRef = useRef(Date.now());
  const sleepCheckRef = useRef(null);
  // Mood switch tracking
  const prevMoodRef = useRef(mood);

  const petMood = getMood(stats.hunger, stats.happiness);
  // Sleep takes priority over base mood but yields to temporary reactions
  const expression = reaction || (isSleeping ? 'sleep' : petMood);
  const needsAttention = petMood === 'sad' && isSpawned;

  // ── Vitality-derived size and speed ──
  const vitality = clamp((stats.hunger + stats.happiness) / 200, 0, 1);
  const sizeScale = 0.85 + vitality * 0.25;   // range 0.85–1.10
  const speedMult = 0.6 + vitality * 0.8;     // range 0.6–1.40

  /* ── Persistance ── */
  useEffect(() => {
    localStorage.setItem(LS.hunger, String(stats.hunger));
    localStorage.setItem(LS.happiness, String(stats.happiness));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(LS.spawned, String(isSpawned));
  }, [isSpawned]);

  // Migration: remove stale pet-renderer key (SVG is now the only renderer)
  useEffect(() => { localStorage.removeItem('pet-renderer'); }, []);

  /* ── Réactions temporaires ── */
  const triggerReaction = useCallback((r) => {
    clearTimeout(reactionTimer.current);
    setReaction(r);
    setFaceCombo(pickRandom(FACE_COMBOS[r] ?? FACE_COMBOS.content));
    setHudThought(pickRandom(MOOD_TEXT_POOL[r] ?? MOOD_TEXT_POOL.content));
    reactionTimer.current = setTimeout(() => setReaction(null), REACTION_MS);
  }, []);

  // On every spawn: woozy landing. On first spawn only: also boost stats to happy.
  useEffect(() => {
    if (!prevSpawnedRef.current && isSpawned) {
      if (firstSpawnRef.current) {
        firstSpawnRef.current = false;
        setStats({ hunger: 80, happiness: 80 });
      }
      // No cleanup return — StrictMode double-invoke would cancel the timeout before it fires
      setTimeout(() => triggerReaction('woozy'), 0);
    }
    prevSpawnedRef.current = isSpawned;
  }, [isSpawned, triggerReaction]);

  // Mirror `reaction` and `isSleeping` into refs so timer callbacks always read current values
  useEffect(() => { idleReactionRef.current = reaction; }, [reaction]);
  useEffect(() => { isSleepingRef.current = isSleeping; }, [isSleeping]);

  // Sync faceCombo/hudThought when sleep state changes (no triggerReaction for sleep
  // since we need a persistent expression, not a 2 s auto-clear)
  useEffect(() => {
    if (isSleeping) {
      setFaceCombo(pickRandom(FACE_COMBOS.sleep ?? FACE_COMBOS.content));
      setHudThought(pickRandom(MOOD_TEXT_POOL.sleep ?? MOOD_TEXT_POOL.content));
    }
  // When waking up, triggerReaction('woozy') is called which resets the combo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSleeping]);

  // When reaction clears, reset combo to base mood
  useEffect(() => {
    if (reaction === null) {
      setFaceCombo(pickRandom(FACE_COMBOS[petMood] ?? FACE_COMBOS.content));
      setHudThought(pickRandom(MOOD_TEXT_POOL[petMood] ?? MOOD_TEXT_POOL.content));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction, petMood]);

  /* ── Dégradation en session (ralentie si thriving) ── */
  // Approche probabiliste : évite les décimales (pas de multiplicateur flottant)
  // Thriving (>85/85) : déclin avec 20% de probabilité par tick → ~5× plus lent
  useEffect(() => {
    if (!isSpawned) return;
    decayRef.current = setInterval(() => {
      setStats((s) => {
        const thriving = s.hunger > 85 && s.happiness > 85;
        if (thriving && Math.random() > 0.2) return s; // skip ce tick
        return {
          hunger: clamp(s.hunger - 2),
          happiness: clamp(s.happiness - 1),
        };
      });
    }, DECAY_MS);
    return () => clearInterval(decayRef.current);
  }, [isSpawned]);

  /* ── Idle micro-reactions — occasional autonomous expressions ── */
  useEffect(() => {
    if (!isSpawned) return;
    const schedule = () => {
      idleTimerRef.current = setTimeout(() => {
        // Guard: skip if a reaction is already playing or the pet is asleep
      if (idleReactionRef.current === null && !isSleepingRef.current) {
          const h   = readLS(LS.hunger, 80);
          const hap = readLS(LS.happiness, 80);
          const mood = getMood(h, hap);
          const opts = {
            happy:   ['happy', 'excited'],
            content: ['content'],
            sad:     ['sad'],
          };
          const choices = opts[mood] ?? ['content'];
          const chosenReaction = choices[Math.floor(Math.random() * choices.length)];
          triggerReaction(chosenReaction);
          // ~40% chance: also pop a floating thought symbol matching the mood
          if (Math.random() < 0.4) {
            const pool = THOUGHT_POOLS[chosenReaction] ?? THOUGHT_POOLS[mood] ?? ['dots'];
            const sym = pickRandom(pool);
            handleThought({ type: 'symbol', content: sym });
          }
        }
        schedule();
      }, 13000 + Math.random() * 20000); // 13–33 s between idle pulses
    };
    schedule();
    return () => { clearTimeout(idleTimerRef.current); clearTimeout(thoughtTimerRef.current); };
  }, [isSpawned, triggerReaction]);

  /* ── Neglect escalation — sustained sad triggers dizzy ── */
  // Uses petMood (not raw stats) so the interval isn't reset on every decay tick.
  // sadSinceRef records when sad began; crossing the 28 s mark fires dizzy once.
  useEffect(() => {
    if (!isSpawned || petMood !== 'sad') {
      sadSinceRef.current = null;
      return;
    }
    // Preserve timestamp if we were already tracking
    if (sadSinceRef.current === null) sadSinceRef.current = Date.now();
    const id = setInterval(() => {
      if (sadSinceRef.current !== null && Date.now() - sadSinceRef.current >= 28000) {
        sadSinceRef.current = null;
        triggerReaction('dizzy');
      }
    }, 5000);
    return () => clearInterval(id);
  }, [isSpawned, petMood, triggerReaction]);

  /* ── Sommeil après inactivité ── */
  useEffect(() => {
    if (!isSpawned) return;
    lastActivityRef.current = Date.now();
    const onActivity = () => {
      lastActivityRef.current = Date.now();
      if (isSleeping) {
        setIsSleeping(false);
        triggerReaction('woozy');
      }
    };
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('pointerdown', onActivity);
    sleepCheckRef.current = setInterval(() => {
      if (!isSleeping && Date.now() - lastActivityRef.current > SLEEP_IDLE_MS) {
        // Set sleep flag only — expression derived from isSleeping, not a timed reaction,
        // so the sleep face persists for the full duration without a 2 s auto-clear.
        setIsSleeping(true);
      }
    }, 15000);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('pointerdown', onActivity);
      clearInterval(sleepCheckRef.current);
    };
  }, [isSpawned, isSleeping, triggerReaction]);

  /* ── Flourish quand le mood du site change ── */
  useEffect(() => {
    if (prevMoodRef.current !== null && prevMoodRef.current !== mood && isSpawned) {
      triggerReaction('excited');
      setMoodSpinActive(true);
      const id = setTimeout(() => setMoodSpinActive(false), 900);
      return () => clearTimeout(id);
    }
    prevMoodRef.current = mood;
  }, [mood, isSpawned, triggerReaction]);

  /* ── API globale ── */
  useEffect(() => {
    window.petReact = (r) => {
      if (localStorage.getItem(LS.spawned) === 'false') return;
      triggerReaction(r);
    };
    window.getPetStats = () => {
      if (localStorage.getItem(LS.spawned) === 'false') return null;
      return {
        hunger: readLS(LS.hunger, 80),
        happiness: readLS(LS.happiness, 80),
        get mood() { return getMood(this.hunger, this.happiness); },
      };
    };
    return () => { delete window.petReact; delete window.getPetStats; };
  }, [triggerReaction]);

  /* ── Interactions (depuis le HUD) ── */
  const handleInteract = useCallback((action) => {
    if (Date.now() < cdEnds[action]) return;
    switch (action) {
      case 'feed':
        setStats((s) => ({ ...s, hunger: clamp(Math.round(s.hunger + 25)) }));
        triggerReaction('eat');
        break;
      case 'pet':
        setStats((s) => ({ ...s, happiness: clamp(Math.round(s.happiness + 20)) }));
        triggerReaction('petted');
        break;
      case 'play':
        setStats((s) => ({ hunger: clamp(Math.round(s.hunger + 10)), happiness: clamp(Math.round(s.happiness + 10)) }));
        triggerReaction('play');
        break;
    }
    setCdEnds((c) => ({ ...c, [action]: Date.now() + COOLDOWNS[action] }));

    // Combo streak bonus — 3 interactions within 7 s → excited burst + happiness bonus
    const now = Date.now();
    const streak = interactionStreakRef.current;
    streak.count = (now - streak.lastAt < 7000) ? streak.count + 1 : 1;
    streak.lastAt = now;
    if (streak.count >= 3) {
      streak.count = 0;
      setStats((s) => ({ ...s, happiness: clamp(Math.round(s.happiness + 8)) }));
      // Fire before the current reaction clears to avoid a 50 ms base-mood flicker
      setTimeout(() => triggerReaction('excited'), REACTION_MS - 100);
    }
  }, [cdEnds, triggerReaction]);

  /* ── Thought bubble queue (déclenché depuis WanderingPet ou PetButton) ── */
  const handleThought = useCallback((input) => {
    const thought = normalizeThought(input);
    const id = ++_thoughtIdCounter.current;
    const entry = { ...thought, id };

    // Enforce max 3 concurrent bubbles: drop oldest if full
    const next = [...thoughtQueueRef.current, entry].slice(-3);
    thoughtQueueRef.current = next;
    setThoughtQueue([...next]);

    // Auto-remove after duration
    thoughtTimersRef.current[id] = setTimeout(() => {
      thoughtQueueRef.current = thoughtQueueRef.current.filter(t => t.id !== id);
      setThoughtQueue([...thoughtQueueRef.current]);
      delete thoughtTimersRef.current[id];
    }, thought.duration);
  }, []);

  // Cleanup all thought timers on unmount
  useEffect(() => {
    return () => Object.values(thoughtTimersRef.current).forEach(clearTimeout);
  }, []);

  /* ── Hover-pet stat bump (+5 happiness) ── */
  const handleHoverPet = useCallback(() => {
    setStats((s) => ({ ...s, happiness: clamp(Math.round(s.happiness + 5)) }));
  }, []);

  /* ── Toggle spawn (recharge les stats si elles étaient basses) ── */
  const toggleSpawn = useCallback(() => {
    setIsSpawned((prev) => {
      const next = !prev;
      if (next) {
        setStats((s) => ({
          hunger: s.hunger < 10 ? 50 : Math.round(s.hunger),
          happiness: s.happiness < 10 ? 50 : Math.round(s.happiness),
        }));
      }
      return next;
    });
  }, []);


  return (
    <>
      {/* Bouton header */}
      <button
        className={`header-action-btn pet-btn${needsAttention ? ' pet-btn--attention' : ''}${!isSpawned ? ' pet-btn--off' : ''}`}
        onClick={toggleSpawn}
        tabIndex={-1}
        aria-label={isSpawned ? 'Rappeler le robot' : 'Invoquer le robot'}
        title={isSpawned ? 'Rappeler le robot' : 'Invoquer le robot'}
      >
        <svg
          className={`pet-icon${needsAttention ? ' pet-icon--bob' : ''}`}
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="6" x2="12" y2="3" />
          <circle cx="12" cy="2" r="1.5" fill="currentColor" stroke="none" />
          <rect x="5" y="6" width="14" height="11" rx="3" />
          <circle cx="9.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
          <path d="M9 15 Q12 17 15 15" />
          <rect x="8" y="17" width="8" height="4" rx="1.5" />
        </svg>
      </button>

      {/* Robot qui se balade (via portail) */}
      <AnimatePresence>
        {isSpawned && (
          <WanderingPet
            key="wandering-pet"
            stats={stats}
            expression={expression}
            eyeState={faceCombo.eyes}
            mouthExpr={faceCombo.mouth}
            petMood={petMood}
            onInteract={handleInteract}
            onBehavior={triggerReaction}
            onThought={handleThought}
            onHoverPet={handleHoverPet}
            cooldowns={cdEnds}
            thoughtQueue={thoughtQueue}
            hudThought={hudThought}
            sizeScale={sizeScale}
            speedMult={speedMult}
            isSleeping={isSleeping}
            moodSpinActive={moodSpinActive}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PetButton;
