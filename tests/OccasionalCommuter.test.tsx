import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import OccasionalCommuter, { pickCommuterTopPx } from '../src/components/ambient/OccasionalCommuter';
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

  it('should spawn commuters without viewport bias across the entire document height', () => {
    // pickCommuterTopPx is the pure position picker used for every spawn. With no
    // active obstacles it draws uniformly across the spawnable band
    // [headerHeight + padding, pageHeight - footerHeight - padding] and never reads
    // scrollY/innerHeight — so positions are not biased toward the visible viewport.
    // We assert that directly instead of scraping removed debug console.log output.
    const SAMPLES = 1000;
    const tops: number[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      tops.push(pickCommuterTopPx([]));
    }

    // Bounds: headerHeight(100) + padding(18) = 118
    //   .. pageHeight(3000) - footerHeight(100) - padding(18) = 2882
    const minY = 118;
    const maxY = 2882;
    tops.forEach((top) => {
      expect(top).toBeGreaterThanOrEqual(minY);
      expect(top).toBeLessThanOrEqual(maxY);
    });

    // The viewport (scrollY 500 .. 1300) covers 800px of the 2764px spawnable band,
    // so a bias-free picker lands inside it ~29% of the time — not ~100%.
    const viewportTop = 500;
    const viewportBottom = 1300; // 500 + innerHeight(800)
    const insideViewport = tops.filter((top) => top >= viewportTop && top <= viewportBottom).length;
    const actualRatio = insideViewport / SAMPLES;
    const expectedRatio = (viewportBottom - viewportTop) / (maxY - minY); // 800 / 2764 ≈ 0.289

    expect(actualRatio).toBeGreaterThan(expectedRatio - 0.06);
    expect(actualRatio).toBeLessThan(expectedRatio + 0.06);
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
