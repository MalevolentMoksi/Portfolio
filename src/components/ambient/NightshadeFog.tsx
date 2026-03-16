/**
 * NightshadeFog — Low ground mist crawling along the footer.
 * Uses CSS-animated layered radial gradients rendered in a fixed band
 * at the bottom of the viewport. Only active when mood === 'nightshade'.
 */

import { useMood } from '@/contexts/MoodContext';

const NightshadeFog = () => {
  const { mood } = useMood();
  if (mood !== 'nightshade') return null;

  return (
    <div className="nightshade-fog" aria-hidden="true">
      <div className="nightshade-fog__layer nightshade-fog__layer--1" />
      <div className="nightshade-fog__layer nightshade-fog__layer--2" />
      <div className="nightshade-fog__layer nightshade-fog__layer--3" />
    </div>
  );
};

export default NightshadeFog;
