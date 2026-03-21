/**
 * OccasionalCommuter — Mood-specific commuters
 * Dynamically selects from 30+ commuters based on active mood
 * 
 * Spawns every 15s-35s (adaptive by page density) with visual mood matching
 * Supports test mode: window.testAllCommuters()
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { COMMUTER_FLEET, CommuterConfig } from './commutersConfig';

/* ─── Constantes de timing ─── */

const MIN_DELAY_MS = 15_000;
const MAX_DELAY_MS = 35_000;
const FIRST_DELAY_MS = 12_000;
const BUFFER_MS = 1_000;
const SPAWN_PADDING_PX = 18;
const MIN_VERTICAL_GAP_PX = 72;
const TOP_PICK_ATTEMPTS = 16;
const TOP_SAMPLE_COUNT = 24;
const RECENT_HISTORY_SIZE = 4;

type CommuterDirection = 'ltr' | 'rtl';

/* ─── Helpers ─── */

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const pickRandomDirection = (): CommuterDirection => (Math.random() < 0.5 ? 'ltr' : 'rtl');

const pickCommuterWithVariety = (
  mood: string,
  activeCommuterNames: Set<string>,
  recentCommuterNames: string[]
): CommuterConfig | null => {
  const fleet = COMMUTER_FLEET[mood];
  if (!fleet || fleet.length === 0) return null;

  const nonActivePool = fleet.filter((commuter) => !activeCommuterNames.has(commuter.name));
  const activeAwarePool = nonActivePool.length > 0 ? nonActivePool : fleet;

  const nonRecentPool = activeAwarePool.filter((commuter) => !recentCommuterNames.includes(commuter.name));
  const finalPool = nonRecentPool.length > 0 ? nonRecentPool : activeAwarePool;

  return finalPool[Math.floor(Math.random() * finalPool.length)] ?? null;
};

const getPageDensityFactor = (): number => {
  const viewportHeight = Math.max(window.innerHeight, 1);
  const pageHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    viewportHeight
  );
  const pageScreens = pageHeight / viewportHeight;

  if (pageScreens <= 2.2) return 1;
  return Math.min(2.25, 1 + (pageScreens - 2.2) * 0.18);
};

const getAdaptiveDelay = (baseDelayMs: number): number => {
  return Math.round(baseDelayMs / getPageDensityFactor());
};

const pickCommuterTopPx = (activeTopValues: number[] = []): number => {
  const scrollTop = window.scrollY;
  const viewportHeight = window.innerHeight;
  const viewportBottom = scrollTop + viewportHeight;

  const header = document.querySelector('header');
  const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;

  let minY = scrollTop + headerHeight + SPAWN_PADDING_PX;
  let maxY = viewportBottom - SPAWN_PADDING_PX;

  const footer = document.querySelector('footer');
  if (footer instanceof HTMLElement) {
    const footerRect = footer.getBoundingClientRect();
    if (footerRect.top < viewportHeight) {
      const footerTopAbsolute = scrollTop + Math.max(0, footerRect.top);
      maxY = Math.min(maxY, footerTopAbsolute - SPAWN_PADDING_PX);
    }
  }

  if (maxY <= minY) {
    const fallbackY = scrollTop + Math.max(headerHeight + SPAWN_PADDING_PX, viewportHeight * 0.45);
    return Math.round(fallbackY);
  }

  const clampedActiveTopValues = activeTopValues
    .map((top) => clamp(top, minY, maxY))
    .filter((top, index, arr) => Number.isFinite(top) && arr.indexOf(top) === index);

  for (let attempt = 0; attempt < TOP_PICK_ATTEMPTS; attempt++) {
    const candidate = randomBetween(minY, maxY);
    const tooClose = clampedActiveTopValues.some((activeTop) =>
      Math.abs(activeTop - candidate) < MIN_VERTICAL_GAP_PX
    );
    if (!tooClose) {
      return Math.round(candidate);
    }
  }

  let bestCandidate = randomBetween(minY, maxY);
  let bestDistance = -1;

  for (let i = 0; i < TOP_SAMPLE_COUNT; i++) {
    const candidate = randomBetween(minY, maxY);
    const nearestDistance =
      clampedActiveTopValues.length === 0
        ? Number.POSITIVE_INFINITY
        : Math.min(...clampedActiveTopValues.map((activeTop) => Math.abs(activeTop - candidate)));

    if (nearestDistance > bestDistance) {
      bestDistance = nearestDistance;
      bestCandidate = candidate;
    }
  }

  return Math.round(bestCandidate);
};

