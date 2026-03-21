/* ══════════════════════════════════════════════
  Jeu d'Attrape — édition avancée
  Modes Free/Challenge, charge du lancer, score combo
  Bot adaptive throws + objectifs par difficulté
   ══════════════════════════════════════════════ */
import { useRef, useEffect, useState, useCallback, type MutableRefObject } from 'react';
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

import { byTier } from '@utils/performanceTier';
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
  botPosRef: MutableRefObject<{ x: number; y: number }>;
  onBotCatch: () => void;
  onGameEnd: () => void;
  ballInfoRef?: MutableRefObject<any>;
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
const BALL_TOP_MIN = BALL_R;
const VEL_HIST_MAX = 6;
const AIM_STEPS = byTier({ high: 22, mid: 16, low: 10 });
const AIM_DT = 2.5;
const AIM_DIRTY_THRESH = 0.3; // seuil de changement pour recalculer la visée
const HINT_DELAY_MS = 3000;
const VEL_SMOOTH = 0.55; // EMA plus réactif (vs 0.35 avant)
const AIR_FRICTION = 0.997; // friction air plus forte (vs 0.999) — réduit les rebonds interminables
const STOP_THRESH = 0.5; // seuil d'arrêt de balle (vs 0.25)
const CHARGE_MIN = 0.08;
const TRAJECTORY_STEP = 8;
const TRAJECTORY_LIMIT = 120;
const TRAJECTORY_VY_SCALE = 0.09;
const AIM_ORIGIN_DIRTY_THRESH = 2;

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
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
};

