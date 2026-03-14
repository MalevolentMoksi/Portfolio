/**
 * Service Worker Registration
 * Deferred to avoid render blocking
 */

const isSecureOrigin =
  window.isSecureContext ||
  window.location.protocol === 'https:' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const currentScript = document.currentScript;
const registerScriptUrl = currentScript?.src
  ? new URL(currentScript.src, window.location.href)
  : new URL('registerSW.js', window.location.href);
const basePath = registerScriptUrl.pathname.replace(/registerSW\.js$/, '');
const swUrl = `${basePath}sw.js`;

if ('serviceWorker' in navigator && isSecureOrigin) {
  // Register SW after page loads
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl, { scope: basePath })
      .then((registration) => {
        // console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        if (error?.name !== 'SecurityError') {
          console.warn('Service Worker registration failed:', error);
        }
      });
  });
}
