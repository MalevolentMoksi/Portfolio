import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { MoodProvider } from './contexts/MoodContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import '@styles/main.css';

document.documentElement.dataset.spaMode = 'true';

const loadDeferredStyles = () => {
  void import('@styles/deferred.css');
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

createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AccessibilityProvider>
        <MoodProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </MoodProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
