/* ─────────────────────────────────────────────────
   Composant principal — bouton header + logique d'état
   ───────────────────────────────────────────────── */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useMood } from '../../contexts/MoodContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import Tooltip from '../Tooltip.jsx';
import {
  LS, DECAY_MS, REACTION_MS, COOLDOWNS, SLEEP_IDLE_MS, ACHIEVEMENTS,
  clamp, readLS, getMood, pickRandom,
} from './petConstants.js';
import { MOOD_TEXT_POOL, FACE_COMBOS, THOUGHT_POOLS, FOOD_ICONS } from './petData.jsx';
import WanderingPet from './WanderingPet.jsx';
import { normalizeThought } from './ThoughtBubbleQueue.jsx';

const PetButton = () => {
  const { mood } = useMood();
  const { showToast } = useToast();
  const [isSpawned, setIsSpawned] = useState(() => localStorage.getItem(LS.spawned) === 'true');
  const [stats, setStats] = useState(() => {
    // Réinitialise à ~50% à chaque chargement de page (synchrone, évite le délai d'un useEffect)
    const neutral = () => Math.round(50 + (Math.random() - 0.5) * 10);
    return { hunger: clamp(neutral()), happiness: clamp(neutral()) };
  });
  const [reaction, setReaction] = useState(null);
  // Timestamp (ms) when each cooldown expires; 0 = not cooling
  const [cdEnds, setCdEnds] = useState({ feed: 0, pet: 0, play: 0 });
  // Pet name — persisted
  const [petName, setPetName] = useState(() => localStorage.getItem(LS.name) || 'Mon Robot');
  // Cycling food icon index — persisted
  const [feedIconIndex, setFeedIconIndex] = useState(() => {
    const v = parseInt(localStorage.getItem(LS.feedIndex), 10);
    return Number.isFinite(v) ? v % FOOD_ICONS.length : 0;
  });
  // Achievements — persisted set of unlocked IDs
  const [achievements, setAchievements] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS.achievements)) || []; }
    catch { return []; }
  });
  // Catch game active flag
  const [isCatching, setIsCatching] = useState(false);
  const isCatchingRef = useRef(false);
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

  useEffect(() => { localStorage.setItem(LS.name, petName); }, [petName]);
  useEffect(() => { localStorage.setItem(LS.feedIndex, String(feedIconIndex)); }, [feedIconIndex]);
  useEffect(() => { localStorage.setItem(LS.achievements, JSON.stringify(achievements)); }, [achievements]);
  useEffect(() => { isCatchingRef.current = isCatching; }, [isCatching]);

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

  /* ── Onboarding : séquence guidée lors du tout premier spawn ── */
  const onboardingRanRef = useRef(false);
  useEffect(() => {
    if (!isSpawned || onboardingRanRef.current) return;
    if (localStorage.getItem(LS.onboarded)) return;
    onboardingRanRef.current = true;

    const steps = [
      { delay: 1200, thought: { type: 'text', content: 'Salut ! Je suis ton robot compagnon !', duration: 5000 } },
      { delay: 6300, thought: { type: 'text', content: 'Je vais me balader un peu partout sur la page !', duration: 5000 } },
      { delay: 11400, thought: { type: 'text', content: 'Tu peux cliquer sur moi pour voir mes stats,', duration: 5000 } },
      { delay: 16500, thought: { type: 'text', content: 'me nourrir et jouer avec moi 💛', duration: 5000 } },
    ];
    const timers = steps.map(({ delay, thought }) =>
      setTimeout(() => handleThought(thought), delay)
    );
    // Marquer comme terminé après la dernière bulle
    timers.push(setTimeout(() => {
      localStorage.setItem(LS.onboarded, '1');
    }, 16000));
    return () => timers.forEach(clearTimeout);
  // handleThought is stable (useCallback with [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpawned]);

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

  /* ── Dégradation en session (ralentie si thriving) + freeze pendant catch ── */
  // Approche probabiliste : évite les décimales (pas de multiplicateur flottant)
  // Thriving (>85/85) : déclin très ralenti + hunger décline plus lentement que happiness
  useEffect(() => {
    if (!isSpawned) return;
    decayRef.current = setInterval(() => {
      if (isCatchingRef.current) {
        // Catch game: freeze hunger, gain happiness slowly.
        // Use probabilistic integer increments (avg +0.5) to avoid decimals.
        setStats((s) => {
          const base = Math.round(s.happiness);
          const inc = Math.random() < 0.5 ? 1 : 0; // +1 half the time -> avg +0.5
          return { ...s, happiness: clamp(base + inc) };
        });
        return;
      }

      setStats((s) => {
        const thriving = s.hunger > 85 && s.happiness > 85;
        // Thriving effect: skip decay with high probability (different rates per stat)
        const hungerSkip = thriving && Math.random() > 0.15;  // 85% skip when thriving
        const happinessSkip = thriving && Math.random() > 0.30; // 70% skip when thriving

        // Use integer-only deltas sampled probabilistically so values remain integers:
        // - hunger: avg 1.5 when not skipped => choose 1 or 2 with equal chance
        // - happiness: avg 0.75 when not skipped => subtract 1 with 75% chance
        let hungerDelta = 0;
        if (!hungerSkip) hungerDelta = Math.random() < 0.5 ? 1 : 2;
        let happinessDelta = 0;
        if (!happinessSkip) happinessDelta = Math.random() < 0.75 ? 1 : 0;

        const newHunger = clamp(Math.round(s.hunger) - hungerDelta);
        const newHappiness = clamp(Math.round(s.happiness) - happinessDelta);
        return { hunger: newHunger, happiness: newHappiness };
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
    return () => { clearTimeout(idleTimerRef.current); };
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
        unlockAchievement('neglect');
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

  /* ── Unlock achievement helper ── */
  const unlockAchievement = useCallback((id) => {
    setAchievements((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  /* ── Interactions (depuis le HUD) ── */
  const handleInteract = useCallback((action) => {
    if (action === 'catch') {
      setIsCatching(true);
      triggerReaction('play');
      unlockAchievement('catch-game');
      return;
    }
    if (Date.now() < cdEnds[action]) return;
    switch (action) {
      case 'feed':
        setStats((s) => ({ ...s, hunger: clamp(Math.round(s.hunger + 25)) }));
        setFeedIconIndex((i) => (i + 1) % FOOD_ICONS.length);
        triggerReaction('eat');
        break;
      case 'pet':
        setStats((s) => ({ ...s, happiness: clamp(Math.round(s.happiness + 20)) }));
        triggerReaction('petted');
        unlockAchievement('pet-action');
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
      unlockAchievement('combo');
      // Fire before the current reaction clears to avoid a 50 ms base-mood flicker
      setTimeout(() => triggerReaction('excited'), REACTION_MS - 100);
    }
  }, [cdEnds, triggerReaction, unlockAchievement]);

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
    setStats((s) => ({ ...s, happiness: clamp(Math.round(s.happiness) + 5) }));
  }, []);

  /* ── Bot catch success: increase happiness (CatchGame effect) ── */
  const handleBotCatchSuccess = useCallback(() => {
    // Random happiness gain between 1 and 10 (inclusive)
    const gain = 1 + Math.floor(Math.random() * 10);
    setStats((s) => ({ ...s, happiness: clamp(Math.round(s.happiness) + gain) }));
    // Small visual feedback: heart thought and numeric label
    handleThought({ type: 'symbol', content: 'heart' });
    handleThought({ type: 'text', content: `+${gain}`, duration: 900 });
  }, [handleThought]);

  /* ── Catch game end ── */
  const handleGameEnd = useCallback(() => {
    setIsCatching(false);
  }, []);

  /* ── Rename callback ── */
  const handleRename = useCallback((newName) => {
    const trimmed = newName.trim().slice(0, 18) || 'Mon Robot';
    setPetName(trimmed);
    if (trimmed !== 'Mon Robot') {
      unlockAchievement('rename');
      showToast(`Robot renommé : ${trimmed}`, { type: 'success', duration: 2500 });
    }
  }, [unlockAchievement, showToast]);

  /* ── Toggle spawn (recharge les stats si elles étaient basses) ── */
  const toggleSpawn = useCallback(() => {
    // showToast doit être appelé HORS du state updater — React StrictMode
    // invoque les updaters deux fois pour détecter les side effects impurs.
    const next = !isSpawned;
    if (next) {
      setStats((s) => ({
        hunger: s.hunger < 10 ? 50 : Math.round(s.hunger),
        happiness: s.happiness < 10 ? 50 : Math.round(s.happiness),
      }));
      showToast('Robot invoqué !', { type: 'info', duration: 2500 });
    } else {
      showToast('Robot rappelé', { type: 'info', duration: 2000 });
    }
    setIsSpawned(next);
  }, [isSpawned, showToast]);


  // Achievement unlocks driven by state changes in PetButton
  useEffect(() => {
    if (petMood === 'happy') unlockAchievement('thrive');
  }, [petMood, unlockAchievement]);

  useEffect(() => {
    if (isSleeping) unlockAchievement('sleep');
  }, [isSleeping, unlockAchievement]);

  // Neglect escalation already triggers dizzy — also unlock achievement
  // (handled inline in the neglect effect below after triggerReaction('dizzy'))

  return (
    <>
      {/* Bouton header */}
      {/* Bouton header — toggle switch animé avec robot */}
      <Tooltip text={isSpawned ? 'Rappeler le robot' : 'Invoquer le robot'} position="bottom">
      <button
        className={`header-action-btn pet-toggle${isSpawned ? ' pet-toggle--on' : ''}${needsAttention ? ' pet-toggle--attention' : ''}`}
        onClick={toggleSpawn}
        tabIndex={0}
        aria-label={isSpawned ? 'Rappeler le robot' : 'Invoquer le robot'}
        role="switch"
        aria-checked={isSpawned}
      >
        <span className="pet-toggle-track">
          <span className="pet-toggle-thumb">
            <svg
              className={`pet-icon${needsAttention ? ' pet-icon--bob' : ''}${!isSpawned ? ' pet-icon--sleep' : ''}`}
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Antenne */}
              <line className="pet-icon-antenna" x1="12" y1="6" x2="12" y2="3" />
              <circle className="pet-icon-antenna-tip" cx="12" cy="2" r="1.5" fill="currentColor" stroke="none" />
              {/* Tête */}
              <rect x="5" y="6" width="14" height="11" rx="3" />
              {/* Yeux — ronds (éveillé) ou tirets (endormi) */}
              {isSpawned ? (
                <>
                  <circle cx="9.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="14.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
                </>
              ) : (
                <>
                  <line className="pet-icon-eye-closed" x1="8" y1="11" x2="11" y2="11" strokeWidth="1.8" />
                  <line className="pet-icon-eye-closed" x1="13" y1="11" x2="16" y2="11" strokeWidth="1.8" />
                </>
              )}
              {/* Bouche — sourire (éveillé) ou plate (endormi) */}
              {isSpawned ? (
                <path d="M9 15 Q12 17 15 15" />
              ) : (
                <line x1="9.5" y1="15" x2="14.5" y2="15" strokeWidth="1.2" />
              )}
              {/* Corps bas */}
              <rect x="8" y="17" width="8" height="4" rx="1.5" />
              {/* Zzz flottant — seulement quand endormi */}
              {!isSpawned && (
                <g className="pet-icon-zzz">
                  <text x="18" y="5" fontSize="4" fill="currentColor" stroke="none" fontWeight="700">z</text>
                  <text x="20" y="2.5" fontSize="3" fill="currentColor" stroke="none" fontWeight="700" opacity="0.6">z</text>
                </g>
              )}
            </svg>
          </span>
        </span>
      </button>
      </Tooltip>

      {/* Robot qui se balade (via portail) */}
      {/* Pas d'AnimatePresence ici — WanderingPet rend via portal sur document.body,
          AnimatePresence ne peut pas mesurer/animer son DOM et injecte un ref
          à travers le portal ce qui génère un warning React. */}
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
          onBotCatchSuccess={handleBotCatchSuccess}
          onThought={handleThought}
          onHoverPet={handleHoverPet}
          cooldowns={cdEnds}
          thoughtQueue={thoughtQueue}
          hudThought={hudThought}
          sizeScale={sizeScale}
          speedMult={speedMult}
          isSleeping={isSleeping}
          moodSpinActive={moodSpinActive}
          petName={petName}
          onRename={handleRename}
          feedIconIndex={feedIconIndex}
          achievements={achievements}
          onUnlock={unlockAchievement}
          isCatching={isCatching}
          onGameEnd={handleGameEnd}
        />
      )}
    </>
  );
};

export default PetButton;
