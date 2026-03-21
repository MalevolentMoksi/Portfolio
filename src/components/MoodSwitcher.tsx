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
import Tooltip from './Tooltip';
import type { MoodKey } from '@/types';

type SelectorMode = 'dropdown' | 'rotaryCylinder' | 'hexGrid' | 'analogTuner';
type TransitionMode = 'vhs' | 'circleReveal';

const ACTIVE_SELECTOR_MODE = 'analogTuner' as SelectorMode;
const ACTIVE_TRANSITION_MODE = 'circleReveal' as TransitionMode;

const CIRCLE_REVEAL_DURATION_MS = 620;
const VHS_DURATION_MS = 200;
const VHS_FLIP_DELAY_MS = 60;

const TUNER_COAST_FACTOR = 10;
const TUNER_FRICTION = 0.82;
const TUNER_SPRING = 0.24;
const TUNER_SETTLE_MAX_MS = 540;
const TUNER_SETTLE_MIN_ERROR = 0.002;
const TUNER_SETTLE_MIN_VELOCITY = 0.0015;
const TUNER_MAX_VELOCITY = 0.08;
const TUNER_RESISTANCE_RADIUS = 0.14;
const TUNER_RESISTANCE_STRENGTH = 0.58;

interface Point {
  x: number;
  y: number;
}

