/* ══════════════════════════════════════════════
  Jeu d'Attrape — édition avancée
  Aim positionnel + catch actif (challenge) + support tactile
  Bot adaptive throws + objectifs par difficulté
   ══════════════════════════════════════════════ */
import { useRef, useEffect, useState, useCallback, type RefObject } from 'react';
import { createPortal } from 'react-dom';

import { useTranslation } from 'react-i18next';
import {
  CATCH_BALL_SIZE,
  CATCH_BALL_SPEED,
  CATCH_BALL_GRAVITY,
  CATCH_BOT_RADIUS,
  BOUNCE_RESTITUTION,
  CATCH_BOT_HOLD_MIN,
  CATCH_BOT_HOLD_RANGE,
  CATCH_BOT_THROW_SPREAD,
} from './petConstants';

import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';
import { safeLocalGet, safeLocalSet } from '@utils/safeStorage';

/* ── Type definitions ── */
type CatchMode = 'free' | 'challenge';
type CatchDifficulty = 'casual' | 'normal' | 'hard';
type HolderState = 'player' | 'flying' | 'bot-held' | 'returning';
type MissReason = 'doubleBounce';
type EndReason = MissReason | 'objective';
interface CatchStats {
  hunger: number;
  happiness: number;
}
interface GameOverSummary {
  success: boolean;
  reason: EndReason;
  score: number;
  rallies: number;
  maxCombo: number;
}
interface CatchGameProps {
  botPosRef: RefObject<{ x: number; y: number }>;
  onBotCatch: () => void;
  onGameEnd: () => void;
  ballInfoRef?: RefObject<any>;
  stats?: CatchStats;
  onUnlockAchievement?: (achievementId: string) => void;
}
interface DifficultyPreset {
  lives: number;
  objectiveScore: number;
  pointsPerCatch: number;
  missPenalty: number;
  comboDecayMs: number;
  playerCatchRadius: number;
  chargeMs: number;
  chargeSpeedBoost: number;
  chargeSpread: number;
  botHoldMin: number;
  botHoldRange: number;
  returnSpeedScale: number;
  returnSpreadScale: number;
  curveChance: number;
  lobChance: number;
  fakeChance: number;
  fastChance: number;
  curveForce: number;
}

/* ── Constants ── */
const BALL_R = CATCH_BALL_SIZE / 2;
const BOT_CATCH = CATCH_BOT_RADIUS;
const BOT_CATCH_SQ = BOT_CATCH * BOT_CATCH;
const BALL_TOP_MIN = BALL_R;
const AIM_STEPS_BY_TIER = { high: 22, mid: 16, low: 10 };
const AIM_DT = 2.5;
/** Min angle change (rad, ~1.4°) to trigger aim-path rebuild */
const AIM_ANGLE_DIRTY = 0.025;
/** Min charge change to trigger aim-path rebuild */
const AIM_CHARGE_DIRTY = 0.02;
const HINT_DELAY_MS = 3000;
const AIR_FRICTION = 0.997;
const STOP_THRESH = 0.5;
const CHARGE_MIN = 0.08;
/** ms after a click/tap during which a catch is valid (generous for all input speeds) */
const CATCH_GRACE_MS = 140;
const STOP_THRESH_SQ = STOP_THRESH * STOP_THRESH;

const LS_BEST_RALLIES = 'catch-best-rallies';
const LS_BEST_BY_DIFF = 'catch-best-by-difficulty';
const LS_LAST_DIFF = 'catch-last-difficulty';
const LS_BADGES = 'catch-challenge-badges';

const DIFFICULTY_PRESETS: Record<CatchDifficulty, DifficultyPreset> = {
  casual: {
    lives: 3,
    objectiveScore: 1100,
    pointsPerCatch: 75,
    missPenalty: 45,
    comboDecayMs: 4200,
    playerCatchRadius: 94,
    chargeMs: 1200,
    chargeSpeedBoost: 1.35,
    chargeSpread: 0.05,
    botHoldMin: CATCH_BOT_HOLD_MIN + 12,
    botHoldRange: CATCH_BOT_HOLD_RANGE + 18,
    returnSpeedScale: 0.9,
    returnSpreadScale: 0.85,
    curveChance: 0.12,
    lobChance: 0.18,
    fakeChance: 0.04,
    fastChance: 0.08,
    curveForce: 0.006,
  },
  normal: {
    lives: 3,
    objectiveScore: 1700,
    pointsPerCatch: 90,
    missPenalty: 60,
    comboDecayMs: 3300,
    playerCatchRadius: 85,
    chargeMs: 1050,
    chargeSpeedBoost: 1.55,
    chargeSpread: 0.1,
    botHoldMin: CATCH_BOT_HOLD_MIN,
    botHoldRange: CATCH_BOT_HOLD_RANGE,
    returnSpeedScale: 1,
    returnSpreadScale: 1,
    curveChance: 0.2,
    lobChance: 0.14,
    fakeChance: 0.08,
    fastChance: 0.12,
    curveForce: 0.011,
  },
  hard: {
    lives: 3,
    objectiveScore: 2500,
    pointsPerCatch: 110,
    missPenalty: 80,
    comboDecayMs: 2500,
    playerCatchRadius: 75,
    chargeMs: 900,
    chargeSpeedBoost: 1.8,
    chargeSpread: 0.16,
    botHoldMin: Math.max(10, CATCH_BOT_HOLD_MIN - 8),
    botHoldRange: Math.max(14, CATCH_BOT_HOLD_RANGE - 12),
    returnSpeedScale: 1.13,
    returnSpreadScale: 1.25,
    curveChance: 0.29,
    lobChance: 0.08,
    fakeChance: 0.16,
    fastChance: 0.22,
    curveForce: 0.018,
  },
};

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

/** Closest point on segment AB to point P — used for CCD bot-catch detection */
const closestPointOnSegment = (
  ax: number, ay: number,
  bx: number, by: number,
  px: number, py: number,
) => {
  const abx = bx - ax, aby = by - ay;
  const ab2 = abx * abx + aby * aby;
  if (ab2 <= 1e-6) return { x: ax, y: ay };
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / ab2));
  return { x: ax + abx * t, y: ay + aby * t };
};

/** Extract pointer {x,y} from a mouse or touch event. Returns null for non-primary mouse buttons. */
const getPointerPos = (e: any): { x: number; y: number } | null => {
  if (e.touches !== undefined) {
    // touchstart / touchend / touchcancel
    const src = e.touches.length > 0 ? e.touches[0] : e.changedTouches?.[0];
    return src ? { x: src.clientX, y: src.clientY } : null;
  }
  if (e.button !== undefined && e.button !== 0) return null;
  return { x: e.clientX, y: e.clientY };
};

