/**
 * OccasionalCommuter — Mood-specific commuters
 * Dynamically selects from 30+ commuters based on active mood
 * 
 * Spawns every 30s-60s with visual mood matching
 * Supports test mode: window.testAllCommuters()
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMood } from '@/contexts/MoodContext';
import { COMMUTER_FLEET, CommuterConfig, getRandomCommuter } from './commutersConfig';

/* ─── Constantes de timing ─── */

const MIN_DELAY_MS = 30_000;
const MAX_DELAY_MS = 60_000;
const FIRST_DELAY_MS = 20_000;
const BUFFER_MS = 1_000;
const SPAWN_PADDING_PX = 18;

/* ─── Helpers ─── */

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

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

const pickCommuterTopPx = (): string => {
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
    return `${Math.round(fallbackY)}px`;
  }

  return `${Math.round(randomBetween(minY, maxY))}px`;
};

/* ─── CommuterVehicle sub-component ─── */

const CommuterVehicle = ({
  config,
  duration,
  preview,
}: {
  config: CommuterConfig;
  duration: number;
  preview: boolean;
}) => {
  const divRef = useRef<any>(null);
  const [animating, setAnimating] = useState(false);

  const topPx = pickCommuterTopPx();

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
      className={preview ? 'ambient-commuter ambient-commuter--preview' : 'ambient-commuter commuter-spacecraft'}
      style={
        preview
          ? {
              top: topPx,
              left: '50%',
              opacity: 0.9,
              animation: 'none',
              transform: 'translateX(-50%)',
            }
          : animating
            ? { top: topPx, animationDuration: `${duration}s` }
            : { top: topPx }
      }
      aria-hidden="true"
    >
      <div className={cssClass}>
        <SVGComponent />
      </div>
    </div>
  );
};

/* ─── Main component ─── */

const OccasionalCommuter = () => {
  const { mood } = useMood();
  const [vehicle, setVehicle] = useState<{
    config: CommuterConfig;
    duration: number;
    key: number;
    preview: boolean;
  } | null>(null);
  const spawnTimerRef = useRef<any>(null);
  const lifetimeTimerRef = useRef<any>(null);
  const testTimersRef = useRef<number[]>([]);
  const latestSpawnRef = useRef<(configOverride?: CommuterConfig) => void>(() => {});
  const mountedRef = useRef(true);

  const clearTestTimers = useCallback(() => {
    testTimersRef.current.forEach((id) => clearTimeout(id));
    testTimersRef.current = [];
  }, []);

  const clearAllTimers = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (lifetimeTimerRef.current) clearTimeout(lifetimeTimerRef.current);
    spawnTimerRef.current = null;
    lifetimeTimerRef.current = null;
  }, []);

  const despawnAndSchedule = useCallback(() => {
    if (!mountedRef.current) return;
    setVehicle(null);
    if (lifetimeTimerRef.current) clearTimeout(lifetimeTimerRef.current);
    const delay = randomBetween(getAdaptiveDelay(MIN_DELAY_MS), getAdaptiveDelay(MAX_DELAY_MS));
    spawnTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      latestSpawnRef.current();
    }, delay);
  }, []);

  const spawnVehicle = useCallback(
    (configOverride?: CommuterConfig, preview = false) => {
      if (!mountedRef.current) return;
      clearAllTimers();

      const commuterConfig = configOverride || getRandomCommuter(mood);
      if (!commuterConfig) {
        console.warn(`No commuters available for mood: ${mood}`);
        despawnAndSchedule();
        return;
      }

      const duration = commuterConfig.duration;
      setVehicle({ config: commuterConfig, duration, key: Date.now(), preview });

      if (preview) {
        lifetimeTimerRef.current = setTimeout(() => {
          setVehicle(null);
        }, Math.min(duration * 1000, 2800));
        return;
      }

      lifetimeTimerRef.current = setTimeout(() => {
        despawnAndSchedule();
      }, duration * 1000 + BUFFER_MS);
    },
    [mood, clearAllTimers, despawnAndSchedule]
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
  }, []);

  // Pet easter egg
  useEffect(() => {
    if (vehicle) {
      const t = setTimeout(() => window.petReact?.('excited'), 3000);
      return () => clearTimeout(t);
    }
  }, [vehicle]);

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
      setVehicle(null);
      console.log('🛑 Commuter preview cycle stopped');
    };

    return () => {
      delete (window as any).testAllCommuters;
      delete (window as any).stopCommuterTest;
    };
  }, [spawnVehicle, clearAllTimers, clearTestTimers]);

  if (!vehicle) return null;

  return createPortal(
    <CommuterVehicle
      key={vehicle.key}
      config={vehicle.config}
      duration={vehicle.duration}
      preview={vehicle.preview}
    />,
    document.getElementById('ambient-root') || document.body
  );
};

export default OccasionalCommuter;
