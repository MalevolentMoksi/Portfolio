import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import OccasionalCommuter from '../src/components/ambient/OccasionalCommuter';
import * as MoodContext from '@/contexts/MoodContext';

// Mock dependencies
vi.mock('@/contexts/MoodContext', () => ({
  useMood: vi.fn(),
}));

describe('OccasionalCommuter - Random Distribution & Viewport Bias', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(MoodContext, 'useMood').mockReturnValue({ mood: 'default' } as any);
    
    // Mock viewport and document properties
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
    Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 500 });
    
    const mockElement = document.createElement('div');
    Object.defineProperty(mockElement, 'offsetHeight', { value: 100, configurable: true });
    
    vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === 'header' || selector === 'footer') {
        return mockElement;
      }
      return null;
    });

    Object.defineProperty(document.documentElement, 'scrollHeight', { writable: true, configurable: true, value: 3000 });
    Object.defineProperty(document.body, 'scrollHeight', { writable: true, configurable: true, value: 3000 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should spawn commuters without viewport bias across the entire document height', async () => {
    // We will spy on the console.log from our logCommuter to capture spawned coordinates
    const spawnLogs: any[] = [];
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation((msg, data) => {
      if (typeof msg === 'string' && msg.includes('[OccasionalCommuter] SPAWN')) {
        spawnLogs.push(data);
      }
    });
    
    // Temporarily enable logging for test environment by overriding process.env
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<OccasionalCommuter />);

    // Fast-forward time to trigger 1000 spawns
    await act(async () => {
      for (let i = 0; i < 1000; i++) {
        vi.advanceTimersByTime(40000); // Advance past max delay
      }
    });

    expect(spawnLogs.length).toBeGreaterThanOrEqual(1000);

    // Verify mathematical distribution
    let insideViewportCount = 0;
    let outsideViewportCount = 0;
    const viewportTop = 500;
    const viewportBottom = 1300; // 500 + 800

    spawnLogs.forEach((log) => {
      const { top } = log;
      
      // Should respect bounds: headerHeight + padding (100 + 18 = 118)
      // to pageHeight - footerHeight - padding (3000 - 100 - 18 = 2882)
      expect(top).toBeGreaterThanOrEqual(118);
      expect(top).toBeLessThanOrEqual(2882);

      if (top >= viewportTop && top <= viewportBottom) {
        insideViewportCount++;
      } else {
        outsideViewportCount++;
      }
    });

    // The viewport is 800px tall. The valid spawn area is 2982 - 18 = 2964px tall.
    // The viewport overlaps the spawn area by 800px.
    // So the probability of spawning inside the viewport is 800 / 2964 ≈ 27%.
    const expectedRatio = 800 / 2964;
    const actualRatio = insideViewportCount / spawnLogs.length;

    expect(actualRatio).toBeGreaterThan(expectedRatio - 0.05);
    expect(actualRatio).toBeLessThan(expectedRatio + 0.05);

    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });
});

describe('OccasionalCommuter - Lifecycle & Premature Disappearance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(MoodContext, 'useMood').mockReturnValue({ mood: 'default' } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not remove commuters prematurely before animation ends', async () => {
    render(<OccasionalCommuter />);
    
    // Trigger initial spawn
    await act(async () => {
      vi.advanceTimersByTime(20000);
    });

    const commuters = screen.queryAllByTestId(/commuter-\d+/);
    expect(commuters.length).toBeGreaterThan(0);
    
    const firstCommuterId = commuters[0].getAttribute('data-testid') as string;

    // Advance by a small amount to ensure we don't trigger the fallback timeout
    // The shortest commuter duration is 24s. We wait for 23s.
    await act(async () => {
      vi.advanceTimersByTime(23000);
    });

    // The specific commuter should still be there, not removed prematurely!
    expect(screen.queryByTestId(firstCommuterId)).not.toBeNull();
  });

  it('should fallback to timeout if animation end is somehow not fired', async () => {
    render(<OccasionalCommuter />);
    
    // Trigger initial spawn
    await act(async () => {
      vi.advanceTimersByTime(20000);
    });

    const commuters = screen.queryAllByTestId(/commuter-\d+/);
    expect(commuters.length).toBeGreaterThan(0);
    
    const firstCommuterId = commuters[0].getAttribute('data-testid') as string;

    // Advance by duration (e.g. 40s) + fallback (5s) = 45s
    await act(async () => {
      vi.advanceTimersByTime(46000);
    });

    // Should be removed via fallback timeout
    expect(screen.queryByTestId(firstCommuterId)).toBeNull();
  });
});
