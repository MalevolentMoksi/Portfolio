import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMood, MOODS, MOOD_ORDER } from '../contexts/MoodContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';
import Tooltip from './Tooltip';
import useTunerAudioFeedback from '@/hooks/useTunerAudioFeedback';
import type { MoodKey } from '@/types';

type SelectorMode = 'dropdown' | 'rotaryCylinder' | 'hexGrid' | 'analogTuner';
type TransitionMode = 'vhs' | 'circleReveal';

const ACTIVE_SELECTOR_MODE = 'analogTuner' as SelectorMode;
const ACTIVE_TRANSITION_MODE = 'circleReveal' as TransitionMode;

const CIRCLE_REVEAL_DURATION_MS = 900;
const VHS_DURATION_MS = 200;
const VHS_FLIP_DELAY_MS = 60;
const NOTCH_SNAP_VISUAL_MS = 190;

const TUNER_COAST_FACTOR = 10;
const TUNER_FRICTION = 0.82;
const TUNER_SPRING = 0.24;
const TUNER_SETTLE_MAX_MS = 540;
const TUNER_SETTLE_MIN_ERROR = 0.002;
const TUNER_SETTLE_MIN_VELOCITY = 0.0015;
const TUNER_MAX_VELOCITY = 0.08;
const TUNER_RESISTANCE_RADIUS = 0.14;
const TUNER_RESISTANCE_STRENGTH = 0.58;
const TUNER_PROGRESS_EPSILON = 0.0008;
const SWIPE_STEP_MIN_DISTANCE_PX = 28;
const SWIPE_STEP_MAX_DURATION_MS = 430;
const SWIPE_STEP_AXIS_LOCK_RATIO = 1.28;
const COMMIT_FEEDBACK_MS = 280;
const HAPTIC_NOTCH_THROTTLE_MS = 58;
const HAPTIC_NOTCH_PATTERN = 10;
const HAPTIC_COMMIT_PATTERN: number[] = [20, 24, 32];
const TUNER_OVERSHOOT_DISTANCE = 0.018;
const TUNER_OVERSHOOT_TRIGGER_ERROR = 0.032;
const TUNER_OVERSHOOT_TRIGGER_VELOCITY = 0.023;
const FM_MIN_FREQUENCY = 87.5;
const FM_MAX_FREQUENCY = 108.0;
const DISPLAY_TICK_STOPS = Array.from({ length: 17 }, (_, index) => index / 16);

/* ── FM Frequency Mapping (87.5 – 108.0 MHz) ─────────────────────── */
const MOOD_FM_FREQUENCIES: Record<MoodKey, number> = {
  default: 87.5,
  hacker: 91.3,
  vaporwave: 95.1,
  europa: 98.9,
  industrial: 102.7,
  nightshade: 106.5,
};

const MOOD_STATION_CODES: Record<MoodKey, string> = {
  default: 'AURA-875',
  hacker: 'KRACK-913',
  vaporwave: 'VAPE-951',
  europa: 'ECHO-989',
  industrial: 'FORGE-1027',
  nightshade: 'NOCT-1065',
};

interface Point {
  x: number;
  y: number;
}

interface SwipeStartSample {
  x: number;
  y: number;
  time: number;
  pointerType: string;
  startIndex: number;
}

interface CommitMoodOptions {
  delayBeforeCommit?: number;
  origin?: Point;
  shouldClosePanel?: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getMoodIndex = (mood: MoodKey): number => {
  const idx = MOOD_ORDER.indexOf(mood);
  return idx >= 0 ? idx : 0;
};

const indexToProgress = (index: number): number => {
  if (MOOD_ORDER.length <= 1) return 0;
  return clamp(index / (MOOD_ORDER.length - 1), 0, 1);
};

const progressToMoodIndex = (progress: number): number => {
  if (MOOD_ORDER.length <= 1) return 0;
  return Math.round(clamp(progress, 0, 1) * (MOOD_ORDER.length - 1));
};

const progressToFrequency = (progress: number): number =>
  FM_MIN_FREQUENCY + clamp(progress, 0, 1) * (FM_MAX_FREQUENCY - FM_MIN_FREQUENCY);

const getApproachStrengthFromProgress = (progress: number): number => {
  const nearestStopIndex = progressToMoodIndex(progress);
  const nearestStopProgress = indexToProgress(nearestStopIndex);
  const distance = Math.abs(progress - nearestStopProgress);
  return clamp(1 - distance / TUNER_RESISTANCE_RADIUS, 0, 1);
};

const getSignalStrengthFromProgress = (progress: number): number => {
  const nearestStopIndex = progressToMoodIndex(progress);
  const nearestStopProgress = indexToProgress(nearestStopIndex);
  const distance = Math.abs(progress - nearestStopProgress);
  return clamp(1 - distance / (TUNER_RESISTANCE_RADIUS * 1.45), 0, 1);
};

const getElementCenter = (element: Element): Point => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

const sanitizeTransitionOrigin = (origin: Point): Point => {
  const fallbackX = window.innerWidth / 2;
  const fallbackY = window.innerHeight / 2;

  const safeX = Number.isFinite(origin.x) ? origin.x : fallbackX;
  const safeY = Number.isFinite(origin.y) ? origin.y : fallbackY;

  return {
    x: clamp(safeX, 0, window.innerWidth),
    y: clamp(safeY, 0, window.innerHeight),
  };
};

const createVhsOverlay = (newMood: MoodKey): HTMLDivElement => {
  const overlay = document.createElement('div');
  overlay.className = 'mood-vhs-overlay';
  overlay.style.setProperty('--vhs-color', MOODS[newMood].color);
  document.body.appendChild(overlay);

  const stripCount = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < stripCount; i++) {
    const strip = document.createElement('div');
    strip.className = 'vhs-strip';
    const topPct = Math.random() * 88;
    const heightPct = 3 + Math.random() * 18;
    const offsetX = (Math.random() - 0.5) * 90;
    const delay = Math.round(Math.random() * 80);

    strip.style.cssText = [
      `top: ${topPct.toFixed(1)}%`,
      `height: ${heightPct.toFixed(1)}%`,
      `transform: translateX(${offsetX.toFixed(0)}px)`,
      `background: ${MOODS[newMood].color}`,
      `animation-delay: ${delay}ms`,
    ].join('; ');

    overlay.appendChild(strip);
  }