const closestPointOnSegment = (ax: any, ay: any, bx: any, by: any, px: any, py: any) => {
  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby;
  if (ab2 <= 1e-6) return { x: ax, y: ay, t: 0 };
  const apx = px - ax;
  const apy = py - ay;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  return { x: ax + abx * t, y: ay + aby * t, t };
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
  const velHistRef = useRef<any[]>([]);
  const smoothVelRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<any>(null);
  const prevTimeRef = useRef<any>(null);
  /* ── Bot-held phase ── */
  const botHoldCounterRef = useRef(0);
  const returnCurveRef = useRef(0);
  const throwAgeRef = useRef(0);
  const botThrowAtRef = useRef(0);
  const lastThrowChargeRef = useRef(0);
  const bounceCountRef = useRef(0);
  const missNoticeTimerRef = useRef<any>(null);
  const livesFlashTimerRef = useRef<any>(null);

  /* ── DOM refs ── */
  const ballElRef = useRef<any>(null);
  const aimSvgRef = useRef<any>(null);
  const aimPathRef = useRef<any>(null);
  /* ── Dirty flag for buildAim — skip expensive SVG rebuild when aim unchanged ── */
  const prevAimVelRef = useRef({ x: 0, y: 0 });
  const prevAimOriginRef = useRef({ x: -9999, y: -9999 });
  const prevAimTrajectoryRef = useRef(0);
  const trajectoryAdjustRef = useRef(0);

  /* ── Charge refs ── */
  const isChargingRef = useRef(false);
  const chargeStartedAtRef = useRef(0);
  const chargePctRef = useRef(0);
  /* ── Score/combo refs for RAF-safe mutations ── */
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const livesRef = useRef(0);
  const maxComboRef = useRef(0);
  const comboDecayEndsAtRef = useRef(0);
  const comboDecayDisplayRef = useRef(0);
  const gameOverRef = useRef(false);

  /* ── React state (render and UI only) ── */
  const [mode, setMode] = useState<CatchMode>('free');
  const [difficulty, setDifficulty] = useState<CatchDifficulty>(initialDifficulty);
  const [showSetup, setShowSetup] = useState(true);
  const [isHeld, setIsHeld] = useState(true);
  const [isCharging, setIsCharging] = useState(false);
  const [chargePct, setChargePct] = useState(0);
  const [rallies, setRallies] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(DIFFICULTY_PRESETS[initialDifficulty].lives);
  const [comboDecayPct, setComboDecayPct] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [lastGain, setLastGain] = useState(0);
  const [bounceCount, setBounceCount] = useState(0);
  const [missNotice, setMissNotice] = useState<MissReason | null>(null);
  const [livesFlash, setLivesFlash] = useState(false);
  const [showDifficultyImpact, setShowDifficultyImpact] = useState(false);
  const [gameOver, setGameOver] = useState<GameOverSummary | null>(null);
  // { x, y } while ripple is active, null otherwise
  const [catchRipple, setCatchRipple] = useState<any>(null);
  const hintTimerRef = useRef<any>(null);

  /* ── Persistence refs ── */
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
  const difficultyReadout = [
    {
      label: t('common.catchGameUI.menu.traits.catchWindow'),
      value: `${preset.playerCatchRadius}px`,
    },
    {
      label: t('common.catchGameUI.menu.traits.comboDecay'),
      value: `${(preset.comboDecayMs / 1000).toFixed(1)}s`,
    },
    {
      label: t('common.catchGameUI.menu.traits.chargeTime'),
      value: `${(preset.chargeMs / 1000).toFixed(2)}s`,
    },
    {
      label: t('common.catchGameUI.menu.traits.returnSpeed'),
      value: `x${preset.returnSpeedScale.toFixed(2)}`,
    },
    {
      label: t('common.catchGameUI.menu.traits.unpredictability'),
      value: `x${preset.returnSpreadScale.toFixed(2)}`,
    },
  ];

  /* ── Effect hooks ── */
  useEffect(() => {
    challengeBadgesRef.current = challengeBadges;
  }, [challengeBadges]);
  useEffect(() => {
    safeLocalSet(LS_LAST_DIFF, difficulty);
  }, [difficulty]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);
  /* ── Mise à jour du best score quand rallies change ── */
  useEffect(() => {
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

  /* ── Callbacks ── */
  const clearHintTimer = useCallback(() => {
    clearTimeout(hintTimerRef.current);
  }, []);
  const startHoldTimer = useCallback(() => {
    setShowHint(false);
    clearHintTimer();
    hintTimerRef.current = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
  }, [clearHintTimer]);
  const resetBallToPlayer = useCallback(
    (withHintTimer = true) => {
      holderRef.current = 'player';
      ballVelRef.current.x = 0;
      ballVelRef.current.y = 0;
      throwAgeRef.current = 0;
      returnCurveRef.current = 0;
      catchCooldownRef.current = 0;
      velHistRef.current = [];
      smoothVelRef.current = { x: 0, y: 0 };
      trajectoryAdjustRef.current = 0;
      prevAimTrajectoryRef.current = 0;
      prevAimVelRef.current = { x: 0, y: 0 };
      prevAimOriginRef.current = { x: -9999, y: -9999 };
      isChargingRef.current = false;
      chargePctRef.current = 0;
      bounceCountRef.current = 0;
      setBounceCount(0);
      setChargePct(0);
      setIsCharging(false);
      setIsHeld(true);
      if (aimPathRef.current) aimPathRef.current.setAttribute('d', '');
      if (withHintTimer) startHoldTimer();
    },
    [startHoldTimer]
  );

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
      // Combo achievement unlocks whenever combo reached 20, success or failure
      if (maxComboRef.current >= 20) {
        unlockChallengeBadge('combo20');
      }
      setGameOver({
        success,
        reason,
        score: scoreRef.current,
        rallies,
        maxCombo: maxComboRef.current,
      });
      setShowHint(false);
      setLastGain(0);
      resetBallToPlayer(false);
    },
    [difficulty, mode, rallies, resetBallToPlayer, unlockChallengeBadge]
  );

  const registerMiss = useCallback(
    (reason: MissReason) => {
      if (mode !== 'challenge') {
        setCombo(0);
        comboDecayEndsAtRef.current = 0;
        setComboDecayPct(0);
        resetBallToPlayer();
        return;
      }
      clearTimeout(missNoticeTimerRef.current);
      setMissNotice(reason);
      missNoticeTimerRef.current = setTimeout(() => setMissNotice(null), 1000);
      comboDecayEndsAtRef.current = 0;
      comboDecayDisplayRef.current = 0;
      setCombo(0);
      setComboDecayPct(0);
      setLastGain(-preset.missPenalty);
      setScore((prev) => Math.max(0, prev - preset.missPenalty));
      bounceCountRef.current = 0;
      setBounceCount(0);
      clearTimeout(livesFlashTimerRef.current);
      setLivesFlash(true);
      livesFlashTimerRef.current = setTimeout(() => setLivesFlash(false), 550);
      setLives((prev) => {
        const next = Math.max(0, prev - 1);
        if (next <= 0) {
          endChallenge(false, reason);
        } else {
          resetBallToPlayer();
        }
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
    setComboDecayPct(1);
  }, [mode, preset.pointsPerCatch, preset.comboDecayMs]);

  const launchBall = useCallback(
    (rawCharge: number) => {
      if (holderRef.current !== 'player') return;
      const clampedCharge = Math.max(CHARGE_MIN, Math.min(1, rawCharge));
      const sv = smoothVelRef.current;
      const svSpd = Math.sqrt(sv.x * sv.x + sv.y * sv.y);
      const dirx = svSpd > 0.1 ? sv.x / svSpd : 1;
      const diry = svSpd > 0.1 ? sv.y / svSpd : 0;
      const speedBoost = 0.65 + clampedCharge * preset.chargeSpeedBoost;
      const speed = CATCH_BALL_SPEED * speedBoost;
      const highChargeT = clampedCharge <= 0.6 ? 0 : (clampedCharge - 0.6) / 0.4;
      const spreadReduction = 1 - highChargeT * 0.45;
      const spread = preset.chargeSpread * clampedCharge * clampedCharge * spreadReduction;
      const trajectoryBias =
        trajectoryAdjustRef.current *
        TRAJECTORY_VY_SCALE *
        (0.55 + Math.min(1, Math.max(0, clampedCharge)) * 0.45);
      const adjustedDirY = diry - trajectoryBias / Math.max(speed, 1);
      const angle = Math.atan2(adjustedDirY, dirx) + (Math.random() - 0.5) * 2 * spread;
      ballVelRef.current = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
      holderRef.current = 'flying';
      throwAgeRef.current = 0;
      catchCooldownRef.current = 22;
      lastThrowChargeRef.current = clampedCharge;
      isChargingRef.current = false;
      chargePctRef.current = 0;
      velHistRef.current = [];
      smoothVelRef.current = { x: 0, y: 0 };
      setChargePct(0);
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
    gameOverRef.current = false;
    setShowSetup(false);
    setGameOver(null);
    setCombo(0);
    setComboDecayPct(0);
    setLastGain(0);
    setBounceCount(0);
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
    resetBallToPlayer();
  }, [difficulty, resetBallToPlayer]);

  const openModeSetup = useCallback(() => {
    setShowSetup(true);
    setGameOver(null);
    gameOverRef.current = false;
    setShowDifficultyImpact(false);
    setRallies(0);
    setScore(0);
    setCombo(0);
    setComboDecayPct(0);
    setLastGain(0);
    setBounceCount(0);
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
    resetBallToPlayer(false);
  }, [difficulty, resetBallToPlayer]);

  /* ── Event listeners & RAF ── */
  useEffect(() => {
    const handle = (e: any) => {
      if (e.key === 'Escape') {
        onGameEnd();
        return;
      }
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      if (showSetup || gameOverRef.current) return;
      e.preventDefault();
      if (holderRef.current !== 'player') return;
      const delta = e.key === 'ArrowUp' ? TRAJECTORY_STEP : -TRAJECTORY_STEP;
      const next = Math.max(
        -TRAJECTORY_LIMIT,
        Math.min(TRAJECTORY_LIMIT, trajectoryAdjustRef.current + delta)
      );
      trajectoryAdjustRef.current = next;
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onGameEnd, showSetup]);

  useEffect(() => {
    const onMove = (e: any) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
      velHistRef.current.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      if (velHistRef.current.length > VEL_HIST_MAX) velHistRef.current.shift();
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const syncViewBox = () => {
      if (aimSvgRef.current)
        aimSvgRef.current.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    };
    syncViewBox();
    window.addEventListener('resize', syncViewBox);
    return () => window.removeEventListener('resize', syncViewBox);
  }, []);

  useEffect(() => {
    const prev = document.body.dataset.catching;
    document.body.dataset.catching = 'true';
    return () => {
      clearHintTimer();
      clearTimeout(missNoticeTimerRef.current);
      clearTimeout(livesFlashTimerRef.current);
      if (prev === undefined) delete document.body.dataset.catching;
      else document.body.dataset.catching = prev;
    };
  }, [clearHintTimer]);

  /* ── Physics helpers ── */
  const getRawVel = () => {
    const h = velHistRef.current;
    if (h.length < 2) return { vx: 0, vy: 0, speed: 0 };
    const a = h[0],
      b = h[h.length - 1];
    const dt = Math.max(b.t - a.t, 8);
    const vx = ((b.x - a.x) / dt) * 16;
    const vy = ((b.y - a.y) / dt) * 16;
    return { vx, vy, speed: Math.sqrt(vx * vx + vy * vy) };
  };

  const getTrajectoryBias = (chargeFactor: number) => {
    const clamped = Math.min(1, Math.max(0, chargeFactor));
    return trajectoryAdjustRef.current * TRAJECTORY_VY_SCALE * (0.55 + clamped * 0.45);
  };

  const targetVel = () => {
    const { vx, vy, speed } = getRawVel();
    const speedMul = 0.65 + chargePctRef.current * preset.chargeSpeedBoost;
    const targetSpeed = CATCH_BALL_SPEED * speedMul;
    if (speed > 1.5) {
      return { vx: (vx / speed) * targetSpeed, vy: (vy / speed) * targetSpeed };
    }
    const sv = smoothVelRef.current;
    const svSpd = Math.sqrt(sv.x * sv.x + sv.y * sv.y);
    if (svSpd > 0.1) {
      return { vx: (sv.x / svSpd) * targetSpeed, vy: (sv.y / svSpd) * targetSpeed };
    }
    return { vx: targetSpeed, vy: 0 };
  };

  const buildAim = (fromX: any, fromY: any, vx: any, vy: any, chargeFactor: number) => {
    const vw = window.innerWidth,
      vh = window.innerHeight;
    let sx = fromX,
      sy = fromY,
      svx = vx,
      svy = vy - getTrajectoryBias(chargeFactor);
    let d = `M${sx.toFixed(1)},${sy.toFixed(1)}`;
    for (let i = 0; i < AIM_STEPS; i++) {
      svy += CATCH_BALL_GRAVITY * AIM_DT;
      svx *= AIR_FRICTION;
      svy *= AIR_FRICTION;
      sx += svx * AIM_DT;
      sy += svy * AIM_DT;
      if (sx < BALL_R) {
        sx = BALL_R;
        svx = Math.abs(svx) * BOUNCE_RESTITUTION;
      } else if (sx > vw - BALL_R) {
        sx = vw - BALL_R;
        svx = -Math.abs(svx) * BOUNCE_RESTITUTION;
      }
      if (sy < BALL_TOP_MIN) {
        sy = BALL_TOP_MIN;
        svy = Math.abs(svy) * BOUNCE_RESTITUTION;
      } else if (sy > vh - BALL_R - 4) {
        sy = vh - BALL_R - 4;
        svy = -Math.abs(svy) * BOUNCE_RESTITUTION;
      }
      d += ` L${sx.toFixed(1)},${sy.toFixed(1)}`;
    }
    return d;
  };

  /* ── Event-driven state updates ── */
  useEffect(() => {
    if (showSetup || gameOverRef.current) return;
    if (holderRef.current === 'player') startHoldTimer();
    return () => clearHintTimer();
  }, [clearHintTimer, showSetup, startHoldTimer]);
  useEffect(() => {
    if (showSetup || mode !== 'challenge' || gameOverRef.current) return;
    if (score >= preset.objectiveScore) {
      endChallenge(true, 'objective');
    }
  }, [endChallenge, mode, preset.objectiveScore, score, showSetup]);

  /* ── Input handlers ── */
  const handleOverlayMouseDown = useCallback(
    (e: any) => {
      if (e.button !== 0) return;
      if (showSetup || gameOverRef.current) return;
      if (holderRef.current !== 'player') return;
      e.stopPropagation();
      e.preventDefault();
      isChargingRef.current = true;
      chargeStartedAtRef.current = performance.now();
      chargePctRef.current = 0;
      setChargePct(0);
      setIsCharging(true);
      setShowHint(false);
      clearHintTimer();
    },
    [clearHintTimer, showSetup]
  );
  const releaseCharge = useCallback(
    (e?: any) => {
      if (e && e.button !== undefined && e.button !== 0) return;
      if (!isChargingRef.current) return;
      if (holderRef.current !== 'player') return;
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      const elapsed = performance.now() - chargeStartedAtRef.current;
      const pct = Math.max(CHARGE_MIN, Math.min(1, elapsed / preset.chargeMs));
      launchBall(pct);
    },
    [launchBall, preset.chargeMs]
  );

  /* ══ Physics simulation loop ══ */
  useEffect(() => {
    const tick = (now: any) => {
      if (showSetup || gameOverRef.current) {
        const bp = ballPosRef.current;
        bp.x = cursorRef.current.x;
        bp.y = cursorRef.current.y;
        if (ballInfoRef) {
          ballInfoRef.current = { x: bp.x, y: bp.y, vx: 0, vy: 0, holder: 'player' };
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      // delta-time normalization: dt == 1.0 at 60 FPS
      const dt =
        prevTimeRef.current === null ? 1 : Math.min((now - prevTimeRef.current) / (1000 / 60), 3);
      prevTimeRef.current = now;
      const vw = window.innerWidth,
        vh = window.innerHeight;
      const bp = ballPosRef.current,
        bv = ballVelRef.current;
      const holder = holderRef.current;
      if (mode === 'challenge' && comboRef.current > 0 && comboDecayEndsAtRef.current > 0) {
        if (holder === 'player') {
          const remaining = comboDecayEndsAtRef.current - Date.now();
          if (remaining <= 0) {
            comboDecayEndsAtRef.current = 0;
            comboDecayDisplayRef.current = 0;
            setCombo(0);
            setComboDecayPct(0);
          } else {
            const nextPct = remaining / preset.comboDecayMs;
            if (Math.abs(nextPct - comboDecayDisplayRef.current) > 0.03) {
              comboDecayDisplayRef.current = nextPct;
              setComboDecayPct(nextPct);
            }
          }
        }
      }
      if (catchCooldownRef.current > 0)
        catchCooldownRef.current = Math.max(0, catchCooldownRef.current - dt);
      // ── Expose ball state to WanderingPet for seek steering ──
      if (ballInfoRef) {
        ballInfoRef.current = { x: bp.x, y: bp.y, vx: bv.x, vy: bv.y, holder };
      }
      /* ── Player holds ball ── */
      if (holder === 'player') {
        bp.x = cursorRef.current.x;
        bp.y = cursorRef.current.y;
        if (isChargingRef.current) {
          const elapsed = performance.now() - chargeStartedAtRef.current;
          const nextPct = Math.max(CHARGE_MIN, Math.min(1, elapsed / preset.chargeMs));
          chargePctRef.current = nextPct;
          if (Math.abs(nextPct - chargePct) > 0.015) setChargePct(nextPct);
        }
        const t = targetVel();
        const sv = smoothVelRef.current;
        // dt-correct exponential moving average
        const emaFactor = 1 - (1 - VEL_SMOOTH) ** dt;
        sv.x += (t.vx - sv.x) * emaFactor;
        sv.y += (t.vy - sv.y) * emaFactor;
        // Only rebuild aim path when smoothed velocity changed meaningfully
        const pav = prevAimVelRef.current;
        const pao = prevAimOriginRef.current;
        const dvx = sv.x - pav.x,
          dvy = sv.y - pav.y;
        const dox = bp.x - pao.x,
          doy = bp.y - pao.y;
        const adjustChanged =
          Math.abs(trajectoryAdjustRef.current - prevAimTrajectoryRef.current) > 0.01;
        if (
          dvx * dvx + dvy * dvy > AIM_DIRTY_THRESH * AIM_DIRTY_THRESH ||
          dox * dox + doy * doy > AIM_ORIGIN_DIRTY_THRESH * AIM_ORIGIN_DIRTY_THRESH ||
          adjustChanged
        ) {
          pav.x = sv.x;
          pav.y = sv.y;
          pao.x = bp.x;
          pao.y = bp.y;
          prevAimTrajectoryRef.current = trajectoryAdjustRef.current;
          if (aimPathRef.current)
            aimPathRef.current.setAttribute(
              'd',
              buildAim(bp.x, bp.y, sv.x, sv.y, chargePctRef.current)
            );
        }
        if (ballElRef.current) {
          ballElRef.current.style.transform = `translate(${bp.x - BALL_R}px,${bp.y - BALL_R}px)`;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      /* ── Bot is holding the ball — follow bot position, countdown to throw ── */
      if (holder === 'bot-held') {
        const bot = botPosRef.current;
        bp.x = bot.x;
        bp.y = bot.y;
        botHoldCounterRef.current -= dt;
        if (botHoldCounterRef.current <= 0) {
          const cx = cursorRef.current.x,
            cy = cursorRef.current.y;
          const dx = cx - bot.x;
          const dist = Math.sqrt(dx * dx + (cy - bot.y) * (cy - bot.y)) || 1;
          const upBias = Math.min(90, dist * 0.18);
          const cy_target = cy - upBias;
          const dy = cy_target - bot.y;
          const roll = Math.random();
          let tvx = 0;
          let tvy = 0;
          let style: 'direct' | 'arc' | 'lob' | 'fast' | 'curve' | 'fake' = 'arc';
          if (roll < preset.lobChance) style = 'lob';
          else if (roll < preset.lobChance + preset.curveChance) style = 'curve';
          else if (roll < preset.lobChance + preset.curveChance + preset.fakeChance) style = 'fake';
          else if (
            roll <
            preset.lobChance + preset.curveChance + preset.fakeChance + preset.fastChance
          ) {
            style = 'fast';
          } else if (Math.random() < 0.45) {
            style = 'direct';
          }
          if (style === 'direct') {
            const dxB = cx - bot.x,
              dyB = cy_target - bot.y;
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
            const fakeTargetY = cy_target - 20;
            const fdx = fakeTargetX - bot.x;
            const fdy = fakeTargetY - bot.y;
            const T = Math.max(24, Math.min(42, dist / 10));
            tvx = fdx / T;
            tvy = fdy / T - 0.5 * CATCH_BALL_GRAVITY * T;
          } else {
            const T = Math.max(30, Math.min(65, dist / 8));
            tvx = dx / T;
            tvy = dy / T - 0.5 * CATCH_BALL_GRAVITY * T;
          }
          const arcSpd = Math.sqrt(tvx * tvx + tvy * tvy);
          const baseAngle = Math.atan2(tvy, tvx);
          const spread =
            (Math.random() - 0.5) *
            2 *
            CATCH_BOT_THROW_SPREAD *
            preset.returnSpreadScale *
            (style === 'fake' ? 1.45 : 1);
          const throwAngle = baseAngle + spread;
          const returnSpeedBoost = style === 'fast' ? 1.18 : 1;
          bv.x = Math.cos(throwAngle) * arcSpd * preset.returnSpeedScale * returnSpeedBoost;
          bv.y = Math.sin(throwAngle) * arcSpd * preset.returnSpeedScale * returnSpeedBoost;
          bp.x = bot.x + Math.cos(throwAngle) * (BOT_CATCH + 6);
          bp.y = bot.y + Math.sin(throwAngle) * (BOT_CATCH + 6);
          returnCurveRef.current =
            style === 'curve' || style === 'fake'
              ? (Math.random() > 0.5 ? 1 : -1) * preset.curveForce
              : 0;
          botThrowAtRef.current = Date.now();
          throwAgeRef.current = 0;
          catchCooldownRef.current = 18;
          holderRef.current = 'returning';
        }
        if (ballElRef.current) {
          ballElRef.current.style.transform = `translate(${bp.x - BALL_R}px,${bp.y - BALL_R}px)`;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      /* ── Ball in flight / returning ── */
      throwAgeRef.current += dt;
      if (holderRef.current === 'returning' && Math.abs(returnCurveRef.current) > 1e-5) {
        bv.x += returnCurveRef.current * dt;
        returnCurveRef.current *= Math.pow(0.985, dt);
      }
      const prevX = bp.x;
      const prevY = bp.y;
      // Integrate forces using dt so physics are wall-clock consistent
      bv.y += CATCH_BALL_GRAVITY * dt;
      bv.x *= AIR_FRICTION ** dt;
      bv.y *= AIR_FRICTION ** dt;
      bp.x += bv.x * dt;
      bp.y += bv.y * dt;
      // Wall bounces
      let bouncedThisFrame = false;
      if (bp.x < BALL_R) {
        bp.x = BALL_R;
        bv.x = Math.abs(bv.x) * BOUNCE_RESTITUTION;
        bouncedThisFrame = true;
      } else if (bp.x > vw - BALL_R) {
        bp.x = vw - BALL_R;
        bv.x = -Math.abs(bv.x) * BOUNCE_RESTITUTION;
        bouncedThisFrame = true;
      }
      if (bp.y < BALL_TOP_MIN) {
        bp.y = BALL_TOP_MIN;
        bv.y = Math.abs(bv.y) * BOUNCE_RESTITUTION;
        bouncedThisFrame = true;
      } else if (bp.y > vh - BALL_R - 4) {
        bp.y = vh - BALL_R - 4;
        bv.y = -Math.abs(bv.y) * BOUNCE_RESTITUTION;
        bouncedThisFrame = true;
      }
      // Bot catch — CCD proximity detection → bot-held phase
      if (holderRef.current === 'flying') {
        const bot = botPosRef.current;
        const hit = closestPointOnSegment(prevX, prevY, bp.x, bp.y, bot.x, bot.y);
        const hx = hit.x - bot.x;
        const hy = hit.y - bot.y;
        const hitDist = Math.sqrt(hx * hx + hy * hy);
        if (hitDist < BOT_CATCH) {
          onBotCatch();
          bp.x = bot.x;
          bp.y = bot.y;
          bv.x = 0;
          bv.y = 0;
          holderRef.current = 'bot-held';
          botHoldCounterRef.current =
            preset.botHoldMin + Math.floor(Math.random() * preset.botHoldRange);
          setRallies((r) => r + 1);
          registerSuccessfulReturn();
          bounceCountRef.current = 0;
          setBounceCount(0);
          setCatchRipple({ x: bot.x, y: bot.y });
          setTimeout(() => setCatchRipple(null), 450);
        }
      }
      // Player catch
      if (
        holderRef.current !== 'player' &&
        holderRef.current !== 'bot-held' &&
        catchCooldownRef.current <= 0
      ) {
        const cx = cursorRef.current.x,
          cy = cursorRef.current.y;
        const dx = bp.x - cx,
          dy = bp.y - cy;
        if (Math.sqrt(dx * dx + dy * dy) < preset.playerCatchRadius) {
          if (
            mode === 'challenge' &&
            holderRef.current === 'returning' &&
            Date.now() - botThrowAtRef.current <= 260
          ) {
            setScore((prev) => prev + 35);
            setLastGain(35);
          }
          resetBallToPlayer();
        }
      }
      if (bouncedThisFrame && holderRef.current !== 'player' && holderRef.current !== 'bot-held') {
        const nextBounces = bounceCountRef.current + 1;
        bounceCountRef.current = nextBounces;
        setBounceCount(nextBounces);
        if (mode === 'challenge' && nextBounces >= 2) {
          registerMiss('doubleBounce');
        }
      }
      if (holderRef.current === 'returning' && Math.sqrt(bv.x * bv.x + bv.y * bv.y) < STOP_THRESH) {
        resetBallToPlayer();
      }
      // Move ball via DOM — transform is compositor-only, avoids layout recalc
      if (ballElRef.current) {
        ballElRef.current.style.transform = `translate(${bp.x - BALL_R}px,${bp.y - BALL_R}px)`;
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
    chargePct,
    clearHintTimer,
    mode,
    onBotCatch,
    preset,
    registerMiss,
    registerSuccessfulReturn,
    resetBallToPlayer,
    showSetup,
  ]);

  return createPortal(
    <div
      className={`catch-game-overlay${catchRipple ? ' catch-game-overlay--flash' : ''}`}
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={releaseCharge}
      onMouseLeave={releaseCharge}
      onContextMenu={(e: any) => e.preventDefault()}
    >
      {/* Ripple localisé au point de catch du bot */}
      {catchRipple && (
        <div className="catch-ripple" style={{ left: catchRipple.x, top: catchRipple.y }} />
      )}
      {showSetup && (
        <div
          className="catch-game-panel"
          role="dialog"
          aria-label={t('common.catchGameUI.menu.title')}
        >
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
              <div className="catch-game-intro-step">
                <span className="catch-game-intro-step-index">4</span>
                <span>{t('common.catchGameUI.instructions.trajectoryStep')}</span>
              </div>
            </div>
          </div>
          <div className="catch-game-panel-label">{t('common.catchGameUI.menu.modeLabel')}</div>
          <div className="catch-game-segment" role="radiogroup">
            <button
              className={`catch-game-segment-btn${mode === 'free' ? ' is-active' : ''}`}
              onClick={(e: any) => {
                e.stopPropagation();
                setMode('free');
              }}
              aria-pressed={mode === 'free'}
            >
              {t('common.catchGameUI.menu.modes.free')}
            </button>
            <button
              className={`catch-game-segment-btn${mode === 'challenge' ? ' is-active' : ''}`}
              onClick={(e: any) => {
                e.stopPropagation();
                setMode('challenge');
              }}
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
          <div className="catch-game-panel-label">
            {t('common.catchGameUI.menu.difficultyLabel')}
          </div>
          <div className="catch-game-segment" role="radiogroup">
            {(['casual', 'normal', 'hard'] as CatchDifficulty[]).map((d) => (
              <button
                key={d}
                className={`catch-game-segment-btn${difficulty === d ? ' is-active' : ''}`}
                onClick={(e: any) => {
                  e.stopPropagation();
                  setDifficulty(d);
                }}
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
            onClick={(e: any) => {
              e.stopPropagation();
              setShowDifficultyImpact((prev) => !prev);
            }}
          >
            <span>{t('common.catchGameUI.menu.difficultyImpact')}</span>
            <span className={`catch-game-disclosure-icon${showDifficultyImpact ? ' is-open' : ''}`}>
              v
            </span>
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
            onClick={(e: any) => {
              e.stopPropagation();
              beginRun();
            }}
          >
            {mode === 'challenge'
              ? t('common.catchGameUI.menu.startChallenge')
              : t('common.catchGameUI.menu.startFree')}
          </button>
        </div>
      )}
      {!showSetup && (
        <div className="catch-game-score">
          <div className="catch-game-score-header">
            <div className="catch-game-score-label">
              {mode === 'challenge'
                ? t('common.catchGameUI.score.challengeLabel')
                : t('common.catchGameUI.score.label')}
            </div>
            <div className="catch-game-score-value">{mode === 'challenge' ? score : rallies}</div>
          </div>
          <div className="catch-game-score-best">
            {mode === 'challenge'
              ? t('common.catchGameUI.score.bestChallenge', {
                  score: bestByDifficulty[difficulty] ?? 0,
                })
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
              <div
                className={`catch-game-challenge-row${livesFlash ? ' catch-game-challenge-row--danger' : ''}`}
              >
                <span>{t('common.catchGameUI.challenge.lives')}</span>
                <span>{'●'.repeat(lives).padEnd(preset.lives, '○')}</span>
              </div>
              <div className="catch-game-challenge-row">
                <span>{t('common.catchGameUI.challenge.bounces')}</span>
                <span>{Math.min(2, bounceCount)}/2</span>
              </div>
              <div className="catch-game-challenge-row">
                <span>{t('common.catchGameUI.challenge.combo')}</span>
                <span>x{combo}</span>
              </div>
              <div className="catch-game-combo-track">
                <div
                  className="catch-game-combo-fill"
                  style={{ transform: `scaleX(${Math.max(0, Math.min(1, comboDecayPct))})` }}
                />
              </div>
              <div className="catch-game-objective-track">
                <div
                  className="catch-game-objective-fill"
                  style={{
                    transform: `scaleX(${Math.max(0, Math.min(1, score / preset.objectiveScore))})`,
                  }}
                />
              </div>
              <div className="catch-game-score-best">
                {t('common.catchGameUI.challenge.goalShort', {
                  score: score,
                  target: preset.objectiveScore,
                })}
              </div>
            </div>
          )}
          {lastGain !== 0 && !gameOver && (
            <div className={`catch-game-gain${lastGain > 0 ? ' catch-game-gain--plus' : ''}`}>
              {lastGain > 0 ? '+' : ''}
              {lastGain}
            </div>
          )}
          {/* Mini stat bars */}
          {stats && (
            <div className="catch-game-stats">
              <div className="catch-game-stat">
                <svg
                  className="catch-game-stat-icon"
                  viewBox="0 0 16 16"
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  aria-label={t('common.catchGameUI.stats.hunger')}
                >
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
                <svg
                  className="catch-game-stat-icon"
                  viewBox="0 0 16 16"
                  width="11"
                  height="11"
                  fill="currentColor"
                  stroke="none"
                  aria-label={t('common.catchGameUI.stats.happiness')}
                >
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
      {/* Aim line — always mounted, path written via ref; viewBox managed by resize listener */}
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
              className={`catch-game-charge-fill${isCharging ? ' catch-game-charge-fill--active' : ''}`}
              style={{ transform: `scaleX(${Math.max(CHARGE_MIN, chargePct)})` }}
            />
          </div>
          <div className="catch-game-charge-value">{Math.round(chargePct * 100)}%</div>
        </div>
      )}
      {gameOver && (
        <div
          className="catch-game-result"
          role="dialog"
          aria-label={t('common.catchGameUI.result.title')}
        >
          <div className="catch-game-result-title">
            {gameOver.success
              ? t('common.catchGameUI.result.victory')
              : t('common.catchGameUI.result.defeat')}
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
              onClick={(e: any) => {
                e.stopPropagation();
                beginRun();
              }}
            >
              {t('common.catchGameUI.result.retry')}
            </button>
            <button
              className="catch-game-result-btn catch-game-result-btn--ghost"
              onClick={(e: any) => {
                e.stopPropagation();
                openModeSetup();
              }}
            >
              {t('common.catchGameUI.result.changeMode')}
            </button>
          </div>
        </div>
      )}
      {/* Exit — agrandi + raccourci ESC */}
      <button
        className="catch-game-exit"
        onClick={(e: any) => {
          e.stopPropagation();
          onGameEnd();
        }}
        aria-label={t('common.catchGameUI.exitLabel')}
      >
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          aria-hidden="true"
        >
          <line x1="3" y1="3" x2="13" y2="13" />
          <line x1="13" y1="3" x2="3" y2="13" />
        </svg>
        <span className="catch-game-exit-label">ESC</span>
      </button>
      {/* Ball — position written via ref using transform (GPU-composited) */}
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
