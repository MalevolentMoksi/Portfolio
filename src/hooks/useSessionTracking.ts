import { useEffect } from 'react';
import { safeSessionGet, safeSessionSet } from '../utils/safeStorage';

/**
 * Tracks session start time and the list of pages visited during the session.
 * Data is stored in sessionStorage so it resets on new tab/session.
 */
const useSessionTracking = (pathname: string): void => {
  useEffect(() => {
    if (!safeSessionGet('session-start')) {
      safeSessionSet('session-start', Date.now().toString());
    }
  }, []);

  useEffect(() => {
    const rawPages = safeSessionGet('session-pages') || '[]';
    let pages: string[] = [];
    try {
      pages = JSON.parse(rawPages) as string[];
    } catch {
      pages = [];
    }
    if (!pages.includes(pathname)) {
      pages.push(pathname);
      safeSessionSet('session-pages', JSON.stringify(pages));
    }
  }, [pathname]);
};

export default useSessionTracking;
