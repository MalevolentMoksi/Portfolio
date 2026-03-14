/**
 * Service Worker Registration
 * Deferred to avoid render blocking
 */

const isSecureOrigin =
  window.isSecureContext ||
  window.location.protocol === 'https:' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

if ('serviceWorker' in navigator && isSecureOrigin) {
  // Register SW after page loads
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        if (error?.name !== 'SecurityError') {
          console.warn('Service Worker registration failed:', error);
        }
      });
  });
}
