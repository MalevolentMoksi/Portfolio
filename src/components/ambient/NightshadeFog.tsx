/**
 * NightshadeFog — Low ground mist crawling along the footer.
 * Uses CSS-animated layered radial gradients rendered in a fixed band
 * at the bottom of the viewport. Only active when mood === 'nightshade'.
 *
 * Layer count scales with the performance tier (high keeps all three drifting
 * gradient bands; weaker tiers render fewer) so the FPS auto-downgrade can ease
 * the compositing load on struggling devices.
 */

import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

const FOG_LAYERS = [1, 2, 3] as const;

const NightshadeFog = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();
  if (mood !== 'nightshade') return null;

  const layerCount = tier === 'high' ? 3 : tier === 'mid' ? 2 : 1;

  return (
    <div className="nightshade-fog" aria-hidden="true">
      {FOG_LAYERS.slice(0, layerCount).map((n) => (
        <div key={n} className={`nightshade-fog__layer nightshade-fog__layer--${n}`} />
      ))}
    </div>
  );
};

export default NightshadeFog;
