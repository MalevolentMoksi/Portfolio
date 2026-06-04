import { describe, it, expect } from 'vitest';
import {
  getParticlesConfig,
  getMoodColor,
  moodNeedsFullReconfigure,
} from '@/scripts/effects-particles-config';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Cfg = any;

describe('moodNeedsFullReconfigure', () => {
  it('is true only for the extended moods', () => {
    expect(moodNeedsFullReconfigure('europa')).toBe(true);
    expect(moodNeedsFullReconfigure('industrial')).toBe(true);
    expect(moodNeedsFullReconfigure('nightshade')).toBe(true);
    expect(moodNeedsFullReconfigure('default')).toBe(false);
    expect(moodNeedsFullReconfigure('hacker')).toBe(false);
    expect(moodNeedsFullReconfigure('vaporwave')).toBe(false);
    expect(moodNeedsFullReconfigure('unknown')).toBe(false);
  });
});

describe('getMoodColor', () => {
  it('returns the mood hex, or default gold for unknown moods', () => {
    expect(getMoodColor('hacker')).toBe('#00ff41');
    expect(getMoodColor('vaporwave')).toBe('#ff71ce');
    expect(getMoodColor('europa')).toBe('#00E5FF');
    expect(getMoodColor('industrial')).toBe('#FF5722');
    expect(getMoodColor('nightshade')).toBe('#A366FF');
    expect(getMoodColor('default')).toBe('#d4af37');
    expect(getMoodColor('does-not-exist')).toBe('#d4af37');
  });
});

describe('getParticlesConfig', () => {
  const moods = ['default', 'hacker', 'vaporwave', 'europa', 'industrial', 'nightshade', 'unknown'];

  for (const mood of moods) {
    it(`returns a well-formed config for "${mood}"`, () => {
      const cfg: Cfg = getParticlesConfig(mood);
      expect(cfg.particles).toBeTruthy();
      expect(cfg.interactivity).toBeTruthy();
      expect(typeof cfg.retina_detect).toBe('boolean');
      expect(cfg.particles.number.value).toBeGreaterThan(0);
      expect(Number.isInteger(cfg.particles.number.value)).toBe(true);
      expect(cfg.particles.move.enable).toBe(true);
    });
  }

  it('uses the frost palette and leftward drift for europa', () => {
    const cfg: Cfg = getParticlesConfig('europa');
    expect(cfg.particles.color.value).toContain('#00E5FF');
    expect(cfg.particles.move.direction).toBe('left');
  });

  it('uses upward ash drift for industrial', () => {
    const cfg: Cfg = getParticlesConfig('industrial');
    expect(cfg.particles.move.direction).toBe('top-right');
  });

  it('uses the single base color for default and hacker moods', () => {
    expect((getParticlesConfig('default') as Cfg).particles.color.value).toBe('#d4af37');
    expect((getParticlesConfig('hacker') as Cfg).particles.color.value).toBe('#00ff41');
    // Unknown mood falls back to the default gold.
    expect((getParticlesConfig('unknown') as Cfg).particles.color.value).toBe('#d4af37');
  });
});
