import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

document.documentElement.dataset.spaMode = 'true';

const root = document.getElementById('root');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
