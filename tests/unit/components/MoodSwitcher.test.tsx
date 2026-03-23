import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MoodSwitcher from '@/components/MoodSwitcher';
import { MoodProvider } from '@/contexts/MoodContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { PerformanceTierProvider } from '@/contexts/PerformanceTierContext';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'fr' }
  })
}));

describe('MoodSwitcher Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  const renderSwitcher = () => {
    return render(
      <PerformanceTierProvider>
        <AccessibilityProvider>
          <MoodProvider>
            <MoodSwitcher />
          </MoodProvider>
        </AccessibilityProvider>
      </PerformanceTierProvider>
    );
  };

  it('renders the mood switcher button', () => {
    renderSwitcher();
    const btn = screen.getByRole('button', { name: 'common.mood.ariaLabel' });
    expect(btn).toBeInTheDocument();
  });

  it('opens the tuner panel when clicked', async () => {
    renderSwitcher();
    const btn = screen.getByRole('button', { name: 'common.mood.ariaLabel' });
    fireEvent.click(btn);
    
    // Check for tuner elements (analog tuner is active by default)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('closes the tuner panel when pressing Escape', async () => {
    renderSwitcher();
    const btn = screen.getByRole('button', { name: 'common.mood.ariaLabel' });
    fireEvent.click(btn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
