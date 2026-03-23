import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('performanceTier utility', () => {
  const originalNavigator = global.navigator;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Reset internal cache of the module by re-importing or using a trick if needed, 
    // but here we can just rely on the fact that we clear sessionStorage.
    // However, the module has a module-level variable `_cached`. 
    // To truly reset it, we might need to use `vi.resetModules()`.
    vi.resetModules();
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    window.matchMedia = originalMatchMedia;
  });

  const mockHardware = (cores: number, memory: number, touch = false) => {
    Object.defineProperty(global.navigator, 'hardwareConcurrency', {
      value: cores,
      configurable: true
    });
    Object.defineProperty(global.navigator, 'deviceMemory', {
      value: memory,
      configurable: true
    });
    
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(hover: none) and (pointer: coarse)' ? touch : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  };

  it('detects "high" tier for powerful machines', async () => {
    const { getPerformanceTier } = await import('@/utils/performanceTier');
    mockHardware(8, 16, false);
    expect(getPerformanceTier()).toBe('high');
  });

  it('detects "mid" tier for average machines', async () => {
    const { getPerformanceTier } = await import('@/utils/performanceTier');
    mockHardware(4, 4, false);
    expect(getPerformanceTier()).toBe('mid');
  });

  it('detects "low" tier for weak machines', async () => {
    const { getPerformanceTier } = await import('@/utils/performanceTier');
    mockHardware(2, 2, true);
    expect(getPerformanceTier()).toBe('low');
  });

  it('caches the result in sessionStorage', async () => {
    const { getPerformanceTier } = await import('@/utils/performanceTier');
    mockHardware(8, 16, false);
    const tier = getPerformanceTier();
    expect(sessionStorage.getItem('perf-tier-v3')).toBe(tier);
  });

  it('prefers cached value from sessionStorage', async () => {
    const { getPerformanceTier } = await import('@/utils/performanceTier');
    sessionStorage.setItem('perf-tier-v3', 'low');
    mockHardware(16, 32, false); // Powerful hardware but cached is low
    expect(getPerformanceTier()).toBe('low');
  });
});
