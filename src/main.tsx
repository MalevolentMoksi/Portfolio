import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { MoodProvider } from './contexts/MoodContext';
import { ToastProvider } from './contexts/ToastContext';
import '@styles/main.css';

document.documentElement.dataset.spaMode = 'true';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element "#root" not found');
}

createRoot(root).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <MoodProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </MoodProvider>
    </AccessibilityProvider>
  </React.StrictMode>
);
