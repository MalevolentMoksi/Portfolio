/**
 * NightshadeBioGlow — Soft bioluminescent pulses anchored at the bottom of the page.
 * Radiating orbs of muted orchid/teal light that breathe slowly.
 * Only active when mood === 'nightshade'.
 */

import { useMood } from '@/contexts/MoodContext';

const NightshadeBioGlow = () => {
  const { mood } = useMood();
  if (mood !== 'nightshade') return null;

  return (
    <div className="nightshade-bioglow" aria-hidden="true">
      <div className="nightshade-bioglow__orb nightshade-bioglow__orb--1" />
      <div className="nightshade-bioglow__orb nightshade-bioglow__orb--2" />
      <div className="nightshade-bioglow__orb nightshade-bioglow__orb--3" />
      <div className="nightshade-bioglow__orb nightshade-bioglow__orb--4" />
    </div>
  );
};

export default NightshadeBioGlow;