interface CommitMoodOptions {
  delayBeforeCommit?: number;
  origin?: Point;
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
  const { settings: a11ySettings } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [previewMood, setPreviewMood] = useState<MoodKey>(mood);
  const [dragProgress, setDragProgress] = useState<number>(() => indexToProgress(getMoodIndex(mood)));
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
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
  const settleRafRef = useRef<number | null>(null);
  const velocityRef = useRef(0);
  const pointerSampleRef = useRef<{ progress: number; time: number } | null>(null);
  const dragProgressRef = useRef(dragProgress);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);

  const isContrastMode = a11ySettings.highContrast;
  const isNoMotionMode = a11ySettings.noMotion;

  const syncPreviewToMood = useCallback((targetMood: MoodKey) => {
    const nextProgress = indexToProgress(getMoodIndex(targetMood));
    setPreviewMood(targetMood);
    setDragProgress(nextProgress);
    dragProgressRef.current = nextProgress;
  }, []);

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
    const perfTier = document.body.getAttribute('data-perf-tier');
    if (perfTier === 'low') return 'vhs';
    if (typeof CSS === 'undefined' || !CSS.supports('clip-path', 'circle(20px at 50% 50%)')) {
      return 'vhs';
    }
    return ACTIVE_TRANSITION_MODE;
  }, []);

  const runViewCircleTransition = useCallback(
    (newMood: MoodKey, origin: Point): boolean => {
      if (typeof document.startViewTransition !== 'function') return false;

      const sanitizedOrigin = sanitizeTransitionOrigin(origin);

      const root = document.documentElement;
      root.style.setProperty('--mood-reveal-origin-x', `${sanitizedOrigin.x}px`);
      root.style.setProperty('--mood-reveal-origin-y', `${sanitizedOrigin.y}px`);
      root.style.setProperty('--mood-reveal-duration-ms', `${CIRCLE_REVEAL_DURATION_MS}ms`);
      root.classList.add('mood-view-transition-active');

      const transition = document.startViewTransition(() => {
        setMood(newMood);
        setAnnouncement(
          t('common.mood.tunerCommitted', {
            mood: t(`common.mood.names.${newMood}`),
          })
        );
      });

      transition.finished.finally(() => {
        root.classList.remove('mood-view-transition-active');
        root.style.removeProperty('--mood-reveal-origin-x');
        root.style.removeProperty('--mood-reveal-origin-y');
        root.style.removeProperty('--mood-reveal-duration-ms');
      });

      return true;
    },
    [setMood, t]
  );

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);

    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const clearScheduledTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
    cancelSettleAnimation();
    clearTransitionOverlays();
  }, [cancelSettleAnimation, clearTransitionOverlays]);

  const closePanel = useCallback(() => {
    cancelSettleAnimation();
    setIsDragging(false);
    setIsSettling(false);
    setIsOpen(false);
  }, [cancelSettleAnimation]);

  const commitMood = useCallback(
    (newMood: MoodKey, options?: CommitMoodOptions) => {
      const delayBeforeCommit = options?.delayBeforeCommit ?? 0;
      const origin = options?.origin;

      const runCommit = () => {
        if (newMood !== mood) {
          const shouldSkipTransitions =
            isNoMotionMode || document.body.classList.contains('a11y--reduce-effects');

          if (shouldSkipTransitions) {
            setMood(newMood);
            setAnnouncement(
              t('common.mood.tunerCommitted', {
                mood: t(`common.mood.names.${newMood}`),
              })
            );
          } else {
            const transitionMode = resolveTransitionMode();
            if (transitionMode === 'circleReveal') {
              const hasViewTransition = runViewCircleTransition(newMood, origin ?? getFallbackOrigin());
              if (!hasViewTransition) {
                const fallbackOverlay = registerTransitionOverlay(createVhsOverlay(newMood));
                schedule(() => {
                  setMood(newMood);
                  setAnnouncement(
                    t('common.mood.tunerCommitted', {
                      mood: t(`common.mood.names.${newMood}`),
                    })
                  );
                }, VHS_FLIP_DELAY_MS);
                schedule(() => {
                  removeTransitionOverlay(fallbackOverlay);
                }, VHS_DURATION_MS);
              }
            } else {
              const overlay = registerTransitionOverlay(createVhsOverlay(newMood));
              schedule(() => {
                setMood(newMood);
                setAnnouncement(
                  t('common.mood.tunerCommitted', {
                    mood: t(`common.mood.names.${newMood}`),
                  })
                );
              }, VHS_FLIP_DELAY_MS);
              schedule(() => {
                removeTransitionOverlay(overlay);
              }, VHS_DURATION_MS);
            }
          }

          setSpinKey((key) => key + 1);
        }

        closePanel();
      };

      if (delayBeforeCommit > 0) {
        schedule(runCommit, delayBeforeCommit);
      } else {
        runCommit();
      }
    },
    [
      closePanel,
      getFallbackOrigin,
      isNoMotionMode,
      mood,
      registerTransitionOverlay,
      removeTransitionOverlay,
      resolveTransitionMode,
      runViewCircleTransition,
      schedule,
      setMood,
      t,
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

    const updatePanelPosition = () => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      setPanelPos({
        top: Math.max(12, rect.bottom + 12),
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };

    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);

    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !panelDivRef.current) return;
    schedule(() => panelDivRef.current?.focus(), 0);
  }, [isOpen, schedule]);

  useEffect(() => {
    dragProgressRef.current = dragProgress;
  }, [dragProgress]);

  useEffect(() => {
    if (!isOpen) return;
    syncPreviewToMood(mood);
    setIsDragging(false);
    setIsSettling(false);
  }, [isOpen, mood, syncPreviewToMood]);

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
    const nextIndex = progressToMoodIndex(clampedProgress);
    const nextMood = MOOD_ORDER[nextIndex];

    setDragProgress(clampedProgress);
    dragProgressRef.current = clampedProgress;
    setPreviewMood(nextMood);
  }, []);

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

      const step = (time: number) => {
        const elapsed = time - startedAt;
        const error = targetProgress - progress;

        velocity = velocity * TUNER_FRICTION + error * TUNER_SPRING;
        velocity = clamp(velocity, -TUNER_MAX_VELOCITY, TUNER_MAX_VELOCITY);
        progress = clamp(progress + velocity, 0, 1);

        setTunerProgress(progress);

        const hasSettled =
          elapsed >= TUNER_SETTLE_MAX_MS ||
          (Math.abs(error) < TUNER_SETTLE_MIN_ERROR &&
            Math.abs(velocity) < TUNER_SETTLE_MIN_VELOCITY);

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
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    setIsSettling(false);
    velocityRef.current = 0;

    const nextProgress = getProgressFromPointer(event.clientX, event.clientY);
    pointerSampleRef.current = { progress: nextProgress, time: performance.now() };
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
    setIsSettling(false);
    velocityRef.current = 0;
    pointerSampleRef.current = null;
    cancelSettleAnimation();
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
    setIsSettling(true);

    schedule(() => {
      setIsSettling(false);
      commitMood(targetMood, { origin: getElementCenter(sourceElement) });
    }, 120);
  };

  const handleTunerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
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
    schedule(() => setIsSettling(false), 140);
    setTunerProgress(indexToProgress(nextIndex));
  };

  const handleListSelection = (newMood: MoodKey, sourceElement: HTMLButtonElement) => {
    commitMood(newMood, { origin: getElementCenter(sourceElement) });
  };

  const renderMoodOptions = () =>
    MOOD_ORDER.map((key) => {
      const m = MOODS[key];
      const isActive = key === mood;
      return (
        <button
          key={key}
          className={`mood-option ${isActive ? 'mood-option--active' : ''}`}
          onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
            handleListSelection(key, event.currentTarget);
          }}
          role="radio"
          aria-checked={isActive}
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

    return (
      <>
        <div className="mood-panel-title">{t('common.mood.tunerTitle')}</div>

        <div className="mood-tuner-shell" style={{ '--mood-color': MOODS[previewMood].color } as CSSProperties}>
          <div className="mood-tuner-display" aria-hidden="true">
            <span className="mood-tuner-display-band">FM</span>
            <span className="mood-tuner-display-value">{`${String(previewIndex + 1).padStart(2, '0')}.0`}</span>
            <span className="mood-tuner-display-mood">
              {MOODS[previewMood].emoji} {previewMoodLabel}
            </span>
          </div>

          <div
            ref={tunerRulerRef}
            className={`mood-tuner ${isVerticalTuner ? 'mood-tuner--vertical' : 'mood-tuner--horizontal'}${
              isDragging ? ' mood-tuner--dragging' : ''
            }${isSettling ? ' mood-tuner--settling' : ''}`}
            role="slider"
            aria-label={t('common.mood.tunerAriaLabel')}
            aria-valuemin={0}
            aria-valuemax={MOOD_ORDER.length - 1}
            aria-valuenow={previewIndex}
            aria-valuetext={t('common.mood.tunerValue', { mood: previewMoodLabel })}
            tabIndex={0}
            onKeyDown={handleTunerKeyDown}
            onPointerDown={handleTunerPointerDown}
            onPointerMove={handleTunerPointerMove}
            onPointerUp={handleTunerPointerUp}
            onPointerCancel={handleTunerPointerCancel}
            style={{ '--tuner-progress': dragProgress } as CSSProperties}
          >
            <div className="mood-tuner-track" aria-hidden="true" />
            <div className="mood-tuner-indicator" aria-hidden="true" />

            {MOOD_ORDER.map((key, index) => {
              const m = MOODS[key];
              const isPreview = key === previewMood;
              const isCurrent = key === mood;

              return (
                <button
                  key={key}
                  type="button"
                  className={`mood-tuner-notch${isPreview ? ' mood-tuner-notch--preview' : ''}${
                    isCurrent ? ' mood-tuner-notch--current' : ''
                  }`}
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
            {t('common.mood.tunerHelpDrag')} {t('common.mood.tunerHelpKeyboard')}
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
            className={`mood-panel mood-panel--${ACTIVE_SELECTOR_MODE}`}
            role="dialog"
            aria-label={t('common.mood.chooseAria')}
            tabIndex={-1}
            style={
              panelPos
                ? {
                    top: `${panelPos.top}px`,
                    right: `${panelPos.right}px`,
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
