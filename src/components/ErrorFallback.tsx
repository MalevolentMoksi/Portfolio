/**
 * ErrorFallback — shown when a lazy route chunk fails to load AND the one-time
 * auto-reload has already been attempted (see retryLazy in App.tsx). Replaces the
 * previous behaviour of rendering a permanent loading spinner with no way out.
 *
 * Intentionally dependency-free (no i18n / CSS imports, inline styles, language read
 * from <html lang>) so it still renders even when the failing chunk is i18n or CSS.
 */
const CHUNK_RELOAD_KEY = 'chunk-reload-v1';

const ErrorFallback = () => {
  const isEnglish = (document.documentElement.lang || 'fr').toLowerCase().startsWith('en');

  const title = isEnglish ? 'Something went wrong' : 'Une erreur est survenue';
  const message = isEnglish
    ? 'This page could not be loaded. Please check your connection and try again.'
    : 'Impossible de charger cette page. Vérifiez votre connexion et réessayez.';
  const retryLabel = isEnglish ? 'Reload the page' : 'Recharger la page';

  const handleRetry = () => {
    // Clear the one-shot reload guard so the auto-retry can run again on next load.
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
      /* sessionStorage unavailable — reload anyway */
    }
    window.location.reload();
  };

  return (
    <div
      role="alert"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-text, #e6e6e6)',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{title}</h2>
      <p style={{ margin: 0, maxWidth: '36ch', opacity: 0.85 }}>{message}</p>
      <button
        type="button"
        onClick={handleRetry}
        style={{
          cursor: 'pointer',
          padding: '0.6rem 1.4rem',
          borderRadius: '8px',
          border: '1px solid rgba(var(--color-primary-rgb, 212, 175, 55), 0.6)',
          background: 'rgba(var(--color-primary-rgb, 212, 175, 55), 0.12)',
          color: 'var(--color-primary, #d4af37)',
          font: 'inherit',
          fontWeight: 600,
        }}
      >
        {retryLabel}
      </button>
    </div>
  );
};

export default ErrorFallback;