/* ── Component ── */
const CatchGame = ({
  botPosRef,
  onBotCatch,
  onGameEnd,
  ballInfoRef,
  stats,
  onUnlockAchievement,
}: CatchGameProps) => {
  const tier = usePerformanceTierValue();
  const aimSteps = AIM_STEPS_BY_TIER[tier] ?? 16;
  const { t } = useTranslation();
  const startX = window.innerWidth / 2;
  const startY = window.innerHeight - 120;
  const initialDifficulty = (() => {
    const raw = safeLocalGet(LS_LAST_DIFF);
    if (raw === 'casual' || raw === 'normal' || raw === 'hard') return raw;
    return 'normal';
  })() as CatchDifficulty;

  /* ── Physics state refs ── */
  const ballPosRef = useRef({ x: startX, y: startY });
  const ballVelRef = useRef({ x: 0, y: 0 });
  const holderRef = useRef<HolderState>('player');
  const catchCooldownRef = useRef(0);
  const cursorRef = useRef({ x: startX, y: startY });
  /** Fixed position where the ball rests while held by the player */
  const ballHomeRef = useRef({ x: startX, y: startY });
  const rafRef = useRef<number>(0);
  const prevTimeRef = useRef<number | null>(null);

  /* ── Bot-held phase ── */
  const botHoldCounterRef = useRef(0);
  const returnCurveRef = useRef(0);
  const throwAgeRef = useRef(0);
  const botThrowAtRef = useRef(0);
  const lastThrowChargeRef = useRef(0);
  const bounceCountRef = useRef(0);
  const missNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livesFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Replay escalation ── */
  const replayCountRef = useRef(0);

  /* ── DOM refs ── */
  const ballElRef = useRef<HTMLDivElement | null>(null);
  const aimSvgRef = useRef<SVGSVGElement | null>(null);
  const aimPathRef = useRef<SVGPathElement | null>(null);
  /** Catch-zone ring element — positioned via RAF, not React state */
  const catchZoneElRef = useRef<HTMLDivElement | null>(null);
  /** Ripple element — always mounted, animation restarted via class toggle */
  const rippleElRef = useRef<HTMLDivElement | null>(null);
  /** Score value element — flash animation triggered directly, no React state */
  const scoreValueElRef = useRef<HTMLDivElement | null>(null);
  /** Cached viewport size — avoids layout-flushing window.innerWidth/Height in RAF */
  const vpWRef = useRef(window.innerWidth);
  const vpHRef = useRef(window.innerHeight);
  /** Tracks last catch-zone ready state to skip redundant classList mutations */
  const catchZoneReadyRef = useRef(false);
  /* Dirty flags for aim-path rebuild — avoid SVG work every frame */
  const prevAimAngleRef = useRef(-999);
  const prevAimChargeRef = useRef(-1);
  /** Overlay div — flash class toggled via DOM on catch, avoids React re-render */
  const overlayElRef = useRef<HTMLDivElement | null>(null);
  /** Charge bar fill + text — scaleX/textContent updated via RAF direct DOM writes */
  const chargeBarFillRef = useRef<HTMLDivElement | null>(null);
  const chargeBarTextRef = useRef<HTMLDivElement | null>(null);
  /** Combo decay fill — scaleX updated via RAF direct DOM write */
  const comboFillRef = useRef<HTMLDivElement | null>(null);
  /** Bounce count text span — textContent updated via RAF direct DOM write */
  const bounceCountTextRef = useRef<HTMLSpanElement | null>(null);

  /* ── Charge refs ── */
  const isChargingRef = useRef(false);
  const chargeStartedAtRef = useRef(0);
  const chargePctRef = useRef(0);
  const prevRenderedChargePctRef = useRef(0);

  /* ── Active-catch timestamp (challenge mode) ── */
  const catchAttemptTimeRef = useRef(0);

  /* ── Score/combo refs — RAF-safe, bypass stale closure issue ── */
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const livesRef = useRef(0);
  const maxComboRef = useRef(0);
  const comboDecayEndsAtRef = useRef(0);
  const comboDecayDisplayRef = useRef(0);
  const gameOverRef = useRef(false);

  /* ── React state (UI/render only) ── */
  const [mode, setMode] = useState<CatchMode>('free');
  const [difficulty, setDifficulty] = useState<CatchDifficulty>(initialDifficulty);
  const [showSetup, setShowSetup] = useState(true);
  const [isHeld, setIsHeld] = useState(true);
  const [isCharging, setIsCharging] = useState(false);
  const [rallies, setRallies] = useState(0);
  // Mirror of `rallies` read by endChallenge without listing `rallies` as a dependency.
  // Listing it cascaded (endChallenge → registerMiss → physics effect deps), restarting
  // the ball-physics RAF loop on every catch and producing a one-frame stutter.
  const ralliesRef = useRef(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(DIFFICULTY_PRESETS[initialDifficulty].lives);
  const [showHint, setShowHint] = useState(false);
  const [lastGain, setLastGain] = useState(0);
  const [missNotice, setMissNotice] = useState<MissReason | null>(null);
  const [livesFlash, setLivesFlash] = useState(false);
  const [showDifficultyImpact, setShowDifficultyImpact] = useState(false);
  const [gameOver, setGameOver] = useState<GameOverSummary | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Persistence state ── */
  const [bestRallies, setBestRallies] = useState(() =>
    parseInt(safeLocalGet(LS_BEST_RALLIES) || '0', 10)
  );
  const [bestByDifficulty, setBestByDifficulty] = useState<Record<CatchDifficulty, number>>(() =>
    safeParse<Record<CatchDifficulty, number>>(safeLocalGet(LS_BEST_BY_DIFF), {
      casual: 0,
      normal: 0,
      hard: 0,
    })
  );
  const [challengeBadges, setChallengeBadges] = useState<Record<string, boolean>>(() =>
    safeParse<Record<string, boolean>>(safeLocalGet(LS_BADGES), {
      clear: false,
      hard: false,
      combo20: false,
    })
  );
  const bestRef = useRef(bestRallies);
  const challengeBadgesRef = useRef(challengeBadges);

  const preset = DIFFICULTY_PRESETS[difficulty];
  const replayMultiplier = 1 + replayCountRef.current * 0.15;
  const currentObjective = Math.round(preset.objectiveScore * replayMultiplier);

  const difficultyReadout = [
    { label: t('common.catchGameUI.menu.traits.catchWindow'), value: `${preset.playerCatchRadius}px` },
    { label: t('common.catchGameUI.menu.traits.comboDecay'), value: `${(preset.comboDecayMs / 1000).toFixed(1)}s` },
    { label: t('common.catchGameUI.menu.traits.chargeTime'), value: `${(preset.chargeMs / 1000).toFixed(2)}s` },
    { label: t('common.catchGameUI.menu.traits.returnSpeed'), value: `x${preset.returnSpeedScale.toFixed(2)}` },
    { label: t('common.catchGameUI.menu.traits.unpredictability'), value: `x${preset.returnSpreadScale.toFixed(2)}` },
    { label: t('common.catchGameUI.menu.traits.scoreGoal'), value: currentObjective.toString() },
    ...(replayCountRef.current > 0
      ? [{ label: t('common.catchGameUI.menu.traits.difficulty'), value: `Replay ×${replayMultiplier.toFixed(2)}` }]
      : []),
  ];

  /* ── Sync refs → state ── */
  useEffect(() => { challengeBadgesRef.current = challengeBadges; }, [challengeBadges]);
  useEffect(() => { safeLocalSet(LS_LAST_DIFF, difficulty); }, [difficulty]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  useEffect(() => {
    ralliesRef.current = rallies;
    if (rallies > bestRef.current) {
      bestRef.current = rallies;
      setBestRallies(rallies);
      safeLocalSet(LS_BEST_RALLIES, String(rallies));
    }
  }, [rallies]);

  useEffect(() => {
    if (mode !== 'challenge') return;
    const best = bestByDifficulty[difficulty] ?? 0;
    if (score <= best) return;
    const next = { ...bestByDifficulty, [difficulty]: score };
    setBestByDifficulty(next);
    safeLocalSet(LS_BEST_BY_DIFF, JSON.stringify(next));
  }, [score, mode, difficulty, bestByDifficulty]);

  /* ── Hint timer ── */
  const clearHintTimer = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, []);

  /**
   * Fire the catch-ripple animation and score-pop at a given position.
   * Pure DOM manipulation — zero React re-renders.
   * Uses the rAF remove→add trick to reliably restart CSS animations.
   */
  const triggerRipple = useCallback((x: number, y: number) => {
    const el = rippleElRef.current;
    if (el) {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.classList.remove('catch-ripple--active');
      requestAnimationFrame(() => rippleElRef.current?.classList.add('catch-ripple--active'));
    }
    const ov = overlayElRef.current;
    if (ov) {
      ov.classList.remove('catch-game-overlay--flash');
      requestAnimationFrame(() => overlayElRef.current?.classList.add('catch-game-overlay--flash'));
    }
    const sv = scoreValueElRef.current;
    if (sv) {
      sv.classList.remove('catch-game-score-value--flash');
      requestAnimationFrame(() =>
        scoreValueElRef.current?.classList.add('catch-game-score-value--flash')
      );
    }
  }, []);

  const startHoldTimer = useCallback(() => {
    setShowHint(false);
    clearHintTimer();
    hintTimerRef.current = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
  }, [clearHintTimer]);

  /* ── Reset ball to player ── */
  const resetBallToPlayer = useCallback(
    (withHintTimer = true) => {
      /* Ball home = where the ball currently is (catch position or stopped position) */
      ballHomeRef.current = { x: ballPosRef.current.x, y: ballPosRef.current.y };
      holderRef.current = 'player';
      ballVelRef.current.x = 0;
      ballVelRef.current.y = 0;
      throwAgeRef.current = 0;
      returnCurveRef.current = 0;
      catchCooldownRef.current = 0;
      catchAttemptTimeRef.current = 0;
      isChargingRef.current = false;
      chargePctRef.current = 0;
      prevRenderedChargePctRef.current = 0;
      prevAimAngleRef.current = -999;
      prevAimChargeRef.current = -1;
      bounceCountRef.current = 0;
      if (bounceCountTextRef.current) bounceCountTextRef.current.textContent = '0';
      if (chargeBarFillRef.current) chargeBarFillRef.current.style.transform = `scaleX(${CHARGE_MIN})`;
      if (chargeBarTextRef.current) chargeBarTextRef.current.textContent = '0%';
      setIsCharging(false);
      setIsHeld(true);
      if (aimPathRef.current) aimPathRef.current.setAttribute('d', '');
      if (withHintTimer) startHoldTimer();
    },
    [startHoldTimer]
  );

  /* ── Challenge badges ── */
  const unlockChallengeBadge = useCallback(
    (key: 'clear' | 'hard' | 'combo20') => {
      if (challengeBadgesRef.current[key]) return;
      const next = { ...challengeBadgesRef.current, [key]: true };
      challengeBadgesRef.current = next;
      setChallengeBadges(next);
      safeLocalSet(LS_BADGES, JSON.stringify(next));
      if (key === 'clear') onUnlockAchievement?.('catch-challenge-clear');
      if (key === 'hard') onUnlockAchievement?.('catch-hard-clear');
      if (key === 'combo20') onUnlockAchievement?.('catch-combo-20');
    },
    [onUnlockAchievement]
  );

  const endChallenge = useCallback(
    (success: boolean, reason: EndReason) => {
      if (gameOverRef.current || mode !== 'challenge') return;
      gameOverRef.current = true;
      if (success) {
        unlockChallengeBadge('clear');
        if (difficulty === 'hard') unlockChallengeBadge('hard');
      }
      if (maxComboRef.current >= 20) unlockChallengeBadge('combo20');
      setGameOver({
        success,
        reason,
        score: scoreRef.current,
        rallies: ralliesRef.current,
        maxCombo: maxComboRef.current,
      });
      setShowHint(false);
      setLastGain(0);
      resetBallToPlayer(false);
    },
    [difficulty, mode, resetBallToPlayer, unlockChallengeBadge]
  );

  const registerMiss = useCallback(
    (reason: MissReason) => {
      if (mode !== 'challenge') {
        setCombo(0);
        comboDecayEndsAtRef.current = 0;
        if (comboFillRef.current) comboFillRef.current.style.transform = 'scaleX(0)';
        resetBallToPlayer();
        return;
      }
      if (missNoticeTimerRef.current) clearTimeout(missNoticeTimerRef.current);
      setMissNotice(reason);
      missNoticeTimerRef.current = setTimeout(() => setMissNotice(null), 1000);
      comboDecayEndsAtRef.current = 0;
      comboDecayDisplayRef.current = 0;
      setCombo(0);
      if (comboFillRef.current) comboFillRef.current.style.transform = 'scaleX(0)';
      setLastGain(-preset.missPenalty);
      setScore((prev) => Math.max(0, prev - preset.missPenalty));
      bounceCountRef.current = 0;
      if (bounceCountTextRef.current) bounceCountTextRef.current.textContent = '0';
      if (livesFlashTimerRef.current) clearTimeout(livesFlashTimerRef.current);
      setLivesFlash(true);
      livesFlashTimerRef.current = setTimeout(() => setLivesFlash(false), 550);
      setLives((prev) => {
        const next = Math.max(0, prev - 1);
        if (next <= 0) endChallenge(false, reason);
        else resetBallToPlayer();
        return next;
      });
    },
    [endChallenge, mode, preset.missPenalty, resetBallToPlayer]
  );

  const registerSuccessfulReturn = useCallback(() => {
    if (mode !== 'challenge') return;
    const chargeBonus = Math.round(lastThrowChargeRef.current * 40);
    const comboMultiplier = Math.min(3.1, 1 + comboRef.current * 0.15);
    const gain = Math.max(10, Math.round((preset.pointsPerCatch + chargeBonus) * comboMultiplier));
    setLastGain(gain);
    setScore((prev) => prev + gain);
    setCombo((prev) => {
      const next = prev + 1;
      if (next > maxComboRef.current) maxComboRef.current = next;
      return next;
    });
    comboDecayEndsAtRef.current = Date.now() + preset.comboDecayMs;
    comboDecayDisplayRef.current = 1;
    if (comboFillRef.current) comboFillRef.current.style.transform = 'scaleX(1)';
  }, [mode, preset.pointsPerCatch, preset.comboDecayMs]);

  /**
   * Launch the ball from its home position toward the current cursor.
   * Direction = angle(ballHome → cursor). Speed = charge-based.
   */
  const launchBall = useCallback(
    (rawCharge: number) => {
      if (holderRef.current !== 'player') return;
      const charge = Math.max(CHARGE_MIN, Math.min(1, rawCharge));
      const home = ballHomeRef.current;
      const cur = cursorRef.current;
      const dx = cur.x - home.x;
      const dy = cur.y - home.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      /* Default to straight up when cursor sits on the ball */
      const dirX = dist > 1 ? dx / dist : 0;
      const dirY = dist > 1 ? dy / dist : -1;
      const speed = CATCH_BALL_SPEED * (0.65 + charge * preset.chargeSpeedBoost);
      /* Angular spread — reduced at high charge to reward precision */
      const spread = preset.chargeSpread * (1 - charge * 0.4);
      const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * 2 * spread;
      ballVelRef.current = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
      holderRef.current = 'flying';
      throwAgeRef.current = 0;
      catchCooldownRef.current = 22;
      lastThrowChargeRef.current = charge;
      isChargingRef.current = false;
      chargePctRef.current = 0;
      catchAttemptTimeRef.current = 0;
      if (chargeBarFillRef.current) chargeBarFillRef.current.style.transform = `scaleX(${CHARGE_MIN})`;
      if (chargeBarTextRef.current) chargeBarTextRef.current.textContent = '0%';
      setIsCharging(false);
      setIsHeld(false);
      setShowHint(false);
      clearHintTimer();
      if (aimPathRef.current) aimPathRef.current.setAttribute('d', '');
    },
    [clearHintTimer, preset.chargeSpeedBoost, preset.chargeSpread]
  );

  const beginRun = useCallback(() => {
    const livesStart = DIFFICULTY_PRESETS[difficulty].lives;
    if (gameOverRef.current && mode === 'challenge') replayCountRef.current += 1;
    gameOverRef.current = false;
    /* Place ball at center-bottom for each new run */
    const homeX = window.innerWidth / 2;
    const homeY = window.innerHeight - 120;
    ballHomeRef.current = { x: homeX, y: homeY };
    ballPosRef.current = { x: homeX, y: homeY };
    setShowSetup(false);
    setGameOver(null);
    setRallies(0);
    setScore(0);
    setCombo(0);
    if (comboFillRef.current) comboFillRef.current.style.transform = 'scaleX(0)';
    setLastGain(0);
    if (bounceCountTextRef.current) bounceCountTextRef.current.textContent = '0';
    setMissNotice(null);
    setLivesFlash(false);
    setShowDifficultyImpact(false);
    setLives(livesStart);
    scoreRef.current = 0;
    comboRef.current = 0;
    livesRef.current = livesStart;
    maxComboRef.current = 0;
    comboDecayEndsAtRef.current = 0;
    comboDecayDisplayRef.current = 0;
    bounceCountRef.current = 0;
    catchAttemptTimeRef.current = 0;
    resetBallToPlayer();
  }, [difficulty, mode, resetBallToPlayer]);

  const openModeSetup = useCallback(() => {
    setShowSetup(true);
    setGameOver(null);
    gameOverRef.current = false;
    setShowDifficultyImpact(false);
    replayCountRef.current = 0;
    setRallies(0);
    setScore(0);
    setCombo(0);
    if (comboFillRef.current) comboFillRef.current.style.transform = 'scaleX(0)';
    setLastGain(0);
    if (bounceCountTextRef.current) bounceCountTextRef.current.textContent = '0';
    setMissNotice(null);
    setLivesFlash(false);
    setLives(DIFFICULTY_PRESETS[difficulty].lives);
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    comboDecayEndsAtRef.current = 0;
    comboDecayDisplayRef.current = 0;
    bounceCountRef.current = 0;
    livesRef.current = DIFFICULTY_PRESETS[difficulty].lives;
    catchAttemptTimeRef.current = 0;
    resetBallToPlayer(false);
  }, [difficulty, resetBallToPlayer]);

  /* ── Keyboard: Escape only ── */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onGameEnd();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onGameEnd]);

  /* ── Pointer tracking: mouse + touch ── */
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) cursorRef.current = { x: t.clientX, y: t.clientY };
    };
    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
    };
  }, []);

  /* ── SVG viewBox sync + viewport cache on resize ── */
  useEffect(() => {
    const sync = () => {
      const w = window.innerWidth, h = window.innerHeight;
      vpWRef.current = w;
      vpHRef.current = h;
      if (aimSvgRef.current)
        aimSvgRef.current.setAttribute('viewBox', `0 0 ${w} ${h}`);
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  /* ── Body dataset + cleanup ── */
  useEffect(() => {
    const prev = document.body.dataset.catching;
    document.body.dataset.catching = 'true';
    return () => {
      clearHintTimer();
      if (missNoticeTimerRef.current) clearTimeout(missNoticeTimerRef.current);
      if (livesFlashTimerRef.current) clearTimeout(livesFlashTimerRef.current);
      if (prev === undefined) delete document.body.dataset.catching;
      else document.body.dataset.catching = prev;
    };
  }, [clearHintTimer]);

  /* ── Aim trajectory preview ── */
  const buildAim = (fromX: number, fromY: number, vx: number, vy: number) => {
    const vw = vpWRef.current, vh = vpHRef.current;
    let sx = fromX, sy = fromY, svx = vx, svy = vy;
    let d = `M${sx.toFixed(1)},${sy.toFixed(1)}`;
    for (let i = 0; i < aimSteps; i++) {
      svy += CATCH_BALL_GRAVITY * AIM_DT;
      svx *= AIR_FRICTION;
      svy *= AIR_FRICTION;
      sx += svx * AIM_DT;
      sy += svy * AIM_DT;
      if (sx < BALL_R) { sx = BALL_R; svx = Math.abs(svx) * BOUNCE_RESTITUTION; }
      else if (sx > vw - BALL_R) { sx = vw - BALL_R; svx = -Math.abs(svx) * BOUNCE_RESTITUTION; }
      if (sy < BALL_TOP_MIN) { sy = BALL_TOP_MIN; svy = Math.abs(svy) * BOUNCE_RESTITUTION; }
      else if (sy > vh - BALL_R - 4) { sy = vh - BALL_R - 4; svy = -Math.abs(svy) * BOUNCE_RESTITUTION; }
      d += ` L${sx.toFixed(1)},${sy.toFixed(1)}`;
    }
    return d;
  };

  /* ── Reactive effects ── */
  useEffect(() => {
    if (showSetup || gameOverRef.current) return;
    if (holderRef.current === 'player') startHoldTimer();
    return () => clearHintTimer();
  }, [clearHintTimer, showSetup, startHoldTimer]);

  useEffect(() => {
    if (showSetup || mode !== 'challenge' || gameOverRef.current) return;
    if (score >= currentObjective) endChallenge(true, 'objective');
  }, [currentObjective, endChallenge, mode, score, showSetup]);

  /* ── Unified pointer handlers (mouse + touch) ── */
  const handlePointerDown = useCallback(
    (e: any) => {
      const pos = getPointerPos(e);
      if (!pos) return;
      if (showSetup || gameOverRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      cursorRef.current = pos;

      if (holderRef.current === 'player') {
        /* Start charging throw */
        isChargingRef.current = true;
        chargeStartedAtRef.current = performance.now();
        chargePctRef.current = 0;
        if (chargeBarFillRef.current) chargeBarFillRef.current.style.transform = `scaleX(${CHARGE_MIN})`;
        if (chargeBarTextRef.current) chargeBarTextRef.current.textContent = '0%';
        setIsCharging(true);
        setShowHint(false);
        clearHintTimer();
      } else if (holderRef.current !== 'bot-held') {
        /* Mark catch attempt — physics loop validates proximity within grace window */
        catchAttemptTimeRef.current = performance.now();
      }
    },
    [clearHintTimer, showSetup]
  );

  const handlePointerUp = useCallback(
    (e?: any) => {
      if (e) {
        if (e.button !== undefined && e.button !== 0) return;
        /* Snap cursor to final touch position for accurate direction */
        if (e.changedTouches) {
          const t = e.changedTouches[0];
          if (t) cursorRef.current = { x: t.clientX, y: t.clientY };
        }
        e.stopPropagation();
        e.preventDefault();
      }
      if (!isChargingRef.current) return;
      if (holderRef.current !== 'player') return;
      const elapsed = performance.now() - chargeStartedAtRef.current;
      const pct = Math.max(CHARGE_MIN, Math.min(1, elapsed / preset.chargeMs));
      launchBall(pct);
    },
    [launchBall, preset.chargeMs]
  );

  /* ══ Physics simulation loop ══ */
  useEffect(() => {
    const tick = (now: number) => {
      /* ── Setup / game-over: freeze ball at home ── */
      if (showSetup || gameOverRef.current) {
        const home = ballHomeRef.current;
        ballPosRef.current.x = home.x;
        ballPosRef.current.y = home.y;
        /* Mutate in-place — avoids allocating a new object every frame */
        if (ballInfoRef?.current) {
          ballInfoRef.current.x = home.x; ballInfoRef.current.y = home.y;
          ballInfoRef.current.vx = 0;     ballInfoRef.current.vy = 0;
          ballInfoRef.current.holder = 'player';
        } else if (ballInfoRef) {
          ballInfoRef.current = { x: home.x, y: home.y, vx: 0, vy: 0, holder: 'player' };
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      /* dt: 1.0 at 60 fps, capped to 3 to survive tab-switch spikes */
      const dt = prevTimeRef.current === null
        ? 1
        : Math.min((now - prevTimeRef.current) / (1000 / 60), 3);
      prevTimeRef.current = now;

      /* Single Date.now() call per frame — reused for all wall-clock comparisons */
      const frameNow = Date.now();

      /* Viewport from cache — avoids layout-flush from window.innerWidth/Height */
      const vw = vpWRef.current, vh = vpHRef.current;
      const bp = ballPosRef.current, bv = ballVelRef.current;
      const holder = holderRef.current;

      /* ── Combo decay (challenge, player holding) ── */
      if (mode === 'challenge' && comboRef.current > 0 && comboDecayEndsAtRef.current > 0 && holder === 'player') {
        const remaining = comboDecayEndsAtRef.current - frameNow;
        if (remaining <= 0) {
          comboDecayEndsAtRef.current = 0;
          comboDecayDisplayRef.current = 0;
          setCombo(0);
          if (comboFillRef.current) comboFillRef.current.style.transform = 'scaleX(0)';
        } else {
          const nextPct = remaining / preset.comboDecayMs;
          if (Math.abs(nextPct - comboDecayDisplayRef.current) > 0.03) {
            comboDecayDisplayRef.current = nextPct;
            if (comboFillRef.current) comboFillRef.current.style.transform = `scaleX(${nextPct})`;
          }
        }
      }

      if (catchCooldownRef.current > 0)
        catchCooldownRef.current = Math.max(0, catchCooldownRef.current - dt);

      /* Mutate ballInfoRef in-place — no per-frame object allocation */
      if (ballInfoRef?.current) {
        ballInfoRef.current.x = bp.x; ballInfoRef.current.y = bp.y;
        ballInfoRef.current.vx = bv.x; ballInfoRef.current.vy = bv.y;
        ballInfoRef.current.holder = holder;
      } else if (ballInfoRef) {
        ballInfoRef.current = { x: bp.x, y: bp.y, vx: bv.x, vy: bv.y, holder };
      }

      /* ══ Player holds ball — stationary at home, aim toward cursor ══ */
      if (holder === 'player') {
        const home = ballHomeRef.current;
        bp.x = home.x;
        bp.y = home.y;

        /* Charge progression — use rAF `now` (same timeline as performance.now(), already available) */
        if (isChargingRef.current) {
          const nextPct = Math.max(CHARGE_MIN, Math.min(1, (now - chargeStartedAtRef.current) / preset.chargeMs));
          chargePctRef.current = nextPct;
          if (Math.abs(nextPct - prevRenderedChargePctRef.current) > 0.015) {
            prevRenderedChargePctRef.current = nextPct;
            if (chargeBarFillRef.current) chargeBarFillRef.current.style.transform = `scaleX(${nextPct})`;
            if (chargeBarTextRef.current) chargeBarTextRef.current.textContent = `${Math.round(nextPct * 100)}%`;
          }
        }

        /* Aim direction: ball → cursor */
        const cx = cursorRef.current.x, cy = cursorRef.current.y;
        const aimAngle = Math.atan2(cy - home.y, cx - home.x);
        const chargeFactor = chargePctRef.current;

        /* Rebuild aim path only when angle or charge changed meaningfully */
        if (
          Math.abs(aimAngle - prevAimAngleRef.current) > AIM_ANGLE_DIRTY ||
          Math.abs(chargeFactor - prevAimChargeRef.current) > AIM_CHARGE_DIRTY
        ) {
          prevAimAngleRef.current = aimAngle;
          prevAimChargeRef.current = chargeFactor;
          const spd = CATCH_BALL_SPEED * (0.65 + chargeFactor * preset.chargeSpeedBoost);
          if (aimPathRef.current)
            aimPathRef.current.setAttribute(
              'd',
              buildAim(home.x, home.y, Math.cos(aimAngle) * spd, Math.sin(aimAngle) * spd)
            );
        }

        if (ballElRef.current)
          ballElRef.current.style.transform = `translate(${bp.x - BALL_R}px,${bp.y - BALL_R}px)`;

        if (catchZoneElRef.current) catchZoneElRef.current.style.opacity = '0';
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      /* ══ Bot holds ball ══ */
      if (holder === 'bot-held') {
        const bot = botPosRef.current;
        bp.x = bot.x;
        bp.y = bot.y;
        botHoldCounterRef.current -= dt;

        if (botHoldCounterRef.current <= 0) {
          const cx = cursorRef.current.x, cy = cursorRef.current.y;
          const dx = cx - bot.x;
          const dist = Math.sqrt(dx * dx + (cy - bot.y) * (cy - bot.y)) || 1;
          const upBias = Math.min(90, dist * 0.18);
          const cy_target = cy - upBias;
          const dy = cy_target - bot.y;
          const roll = Math.random();
          let tvx = 0, tvy = 0;
          let style: 'direct' | 'arc' | 'lob' | 'fast' | 'curve' | 'fake' = 'arc';
          if (roll < preset.lobChance) style = 'lob';
          else if (roll < preset.lobChance + preset.curveChance) style = 'curve';
          else if (roll < preset.lobChance + preset.curveChance + preset.fakeChance) style = 'fake';
          else if (roll < preset.lobChance + preset.curveChance + preset.fakeChance + preset.fastChance) style = 'fast';
          else if (Math.random() < 0.45) style = 'direct';

          if (style === 'direct') {
            const dxB = cx - bot.x, dyB = cy_target - bot.y;
            const distB = Math.sqrt(dxB * dxB + dyB * dyB) || 1;
            const spd = CATCH_BALL_SPEED * 0.85 * preset.returnSpeedScale;
            tvx = (dxB / distB) * spd;
            tvy = (dyB / distB) * spd;
          } else if (style === 'lob') {
            const T = Math.max(55, Math.min(95, dist / 5));
            tvx = dx / T;
            tvy = dy / T - 0.5 * CATCH_BALL_GRAVITY * T;
          } else if (style === 'fast') {
            const T = Math.max(15, Math.min(24, dist / 18));
            tvx = dx / T;
            tvy = dy / T - 0.5 * CATCH_BALL_GRAVITY * T;
          } else if (style === 'fake') {
            const fakeTargetX = cx + (Math.random() - 0.5) * 130;
            const T = Math.max(24, Math.min(42, dist / 10));
            tvx = (fakeTargetX - bot.x) / T;
            tvy = (cy_target - 20 - bot.y) / T - 0.5 * CATCH_BALL_GRAVITY * T;
          } else {
            const T = Math.max(30, Math.min(65, dist / 8));
            tvx = dx / T;
            tvy = dy / T - 0.5 * CATCH_BALL_GRAVITY * T;
          }

          const arcSpd = Math.sqrt(tvx * tvx + tvy * tvy);
          const spread =
            (Math.random() - 0.5) * 2 * CATCH_BOT_THROW_SPREAD * preset.returnSpreadScale *
            (style === 'fake' ? 1.45 : 1);
          const throwAngle = Math.atan2(tvy, tvx) + spread;
          const returnSpeedBoost = style === 'fast' ? 1.18 : 1;
          bv.x = Math.cos(throwAngle) * arcSpd * preset.returnSpeedScale * returnSpeedBoost;
          bv.y = Math.sin(throwAngle) * arcSpd * preset.returnSpeedScale * returnSpeedBoost;
          bp.x = bot.x + Math.cos(throwAngle) * (BOT_CATCH + 6);
          bp.y = bot.y + Math.sin(throwAngle) * (BOT_CATCH + 6);
          returnCurveRef.current =
            style === 'curve' || style === 'fake'
              ? (Math.random() > 0.5 ? 1 : -1) * preset.curveForce
              : 0;
          botThrowAtRef.current = frameNow;
          throwAgeRef.current = 0;
          catchCooldownRef.current = 18;
          holderRef.current = 'returning';
        }

        if (ballElRef.current)
          ballElRef.current.style.transform = `translate(${bp.x - BALL_R}px,${bp.y - BALL_R}px)`;
        if (catchZoneElRef.current) catchZoneElRef.current.style.opacity = '0';
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      /* ══ Ball in flight / returning ══ */
      throwAgeRef.current += dt;

      if (holder === 'returning' && Math.abs(returnCurveRef.current) > 1e-5) {
        bv.x += returnCurveRef.current * dt;
        /* Linear approximation of 0.985**dt — negligible error for dt near 1 */
        returnCurveRef.current *= 1 - 0.015 * dt;
      }

      const prevX = bp.x, prevY = bp.y;
      bv.y += CATCH_BALL_GRAVITY * dt;
      /* Linear approximation of AIR_FRICTION**dt — error < 0.0001 for dt ∈ [0,3] */
      const frictionDt = 1 - (1 - AIR_FRICTION) * dt;
      bv.x *= frictionDt;
      bv.y *= frictionDt;
      bp.x += bv.x * dt;
      bp.y += bv.y * dt;

      /* Wall bounces */
      let bouncedThisFrame = false;
      if (bp.x < BALL_R) {
        bp.x = BALL_R; bv.x = Math.abs(bv.x) * BOUNCE_RESTITUTION; bouncedThisFrame = true;
      } else if (bp.x > vw - BALL_R) {
        bp.x = vw - BALL_R; bv.x = -Math.abs(bv.x) * BOUNCE_RESTITUTION; bouncedThisFrame = true;
      }
      if (bp.y < BALL_TOP_MIN) {
        bp.y = BALL_TOP_MIN; bv.y = Math.abs(bv.y) * BOUNCE_RESTITUTION; bouncedThisFrame = true;
      } else if (bp.y > vh - BALL_R - 4) {
        bp.y = vh - BALL_R - 4; bv.y = -Math.abs(bv.y) * BOUNCE_RESTITUTION; bouncedThisFrame = true;
      }

      /* ── Bot catch (CCD) ── */
      if (holder === 'flying') {
        const bot = botPosRef.current;
        const hit = closestPointOnSegment(prevX, prevY, bp.x, bp.y, bot.x, bot.y);
        const hx = hit.x - bot.x, hy = hit.y - bot.y;
        if (hx * hx + hy * hy < BOT_CATCH_SQ) {
          onBotCatch();
          bp.x = bot.x; bp.y = bot.y;
          bv.x = 0; bv.y = 0;
          holderRef.current = 'bot-held';
          botHoldCounterRef.current = preset.botHoldMin + Math.floor(Math.random() * preset.botHoldRange);
          setRallies((r) => r + 1);
          registerSuccessfulReturn();
          bounceCountRef.current = 0;
          if (bounceCountTextRef.current) bounceCountTextRef.current.textContent = '0';
          triggerRipple(bot.x, bot.y);
        }
      }

      /* ── Player catch ── */
      if (holderRef.current !== 'player' && holderRef.current !== 'bot-held' && catchCooldownRef.current <= 0) {
        const cx = cursorRef.current.x, cy = cursorRef.current.y;
        const dx = bp.x - cx, dy = bp.y - cy;
        const inRange = dx * dx + dy * dy < preset.playerCatchRadius * preset.playerCatchRadius;

        if (mode === 'challenge') {
          /* Active catch: requires click/tap within grace window — use rAF `now` */
          if (
            inRange &&
            catchAttemptTimeRef.current > 0 &&
            now - catchAttemptTimeRef.current < CATCH_GRACE_MS
          ) {
            catchAttemptTimeRef.current = 0;
            if (holderRef.current === 'returning' && frameNow - botThrowAtRef.current <= 260) {
              setScore((prev) => prev + 35);
              setLastGain(35);
            }
            triggerRipple(cx, cy);
            resetBallToPlayer();
          }
        } else {
          /* Free mode: passive proximity catch */
          if (inRange) {
            triggerRipple(cx, cy);
            resetBallToPlayer();
          }
        }
      }

      /* ── Bounce / miss tracking ── */
      if (bouncedThisFrame && holderRef.current !== 'player' && holderRef.current !== 'bot-held') {
        const nextBounces = bounceCountRef.current + 1;
        bounceCountRef.current = nextBounces;
        if (bounceCountTextRef.current) bounceCountTextRef.current.textContent = String(Math.min(2, nextBounces));
        if (mode === 'challenge' && nextBounces >= 2) registerMiss('doubleBounce');
      }

      /* ── Safety net: auto-reset when ball stops (squared comparison avoids sqrt) ── */
      if (
        (holderRef.current === 'flying' || holderRef.current === 'returning') &&
        bv.x * bv.x + bv.y * bv.y < STOP_THRESH_SQ
      ) {
        resetBallToPlayer();
      }

      /* ── Ball DOM position ── */
      if (ballElRef.current)
        ballElRef.current.style.transform = `translate(${bp.x - BALL_R}px,${bp.y - BALL_R}px)`;

      /* ── Catch zone: position + ready state (only mutate classList when state changes) ── */
      if (catchZoneElRef.current && holderRef.current !== 'player' && holderRef.current !== 'bot-held') {
        const cx = cursorRef.current.x, cy = cursorRef.current.y;
        const r = preset.playerCatchRadius;
        const showZone = catchCooldownRef.current <= 0;
        catchZoneElRef.current.style.opacity = showZone ? '1' : '0';
        catchZoneElRef.current.style.transform = `translate(${cx - r}px,${cy - r}px)`;
        if (showZone) {
          const dx = bp.x - cx, dy = bp.y - cy;
          const ready = dx * dx + dy * dy < r * r;
          if (ready !== catchZoneReadyRef.current) {
            catchZoneReadyRef.current = ready;
            catchZoneElRef.current.classList.toggle('catch-zone--ready', ready);
          }
        }
      } else if (catchZoneElRef.current) {
        catchZoneElRef.current.style.opacity = '0';
        if (catchZoneReadyRef.current) {
          catchZoneReadyRef.current = false;
          catchZoneElRef.current.classList.remove('catch-zone--ready');
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      prevTimeRef.current = null;
      clearHintTimer();
    };
  }, [
    ballInfoRef,
    botPosRef,
    clearHintTimer,
    mode,
    onBotCatch,
    preset,
    registerMiss,
    registerSuccessfulReturn,
    resetBallToPlayer,
    showSetup,
    triggerRipple,
  ]);

  /* ══ Render ══ */
  return createPortal(
    <div
      ref={overlayElRef}
      className="catch-game-overlay"
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
      onContextMenu={(e: any) => e.preventDefault()}
    >
      {/* Ripple — always mounted, animation restarted via catch-ripple--active class toggle */}
      <div ref={rippleElRef} className="catch-ripple" aria-hidden="true" />

      {/* ── Setup panel ── */}
      {showSetup && (
        <div className="catch-game-panel" role="dialog" aria-label={t('common.catchGameUI.menu.title')}>
          <div className="catch-game-panel-title">{t('common.catchGameUI.menu.title')}</div>
          <div className="catch-game-panel-subtitle">{t('common.catchGameUI.menu.subtitle')}</div>
          <div className="catch-game-instructions">
            <div className="catch-game-instructions-title">{t('common.catchGameUI.title')}</div>
            <div className="catch-game-intro-steps">
              <div className="catch-game-intro-step">
                <span className="catch-game-intro-step-index">1</span>
                <span>{t('common.catchGameUI.instructions.aimStep')}</span>
              </div>
              <div className="catch-game-intro-step">
                <span className="catch-game-intro-step-index">2</span>
                <span>{t('common.catchGameUI.instructions.chargeStep')}</span>
              </div>
              <div className="catch-game-intro-step">
                <span className="catch-game-intro-step-index">3</span>
                <span>{t('common.catchGameUI.instructions.returnStep')}</span>
              </div>
            </div>
          </div>

          <div className="catch-game-panel-label">{t('common.catchGameUI.menu.modeLabel')}</div>
          <div className="catch-game-segment" role="radiogroup">
            <button
              className={`catch-game-segment-btn${mode === 'free' ? ' is-active' : ''}`}
              onClick={(e: any) => { e.stopPropagation(); setMode('free'); }}
              aria-pressed={mode === 'free'}
            >
              {t('common.catchGameUI.menu.modes.free')}
            </button>
            <button
              className={`catch-game-segment-btn${mode === 'challenge' ? ' is-active' : ''}`}
              onClick={(e: any) => { e.stopPropagation(); setMode('challenge'); }}
              aria-pressed={mode === 'challenge'}
            >
              {t('common.catchGameUI.menu.modes.challenge')}
            </button>
          </div>
          {mode === 'challenge' && (
            <div className="catch-game-panel-info catch-game-panel-info--subtitle">
              {t('common.catchGameUI.menu.subtitle')}
            </div>
          )}

          <div className="catch-game-panel-label">{t('common.catchGameUI.menu.difficultyLabel')}</div>
          <div className="catch-game-segment" role="radiogroup">
            {(['casual', 'normal', 'hard'] as CatchDifficulty[]).map((d) => (
              <button
                key={d}
                className={`catch-game-segment-btn${difficulty === d ? ' is-active' : ''}`}
                onClick={(e: any) => { e.stopPropagation(); setDifficulty(d); }}
                aria-pressed={difficulty === d}
              >
                {t(`common.catchGameUI.menu.difficulties.${d}`)}
              </button>
            ))}
          </div>

          <button
            className="catch-game-disclosure"
            type="button"
            aria-expanded={showDifficultyImpact}
            onClick={(e: any) => { e.stopPropagation(); setShowDifficultyImpact((p) => !p); }}
          >
            <span>{t('common.catchGameUI.menu.difficultyImpact')}</span>
            <span className={`catch-game-disclosure-icon${showDifficultyImpact ? ' is-open' : ''}`}>v</span>
          </button>
          {showDifficultyImpact && (
            <div className="catch-game-difficulty-readout">
              {difficultyReadout.map((item) => (
                <div className="catch-game-difficulty-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          )}

          <button
            className="catch-game-start-btn"
            onClick={(e: any) => { e.stopPropagation(); beginRun(); }}
          >
            {mode === 'challenge'
              ? t('common.catchGameUI.menu.startChallenge')
              : t('common.catchGameUI.menu.startFree')}
          </button>
        </div>
      )}

      {/* ── HUD ── */}
      {!showSetup && (
        <div className="catch-game-score">
          <div className="catch-game-score-header">
            <div className="catch-game-score-label">
              {mode === 'challenge'
                ? t('common.catchGameUI.score.challengeLabel')
                : t('common.catchGameUI.score.label')}
            </div>
            <div ref={scoreValueElRef} className="catch-game-score-value">{mode === 'challenge' ? score : rallies}</div>
          </div>
          <div className="catch-game-score-best">
            {mode === 'challenge'
              ? t('common.catchGameUI.score.bestChallenge', { score: bestByDifficulty[difficulty] ?? 0 })
              : t('common.catchGameUI.score.best', { score: bestRallies })}
          </div>
          {mode === 'challenge' && (
            <div className="catch-game-challenge-block">
              <div className="catch-game-challenge-row">
                <span>{t('common.catchGameUI.challenge.difficulty')}</span>
                <span className="catch-game-difficulty-badge">
                  {t(`common.catchGameUI.menu.difficulties.${difficulty}`)}
                </span>
              </div>
              <div className={`catch-game-challenge-row${livesFlash ? ' catch-game-challenge-row--danger' : ''}`}>
                <span>{t('common.catchGameUI.challenge.lives')}</span>
                <span>{'●'.repeat(lives).padEnd(preset.lives, '○')}</span>
              </div>
              <div className="catch-game-challenge-row">
                <span>{t('common.catchGameUI.challenge.bounces')}</span>
                <span><span ref={bounceCountTextRef}>0</span>/2</span>
              </div>
              <div className="catch-game-challenge-row">
                <span>{t('common.catchGameUI.challenge.combo')}</span>
                <span>x{combo}</span>
              </div>
              <div className="catch-game-combo-track">
                <div
                  ref={comboFillRef}
                  className="catch-game-combo-fill"
                  style={{ transform: 'scaleX(0)' }}
                />
              </div>
              <div className="catch-game-objective-track">
                <div
                  className="catch-game-objective-fill"
                  style={{ transform: `scaleX(${Math.max(0, Math.min(1, score / preset.objectiveScore))})` }}
                />
              </div>
              <div className="catch-game-score-best">
                {t('common.catchGameUI.challenge.goalShort', { score, target: preset.objectiveScore })}
              </div>
            </div>
          )}
          {lastGain !== 0 && !gameOver && (
            <div className={`catch-game-gain${lastGain > 0 ? ' catch-game-gain--plus' : ''}`}>
              {lastGain > 0 ? '+' : ''}{lastGain}
            </div>
          )}
          {stats && (
            <div className="catch-game-stats">
              <div className="catch-game-stat">
                <svg className="catch-game-stat-icon" viewBox="0 0 16 16" width="11" height="11"
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  aria-label={t('common.catchGameUI.stats.hunger')}>
                  <line x1="5" y1="2" x2="5" y2="6" />
                  <path d="M3 2 L3 5 Q3 7 5 7 Q7 7 7 5 L7 2" />
                  <line x1="5" y1="7" x2="5" y2="14" />
                  <line x1="11" y1="2" x2="11" y2="14" />
                  <path d="M9 2 Q11 3 11 6" />
                </svg>
                <div className="catch-game-stat-track">
                  <div
                    className={`catch-game-stat-fill${stats.hunger < 30 ? ' catch-game-stat-fill--critical' : ''}`}
                    style={{ transform: `scaleX(${stats.hunger / 100})` }}
                  />
                </div>
                <span className="catch-game-stat-value">{stats.hunger}%</span>
              </div>
              <div className="catch-game-stat">
                <svg className="catch-game-stat-icon" viewBox="0 0 16 16" width="11" height="11"
                  fill="currentColor" stroke="none"
                  aria-label={t('common.catchGameUI.stats.happiness')}>
                  <path d="M8 2 L9.5 6.2 L14 6.2 L10.5 8.8 L11.8 13 L8 10.5 L4.2 13 L5.5 8.8 L2 6.2 L6.5 6.2 Z" />
                </svg>
                <div className="catch-game-stat-track">
                  <div
                    className={`catch-game-stat-fill${stats.happiness < 30 ? ' catch-game-stat-fill--critical' : ''}`}
                    style={{ transform: `scaleX(${stats.happiness / 100})` }}
                  />
                </div>
                <span className="catch-game-stat-value">{stats.happiness}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Aim trajectory SVG ── */}
      <svg ref={aimSvgRef} className="catch-aim-line" preserveAspectRatio="none">
        <path
          ref={aimPathRef}
          d=""
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>

      {/* ── Catch zone (challenge mode only) — positioned by RAF ── */}
      {!showSetup && !gameOver && mode === 'challenge' && (
        <div
          ref={catchZoneElRef}
          className="catch-zone"
          style={{ width: preset.playerCatchRadius * 2, height: preset.playerCatchRadius * 2 }}
          aria-hidden="true"
        />
      )}

      {showHint && isHeld && !showSetup && (
        <div className="catch-game-hint">{t('common.catchGameUI.hint')}</div>
      )}
      {missNotice && !showSetup && !gameOver && (
        <div className="catch-game-miss">{t(`common.catchGameUI.missReasons.${missNotice}`)}</div>
      )}
      {!showSetup && isHeld && !gameOver && (
        <div className="catch-game-charge" aria-hidden="true">
          <div className="catch-game-charge-label">{t('common.catchGameUI.charge.label')}</div>
          <div className="catch-game-charge-track">
            <div
              ref={chargeBarFillRef}
              className={`catch-game-charge-fill${isCharging ? ' catch-game-charge-fill--active' : ''}`}
              style={{ transform: `scaleX(${CHARGE_MIN})` }}
            />
          </div>
          <div ref={chargeBarTextRef} className="catch-game-charge-value">0%</div>
        </div>
      )}

      {/* ── Game-over panel ── */}
      {gameOver && (
        <div className="catch-game-result" role="dialog" aria-label={t('common.catchGameUI.result.title')}>
          <div className="catch-game-result-title">
            {gameOver.success ? t('common.catchGameUI.result.victory') : t('common.catchGameUI.result.defeat')}
          </div>
          <div className="catch-game-result-line">
            {t('common.catchGameUI.result.score', { score: gameOver.score })}
          </div>
          <div className="catch-game-result-line">
            {t('common.catchGameUI.result.rallies', { rallies: gameOver.rallies })}
          </div>
          <div className="catch-game-result-line">
            {t('common.catchGameUI.result.combo', { combo: gameOver.maxCombo })}
          </div>
          {!gameOver.success && gameOver.reason !== 'objective' && (
            <div className="catch-game-result-line catch-game-result-line--danger">
              {t(`common.catchGameUI.missReasons.${gameOver.reason}`)}
            </div>
          )}
          <div className="catch-game-result-actions">
            <button
              className="catch-game-result-btn"
              onClick={(e: any) => { e.stopPropagation(); beginRun(); }}
            >
              {t('common.catchGameUI.result.retry')}
            </button>
            <button
              className="catch-game-result-btn catch-game-result-btn--ghost"
              onClick={(e: any) => { e.stopPropagation(); openModeSetup(); }}
            >
              {t('common.catchGameUI.result.changeMode')}
            </button>
          </div>
        </div>
      )}

      {/* ── Exit button ── */}
      <button
        className="catch-game-exit"
        onClick={(e: any) => { e.stopPropagation(); onGameEnd(); }}
        aria-label={t('common.catchGameUI.exitLabel')}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" fill="none" aria-hidden="true">
          <line x1="3" y1="3" x2="13" y2="13" />
          <line x1="13" y1="3" x2="3" y2="13" />
        </svg>
        <span className="catch-game-exit-label">ESC</span>
      </button>

      {/* ── Ball — position written via ref (GPU-composited transform) ── */}
      {!showSetup && (
        <div
          ref={ballElRef}
          className={`catch-ball${isHeld ? ' catch-ball--held' : ''}`}
          style={{ transform: `translate(${startX - BALL_R}px,${startY - BALL_R}px)` }}
        >
          <svg viewBox="0 0 22 22" width={CATCH_BALL_SIZE} height={CATCH_BALL_SIZE}>
            <defs>
              <radialGradient id="ballGrad" cx="0.35" cy="0.35" r="0.65">
                <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
              </radialGradient>
            </defs>
            <circle cx="11" cy="11" r="10" fill="currentColor" />
            <circle cx="11" cy="11" r="10" fill="url(#ballGrad)" />
            <path d="M4 11 Q11 6 18 11" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
            <path d="M4 11 Q11 16 18 11" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
          </svg>
        </div>
      )}
    </div>,
    document.body
  );
};

export default CatchGame;
