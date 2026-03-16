import { useEffect } from 'react';

/**
 * useFooterPositioning — Dynamically positions footer ivy SVG relative to the actual footer element.
 * Since the ivy is rendered in the ambient portal (sibling to footer), we need to track
 * the footer's viewport position and update the ivy's bottom offset accordingly.
 */
export const useFooterPositioning = () => {
  useEffect(() => {
    const updateFooterIvyPosition = () => {
      const footer = document.querySelector('.site-footer');
      const ivySvg = document.querySelector('.nightshade-ivy--footer');

      if (!footer || !ivySvg) return;

      const footerRect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Distance from viewport bottom to footer top
      const distanceFromBottom = viewportHeight - footerRect.top;

      // Set the ivy's bottom offset so it sits just above the footer
      (ivySvg as HTMLElement).style.bottom = `${distanceFromBottom}px`;
    };

    updateFooterIvyPosition();

    // Update on resize or scroll
    const resizeObserver = new ResizeObserver(updateFooterIvyPosition);
    const footer = document.querySelector('.site-footer');
    if (footer) resizeObserver.observe(footer);

    window.addEventListener('scroll', updateFooterIvyPosition);
    window.addEventListener('resize', updateFooterIvyPosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', updateFooterIvyPosition);
      window.removeEventListener('resize', updateFooterIvyPosition);
    };
  }, []);
};
