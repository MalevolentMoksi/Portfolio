import { useEffect } from 'react';
import { getAssetPath } from '../utils/assetPath';

/**
 * Swaps the page favicon to the mood-specific SVG variant whenever the
 * active mood changes.
 */
const useDynamicFavicon = (mood: string): void => {
  useEffect(() => {
    // Target the SVG icon specifically so the mood swap never touches the static
    // raster fallback (favicon-96.png) used by Safari/iOS.
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
    if (link) {
      link.href = getAssetPath(`assets/images/favicon-${mood}.svg?v=2`);
    }
  }, [mood]);
};

export default useDynamicFavicon;
