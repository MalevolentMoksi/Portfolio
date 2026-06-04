import { lazy, Suspense, useEffect } from 'react';
import type { ComponentType } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout';
import Loading from './components/Loading';
import ErrorFallback from './components/ErrorFallback';
import useAnalyticsTracking from './hooks/useAnalyticsTracking';
import Home from './pages/Home';

// Retry wrapper: if a lazy chunk fails to load (e.g. after a new deploy),
// force a page reload so the browser fetches the updated index.html.
// A sessionStorage guard prevents infinite reload loops (one reload per session).
const CHUNK_RELOAD_KEY = 'chunk-reload-v1';
const PERF_TOAST_KEY = 'perf-tier-initial-toast-v1';
 
function retryLazy<T extends ComponentType<Record<string, never>>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy<T>(() =>
    importFn().catch(() => {
      let shouldReload = false;
      try {
        if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
          // Clear performance toast guard so it re-shows after the reload
          sessionStorage.removeItem(PERF_TOAST_KEY);
          shouldReload = true;
        }
      } catch {
        // sessionStorage unavailable — don't reload (avoid loop); show the error UI.
      }
      if (shouldReload) {
        // First failure: reload once so the browser fetches the updated index.html.
        window.location.reload();
        return { default: Loading } as unknown as { default: T };
      }
      // Second failure (reload already happened) or storage unavailable: show an
      // actionable error with a manual retry instead of a permanent spinner.
      return { default: ErrorFallback } as unknown as { default: T };
    })
  );
}

// Lazy load pages pour code splitting
const Projets = retryLazy(() => import('./pages/Projets'));
const ProjetsPersonnels = retryLazy(() => import('./pages/ProjetsPersonnels'));
const ProjetMEGASAE = retryLazy(() => import('./pages/ProjetMEGASAE'));
const ProjetSAE12 = retryLazy(() => import('./pages/ProjetSAE12'));
const ProjetSAE3 = retryLazy(() => import('./pages/ProjetSAE3'));
const ProjetSAE4 = retryLazy(() => import('./pages/ProjetSAE4'));
const ProjetSAE56 = retryLazy(() => import('./pages/ProjetSAE56'));
const ProjetSAE301 = retryLazy(() => import('./pages/ProjetSAE301'));
const ProjetSAE401 = retryLazy(() => import('./pages/ProjetSAE401'));
const About = retryLazy(() => import('./pages/About'));
const Credits = retryLazy(() => import('./pages/Credits'));
const Legal = retryLazy(() => import('./pages/Legal'));
const NotFound = retryLazy(() => import('./pages/NotFound'));

// Inner component to access useLocation (must be inside BrowserRouter)
const AppContent = () => {
  const location = useLocation();
  useAnalyticsTracking(location.pathname);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="projets" element={<Projets />} />
          <Route path="projets-personnels" element={<ProjetsPersonnels />} />
          <Route path="projet-MEGASAE" element={<ProjetMEGASAE />} />
          <Route path="projet-SAE12" element={<ProjetSAE12 />} />
          <Route path="projet-SAE3" element={<ProjetSAE3 />} />
          <Route path="projet-SAE4" element={<ProjetSAE4 />} />
          <Route path="projet-SAE56" element={<ProjetSAE56 />} />
          <Route path="projet-SAE3.01" element={<ProjetSAE301 />} />
          <Route path="projet-SAE401" element={<ProjetSAE401 />} />
          <Route path="about" element={<About />} />
          <Route path="credits" element={<Credits />} />
          <Route path="informations-legales" element={<Legal />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  const { i18n } = useTranslation();

  // Sync <html lang="..."> with the active i18n language so screen readers
  // apply the correct pronunciation rules when the user switches languages.
  useEffect(() => {
    document.documentElement.lang = i18n.language || 'fr';
  }, [i18n.language]);

  return (
    <BrowserRouter
      basename="/"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
