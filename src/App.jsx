import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Projets from './pages/Projets.jsx';
import ProjetsPersonnels from './pages/ProjetsPersonnels.jsx';
import ProjetMEGASAE from './pages/ProjetMEGASAE.jsx';
import ProjetSAE12 from './pages/ProjetSAE12.jsx';
import ProjetSAE3 from './pages/ProjetSAE3.jsx';
import ProjetSAE4 from './pages/ProjetSAE4.jsx';
import ProjetSAE56 from './pages/ProjetSAE56.jsx';

const App = () => (
  <BrowserRouter 
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
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
  </BrowserRouter>
);

export default App;
