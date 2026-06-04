import { describe, it, expect } from 'vitest';
import { COMMUTER_FLEET, getRandomCommuter } from '@/components/ambient/commutersConfig';

const MOODS = ['default', 'hacker', 'vaporwave', 'europa', 'industrial', 'nightshade'];

describe('COMMUTER_FLEET', () => {
  it('defines a non-empty, well-formed fleet for all 6 moods', () => {
    for (const mood of MOODS) {
      const fleet = COMMUTER_FLEET[mood];
      expect(Array.isArray(fleet)).toBe(true);
      expect(fleet.length).toBeGreaterThan(0);
      for (const c of fleet) {
        expect(typeof c.name).toBe('string');
        expect(typeof c.className).toBe('string');
        expect(c.duration).toBeGreaterThan(0);
        expect(c.component).toBeTruthy();
      }
    }
  });

  it('uses unique commuter names within each mood', () => {
    for (const fleet of Object.values(COMMUTER_FLEET)) {
      const names = fleet.map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});

describe('getRandomCommuter', () => {
  it('returns a config that belongs to the requested mood fleet', () => {
    const c = getRandomCommuter('default');
    expect(c).not.toBeNull();
    expect(COMMUTER_FLEET.default).toContain(c);
  });

  it('returns null for an unknown mood', () => {
    expect(getRandomCommuter('does-not-exist')).toBeNull();
  });
});
