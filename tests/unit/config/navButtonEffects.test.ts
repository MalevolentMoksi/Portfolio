import { describe, it, expect } from 'vitest';
import {
  NAV_BUTTON_PRESETS,
  ACTIVE_NAV_BUTTON_PRESET,
  ACTIVE_NAV_BUTTON_EFFECT_BODY_CLASSES,
  ALL_NAV_BUTTON_EFFECT_BODY_CLASSES,
  isNavButtonFeatureEnabled,
} from '@/config/navButtonEffects';

describe('navButtonEffects config', () => {
  it('exposes the default (empty) and punchy (full) presets', () => {
    expect(NAV_BUTTON_PRESETS).toHaveProperty('default');
    expect(NAV_BUTTON_PRESETS).toHaveProperty('punchy');
    expect(NAV_BUTTON_PRESETS.default).toEqual([]);
    expect(NAV_BUTTON_PRESETS.punchy.length).toBeGreaterThan(0);
  });

  it('active body classes include the active preset class', () => {
    expect(ACTIVE_NAV_BUTTON_EFFECT_BODY_CLASSES).toContain(
      `nav-buttons--preset-${ACTIVE_NAV_BUTTON_PRESET}`
    );
  });

  it('ALL body classes enumerate every preset and feature', () => {
    expect(ALL_NAV_BUTTON_EFFECT_BODY_CLASSES).toContain('nav-buttons--preset-default');
    expect(ALL_NAV_BUTTON_EFFECT_BODY_CLASSES).toContain('nav-buttons--preset-punchy');
    expect(ALL_NAV_BUTTON_EFFECT_BODY_CLASSES).toContain('nav-buttons--feature-spring');
  });

  it('isNavButtonFeatureEnabled reflects the active preset (default → none enabled)', () => {
    // ACTIVE_NAV_BUTTON_PRESET is 'default' (empty) with no extra features.
    expect(isNavButtonFeatureEnabled('spring')).toBe(false);
    expect(isNavButtonFeatureEnabled('depth')).toBe(false);
  });
});
