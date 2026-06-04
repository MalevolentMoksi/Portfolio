import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

const Boom = () => {
  throw new Error('boom');
};

describe('ErrorBoundary — bilingual fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.lang = 'fr';
  });

  it('shows the French recovery copy when <html lang> is fr', () => {
    document.documentElement.lang = 'fr';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/une erreur est survenue/i)).toBeTruthy();
    expect(screen.getByRole('button').textContent).toMatch(/Rafraîchir/i);
  });

  it('shows the English recovery copy when <html lang> is en', () => {
    document.documentElement.lang = 'en';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
    expect(screen.getByRole('button').textContent).toMatch(/Refresh/i);
  });
});
