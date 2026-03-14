import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Loading from './components/Loading';

// Lazy load pages pour code splitting
const Home = lazy(() => import('./pages/Home'));
const Projets = lazy(() => import('./pages/Projets'));
const ProjetsPersonnels = lazy(() => import('./pages/ProjetsPersonnels'));
const ProjetMEGASAE = lazy(() => import('./pages/ProjetMEGASAE'));
const ProjetSAE12 = lazy(() => import('./pages/ProjetSAE12'));
const ProjetSAE3 = lazy(() => import('./pages/ProjetSAE3'));
const ProjetSAE4 = lazy(() => import('./pages/ProjetSAE4'));
const ProjetSAE56 = lazy(() => import('./pages/ProjetSAE56'));
const ProjetSAE301 = lazy(() => import('./pages/ProjetSAE301'));
const About = lazy(() => import('./pages/About'));
const Credits = lazy(() => import('./pages/Credits'));
const NotFound = lazy(() => import('./pages/NotFound'));

const App = () => (
  <BrowserRouter
    basename="/"
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
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
  </BrowserRouter>
);

export default App;
