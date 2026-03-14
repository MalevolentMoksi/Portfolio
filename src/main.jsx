import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './i18n';
import { AccessibilityProvider } from './contexts/AccessibilityContext.jsx';
import { MoodProvider } from './contexts/MoodContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import '@styles/main.css';

document.documentElement.dataset.spaMode = 'true';

const root = document.getElementById('root');

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
