import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import en from '@/locales/en.json';
import BackToTopButton from '@/components/BackToTopButton';

// Resolve a dotted i18n key against the real English locale so the test verifies the
// component is wired to the correct key AND that the English value exists.
const resolve = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => resolve(en, key) ?? key,
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

describe('BackToTopButton — i18n', () => {
  it('uses the translated aria-label (not a hardcoded French string)', () => {
    render(<BackToTopButton />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Back to top');
  });
});
