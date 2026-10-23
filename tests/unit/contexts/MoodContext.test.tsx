import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { MoodProvider, useMood, MOODS } from '@/contexts/MoodContext';

// MoodProvider depends on AccessibilityContext only for the highContrast flag.
const a11y = vi.hoisted(() => ({ highContrast: false }));
vi.mock('@/contexts/AccessibilityContext', () => ({
  useAccessibility: () => ({ settings: { highContrast: a11y.highContrast } }),
}));

const Consumer = ({ to }: { to: 'vaporwave' | 'hacker' }) => {
  const { setMood } = useMood();
  return (
    <button type="button" onClick={() => setMood(to)}>
      go
    </button>
  );
};

const themeColor = () =>
  document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

describe('MoodContext — dynamic theme-color', () => {
  beforeEach(() => {
    document.querySelector('meta[name="theme-color"]')?.remove();
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', '#050400');
    document.head.appendChild(meta);
    localStorage.clear();
  });

  it('sets the theme-color to the initial mood on mount', () => {
    render(
      <MoodProvider>
        <Consumer to="hacker" />
      </MoodProvider>
    );
    // Default mood applied on mount.
    expect(themeColor()).toBe(MOODS.default.color);
  });

  it('updates the theme-color meta when the mood changes', () => {
    const { getByText } = render(
      <MoodProvider>
        <Consumer to="vaporwave" />
      </MoodProvider>
    );
    act(() => {
      getByText('go').click();
    });
    expect(themeColor()).toBe(MOODS.vaporwave.color);
  });
});

describe('MoodContext: high contrast', () => {
  const MoodProbe = () => {
    const { mood } = useMood();
    return <span data-testid="mood">{mood}</span>;
  };

  beforeEach(() => {
    localStorage.clear();
    a11y.highContrast = false;
  });

  it('shows default while high contrast is on, then restores the chosen mood', () => {
    localStorage.setItem('portfolio-mood', 'nightshade');
    a11y.highContrast = true;
    const { getByTestId, rerender } = render(
      <MoodProvider>
        <MoodProbe />
      </MoodProvider>
    );
    expect(getByTestId('mood').textContent).toBe('default');
    expect(document.body.getAttribute('data-mood')).toBe('default');
    // The stored preference is left untouched.
    expect(localStorage.getItem('portfolio-mood')).toBe('nightshade');

    a11y.highContrast = false;
    rerender(
      <MoodProvider>
        <MoodProbe />
      </MoodProvider>
    );
    expect(getByTestId('mood').textContent).toBe('nightshade');
    expect(document.body.getAttribute('data-mood')).toBe('nightshade');
  });

  it('ignores an inherited property name stored as mood', () => {
    localStorage.setItem('portfolio-mood', 'toString');
    const { getByTestId } = render(
      <MoodProvider>
        <MoodProbe />
      </MoodProvider>
    );
    expect(getByTestId('mood').textContent).toBe('default');
  });
});
