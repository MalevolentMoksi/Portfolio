import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';

// Low tier everywhere: noMotion is only auto-enabled for it on touch-only devices,
// which the matchMedia mocks below decide.
vi.mock('@/utils/performanceTier', () => ({ getPerformanceTier: () => 'low' }));

const Probe = () => {
  const { settings } = useAccessibility();
  return <span data-testid="nomotion">{String(settings.noMotion)}</span>;
};

// Mock matchMedia so the prefers-reduced-motion query returns `reduced` and every
// other query (hover/pointer) returns false.
const mockMatchMedia = (reduced: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reduced : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

describe('AccessibilityContext — OS reduce-motion default', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
  });
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.className = '';
  });

  it('auto-enables noMotion on first visit when the OS requests reduced motion', () => {
    mockMatchMedia(true);
    const { getByTestId } = render(
      <AccessibilityProvider>
        <Probe />
      </AccessibilityProvider>
    );
    expect(getByTestId('nomotion').textContent).toBe('true');
    expect(document.body.classList.contains('a11y--no-motion')).toBe(true);
  });

  it('leaves noMotion off on first visit when the OS does not request reduced motion', () => {
    mockMatchMedia(false);
    const { getByTestId } = render(
      <AccessibilityProvider>
        <Probe />
      </AccessibilityProvider>
    );
    expect(getByTestId('nomotion').textContent).toBe('false');
  });

  it('respects an explicitly-saved setting over the OS default', () => {
    mockMatchMedia(true);
    localStorage.setItem('portfolio-a11y-settings', JSON.stringify({ noMotion: false }));
    const { getByTestId } = render(
      <AccessibilityProvider>
        <Probe />
      </AccessibilityProvider>
    );
    // Saved choice wins even though the OS asks for reduced motion.
    expect(getByTestId('nomotion').textContent).toBe('false');
  });
});

describe('AccessibilityContext: low-end mobile notice', () => {
  const mockTouchDevice = () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('pointer: coarse'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.showToast = vi.fn();
  });
  afterEach(() => {
    delete window.showToast;
    vi.restoreAllMocks();
  });

  it('tells the visitor once when noMotion was auto-enabled on first visit', () => {
    mockTouchDevice();
    const first = render(
      <AccessibilityProvider>
        <Probe />
      </AccessibilityProvider>
    );
    expect(first.getByTestId('nomotion').textContent).toBe('true');
    expect(window.showToast).toHaveBeenCalledTimes(1);
    first.unmount();

    // Settings are now saved: a later load is not a first visit any more.
    render(
      <AccessibilityProvider>
        <Probe />
      </AccessibilityProvider>
    );
    expect(window.showToast).toHaveBeenCalledTimes(1);
  });

  it('stays silent when the setting comes from storage', () => {
    mockTouchDevice();
    localStorage.setItem('portfolio-a11y-settings', JSON.stringify({ noMotion: true }));
    render(
      <AccessibilityProvider>
        <Probe />
      </AccessibilityProvider>
    );
    expect(window.showToast).not.toHaveBeenCalled();
  });
});
