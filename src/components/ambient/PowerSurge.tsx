/**
 * PowerSurge — Effet de surtension pour le mood Industrial.
 *
 * Toutes les 22–34 secondes, ajoute brièvement la classe `.power-surge-active`
 * sur la scène de mood (et body en compat). Le CSS correspondant (_mood-switcher.css) fait baisser
 * la luminosité de main/header puis la ramène d'un coup — simulant une
 * alimentation instable typique d'un complexe industriel.
 *
 * Se désactive automatiquement quand le mood n'est pas 'industrial'.
 */

import { useEffect, useRef } from 'react';
import { useMood } from '@/contexts/MoodContext';

const SURGE_MIN_MS = 22_000; // 22 s
const SURGE_MAX_MS = 34_000; // 34 s
const SURGE_DURATION_MS = 520; // durée du flash

const applyPowerSurgeClass = (enabled: boolean): void => {
  const method = enabled ? 'add' : 'remove';
  document.body.classList[method]('power-surge-active');

  const moodStages = document.querySelectorAll<HTMLElement>('.mood-stage');
  moodStages.forEach((stage) => stage.classList[method]('power-surge-active'));
};

const PowerSurge = () => {
  const { mood } = useMood();
  const timerRef = useRef<any>(null);
  const surgeRef = useRef<any>(null);

  useEffect(() => {
    if (mood !== 'industrial') return;

    // Respecter prefers-reduced-motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

    const scheduleSurge = () => {
      const delay = SURGE_MIN_MS + Math.random() * (SURGE_MAX_MS - SURGE_MIN_MS);
      timerRef.current = setTimeout(() => {
        applyPowerSurgeClass(true);
        surgeRef.current = setTimeout(() => {
          applyPowerSurgeClass(false);
          scheduleSurge();
        }, SURGE_DURATION_MS);
      }, delay);
    };

    scheduleSurge();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (surgeRef.current) clearTimeout(surgeRef.current);
      applyPowerSurgeClass(false);
    };
  }, [mood]);

  // Composant sans rendu visuel propre
  return null;
};

export default PowerSurge;
