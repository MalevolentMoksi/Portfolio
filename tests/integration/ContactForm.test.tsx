import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ContactForm from '@/components/ContactForm';
import { ToastProvider } from '@/contexts/ToastContext';

// Mock i18n
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'fr' }
    })
  };
});

describe('ContactForm Integration', () => {
  const renderForm = () => {
    return render(
      <ToastProvider>
        <ContactForm />
      </ToastProvider>
    );
  };

  let dateNowSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => 1000000000000);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('renders form fields', () => {
    renderForm();
    expect(screen.getByLabelText('common.contactForm.labels.name', { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText('common.contactForm.labels.email', { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText('common.contactForm.labels.message', { selector: 'textarea' })).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    renderForm();
    
    // Fast-forward past rate limit
    dateNowSpy.mockImplementation(() => 1000000004000);
    
    const submitBtn = screen.getByRole('button', { name: 'common.contactForm.submit' });
    
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('common.contactForm.validation.nameRequired')).toBeInTheDocument();
      expect(screen.getByText('common.contactForm.validation.emailRequired')).toBeInTheDocument();
      expect(screen.getByText('common.contactForm.validation.messageRequired')).toBeInTheDocument();
    });
  });

  it('submits form successfully when valid data is provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    renderForm();
    
    // Fast-forward past rate limit
    dateNowSpy.mockImplementation(() => 1000000004000);
    
    fireEvent.change(screen.getByLabelText('common.contactForm.labels.name', { selector: 'input' }), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('common.contactForm.labels.email', { selector: 'input' }), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('common.contactForm.labels.message', { selector: 'textarea' }), { target: { value: 'Hello, this is a valid message that is long enough.' } });
    
    const submitBtn = screen.getByRole('button', { name: 'common.contactForm.submit' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('shows rate limit error if submitted too quickly', async () => {
    renderForm();
    
    // No time advancement
    const submitBtn = screen.getByRole('button', { name: 'common.contactForm.submit' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/common\.contactForm\.validation\.rateLimit/)).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('silently ignores submission if honeypot is filled', async () => {
    renderForm();
    dateNowSpy.mockImplementation(() => 1000000004000);

    const honeypot = screen.getByLabelText(/website/i);
    fireEvent.change(honeypot, { target: { value: 'bot-value' } });
    
    const submitBtn = screen.getByRole('button', { name: 'common.contactForm.submit' });
    fireEvent.click(submitBtn);

    // No errors, but no fetch either
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles server error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    renderForm();
    dateNowSpy.mockImplementation(() => 1000000004000);

    fireEvent.change(screen.getByLabelText('common.contactForm.labels.name', { selector: 'input' }), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('common.contactForm.labels.email', { selector: 'input' }), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('common.contactForm.labels.message', { selector: 'textarea' }), { target: { value: 'Valid message content' } });

    fireEvent.click(screen.getByRole('button', { name: 'common.contactForm.submit' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    // The component should show error (via toast, but we can't easily check toast without mocking it more deeply, 
    // but we can check if isSubmitting is back to false)
    expect(screen.getByRole('button', { name: 'common.contactForm.submit' })).not.toBeDisabled();
  });

  it('disables fields during submission', async () => {
    let resolveFetch: (value: any) => void;
    global.fetch = vi.fn().mockReturnValue(new Promise((resolve) => {
      resolveFetch = resolve;
    }));

    renderForm();
    dateNowSpy.mockImplementation(() => 1000000004000);

    fireEvent.change(screen.getByLabelText('common.contactForm.labels.name', { selector: 'input' }), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('common.contactForm.labels.email', { selector: 'input' }), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('common.contactForm.labels.message', { selector: 'textarea' }), { target: { value: 'Valid message content' } });

    fireEvent.click(screen.getByRole('button', { name: 'common.contactForm.submit' }));

    expect(screen.getByRole('button', { name: 'common.contactForm.submitting' })).toBeDisabled();
    expect(screen.getByLabelText('common.contactForm.labels.name')).toBeDisabled();
    
    // @ts-ignore
    resolveFetch({ ok: true });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'common.contactForm.submit' })).not.toBeDisabled();
    });
  });
});
