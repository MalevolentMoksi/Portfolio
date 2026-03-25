import { useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

/**
 * useAccessibilityEffects — Syncs accessibility settings with visual effects.
 * When noMotion is toggled, updates particle animations to respect the setting.
 */
export const useAccessibilityEffects = () => {
  const { settings } = useAccessibility();

  useEffect(() => {
    // Get the global visual effects instance (if available)
    const visualEffects = (window as any).visualEffectsInstance;

    if (visualEffects?.setAnimationsEnabled) {
      // noMotion=true means animations disabled, so enabled should be false
      visualEffects.setAnimationsEnabled(!settings.noMotion);
    }
  }, [settings.noMotion]);
};
