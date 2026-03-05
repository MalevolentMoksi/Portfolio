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
 * Les composants mood-spécifiques se gèrent eux-mêmes (return null si inactifs).
 */

import DistantSilhouettes from './DistantSilhouettes.jsx';
import OccasionalCommuter from './OccasionalCommuter.jsx';
// import FooterWalkers from './FooterWalkers.jsx'; // désactivé — voir FooterWalkers.jsx
import EuropaSnowfall from './EuropaSnowfall.jsx';
import EuropaIcicles from './EuropaIcicles.jsx';
import EuropaFrost from './EuropaFrost.jsx';
import RisingEmbers from './RisingEmbers.jsx';
import IndustrialNeons from './IndustrialNeons.jsx';
import IndustrialSteam from './IndustrialSteam.jsx';
import PowerSurge from './PowerSurge.jsx';

const AmbientEffects = () => (
  <>
    <OccasionalCommuter />
    {/* <FooterWalkers /> */}
    <DistantSilhouettes />
    <EuropaSnowfall />
    <EuropaIcicles />
    <EuropaFrost />
    <RisingEmbers />
    <IndustrialNeons />
    <IndustrialSteam />
    <PowerSurge />
  </>
);

export default AmbientEffects;
