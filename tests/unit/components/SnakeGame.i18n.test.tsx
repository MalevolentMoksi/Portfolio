import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import en from '@/locales/en.json';
import SnakeGame from '@/components/SnakeGame';

const resolve = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);

// Real English values so we assert the component is wired to i18n (not hardcoded FR).
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const v = resolve(en, key);
      if (typeof v === 'string' && opts) {
        return v.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(opts[k] ?? ''));
      }
      return v ?? key;
    },
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

describe('SnakeGame — i18n', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders the HUD and close control in English', () => {
    render(<SnakeGame onClose={() => {}} />);
    // HUD labels (visible immediately, before the countdown advances)
    expect(screen.getByText('Score')).toBeTruthy();
    expect(screen.getByText('Best')).toBeTruthy();
    // Close button aria-label and the accessible canvas label come from i18n
    expect(screen.getByLabelText('Close the game')).toBeTruthy();
    expect(screen.getByLabelText(/Snake game/i)).toBeTruthy();
  });
});
