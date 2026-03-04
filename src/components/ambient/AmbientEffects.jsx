/**
 * AmbientEffects — Orchestrateur des trois couches d'ambiance :
 *
 *  1. OccasionalCommuter — véhicule traversant l'écran
 *  2. FooterDiorama      — élément décoratif ancré au footer
 *  3. DistantSilhouettes — silhouettes lointaines dérivantes
 *
 * Rendu une seule fois dans Layout.jsx.
 */

import DistantSilhouettes from './DistantSilhouettes.jsx';
import OccasionalCommuter from './OccasionalCommuter.jsx';

const AmbientEffects = () => (
  <>
    <OccasionalCommuter />
    <DistantSilhouettes />
  </>
);

export default AmbientEffects;
