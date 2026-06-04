import { describe, it, expect } from 'vitest';
import { getAssetPath } from '@/utils/assetPath';

describe('getAssetPath', () => {
  it('prefixes with the base URL and normalizes a single leading slash', () => {
    // import.meta.env.BASE_URL is '/' in the test environment.
    expect(getAssetPath('assets/images/x.png')).toBe('/assets/images/x.png');
    expect(getAssetPath('/assets/images/x.png')).toBe('/assets/images/x.png');
  });

  it('handles empty input without throwing', () => {
    expect(getAssetPath('')).toBe('/');
  });
});
