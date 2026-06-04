import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { i18nReady } from './i18n';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { MoodProvider } from './contexts/MoodContext';
import { PerformanceTierProvider } from './contexts/PerformanceTierContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import '@styles/main.css';

document.documentElement.dataset.spaMode = 'true';

const loadDeferredStyles = () => {
  void import('./styles/deferred.css');
};

const idleWindow = window as Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
};

if (document.readyState === 'complete') {
  setTimeout(loadDeferredStyles, 1200);
} else {
  window.addEventListener(
    'load',
    () => {
      if (typeof idleWindow.requestIdleCallback === 'function') {
        idleWindow.requestIdleCallback(loadDeferredStyles, { timeout: 2500 });
        return;
      }
      setTimeout(loadDeferredStyles, 1200);
    },
    { once: true }
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element "#root" not found');
}

const renderApp = () => {
  createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <PerformanceTierProvider>
          <AccessibilityProvider>
            <MoodProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </MoodProvider>
          </AccessibilityProvider>
        </PerformanceTierProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Wait until i18n is initialised and the detected language's bundle is loaded before
// the first render, so a non-default-language visitor never sees a flash of fallback
// (French) copy. Render anyway if the locale chunk fails so the app is never blank.
i18nReady.catch(() => {}).then(renderApp);
