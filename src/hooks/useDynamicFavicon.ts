import { useEffect } from 'react';
import { getAssetPath } from '../utils/assetPath';

/**
 * Swaps the page favicon to the mood-specific SVG variant whenever the
 * active mood changes.
 */
const useDynamicFavicon = (mood: string): void => {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      link.href = getAssetPath(`assets/images/favicon-${mood}.svg`);
    }
  }, [mood]);
};

export default useDynamicFavicon;