/* ─── CommuterVehicle sub-component ─── */

const CommuterVehicle = ({
  config,
  duration,
  preview,
  direction,
  top,
}: {
  config: CommuterConfig;
  duration: number;
  preview: boolean;
  direction: CommuterDirection;
  top: number;
}) => {
  const divRef = useRef<any>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setAnimating(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const SVGComponent = config.component;
  const cssClass = animating ? config.className : '';

  return (
    <div
      ref={divRef}
      className={
        preview
          ? 'ambient-commuter ambient-commuter--preview'
          : `ambient-commuter commuter-spacecraft ambient-commuter--${direction}`
      }
      style={
        preview
          ? {
              top,
              left: '50%',
              opacity: 0.9,
              animation: 'none',
              transform: 'translateX(-50%)',
            }
          : animating
            ? { top, animationDuration: `${duration}s` }
            : { top }
      }
      aria-hidden="true"
    >
      <div className={`${cssClass} ${direction === 'rtl' ? 'ambient-commuter__payload--rtl' : ''}`.trim()}>
        <SVGComponent />
      </div>
    </div>
  );
};

/* ─── Main component ─── */

const OccasionalCommuter = () => {
  const { mood } = useMood();
  const [vehicles, setVehicles] = useState<{
    config: CommuterConfig;
    duration: number;
    preview: boolean;
    id: string;
    direction: CommuterDirection;
    top: number;
  }[]>([]);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const testTimersRef = useRef<number[]>([]);
  const vehicleTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const latestSpawnRef = useRef<(configOverride?: CommuterConfig) => void>(() => {});
  const vehiclesRef = useRef(vehicles);
  const recentCommuterNamesRef = useRef<string[]>([]);
  const mountedRef = useRef(true);
  const nextIdRef = useRef(0);

  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  const clearTestTimers = useCallback(() => {
    testTimersRef.current.forEach((id) => clearTimeout(id));
    testTimersRef.current = [];
  }, []);

  const clearAllTimers = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    vehicleTimersRef.current.forEach((timer) => clearTimeout(timer));
    vehicleTimersRef.current.clear();
    spawnTimerRef.current = null;
  }, []);

  const removeVehicle = useCallback((vehicleId: string) => {
    if (!mountedRef.current) return;
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    vehicleTimersRef.current.delete(vehicleId);
  }, []);

  const scheduleNextSpawn = useCallback(() => {
    if (!mountedRef.current) return;
    const delay = randomBetween(getAdaptiveDelay(MIN_DELAY_MS), getAdaptiveDelay(MAX_DELAY_MS));
    spawnTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      latestSpawnRef.current();
    }, delay);
  }, []);

  const spawnVehicle = useCallback(
    (configOverride?: CommuterConfig, preview = false) => {
      if (!mountedRef.current) return;

      const activeCommuterNames = new Set(vehiclesRef.current.map((vehicle) => vehicle.config.name));
      const commuterConfig =
        configOverride ||
        pickCommuterWithVariety(mood, activeCommuterNames, recentCommuterNamesRef.current);
      if (!commuterConfig) {
        console.warn(`No commuters available for mood: ${mood}`);
        scheduleNextSpawn();
        return;
      }

      recentCommuterNamesRef.current = [...recentCommuterNamesRef.current, commuterConfig.name].slice(
        -RECENT_HISTORY_SIZE
      );

      const activeTopValues = vehiclesRef.current.map((vehicle) => vehicle.top);
      const vehicleId = `commuter-${nextIdRef.current++}`;
      const duration = commuterConfig.duration;
      const direction = preview ? 'ltr' : pickRandomDirection();
      const top = pickCommuterTopPx(activeTopValues);
      const newVehicle = { config: commuterConfig, duration, preview, id: vehicleId, direction, top };
      
      setVehicles((prev) => [...prev, newVehicle]);

      if (preview) {
        const timer = setTimeout(() => {
          removeVehicle(vehicleId);
        }, Math.min(duration * 1000, 2800));
        vehicleTimersRef.current.set(vehicleId, timer);
        return;
      }

      const timer = setTimeout(() => {
        removeVehicle(vehicleId);
      }, duration * 1000 + BUFFER_MS);
      vehicleTimersRef.current.set(vehicleId, timer);

      // Schedule next spawn immediately without waiting for this one to finish
      scheduleNextSpawn();
    },
    [mood, removeVehicle, scheduleNextSpawn]
  );

  useEffect(() => {
    latestSpawnRef.current = spawnVehicle;
  }, [spawnVehicle]);

  // Initial spawn
  useEffect(() => {
    mountedRef.current = true;
    spawnTimerRef.current = setTimeout(() => {
      spawnVehicle();
    }, getAdaptiveDelay(FIRST_DELAY_MS));

    return () => {
      mountedRef.current = false;
      clearAllTimers();
    };
  }, [spawnVehicle, clearAllTimers]);

  // Pet easter egg
  useEffect(() => {
    if (vehicles.length > 0) {
      const t = setTimeout(() => window.petReact?.('excited'), 3000);
      return () => clearTimeout(t);
    }
  }, [vehicles]);

  // Console API: spawn specific commuter
  useEffect(() => {
    (window as any).spawnCommuter = (config?: CommuterConfig) => spawnVehicle(config);
    return () => {
      delete (window as any).spawnCommuter;
    };
  }, [spawnVehicle]);

  // Console API: test all 30 commuters in sequence
  useEffect(() => {
    (window as any).testAllCommuters = (delayBetweenMs: number = 4000) => {
      console.log('🎭 Starting commuter test cycle (all 30 commuters)...\n');
      clearAllTimers();
      clearTestTimers();
      const moods = Object.keys(COMMUTER_FLEET) as string[];
      let totalDelay = 1000;

      moods.forEach((m) => {
        const fleet = COMMUTER_FLEET[m];
        fleet.forEach((config) => {
          const timerId = window.setTimeout(() => {
            console.log(`  → ${m.toUpperCase().padEnd(12)} — ${config.name.padEnd(18)} (${config.duration}s)`);
            spawnVehicle(config, true);
          }, totalDelay);
          testTimersRef.current.push(timerId);
          totalDelay += delayBetweenMs;
        });
      });

      console.log(`\n📊 Cycle will complete in ~${(totalDelay / 1000).toFixed(1)}s`);
      return 'Commuter preview cycle started';
    };

    (window as any).stopCommuterTest = () => {
      clearTestTimers();
      clearAllTimers();
      setVehicles([]);
      console.log('🛑 Commuter preview cycle stopped');
    };

    return () => {
      delete (window as any).testAllCommuters;
      delete (window as any).stopCommuterTest;
    };
  }, [spawnVehicle, clearAllTimers, clearTestTimers]);

  return createPortal(
    <>
      {vehicles.map((vehicle) => (
        <CommuterVehicle
          key={vehicle.id}
          config={vehicle.config}
          duration={vehicle.duration}
          preview={vehicle.preview}
          direction={vehicle.direction}
          top={vehicle.top}
        />
      ))}
    </>,
    document.getElementById('ambient-root') || document.body
  );
};

export default OccasionalCommuter;
