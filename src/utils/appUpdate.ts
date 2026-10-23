/**
 * App update handling.
 *
 * GitHub Pages replaces every hashed chunk on each deploy, so a tab opened before a
 * deploy keeps running the old build and can no longer lazy-load its own chunks.
 * The old answer was to reload the page as soon as a new service worker took over,
 * which yanked the page from under the visitor in the middle of a read.
 *
 * Instead, the page never reloads on its own while the visitor is reading:
 * - a cheap `version.json` check (on return to the tab, and periodically) detects
 *   that a newer build is deployed;
 * - the update is then applied on the visitor's next internal link click, as a full
 *   page load to the destination: indistinguishable from a normal page change;
 * - that swap is skipped while music is playing, so the soundtrack is never cut;
 * - if a stale chunk still fails to load (navigation done before the check noticed
 *   the deploy), `reloadForStaleBuild` reloads once, guarded by build id so it can
 *   never loop.
 */
import { safeSessionGet, safeSessionRemove, safeSessionSet } from './safeStorage';

export const BUILD_ID: string = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';

/** Session key holding the build id of the page that last forced a reload. */
export const STALE_RELOAD_KEY = 'chunk-reload-v1';
const PERF_TOAST_KEY = 'perf-tier-initial-toast-v1';

const CHECK_MIN_INTERVAL_MS = 5 * 60 * 1000;
const CHECK_PERIOD_MS = 30 * 60 * 1000;

let updateReady = false;
let lastCheckAt = 0;
let checkInFlight: Promise<boolean> | null = null;
let watcherStarted = false;

export const isUpdateReady = (): boolean => updateReady;

/** Indirection so tests can observe reloads (jsdom's location.reload is locked). */
export const page = {
  reload: (): void => window.location.reload(),
};

const isOffline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false;

const isMusicPlaying = (): boolean => document.documentElement.dataset.musicPlaying === 'true';

/**
 * Asks the server which build is deployed. Resolves true when it differs from the
 * running one. Never throws: a failed check simply means "no update known".
 */
export const checkForUpdate = (): Promise<boolean> => {
  if (updateReady) return Promise.resolve(true);
  if (checkInFlight) return checkInFlight;
  if (isOffline()) return Promise.resolve(false);

  lastCheckAt = Date.now();
  checkInFlight = fetch(`${import.meta.env.BASE_URL}version.json`, { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: { buildId?: unknown } | null) => {
      if (data && typeof data.buildId === 'string' && data.buildId !== BUILD_ID) {
        updateReady = true;
      }
      return updateReady;
    })
    .catch(() => false)
    .finally(() => {
      checkInFlight = null;
    });
  return checkInFlight;
};

/**
 * Reloads once to pick up the deployed build after a chunk failed to load.
 * Returns false (and does nothing) when offline, when storage cannot hold the guard,
 * or when this very build already forced a reload: reloading again would only loop.
 */
export const reloadForStaleBuild = (): boolean => {
  if (isOffline()) return false;
  if (safeSessionGet(STALE_RELOAD_KEY) === BUILD_ID) return false;
  // The guard must survive the reload, so in-memory fallback storage is not enough.
  if (!safeSessionSet(STALE_RELOAD_KEY, BUILD_ID)) return false;
  // Let the performance toast show again on the fresh page.
  safeSessionRemove(PERF_TOAST_KEY);
  page.reload();
  return true;
};

const findInternalLink = (event: MouseEvent): URL | null => {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;

  const target = event.target instanceof Element ? event.target : null;
  const anchor = target?.closest<HTMLAnchorElement>('a[href]');
  if (!anchor || anchor.hasAttribute('download')) return null;
  if (anchor.target && anchor.target !== '_self') return null;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  // In-page anchors and same-page links stay client side.
  if (url.pathname === window.location.pathname) return null;
  return url;
};

const handleClickCapture = (event: MouseEvent): void => {
  if (!updateReady || isMusicPlaying()) return;
  const url = findInternalLink(event);
  if (!url) return;

  // React Router's <Link> skips its own navigation when the event is already
  // default-prevented, so the SPA transition never starts.
  event.preventDefault();
  // Move to the destination, then reload it: a reload revalidates the HTML with the
  // server, whereas a plain navigation could reuse a stale copy from the HTTP cache.
  window.history.pushState(window.history.state, '', url.href);
  page.reload();
};

/** Starts the deploy watcher. Safe to call more than once; no-op in dev. */
export const startAppUpdateWatcher = (): void => {
  if (watcherStarted || import.meta.env.DEV || typeof window === 'undefined') return;
  watcherStarted = true;

  // Capture phase on document runs before React's listeners on the root container.
  document.addEventListener('click', handleClickCapture, true);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastCheckAt > CHECK_MIN_INTERVAL_MS) {
      void checkForUpdate();
    }
  });

  window.setInterval(() => {
    if (document.visibilityState === 'visible') void checkForUpdate();
  }, CHECK_PERIOD_MS);
};
