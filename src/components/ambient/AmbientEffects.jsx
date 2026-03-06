/**
 * AmbientEffects — Orchestrateur des couches d'ambiance :
 *
 *  1. OccasionalCommuter — véhicule traversant l'écran
 *  2. DistantSilhouettes — silhouettes lointaines dérivantes
 *  3. EuropaSnowfall     — flocons CSS (mood europa uniquement)
 *  4. EuropaIcicles      — stalactites SVG sous le header (europa)
 *  5. EuropaFrost        — craquelures + congère (europa)
 *  6. RisingEmbers       — braises montantes + étincelles (industrial)
 *  7. IndustrialNeons    — enseignes néon SVG (industrial)
 *  8. IndustrialSteam    — jets de vapeur (industrial)
 *  9. PowerSurge         — surtension périodique (industrial)
 *
 * Rendu une seule fois dans Layout.jsx.
 *
 * Stratégie de chargement :
 *  - OccasionalCommuter et DistantSilhouettes sont toujours actifs → import statique.
 *  - Les 6 composants mood-spécifiques sont lazy-loadés en deux groupes
 *    (europa / industrial) pour ne pas alourdir le bundle initial.
 *    Suspense avec fallback null — ces composants sont purement décoratifs.
 */

import { lazy, Suspense } from 'react';
import DistantSilhouettes from './DistantSilhouettes.jsx';
import OccasionalCommuter from './OccasionalCommuter.jsx';
// import FooterWalkers from './FooterWalkers.jsx'; // désactivé — voir FooterWalkers.jsx

// Groupe Europa — chargé seulement quand le mood europa est activé
const EuropaSnowfall = lazy(() => import('./EuropaSnowfall.jsx'));
const EuropaIcicles  = lazy(() => import('./EuropaIcicles.jsx'));
const EuropaFrost    = lazy(() => import('./EuropaFrost.jsx'));

// Groupe Industrial — chargé seulement quand le mood industrial est activé
const RisingEmbers    = lazy(() => import('./RisingEmbers.jsx'));
const IndustrialNeons = lazy(() => import('./IndustrialNeons.jsx'));
const IndustrialSteam = lazy(() => import('./IndustrialSteam.jsx'));
const PowerSurge      = lazy(() => import('./PowerSurge.jsx'));

const AmbientEffects = () => (
  <>
    <OccasionalCommuter />
    {/* <FooterWalkers /> */}
    <DistantSilhouettes />
    <Suspense fallback={null}>
      <EuropaSnowfall />
      <EuropaIcicles />
      <EuropaFrost />
      <RisingEmbers />
      <IndustrialNeons />
      <IndustrialSteam />
      <PowerSurge />
    </Suspense>
  </>
);

export default AmbientEffects;
