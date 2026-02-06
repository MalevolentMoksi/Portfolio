import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Loading from './components/Loading.jsx';

// Lazy load pages pour code splitting
const Home = lazy(() => import('./pages/Home.jsx'));
const Projets = lazy(() => import('./pages/Projets.jsx'));
const ProjetsPersonnels = lazy(() => import('./pages/ProjetsPersonnels.jsx'));
const ProjetMEGASAE = lazy(() => import('./pages/ProjetMEGASAE.jsx'));
const ProjetSAE12 = lazy(() => import('./pages/ProjetSAE12.jsx'));
const ProjetSAE3 = lazy(() => import('./pages/ProjetSAE3.jsx'));
const ProjetSAE4 = lazy(() => import('./pages/ProjetSAE4.jsx'));
const ProjetSAE56 = lazy(() => import('./pages/ProjetSAE56.jsx'));

const App = () => (
  <BrowserRouter 
    basename="/Portfolio/"
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
      </Route>
    </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
