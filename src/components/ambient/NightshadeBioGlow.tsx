/**
 * NightshadeBioGlow — Soft bioluminescent pulses anchored at the bottom of the page.
 * Radiating orbs of muted orchid/teal light that breathe slowly.
 * Only active when mood === 'nightshade'.
 *
 * Each orb carries a 28px blur (see _ambient.css). Blur is the priciest part of
 * the nightshade ambient stack, so the orb count scales with the performance
 * tier: high keeps the full four, weaker tiers render fewer. This lets the FPS
 * auto-downgrade actually relieve struggling devices instead of only thinning
 * the spores.
 */

import { useMood } from '@/contexts/MoodContext';
import { usePerformanceTierValue } from '@/contexts/PerformanceTierContext';

const ORB_MODIFIERS = [1, 2, 3, 4] as const;

const NightshadeBioGlow = () => {
  const { mood } = useMood();
  const tier = usePerformanceTierValue();
  if (mood !== 'nightshade') return null;

  const orbCount = tier === 'high' ? 4 : tier === 'mid' ? 3 : 2;

  return (
    <div className="nightshade-bioglow" aria-hidden="true">
      {ORB_MODIFIERS.slice(0, orbCount).map((n) => (
        <div key={n} className={`nightshade-bioglow__orb nightshade-bioglow__orb--${n}`} />
      ))}
    </div>
  );
};

export default NightshadeBioGlow;
