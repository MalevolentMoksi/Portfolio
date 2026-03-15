import { useEffect } from 'react';
import {
  ACTIVE_NAV_BUTTON_EFFECT_BODY_CLASSES,
  ALL_NAV_BUTTON_EFFECT_BODY_CLASSES,
  isNavButtonFeatureEnabled,
} from '@/config/navButtonEffects';

const NAV_BUTTON_BURST_SELECTOR = [
  '.header-action-btn:not(:disabled)',
  '.header--nav-desktop ul li a:not([aria-current="page"]):not(.active)',
  '.language-segmented__btn:not(:disabled)',
  '.hamburger-toggle:not(:disabled)',
].join(', ');

const BURST_CLASS_NAME = 'nav-click-bursting';
const BURST_DURATION_MS = 460;

const getBurstTarget = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof Element)) {
    return null;
  }

  const burstTarget = target.closest(NAV_BUTTON_BURST_SELECTOR);
  return burstTarget instanceof HTMLElement ? burstTarget : null;
};

const triggerBurst = (
  element: HTMLElement,
  relativeX: number,
  relativeY: number,
  timers: Map<HTMLElement, number>
) => {
  const previousTimer = timers.get(element);
  if (previousTimer !== undefined) {
    window.clearTimeout(previousTimer);
  }

  element.style.setProperty('--nav-click-x', `${Math.round(relativeX)}px`);
  element.style.setProperty('--nav-click-y', `${Math.round(relativeY)}px`);
  element.classList.remove(BURST_CLASS_NAME);
  void element.offsetWidth;
  element.classList.add(BURST_CLASS_NAME);

  const timerId = window.setTimeout(() => {
    element.classList.remove(BURST_CLASS_NAME);
    element.style.removeProperty('--nav-click-x');
    element.style.removeProperty('--nav-click-y');
    timers.delete(element);
  }, BURST_DURATION_MS);

  timers.set(element, timerId);
};

const useNavButtonEffects = () => {
  useEffect(() => {
    const body = document.body;
    if (!body) {
      return undefined;
    }

    body.classList.remove(...ALL_NAV_BUTTON_EFFECT_BODY_CLASSES);
    body.classList.add(...ACTIVE_NAV_BUTTON_EFFECT_BODY_CLASSES);

    return () => {
      body.classList.remove(...ACTIVE_NAV_BUTTON_EFFECT_BODY_CLASSES);
    };
  }, []);

  useEffect(() => {
    if (!isNavButtonFeatureEnabled('click-burst')) {
      return undefined;
    }

    const header = document.querySelector('header.header--main');
    if (!(header instanceof HTMLElement)) {
      return undefined;
    }

    const timers = new Map<HTMLElement, number>();

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      const burstTarget = getBurstTarget(event.target);
      if (!burstTarget) {
        return;
      }

      const rect = burstTarget.getBoundingClientRect();
      triggerBurst(burstTarget, event.clientX - rect.left, event.clientY - rect.top, timers);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) {
        return;
      }

      const burstTarget = getBurstTarget(event.target);
      if (!burstTarget) {
        return;
      }

      if (event.key === ' ' && burstTarget.tagName === 'A') {
        return;
      }

      const rect = burstTarget.getBoundingClientRect();
      triggerBurst(burstTarget, rect.width / 2, rect.height / 2, timers);
    };

    header.addEventListener('pointerdown', handlePointerDown);
    header.addEventListener('keydown', handleKeyDown);

    return () => {
      header.removeEventListener('pointerdown', handlePointerDown);
      header.removeEventListener('keydown', handleKeyDown);

      for (const [element, timerId] of timers) {
        window.clearTimeout(timerId);
        element.classList.remove(BURST_CLASS_NAME);
        element.style.removeProperty('--nav-click-x');
        element.style.removeProperty('--nav-click-y');
      }
    };
  }, []);
};

export default useNavButtonEffects;
