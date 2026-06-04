import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';

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
