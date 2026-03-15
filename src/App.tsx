import { lazy, Suspense, useEffect } from 'react';
import type { ComponentType } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout';
import Loading from './components/Loading';
import useAnalyticsTracking from './hooks/useAnalyticsTracking';

// Retry wrapper: if a lazy chunk fails to load (e.g. after a new deploy),
// force a page reload so the browser fetches the updated index.html.
function retryLazy<T extends ComponentType<Record<string, never>>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy<T>(() =>
    importFn().catch(() => {
      window.location.reload();
      return { default: Loading } as unknown as { default: T };
    })
  );
}

// Lazy load pages pour code splitting
const Home = retryLazy(() => import('./pages/Home'));
const Projets = retryLazy(() => import('./pages/Projets'));
const ProjetsPersonnels = retryLazy(() => import('./pages/ProjetsPersonnels'));
const ProjetMEGASAE = retryLazy(() => import('./pages/ProjetMEGASAE'));
const ProjetSAE12 = retryLazy(() => import('./pages/ProjetSAE12'));
const ProjetSAE3 = retryLazy(() => import('./pages/ProjetSAE3'));
const ProjetSAE4 = retryLazy(() => import('./pages/ProjetSAE4'));
const ProjetSAE56 = retryLazy(() => import('./pages/ProjetSAE56'));
const ProjetSAE301 = retryLazy(() => import('./pages/ProjetSAE301'));
const About = retryLazy(() => import('./pages/About'));
const Credits = retryLazy(() => import('./pages/Credits'));
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
          <Route path="about" element={<About />} />
          <Route path="credits" element={<Credits />} />
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