  return overlay;
};

const MoodSwitcher = () => {
  const { t } = useTranslation();
  const { mood, setMood } = useMood();
  const tier = usePerformanceTierValue();
  const { settings: a11ySettings } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [previewMood, setPreviewMood] = useState<MoodKey>(mood);
  const [dragProgress, setDragProgress] = useState<number>(() => indexToProgress(getMoodIndex(mood)));
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isNotchSnapping, setIsNotchSnapping] = useState(false);
  const [isCommitFeedbackActive, setIsCommitFeedbackActive] = useState(false);
  const [lastActivatedNotchIndex, setLastActivatedNotchIndex] = useState<number | null>(null);
  const [hoveredNotchIndex, setHoveredNotchIndex] = useState<number | null>(null);
  const [swipeStepDirection, setSwipeStepDirection] = useState<-1 | 0 | 1>(0);
  const [isVerticalTuner, setIsVerticalTuner] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 720px)').matches;
  });
  const [announcement, setAnnouncement] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const panelDivRef = useRef<HTMLDivElement>(null);
  const tunerRulerRef = useRef<HTMLDivElement>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const transitionOverlaysRef = useRef<HTMLDivElement[]>([]);
  const transitionInFlightRef = useRef(false);
  const settleRafRef = useRef<number | null>(null);
  const velocityRef = useRef(0);
  const pointerSampleRef = useRef<{ progress: number; time: number } | null>(null);
  const swipeStartRef = useRef<SwipeStartSample | null>(null);
  const listOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const previewMoodRef = useRef<MoodKey>(mood);
  const dragProgressRef = useRef(dragProgress);
  const isDraggingRef = useRef(false);
  const lastHapticNotchIndexRef = useRef<number>(getMoodIndex(mood));
  const lastNotchHapticAtRef = useRef(0);
  const activePointerTypeRef = useRef<string | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  const isContrastMode = a11ySettings.highContrast;
  const isNoMotionMode = a11ySettings.noMotion;
  const { startSweep, updateSweep, stopSweep, playLockBeep } = useTunerAudioFeedback({
    enabled: false,
  });

  const triggerHaptic = useCallback(
    (pattern: number | number[]) => {
      if (isNoMotionMode || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
        return;
      }
      navigator.vibrate(pattern);
    },
    [isNoMotionMode]
  );

  const syncPreviewToMood = useCallback((targetMood: MoodKey) => {
    const nextProgress = indexToProgress(getMoodIndex(targetMood));
    setPreviewMood(targetMood);
    previewMoodRef.current = targetMood;
    setDragProgress(nextProgress);
    dragProgressRef.current = nextProgress;
  }, []);

  const applyMoodImmediately = useCallback(
    (newMood: MoodKey) => {
      setMood(newMood);
      setAnnouncement(
        t('common.mood.tunerCommitted', {
          mood: t(`common.mood.names.${newMood}`),
        })
      );
    },
    [setMood, t]
  );

  const removeTransitionOverlay = useCallback((overlay: HTMLDivElement) => {
    overlay.remove();
    transitionOverlaysRef.current = transitionOverlaysRef.current.filter((entry) => entry !== overlay);
  }, []);

  const registerTransitionOverlay = useCallback((overlay: HTMLDivElement): HTMLDivElement => {
    transitionOverlaysRef.current.push(overlay);
    return overlay;
  }, []);

  const clearTransitionOverlays = useCallback(() => {
    transitionOverlaysRef.current.forEach((overlay) => overlay.remove());
    transitionOverlaysRef.current = [];
  }, []);

  const cancelSettleAnimation = useCallback(() => {
    if (settleRafRef.current !== null) {
      window.cancelAnimationFrame(settleRafRef.current);
      settleRafRef.current = null;
    }
  }, []);

  const getFallbackOrigin = useCallback((): Point => {
    if (panelRef.current) return getElementCenter(panelRef.current);
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
  }, []);

  const resolveTransitionMode = useCallback((): TransitionMode => {
    if (tier === 'low') return 'vhs';
    if (typeof CSS === 'undefined' || !CSS.supports('clip-path', 'circle(20px at 50% 50%)')) {
      return 'vhs';
    }
    return ACTIVE_TRANSITION_MODE;
  }, [tier]);

  const runViewCircleTransition = useCallback(
    (newMood: MoodKey, origin: Point): boolean => {
      if (typeof document.startViewTransition !== 'function') return false;
      if (transitionInFlightRef.current) return false;

      const sanitizedOrigin = sanitizeTransitionOrigin(origin);

      const root = document.documentElement;
      root.style.setProperty('--mood-reveal-origin-x', `${sanitizedOrigin.x}px`);
      root.style.setProperty('--mood-reveal-origin-y', `${sanitizedOrigin.y}px`);
      root.style.setProperty('--mood-reveal-duration-ms', `${CIRCLE_REVEAL_DURATION_MS}ms`);
      root.classList.add('mood-view-transition-active');

      transitionInFlightRef.current = true;

      let transition;
      try {
        transition = document.startViewTransition(() => {
          applyMoodImmediately(newMood);
        });
      } catch {
        transitionInFlightRef.current = false;
        root.classList.remove('mood-view-transition-active');
        root.style.removeProperty('--mood-reveal-origin-x');
        root.style.removeProperty('--mood-reveal-origin-y');
        root.style.removeProperty('--mood-reveal-duration-ms');
        return false;
      }

      transition.finished.finally(() => {
        transitionInFlightRef.current = false;
        root.classList.remove('mood-view-transition-active');
        root.style.removeProperty('--mood-reveal-origin-x');
        root.style.removeProperty('--mood-reveal-origin-y');
        root.style.removeProperty('--mood-reveal-duration-ms');
      });

      return true;
    },
    [applyMoodImmediately]
  );

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);

    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const triggerCommitFeedback = useCallback(
    (targetMood: MoodKey) => {
      const targetIndex = getMoodIndex(targetMood);
      setIsCommitFeedbackActive(true);
      setLastActivatedNotchIndex(targetIndex);
      schedule(() => {
        setIsCommitFeedbackActive(false);
      }, COMMIT_FEEDBACK_MS);
      schedule(() => {
        setLastActivatedNotchIndex(null);
      }, COMMIT_FEEDBACK_MS + 40);
    },
    [schedule]
  );

  const clearScheduledTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
    cancelSettleAnimation();
    clearTransitionOverlays();
    stopSweep();
  }, [cancelSettleAnimation, clearTransitionOverlays, stopSweep]);

  const closePanel = useCallback(() => {
    cancelSettleAnimation();
    setIsDragging(false);
    isDraggingRef.current = false;
    setIsSettling(false);
    setIsNotchSnapping(false);
    setHoveredNotchIndex(null);
    setSwipeStepDirection(0);
    swipeStartRef.current = null;
    activePointerTypeRef.current = null;
    stopSweep();
    setIsOpen(false);
  }, [cancelSettleAnimation, stopSweep]);

  const commitMood = useCallback(
    (newMood: MoodKey, options?: CommitMoodOptions) => {
      const delayBeforeCommit = options?.delayBeforeCommit ?? 0;
      const origin = options?.origin;
      const shouldClosePanel = options?.shouldClosePanel ?? false;

      const runCommit = () => {
        if (newMood !== mood) {
          stopSweep();
          triggerCommitFeedback(newMood);
          playLockBeep(MOOD_FM_FREQUENCIES[newMood]);
          triggerHaptic(HAPTIC_COMMIT_PATTERN);

          const shouldSkipTransitions =
            isNoMotionMode ||
            document.body.classList.contains('a11y--reduce-effects') ||
            transitionInFlightRef.current;

          if (shouldSkipTransitions) {
            applyMoodImmediately(newMood);
          } else {
            const transitionMode = resolveTransitionMode();
            if (transitionMode === 'circleReveal') {
              const hasViewTransition = runViewCircleTransition(newMood, origin ?? getFallbackOrigin());
              if (!hasViewTransition) {
                const fallbackOverlay = registerTransitionOverlay(createVhsOverlay(newMood));
                schedule(() => {
                  applyMoodImmediately(newMood);
                }, VHS_FLIP_DELAY_MS);
                schedule(() => {
                  removeTransitionOverlay(fallbackOverlay);
                }, VHS_DURATION_MS);
              }
            } else {
              const overlay = registerTransitionOverlay(createVhsOverlay(newMood));
              schedule(() => {
                applyMoodImmediately(newMood);
              }, VHS_FLIP_DELAY_MS);
              schedule(() => {
                removeTransitionOverlay(overlay);
              }, VHS_DURATION_MS);
            }
          }

          setSpinKey((key) => key + 1);
        }

        if (shouldClosePanel) {
          closePanel();
        }
      };

      if (delayBeforeCommit > 0) {
        schedule(runCommit, delayBeforeCommit);
      } else {
        runCommit();
      }
    },
    [
      closePanel,
      applyMoodImmediately,
      getFallbackOrigin,
      isNoMotionMode,
      mood,
      playLockBeep,
      registerTransitionOverlay,
      removeTransitionOverlay,
      resolveTransitionMode,
      runViewCircleTransition,
      schedule,
      setMood,
      stopSweep,
      t,
      triggerHaptic,
      triggerCommitFeedback,
    ]
  );

  useEffect(() => {
    return () => {
      clearScheduledTimeouts();
    };
  }, [clearScheduledTimeouts]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 720px)');
    const updateOrientation = () => {
      setIsVerticalTuner(mediaQuery.matches);
    };

    updateOrientation();
    mediaQuery.addEventListener('change', updateOrientation);

    return () => {
      mediaQuery.removeEventListener('change', updateOrientation);
    };
  }, []);

  /* ── Fermer au clic extérieur ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (transitionInFlightRef.current) return;

      const targetNode = e.target as Node | null;
      if (
        panelRef.current &&
        !panelRef.current.contains(targetNode) &&
        !(panelDivRef.current && panelDivRef.current.contains(targetNode))
      ) {
        closePanel();
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handle);
    };
  }, [closePanel, isOpen]);

  /* ── Fermer avec Escape ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [closePanel, isOpen]);

  /* —— Position du panneau (portal → coordonnées viewport) —— */
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    let rafId: number | null = null;

    const updatePanelPosition = () => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const panelWidth = panelDivRef.current?.offsetWidth ?? 0;
      const panelHeight = panelDivRef.current?.offsetHeight ?? 0;
      const viewportMargin = 12;

      let top = Math.max(viewportMargin, rect.bottom + 12);
      if (panelHeight > 0 && top + panelHeight > window.innerHeight - viewportMargin) {
        const aboveAnchorTop = rect.top - panelHeight - 12;
        top =
          aboveAnchorTop >= viewportMargin
            ? aboveAnchorTop
            : Math.max(viewportMargin, window.innerHeight - panelHeight - viewportMargin);
      }

      let left = rect.left;
      if (panelWidth > 0) {
        const preferredLeft = rect.right - panelWidth;
        left = clamp(
          preferredLeft,
          viewportMargin,
          Math.max(viewportMargin, window.innerWidth - panelWidth - viewportMargin)
        );
      }

      setPanelPos({
        top,
        left,
      });
    };

    updatePanelPosition();
    rafId = window.requestAnimationFrame(updatePanelPosition);
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [isNoMotionMode, isOpen, isVerticalTuner]);

  useEffect(() => {
    if (!isOpen || !panelDivRef.current) return;
    schedule(() => {
      if (isNoMotionMode) {
        const currentIndex = getMoodIndex(mood);
        listOptionRefs.current[currentIndex]?.focus();
        return;
      }
      tunerRulerRef.current?.focus();
    }, 0);
  }, [isNoMotionMode, isOpen, mood, schedule]);

  useEffect(() => {
    dragProgressRef.current = dragProgress;
  }, [dragProgress]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    previewMoodRef.current = previewMood;
  }, [previewMood]);

  useEffect(() => {
    if (!isOpen) return;
    syncPreviewToMood(mood);
    setIsDragging(false);
    isDraggingRef.current = false;
    setIsSettling(false);
    setIsNotchSnapping(false);
    setHoveredNotchIndex(null);
    setSwipeStepDirection(0);
    lastHapticNotchIndexRef.current = getMoodIndex(mood);
    activePointerTypeRef.current = null;
    swipeStartRef.current = null;
  }, [isOpen, mood, syncPreviewToMood]);

  const getSwipeStepDirection = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): -1 | 0 | 1 => {
      const swipeStart = swipeStartRef.current;
      if (!swipeStart) return 0;

      if (swipeStart.pointerType !== 'touch' && swipeStart.pointerType !== 'pen') {
        return 0;
      }

      const elapsed = performance.now() - swipeStart.time;
      if (elapsed > SWIPE_STEP_MAX_DURATION_MS) return 0;

      const axisDelta = isVerticalTuner ? event.clientY - swipeStart.y : event.clientX - swipeStart.x;
      const crossAxisDelta = isVerticalTuner
        ? event.clientX - swipeStart.x
        : event.clientY - swipeStart.y;

      if (Math.abs(axisDelta) < SWIPE_STEP_MIN_DISTANCE_PX) return 0;
      if (Math.abs(axisDelta) < Math.abs(crossAxisDelta) * SWIPE_STEP_AXIS_LOCK_RATIO) {
        return 0;
      }

      return axisDelta > 0 ? 1 : -1;
    },
    [isVerticalTuner]
  );

  const getProgressFromPointer = useCallback(
    (clientX: number, clientY: number): number => {
      const ruler = tunerRulerRef.current;
      if (!ruler) return dragProgressRef.current;

      const rect = ruler.getBoundingClientRect();
      const raw = isVerticalTuner
        ? (clientY - rect.top) / Math.max(rect.height, 1)
        : (clientX - rect.left) / Math.max(rect.width, 1);
      const clamped = clamp(raw, 0, 1);

      if (Math.abs(velocityRef.current) > 0.045) {
        return clamped;
      }

      // Add a stronger resistance around notch centers to feel like detents.
      const previous = dragProgressRef.current;
      const nearestStopIndex = progressToMoodIndex(clamped);
      const nearestStopProgress = indexToProgress(nearestStopIndex);
      const distance = Math.abs(clamped - nearestStopProgress);
      const resistance =
        distance < TUNER_RESISTANCE_RADIUS
          ? (TUNER_RESISTANCE_RADIUS - distance) / TUNER_RESISTANCE_RADIUS
          : 0;
      const damping = 1 - resistance * TUNER_RESISTANCE_STRENGTH;

      return clamp(previous + (clamped - previous) * damping, 0, 1);
    },
    [isVerticalTuner]
  );

  const setTunerProgress = useCallback((nextProgress: number) => {
    const clampedProgress = clamp(nextProgress, 0, 1);
    const nearestIndex = progressToMoodIndex(clampedProgress);
    const nextIndex = nearestIndex;
    const nextMood = MOOD_ORDER[nextIndex];
    const previousProgress = dragProgressRef.current;
    const progressDelta = Math.abs(clampedProgress - previousProgress);

    if (progressDelta < TUNER_PROGRESS_EPSILON && nextMood === previewMoodRef.current) {
      return;
    }

    setDragProgress(clampedProgress);
    dragProgressRef.current = clampedProgress;
    setPreviewMood(nextMood);
    previewMoodRef.current = nextMood;

    updateSweep(progressToFrequency(clampedProgress), getSignalStrengthFromProgress(clampedProgress));

    const isTouchLikePointer =
      activePointerTypeRef.current === 'touch' || activePointerTypeRef.current === 'pen';
    if (isDraggingRef.current && isTouchLikePointer && nearestIndex !== lastHapticNotchIndexRef.current) {
      const now = performance.now();
      if (now - lastNotchHapticAtRef.current >= HAPTIC_NOTCH_THROTTLE_MS) {
        triggerHaptic(HAPTIC_NOTCH_PATTERN);
        lastNotchHapticAtRef.current = now;
      }
    }
    lastHapticNotchIndexRef.current = nearestIndex;
  }, [triggerHaptic, updateSweep]);

  const getTunerOrigin = useCallback(
    (progress: number): Point => {
      const ruler = tunerRulerRef.current;
      if (!ruler) return getFallbackOrigin();

      const rect = ruler.getBoundingClientRect();
      if (isVerticalTuner) {
        return {
          x: rect.left + rect.width * 0.5,
          y: rect.top + rect.height * progress,
        };
      }

      return {
        x: rect.left + rect.width * progress,
        y: rect.top + rect.height * 0.5,
      };
    },
    [getFallbackOrigin, isVerticalTuner]
  );

  const settleToNotch = useCallback(
    (targetIndex: number, origin: Point) => {
      cancelSettleAnimation();

      const targetProgress = indexToProgress(targetIndex);
      const targetMood = MOOD_ORDER[targetIndex];

      setIsSettling(true);

      let progress = dragProgressRef.current;
      let velocity = velocityRef.current;
      const startedAt = performance.now();
      let settleTarget = targetProgress;
      let hasOvershot = false;
      let returningFromOvershoot = false;

      const step = (time: number) => {
        const elapsed = time - startedAt;
        const error = settleTarget - progress;

        velocity = velocity * TUNER_FRICTION + error * TUNER_SPRING;
        velocity = clamp(velocity, -TUNER_MAX_VELOCITY, TUNER_MAX_VELOCITY);
        progress = clamp(progress + velocity, 0, 1);

        if (
          !hasOvershot &&
          elapsed > 70 &&
          Math.abs(targetProgress - progress) <= TUNER_OVERSHOOT_TRIGGER_ERROR &&
          Math.abs(velocity) <= TUNER_OVERSHOOT_TRIGGER_VELOCITY
        ) {
          const direction = Math.sign(targetProgress - progress || velocity || 1);
          settleTarget = clamp(targetProgress + direction * TUNER_OVERSHOOT_DISTANCE, 0, 1);
          velocity += direction * 0.013;
          hasOvershot = true;
        } else if (
          hasOvershot &&
          !returningFromOvershoot &&
          Math.abs(progress - settleTarget) <= 0.008
        ) {
          settleTarget = targetProgress;
          velocity *= 0.72;
          returningFromOvershoot = true;
        }

        setTunerProgress(progress);

        const finalError = targetProgress - progress;

        const hasSettled =
          elapsed >= TUNER_SETTLE_MAX_MS ||
          (Math.abs(finalError) < TUNER_SETTLE_MIN_ERROR &&
            Math.abs(velocity) < TUNER_SETTLE_MIN_VELOCITY &&
            (!hasOvershot || returningFromOvershoot));

        if (hasSettled) {
          setTunerProgress(targetProgress);
          velocityRef.current = 0;
          pointerSampleRef.current = null;
          setIsSettling(false);
          settleRafRef.current = null;
          commitMood(targetMood, { origin });
          return;
        }

        settleRafRef.current = window.requestAnimationFrame(step);
      };

      settleRafRef.current = window.requestAnimationFrame(step);
    },
    [cancelSettleAnimation, commitMood, setTunerProgress]
  );

  const handleTunerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isNoMotionMode) return;

    cancelSettleAnimation();
    setIsNotchSnapping(false);
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some synthetic or browser edge pointer flows may not support capture.
    }
    setIsDragging(true);
    isDraggingRef.current = true;
    setIsSettling(false);
    velocityRef.current = 0;
    activePointerTypeRef.current = event.pointerType;

    const nextProgress = getProgressFromPointer(event.clientX, event.clientY);
    const nearestIndex = progressToMoodIndex(nextProgress);
    lastHapticNotchIndexRef.current = nearestIndex;
    pointerSampleRef.current = { progress: nextProgress, time: performance.now() };
    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      pointerType: event.pointerType,
      startIndex: getMoodIndex(previewMoodRef.current),
    };
    startSweep(progressToFrequency(nextProgress), getSignalStrengthFromProgress(nextProgress));
    setTunerProgress(nextProgress);
  };

  const handleTunerPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || isNoMotionMode) return;

    const now = performance.now();
    const previousProgress = dragProgressRef.current;
    const nextProgress = getProgressFromPointer(event.clientX, event.clientY);

    const previousSample = pointerSampleRef.current;
    if (previousSample) {
      const dt = Math.max(now - previousSample.time, 1);
      const instantVelocity = ((nextProgress - previousProgress) / dt) * 16.6;
      velocityRef.current = clamp(
        velocityRef.current * 0.72 + instantVelocity * 0.28,
        -TUNER_MAX_VELOCITY,
        TUNER_MAX_VELOCITY
      );
    }

    pointerSampleRef.current = { progress: nextProgress, time: now };
    setTunerProgress(nextProgress);
  };

  const handleTunerPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!isDragging) return;

    setIsDragging(false);
    isDraggingRef.current = false;
    setIsNotchSnapping(false);
    activePointerTypeRef.current = null;

    const swipeDirection = getSwipeStepDirection(event);
    const previewIndex = getMoodIndex(previewMoodRef.current);
    const swipeStartIndex = swipeStartRef.current?.startIndex ?? previewIndex;
    swipeStartRef.current = null;

    if (swipeDirection !== 0) {
      const swipeTargetIndex = clamp(swipeStartIndex + swipeDirection, 0, MOOD_ORDER.length - 1);
      if (swipeTargetIndex !== swipeStartIndex) {
        const swipeTargetProgress = indexToProgress(swipeTargetIndex);
        const swipeTargetMood = MOOD_ORDER[swipeTargetIndex];
        setSwipeStepDirection(swipeDirection);
        setIsSettling(true);
        setTunerProgress(swipeTargetProgress);
        schedule(() => {
          setIsSettling(false);
          setSwipeStepDirection(0);
        }, 180);
        commitMood(swipeTargetMood, {
          delayBeforeCommit: 95,
          origin: getTunerOrigin(swipeTargetProgress),
        });
        return;
      }
    }

    const projectedProgress = clamp(
      dragProgressRef.current + velocityRef.current * TUNER_COAST_FACTOR,
      0,
      1
    );
    const targetIndex = progressToMoodIndex(projectedProgress);
    const targetProgress = indexToProgress(targetIndex);
    settleToNotch(targetIndex, getTunerOrigin(targetProgress));
  };

  const handleTunerPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
    isDraggingRef.current = false;
    setIsSettling(false);
    setIsNotchSnapping(false);
    setHoveredNotchIndex(null);
    setSwipeStepDirection(0);
    velocityRef.current = 0;
    pointerSampleRef.current = null;
    swipeStartRef.current = null;
    cancelSettleAnimation();
    activePointerTypeRef.current = null;
    stopSweep();
    syncPreviewToMood(mood);
  };

  const handleTunerNotchClick = (index: number, sourceElement: HTMLButtonElement) => {
    const progress = indexToProgress(index);
    const targetMood = MOOD_ORDER[index];

    cancelSettleAnimation();
    setTunerProgress(progress);
    velocityRef.current = 0;
    pointerSampleRef.current = null;
    setIsDragging(false);
    isDraggingRef.current = false;
    setIsSettling(true);
    setIsNotchSnapping(true);
    setLastActivatedNotchIndex(index);
    startSweep(progressToFrequency(progress), 1);

    schedule(() => {
      setIsNotchSnapping(false);
    }, NOTCH_SNAP_VISUAL_MS);

    schedule(() => {
      setIsSettling(false);
      commitMood(targetMood, { origin: getElementCenter(sourceElement) });
    }, 120);
  };

  const handleTunerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      event.currentTarget.focus();
      return;
    }

    const currentIndex = getMoodIndex(previewMood);

    if (event.key === 'Escape') {
      closePanel();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commitMood(previewMood, { origin: getTunerOrigin(dragProgressRef.current) });
      return;
    }

    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = clamp(currentIndex + 1, 0, MOOD_ORDER.length - 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = clamp(currentIndex - 1, 0, MOOD_ORDER.length - 1);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = MOOD_ORDER.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    setIsSettling(true);
    setLastActivatedNotchIndex(nextIndex);
    schedule(() => setIsSettling(false), 140);
    schedule(() => setLastActivatedNotchIndex(null), 190);
    setTunerProgress(indexToProgress(nextIndex));
  };

  const handleFallbackOptionKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (!isNoMotionMode) return;

    let targetIndex = index;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      targetIndex = clamp(index + 1, 0, MOOD_ORDER.length - 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      targetIndex = clamp(index - 1, 0, MOOD_ORDER.length - 1);
    } else if (event.key === 'Home') {
      targetIndex = 0;
    } else if (event.key === 'End') {
      targetIndex = MOOD_ORDER.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextMood = MOOD_ORDER[targetIndex];
    setPreviewMood(nextMood);
    previewMoodRef.current = nextMood;
    listOptionRefs.current[targetIndex]?.focus();
  };

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;

    const panel = panelDivRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (!active || !panel.contains(active)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (focusable.length === 1) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleListSelection = (newMood: MoodKey, sourceElement: HTMLButtonElement) => {
    commitMood(newMood, { origin: getElementCenter(sourceElement) });
  };

  const renderMoodOptions = () =>
    MOOD_ORDER.map((key, index) => {
      const m = MOODS[key];
      const isActive = key === mood;
      const isPreview = key === previewMood;
      return (
        <button
          key={key}
          ref={(button) => {
            listOptionRefs.current[index] = button;
          }}
          className={`mood-option ${isActive ? 'mood-option--active' : ''}`}
          onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
            handleListSelection(key, event.currentTarget);
          }}
          onFocus={() => {
            if (!isNoMotionMode) return;
            setPreviewMood(key);
            previewMoodRef.current = key;
          }}
          onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => {
            handleFallbackOptionKeyDown(event, index);
          }}
          role="radio"
          aria-checked={isActive}
          tabIndex={isNoMotionMode ? (isPreview ? 0 : -1) : 0}
          style={{ '--mood-color': m.color } as CSSProperties}
        >
          <span className="mood-swatch" style={{ background: m.color }} />
          <span className="mood-label">
            <span className="mood-emoji">{m.emoji}</span> {t(`common.mood.names.${key}`)}
          </span>
          {isActive && (
            <span className="mood-check" aria-hidden="true">
              ✓
            </span>
          )}
        </button>
      );
    });

  const renderDropdownSelector = () => (
    <>
      <div className="mood-panel-title">{t('common.mood.title')}</div>
      {renderMoodOptions()}
    </>
  );

  const renderNoMotionFallback = () => (
    <>
      <div className="mood-panel-title">{t('common.mood.title')}</div>
      <p className="mood-fallback-hint">{t('common.mood.tunerNoMotionFallback')}</p>
      {renderMoodOptions()}
    </>
  );

  const renderAnalogTunerSelector = () => {
    if (isNoMotionMode) return renderNoMotionFallback();

    const previewIndex = getMoodIndex(previewMood);
    const previewMoodLabel = t(`common.mood.names.${previewMood}`);
    const stationCode = MOOD_STATION_CODES[previewMood];
    const stationLabel = t(`common.mood.stations.${previewMood}`);
    const liveFrequency = progressToFrequency(dragProgress);
    const liveFrequencyLabel = `${liveFrequency.toFixed(1)} MHz`;
    const nearestIndex = progressToMoodIndex(dragProgress);
    const approachStrength = getApproachStrengthFromProgress(dragProgress);
    const signalStrength = getSignalStrengthFromProgress(dragProgress);
    const tunerStateLabel = isDragging
      ? t('common.mood.tunerStateAiming')
      : isSettling
      ? t('common.mood.tunerStateSettling')
      : t('common.mood.tunerStateReady');

    return (
      <>
        <div className="mood-panel-title mood-panel-title--tuner">
          <span className="mood-panel-title-main">{t('common.mood.tunerTitle')}</span>
          <span className="mood-panel-title-sub">{t('common.mood.tunerSubtitle')}</span>
        </div>

        <div
          className={`mood-tuner-shell${isVerticalTuner ? ' mood-tuner-shell--vertical-layout' : ''}${
            isDragging || isSettling ? ' mood-tuner-shell--active' : ''
          }${isCommitFeedbackActive ? ' mood-tuner-shell--lock-flare' : ''}`}
          style={{ '--mood-color': MOODS[previewMood].color } as CSSProperties}
        >
          <div
            className={`mood-tuner-display${isCommitFeedbackActive ? ' mood-tuner-display--commit' : ''}`}
            aria-hidden="true"
          >
            <div className="mood-tuner-display-row mood-tuner-display-row--top">
              <span className="mood-tuner-display-band">FM</span>
              <span className="mood-tuner-display-mode">{t('common.mood.tunerDisplayMode')}</span>
              <span className="mood-tuner-display-state">{tunerStateLabel}</span>
            </div>
            <div className="mood-tuner-display-row mood-tuner-display-row--main">
              <span className="mood-tuner-display-value">{liveFrequencyLabel}</span>
              <span className="mood-tuner-display-divider" aria-hidden="true" />
              <span className="mood-tuner-display-mood">
                {MOODS[previewMood].emoji} {previewMoodLabel}
              </span>
            </div>
            <div className="mood-tuner-display-row mood-tuner-display-row--meta">
              <span className="mood-tuner-display-station">{stationCode}</span>
              <span className="mood-tuner-display-station-name">{stationLabel}</span>
              <span className="mood-tuner-display-signal-label">{t('common.mood.tunerSignalLabel')}</span>
              <span className="mood-tuner-display-signal" aria-hidden="true">
                <span
                  className="mood-tuner-display-signal-fill"
                  style={{ transform: `scaleX(${signalStrength})` }}
                />
              </span>
            </div>
            <div className="mood-tuner-display-rail" aria-hidden="true">
              <span className="mood-tuner-display-ticks">
                {DISPLAY_TICK_STOPS.map((stop, index) => {
                  const tickDistance = Math.abs(dragProgress - stop);
                  return (
                    <span
                      key={`tick-${index}`}
                      className={`mood-tuner-display-tick${index % 4 === 0 ? ' mood-tuner-display-tick--major' : ''}`}
                      style={
                        {
                          '--tick-stop': stop,
                          '--tick-intensity': clamp(1 - tickDistance / 0.22, 0, 1),
                        } as CSSProperties
                      }
                    />
                  );
                })}
              </span>
              <span
                className="mood-tuner-display-rail-fill"
                style={{ transform: `scaleX(${dragProgress})` }}
              />
            </div>
          </div>
          <span className="mood-tuner-lock-bokeh" aria-hidden="true" />

          <div
            ref={tunerRulerRef}
            className={`mood-tuner ${isVerticalTuner ? 'mood-tuner--vertical' : 'mood-tuner--horizontal'}${
              isDragging ? ' mood-tuner--dragging' : ''
            }${isSettling ? ' mood-tuner--settling' : ''}${
              isNotchSnapping ? ' mood-tuner--notch-snapping' : ''
            }${approachStrength > 0.08 ? ' mood-tuner--approaching' : ''}${
              swipeStepDirection !== 0 ? ' mood-tuner--swipe-step' : ''
            }`}
            role="slider"
            aria-label={t('common.mood.tunerAriaLabel')}
            aria-valuemin={0}
            aria-valuemax={MOOD_ORDER.length - 1}
            aria-valuenow={previewIndex}
            aria-valuetext={t('common.mood.tunerValueDetailed', {
              mood: previewMoodLabel,
              frequency: liveFrequency.toFixed(1),
              station: stationCode,
            })}
            tabIndex={0}
            onKeyDown={handleTunerKeyDown}
            onPointerDown={handleTunerPointerDown}
            onPointerMove={handleTunerPointerMove}
            onPointerUp={handleTunerPointerUp}
            onPointerCancel={handleTunerPointerCancel}
            style={
              {
                '--tuner-progress': dragProgress,
                '--tuner-approach': approachStrength,
              } as CSSProperties
            }
          >
            <div className="mood-tuner-track" aria-hidden="true" />
            <div className="mood-tuner-indicator" aria-hidden="true" />

            {MOOD_ORDER.map((key, index) => {
              const m = MOODS[key];
              const isPreview = key === previewMood;
              const isCurrent = key === mood;
              const isNearest = index === nearestIndex;
              const isPulse = index === lastActivatedNotchIndex;
              const isHovered = index === hoveredNotchIndex && !isCurrent;

              return (
                <button
                  key={key}
                  type="button"
                  className={`mood-tuner-notch${isPreview ? ' mood-tuner-notch--preview' : ''}${
                    isCurrent ? ' mood-tuner-notch--current' : ''
                  }${isNearest ? ' mood-tuner-notch--nearest' : ''}${
                    isPulse ? ' mood-tuner-notch--pulse' : ''
                  }${isHovered ? ' mood-tuner-notch--hovered' : ''}`}
                  style={
                    {
                      '--tuner-stop': indexToProgress(index),
                      '--mood-color': m.color,
                    } as CSSProperties
                  }
                  onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                  }}
                  onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    handleTunerNotchClick(index, event.currentTarget);
                  }}
                  onMouseEnter={() => {
                    if (key === mood) return;
                    setHoveredNotchIndex(index);
                  }}
                  onMouseLeave={() => {
                    setHoveredNotchIndex((previous) => (previous === index ? null : previous));
                  }}
                  onFocus={() => {
                    if (key === mood) return;
                    setHoveredNotchIndex(index);
                  }}
                  onBlur={() => {
                    setHoveredNotchIndex((previous) => (previous === index ? null : previous));
                  }}
                  tabIndex={-1}
                  aria-label={t('common.mood.tunerNotchAria', {
                    mood: t(`common.mood.names.${key}`),
                  })}
                >
                  <span className="mood-tuner-notch-dot" aria-hidden="true" />
                  <span className="mood-tuner-notch-label" aria-hidden="true">
                    {m.emoji}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mood-tuner-help">
            {t('common.mood.tunerHelpDrag')} {t('common.mood.tunerHelpKeyboard')}{' '}
            {t('common.mood.tunerHelpSwipe')}
          </p>
        </div>
      </>
    );
  };

  const renderActiveSelector = () => {
    const renderers: Record<SelectorMode, () => ReactElement> = {
      dropdown: renderDropdownSelector,
      rotaryCylinder: renderDropdownSelector, // TODO: implement
      hexGrid: renderDropdownSelector, // TODO: implement
      analogTuner: renderAnalogTunerSelector,
    };

    return renderers[ACTIVE_SELECTOR_MODE]();
  };

  const currentMood = MOODS[mood];
  const currentMoodLabel = t(`common.mood.names.${mood}`);
  const buttonTooltip = isContrastMode
    ? t('common.mood.contrastModeDisabled')
    : t('common.mood.tooltip', { mood: currentMoodLabel });

  return (
    <div className="mood-switcher-wrapper" ref={panelRef}>
      {/* Bouton icône */}
      <Tooltip text={buttonTooltip} position="bottom">
        <button
          className="header-action-btn mood-btn"
          onClick={() => !isContrastMode && setIsOpen((prev) => !prev)}
          aria-label={t('common.mood.ariaLabel')}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          disabled={isContrastMode}
          title={isContrastMode ? t('common.mood.contrastModeDisabled') : undefined}
        >
          <svg
            key={spinKey}
            className={`mood-icon${spinKey > 0 ? ' mood-icon--spin' : ''}`}
            viewBox="0 0 24 24"
            width="17"
            height="17"
            aria-hidden="true"
          >
            {/* Orbe central — couleur = mood actif */}
            <circle
              className="mood-orb"
              cx="12"
              cy="12"
              r="5"
              fill={currentMood.color}
              stroke={currentMood.color}
              strokeWidth="0.5"
              strokeOpacity="0.6"
            />
            {/* 6 satellites orbitaux — hexagone régulier (r=9.5, centre 12,12) */}
            <circle
              className="mood-dot mood-dot--1"
              cx="12"
              cy="2.5"
              r="1.5"
              fill={MOODS.default.color}
              opacity={mood === 'default' ? 1 : 0.35}
            />
            <circle
              className="mood-dot mood-dot--2"
              cx="20.2"
              cy="7.25"
              r="1.5"
              fill={MOODS.hacker.color}
              opacity={mood === 'hacker' ? 1 : 0.35}
            />
            <circle
              className="mood-dot mood-dot--3"
              cx="20.2"
              cy="16.75"
              r="1.5"
              fill={MOODS.vaporwave.color}
              opacity={mood === 'vaporwave' ? 1 : 0.35}
            />
            <circle
              className="mood-dot mood-dot--4"
              cx="12"
              cy="21.5"
              r="1.5"
              fill={MOODS.europa.color}
              opacity={mood === 'europa' ? 1 : 0.35}
            />
            <circle
              className="mood-dot mood-dot--5"
              cx="3.8"
              cy="16.75"
              r="1.5"
              fill={MOODS.industrial.color}
              opacity={mood === 'industrial' ? 1 : 0.35}
            />
            <circle
              className="mood-dot mood-dot--6"
              cx="3.8"
              cy="7.25"
              r="1.5"
              fill={MOODS.nightshade.color}
              opacity={mood === 'nightshade' ? 1 : 0.35}
            />
            {/* Orbite ring */}
            <circle
              cx="12"
              cy="12"
              r="9.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="3 3"
              opacity="0.25"
            />
          </svg>
        </button>
      </Tooltip>

      {/* Panneau de sélection */}
      {isOpen &&
        createPortal(
          <div
            ref={panelDivRef}
            className={`mood-panel mood-panel--${ACTIVE_SELECTOR_MODE}${
              isVerticalTuner ? ' mood-panel--vertical-layout' : ''
            }`}
            role="dialog"
            aria-modal="true"
            aria-label={t('common.mood.chooseAria')}
            tabIndex={-1}
            onKeyDown={handlePanelKeyDown}
            style={
              panelPos
                ? {
                    top: `${panelPos.top}px`,
                    left: `${panelPos.left}px`,
                  }
                : {}
            }
          >
            {renderActiveSelector()}
            <span className="mood-sr-only" role="status" aria-live="polite">
              {announcement}
            </span>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MoodSwitcher;
