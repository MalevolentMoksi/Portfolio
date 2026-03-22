/**
 * Service Worker Registration with Update & Error Handling
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
  const registerServiceWorker = () => {
    // Guard: prevent multiple reloads from SW updates
    let hasReloadedForSwUpdate = false;

    navigator.serviceWorker
      .register(swUrl, { scope: basePath })
      .then((registration) => {
        // Listen for updates and activate new SW immediately (skip waiting)
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW is ready; tell it to skip waiting
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              // Notify user of update (optional)
              console.log('Service Worker updated — page will reload');
            }
          });
        });

        // Handle skip-waiting message from new SW — reload only once
        const handleControllerChange = () => {
          if (!hasReloadedForSwUpdate) {
            hasReloadedForSwUpdate = true;
            // Defer reload to allow SW to fully activate
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        // console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        if (error?.name !== 'SecurityError') {
          console.warn('Service Worker registration failed:', error);
        }
      });
  };

  const runWhenIdle = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(
        () => {
          registerServiceWorker();
        },
        { timeout: 4000 }
      );
      return;
    }

    window.setTimeout(registerServiceWorker, 2500);
  };

  // Register after page load and idle time to avoid competing with initial rendering/network.
  window.addEventListener('load', runWhenIdle, { once: true });
}
