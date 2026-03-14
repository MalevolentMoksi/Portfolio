/**
 * Service Worker Registration
 * Deferred to avoid render blocking
 */

if ('serviceWorker' in navigator) {
  // Register SW after page loads
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error);
      });
  });
}
