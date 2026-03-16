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
 * 10. ElectricalGrid     — grille électrique perspective (industrial)
 * 11. DefaultStarField   — charte céleste dorée (default)
 * 12. DigitalRain        — pluie de glyphes (hacker)
 *
 * Rendu une seule fois dans Layout.jsx.
 *
 * Stratégie de chargement :
 *  - OccasionalCommuter et DistantSilhouettes sont toujours actifs → import statique.
 *  - Les composants mood-spécifiques sont lazy-loadés en groupes
 *    pour ne pas alourdir le bundle initial.
 *    Suspense avec fallback null — ces composants sont purement décoratifs.
 */

import { lazy, Suspense } from 'react';
import DistantSilhouettes from './DistantSilhouettes';
import { useAccessibilityEffects } from '@/hooks/useAccessibilityEffects';
import OccasionalCommuter from './OccasionalCommuter';
// import ObservationDrone from './ObservationDrone';
// import AmbientBoids from './AmbientBoids';
// import FooterWalkers from './FooterWalkers'; // désactivé — voir FooterWalkers.jsx

// Groupe Europa — chargé seulement quand le mood europa est activé
const EuropaSnowfall = lazy(() => import('./EuropaSnowfall'));
const EuropaIcicles = lazy(() => import('./EuropaIcicles'));
const EuropaFrost = lazy(() => import('./EuropaFrost'));

// Groupe Industrial — chargé seulement quand le mood industrial est activé
const RisingEmbers = lazy(() => import('./RisingEmbers'));
const IndustrialNeons = lazy(() => import('./IndustrialNeons'));
const IndustrialSteam = lazy(() => import('./IndustrialSteam'));
const PowerSurge = lazy(() => import('./PowerSurge'));
const ElectricalGrid = lazy(() => import('./ElectricalGrid'));

// Groupe Nightshade — chargé seulement quand le mood nightshade est activé
const NightshadeSpores = lazy(() => import('./NightshadeSpores'));
const NightshadeFog = lazy(() => import('./NightshadeFog'));
const NightshadeIvy = lazy(() => import('./NightshadeIvy'));
const NightshadeBioGlow = lazy(() => import('./NightshadeBioGlow'));

// Groupe signatures default/hacker
// const FloatingGeometry = lazy(() => import('./FloatingGeometry')); // désactivé — remplacé par DefaultStarField
// const DefaultStarField = lazy(() => import('./DefaultStarField')); // désactivé — conflits visuels avec particles existants
const DigitalRain = lazy(() => import('./DigitalRain'));

const AmbientEffects = () => {
  // Sync accessibility settings (noMotion) with visual effects
  useAccessibilityEffects();

  return (
    <>
      <OccasionalCommuter />
      {/* <FooterWalkers /> */}
      <DistantSilhouettes />
      {/* <ObservationDrone /> */}
      {/* <AmbientBoids /> */}
      <Suspense fallback={null}>
        <EuropaSnowfall />
        <EuropaIcicles />
        <EuropaFrost />
        <RisingEmbers />
        <IndustrialNeons />
        <IndustrialSteam />
        <PowerSurge />
        <ElectricalGrid />
        {/* <DefaultStarField /> */}
        <DigitalRain />
        <NightshadeSpores />
        <NightshadeFog />
        <NightshadeIvy />
        <NightshadeBioGlow />
      </Suspense>
    </>
  );
};

export default AmbientEffects;
