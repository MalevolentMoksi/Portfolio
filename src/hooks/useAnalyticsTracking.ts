import { useEffect, useRef } from 'react';
import { upsertAnalyticsSession, touchAnalyticsSessionActivity } from '../utils/analyticsSession';
import { safeLocalGet, safeLocalSet } from '../utils/safeStorage';

/* ── Non-standard Navigator API extensions ─────────────── */
interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorUAData {
  brands: Array<{ brand: string; version: string }>;
  mobile: boolean;
}

declare global {
  interface Navigator {
    readonly connection?: NetworkInformation;
    readonly deviceMemory?: number;
    readonly hardwareConcurrency?: number;
    readonly standalone?: boolean;
    readonly userAgentData?: NavigatorUAData;
  }
}

interface GeoLocation {
  country?: string;
  city?: string;
  timezone?: string;
}

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface VisitorIdentity {
  label: string;
  source: 'utm' | 'saved' | 'generated';
  lifetimeSessions: number;
}

interface SessionStats {
  pages: number;
  elapsedMinutes: number;
  sessionId: string;
  lifetimeSessions: number;
}

type ExitReason = 'visibility-hidden' | 'pagehide' | 'route-change';

const GEO_CACHE_KEY = 'portfolio-geo-cache-v2';
const GEO_CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Sends enhanced page view analytics to a Discord webhook via Cloudflare Worker proxy.
 *
 * Tracks (all GDPR compliant — no personal data, no persistent fingerprinting):
 * - Page path, UTM parameters, session statistics
 * - Browser, connection type, device memory, viewport category, PWA mode
 * - User preferences: mood, language, accessibility settings, music state
 * - Anonymized geolocation (country/city only) and referrer domain (hostname only)
 */
const useAnalyticsTracking = (pathname: string): void => {
  const pageStartTimeRef = useRef<number>(Date.now());
  const visibleWindowStartRef = useRef<number>(
    document.visibilityState === 'visible' ? Date.now() : 0
  );
  const accumulatedVisibleMsRef = useRef<number>(0);
  const lastSentVisibleSecondsRef = useRef<number>(0);
  const previousPathRef = useRef<string | null>(null);
  const entryReferrerRef = useRef<string>(formatEntryReferrer(document.referrer));
  const geoCache = useRef<GeoLocation | null>(null);
  const geoFetched = useRef(false);

  useEffect(() => {
    const previousInternalPath = previousPathRef.current;
    previousPathRef.current = pathname;

    // Reset page-start time on every navigation.
    pageStartTimeRef.current = Date.now();
    accumulatedVisibleMsRef.current = 0;
    lastSentVisibleSecondsRef.current = 0;
    visibleWindowStartRef.current = document.visibilityState === 'visible' ? Date.now() : 0;

    touchAnalyticsSessionActivity();

    const proxyUrl = import.meta.env.VITE_WEBHOOK_PROXY_URL;
    if (!proxyUrl) return;

    let isCancelled = false;
    let loadDelayTimer: number | null = null;
    let fallbackTimer: number | null = null;
    let idleCallbackId: number | null = null;
    let loadListenerAttached = false;
    let onLoadHandler: (() => void) | null = null;

    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const closeVisibleWindow = () => {
      if (visibleWindowStartRef.current > 0) {
        accumulatedVisibleMsRef.current += Date.now() - visibleWindowStartRef.current;
        visibleWindowStartRef.current = 0;
      }
    };

    const openVisibleWindow = () => {
      if (document.visibilityState === 'visible' && visibleWindowStartRef.current === 0) {
        visibleWindowStartRef.current = Date.now();
      }
    };

    const getVisibleTimeMs = () => {
      if (visibleWindowStartRef.current > 0) {
        return accumulatedVisibleMsRef.current + (Date.now() - visibleWindowStartRef.current);
      }
      return accumulatedVisibleMsRef.current;
    };

    const sendPayload = (payload: unknown, preferBeacon = false) => {
      const body = JSON.stringify(payload);

      if (preferBeacon && typeof navigator.sendBeacon === 'function') {
        const sent = navigator.sendBeacon(proxyUrl, new Blob([body], { type: 'application/json' }));
        if (sent) return;
      }

      fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body,
      }).catch((err: unknown) => {
        console.debug('[Analytics] Failed to send:', err);
      });
    };

    const flushTimeOnPage = (reason: ExitReason, preferBeacon: boolean) => {
      const visibleSeconds = Math.max(1, Math.round(getVisibleTimeMs() / 1000));
      if (visibleSeconds <= lastSentVisibleSecondsRef.current) return;
      lastSentVisibleSecondsRef.current = visibleSeconds;

      const sessionStats = getSessionStats(pathname);

      sendPayload(
        {
          embeds: [
            {
              author: { name: '📊 Portfolio Analytics' },
              title: `Exit Signal · ${formatPageName(pathname)}`,
              color: 0xf5a623,
              fields: [
                {
                  name: 'Navigation',
                  value: [
                    `**Path**: \`${pathname}\``,
                    `**Time on page (final)**: ${visibleSeconds}s`,
                    `**Entry referrer**: ${entryReferrerRef.current}`,
                    `**Internal from**: ${formatInternalPath(previousInternalPath)}`,
                    `**Trigger**: ${reason}`,
                  ].join('\n'),
                  inline: false,
                },
                {
                  name: 'Session',
                  value: [
                    `**Session ID**: ${sessionStats.sessionId}`,
                    `**Pages**: ${sessionStats.pages}`,
                    `**Elapsed**: ${sessionStats.elapsedMinutes} min`,
                  ].join('\n'),
                  inline: false,
                },
              ],
              timestamp: new Date().toISOString(),
              footer: {
                text: getBrowserTimezone() ?? 'timezone unavailable',
              },
            },
          ],
        },
        preferBeacon
      );
    };

    const runTracking = () => {
      if (isCancelled) return;

      const params = new URLSearchParams(window.location.search);
      const utm = {
        source: normalizeAttribution(params.get('utm_source')),
        medium: normalizeAttribution(params.get('utm_medium')),
        campaign: normalizeAttribution(params.get('utm_campaign')),
        visitor: normalizeVisitorLabel(params.get('visitor')),
      };

      const sessionStats = getSessionStats(pathname);
      const visitor = resolveVisitorIdentity(utm.visitor, sessionStats.lifetimeSessions);
      const browserInfo = getBrowserInfo(navigator.userAgent);
      const metrics = collectPageMetrics(pageStartTimeRef.current);
      const prefs = collectUserPreferences();
      const pageName = formatPageName(pathname);

      const sendMessage = (geo: GeoLocation | null): void => {
        if (isCancelled) return;

        const isKnownVisitor = visitor.source !== 'generated';
        const timeOnPage = Math.max(1, Math.round(getVisibleTimeMs() / 1000));
        const location = formatLocation(geo);
        const fields: EmbedField[] = [
          {
            name: 'Navigation',
            value: [
              `**Path**: \`${pathname}\``,
              `**Time on page (live)**: ${timeOnPage}s`,
              `**Entry referrer**: ${entryReferrerRef.current}`,
              `**Internal from**: ${formatInternalPath(previousInternalPath)}`,
            ].join('\n'),
            inline: false,
          },
          {
            name: 'Visitor',
            value: [
              `**Visitor ID**: ${visitor.label}`,
              `**Type**: ${formatVisitorSource(visitor.source)}`,
              `**Location**: ${location}`,
              `**Language**: ${prefs.language.toUpperCase()}`,
              `**Browser**: ${browserInfo}`,
              `**Session**: ${sessionStats.pages} page${sessionStats.pages !== 1 ? 's' : ''} · ${sessionStats.elapsedMinutes} min · #${visitor.lifetimeSessions}`,
              `**Session ID**: ${sessionStats.sessionId}`,
            ].join('\n'),
            inline: false,
          },
          {
            name: 'Preferences',
            value: [
              `**Mood**: ${prefs.mood}`,
              `**Accessibility**: ${prefs.a11y}`,
              `**Music**: ${prefs.musicState}`,
            ].join('\n'),
            inline: true,
          },
          {
            name: 'Device',
            value: [
              `**Display**: ${metrics.viewportCategory}${metrics.isPWA ? ' · PWA' : ''}`,
              `**Connection**: ${metrics.connectionType}`,
              `**RAM**: ${metrics.deviceMemory}`,
              `**CPU Cores**: ${metrics.hardwareConcurrency}`,
              `**Route ready**: ${metrics.routeReadyMs} ms`,
              `**Navigation DOM ready**: ${
                metrics.domReadyMs !== null ? `${metrics.domReadyMs} ms` : 'n/a'
              }`,
              `**Navigation load**: ${
                metrics.loadTimeMs !== null ? `${metrics.loadTimeMs} ms` : 'n/a'
              }`,
            ].join('\n'),
            inline: true,
          },
        ];

        if (utm.source || utm.medium || utm.campaign || utm.visitor) {
          fields.push({
            name: 'Attribution',
            value: [
              `**Source**: ${utm.source ?? 'direct'} / ${utm.medium ?? 'none'}`,
              `**Campaign**: ${utm.campaign ?? 'None'}`,
              `**Visitor**: ${utm.visitor ?? visitor.label}`,
            ].join('\n'),
            inline: false,
          });
        }

        sendPayload({
          embeds: [
            {
              author: { name: '📊 Portfolio Analytics' },
              title: pageName,
              description: isKnownVisitor
                ? `Visitor: **${visitor.label}**`
                : `Visitor: **${visitor.label} (guest)**`,
              color: isKnownVisitor ? 0x00ff99 : 0x5865f2,
              fields,
              timestamp: new Date().toISOString(),
              footer: {
                text: geo?.timezone ?? getBrowserTimezone() ?? 'timezone unavailable',
              },
            },
          ],
        });
      };

      if (geoFetched.current) {
        sendMessage(geoCache.current);
        return;
      }

      geoFetched.current = true;
      fetchGeolocation().then((geo) => {
        geoCache.current = geo;
        sendMessage(geo);
      });
    };

    const scheduleRun = () => {
      if (isCancelled) return;

      loadDelayTimer = window.setTimeout(() => {
        if (isCancelled) return;

        if (typeof idleWindow.requestIdleCallback === 'function') {
          idleCallbackId = idleWindow.requestIdleCallback(runTracking, { timeout: 2000 });
          return;
        }

        runTracking();
      }, 1200);
    };

    if (document.readyState === 'complete') {
      scheduleRun();
    } else {
      onLoadHandler = () => {
        loadListenerAttached = false;
        scheduleRun();
      };
      loadListenerAttached = true;
      window.addEventListener('load', onLoadHandler, { once: true });

      // Safety fallback for pages where load may have already happened before listener attachment.
      fallbackTimer = window.setTimeout(() => {
        if (!loadListenerAttached) return;
        if (onLoadHandler) {
          window.removeEventListener('load', onLoadHandler);
          onLoadHandler = null;
        }
        loadListenerAttached = false;
        scheduleRun();
      }, 2000);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        closeVisibleWindow();
        // flushTimeOnPage('visibility-hidden', true);
        return;
      }

      openVisibleWindow();
      touchAnalyticsSessionActivity();
    };

    const handlePageHide = () => {
      closeVisibleWindow();
      flushTimeOnPage('pagehide', true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      isCancelled = true;
      if (loadDelayTimer !== null) {
        window.clearTimeout(loadDelayTimer);
      }
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
      }
      if (idleCallbackId !== null && typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleCallbackId);
      }
      if (loadListenerAttached && onLoadHandler) {
        window.removeEventListener('load', onLoadHandler);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);

      closeVisibleWindow();
      flushTimeOnPage('route-change', false);
    };
  }, [pathname]);
};

/* ── Helpers ────────────────────────────────────────────── */

function formatPageName(pathname: string): string {
  if (pathname === '/') return 'Home';
  return pathname
    .replace(/^\//, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function collectPageMetrics(routeStartTime: number): {
  loadTimeMs: number | null;
  domReadyMs: number | null;
  connectionType: string;
  deviceMemory: string;
  hardwareConcurrency: string;
  viewportCategory: string;
  isPWA: boolean;
  routeReadyMs: number;
} {
  let loadTimeMs: number | null = null;
  let domReadyMs: number | null = null;
  try {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (nav?.domContentLoadedEventEnd > 0) {
      domReadyMs = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
    }
    if (nav?.loadEventEnd > 0) {
      loadTimeMs = Math.round(nav.loadEventEnd - nav.startTime);
    }
  } catch {
    /* ignore */
  }

  const routeReadyMs = Math.max(1, Math.round(Date.now() - routeStartTime));

  const connectionType = getConnectionType();
  const deviceMemory = getDeviceMemoryLabel();
  const hardwareConcurrency = getHardwareConcurrencyLabel();

  const w = window.innerWidth;
  const viewportCategory = w < 768 ? '📱 Mobile' : w < 1024 ? '💻 Tablet' : '🖥️ Desktop';
  const isPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true ||
    document.referrer.startsWith('android-app://');

  return {
    loadTimeMs,
    domReadyMs,
    connectionType,
    deviceMemory,
    hardwareConcurrency,
    viewportCategory,
    isPWA,
    routeReadyMs,
  };
}

function collectUserPreferences(): {
  mood: string;
  language: string;
  a11y: string;
  musicState: string;
} {
  const moodKey = safeLocalGet('portfolio-mood') ?? document.body.dataset.mood ?? 'default';
  const moodLabels: Record<string, string> = {
    default: '◆ Default',
    hacker: '> Terminal',
    vaporwave: '~ Vaporwave',
    europa: '❄ Europa',
    industrial: '⚙ Industriel',
  };
  const mood = moodLabels[moodKey] ?? moodKey;

  const language = detectLanguage();

  const a11yRaw = safeLocalGet('portfolio-a11y-settings');
  const a11yFlags: string[] = [];
  if (a11yRaw) {
    try {
      const s = JSON.parse(a11yRaw) as Record<string, unknown>;
      if (s.noMotion) a11yFlags.push('no-motion');
      if (s.highContrast) a11yFlags.push('high-contrast');
      if (s.dyslexiaFont) a11yFlags.push('dyslexia');
      if (s.fontSize && s.fontSize !== 'normal') a11yFlags.push(`font-${String(s.fontSize)}`);
    } catch {
      /* ignore */
    }
  } else {
    const body = document.body;
    if (body.classList.contains('a11y--no-motion')) a11yFlags.push('no-motion');
    if (body.classList.contains('a11y--high-contrast')) a11yFlags.push('high-contrast');
    if (body.classList.contains('a11y--dyslexia')) a11yFlags.push('dyslexia');
    if (body.classList.contains('a11y--font-lg')) a11yFlags.push('font-lg');
    if (body.classList.contains('a11y--font-xl')) a11yFlags.push('font-xl');
  }

  const musicPaused = safeLocalGet('music-isPaused');
  let musicState: string;
  if (musicPaused === 'false') {
    musicState = '▶ Playing';
  } else if (musicPaused === 'true') {
    musicState = '⏸ Paused';
  } else {
    const audio = document.querySelector('audio') as HTMLAudioElement | null;
    if (audio) {
      musicState = audio.paused ? '⏸ Paused' : '▶ Playing';
    } else {
      musicState = '*inactive*';
    }
  }

  return {
    mood,
    language,
    a11y: a11yFlags.length > 0 ? a11yFlags.join(', ') : '*none*',
    musicState,
  };
}

function formatEntryReferrer(referrer: string): string {
  try {
    if (referrer) {
      // Hostname only — never the full URL (query params can contain personal data).
      return new URL(referrer).hostname;
    }
    return 'Direct';
  } catch {
    return 'Direct';
  }
}

function formatInternalPath(previousPath: string | null): string {
  return previousPath ?? 'Entry page';
}

function detectLanguage(): string {
  const langRaw =
    safeLocalGet('i18nextLng') ||
    document.documentElement.lang ||
    navigator.languages?.[0] ||
    navigator.language ||
    'fr';
  const normalized = langRaw.toLowerCase();
  const [base] = normalized.split(/[-_]/);
  return base || normalized;
}

function getConnectionType(): string {
  const connection = navigator.connection;

  if (connection?.effectiveType) {
    const saveDataTag = connection.saveData ? ' + save-data' : '';
    return `${connection.effectiveType}${saveDataTag}`;
  }

  if (typeof connection?.downlink === 'number' && Number.isFinite(connection.downlink)) {
    if (connection.downlink < 0.8) return '~2g (estimated)';
    if (connection.downlink < 2) return '~3g (estimated)';
    return '~4g (estimated)';
  }

  if (navigator.onLine === false) {
    return 'offline';
  }

  return 'online (browser-limited)';
}

function getDeviceMemoryLabel(): string {
  if (typeof navigator.deviceMemory === 'number' && Number.isFinite(navigator.deviceMemory)) {
    if (navigator.deviceMemory >= 8) {
      return '8+ GB (browser cap)';
    }
    return `${navigator.deviceMemory} GB`;
  }

  const cores = navigator.hardwareConcurrency;
  if (typeof cores === 'number' && Number.isFinite(cores)) {
    const estimatedMemory = cores <= 2 ? 2 : cores <= 4 ? 4 : cores <= 8 ? 8 : 16;
    return `~${estimatedMemory} GB (est. ${cores} cores)`;
  }

  return 'estimated 4 GB';
}

function getHardwareConcurrencyLabel(): string {
  if (
    typeof navigator.hardwareConcurrency === 'number' &&
    Number.isFinite(navigator.hardwareConcurrency)
  ) {
    return `${navigator.hardwareConcurrency} (browser-reported)`;
  }

  return 'unavailable';
}

function getBrowserTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function getBrowserInfo(ua: string): string {
  const uaBrands = navigator.userAgentData?.brands ?? [];

  if (uaBrands.length > 0) {
    const filtered = uaBrands.map((b) => b.brand).filter((name) => !/Not A\(Brand\)/i.test(name));
    if (filtered.length > 0) {
      const isMobile =
        navigator.userAgentData?.mobile ?? /iPhone|iPad|Android|Mobile|Windows Phone/i.test(ua);
      return `${filtered[0]} · ${isMobile ? 'Mobile' : 'Desktop'}`;
    }
  }

  // Order matters: Edge/Opera include "Chrome" in their UA string.
  const browsers = [
    { regex: /CriOS\//, name: 'Chrome iOS' },
    { regex: /Edg\//, name: 'Edge' },
    { regex: /OPR\//, name: 'Opera' },
    { regex: /Firefox\//, name: 'Firefox' },
    { regex: /FxiOS\//, name: 'Firefox iOS' },
    { regex: /Chrome\//, name: 'Chrome' },
    { regex: /Safari\//, name: 'Safari' },
  ];

  let browser = 'Unknown';
  for (const { regex, name } of browsers) {
    if (regex.test(ua)) {
      browser = name;
      break;
    }
  }

  const isMobile =
    navigator.userAgentData?.mobile ?? /iPhone|iPad|Android|Mobile|Windows Phone/i.test(ua);
  return `${browser} · ${isMobile ? 'Mobile' : 'Desktop'}`;
}

async function fetchGeolocation(): Promise<GeoLocation | null> {
  // Check localStorage cache first (TTL: 30 minutes).
  const localeFallback = inferGeoFromLocale();
  const cached = safeLocalGet(GEO_CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached) as {
        data: GeoLocation | null;
        timestamp: number;
      };
      const age = Date.now() - timestamp;
      if (age < GEO_CACHE_TTL_MS) {
        return mergeGeo(data, localeFallback);
      }
    } catch {
      /* ignore cache parse error */
    }
  }

  let remoteGeo: GeoLocation | null = null;

  try {
    remoteGeo = await fetchGeoProvider('https://ipapi.co/json/', {
      countryField: 'country_name',
      cityField: 'city',
      timezoneField: 'timezone',
      timeoutMs: 2500,
    });

    if (!remoteGeo) {
      remoteGeo = await fetchGeoProvider('https://ipwho.is/', {
        countryField: 'country',
        cityField: 'city',
        timezoneField: 'timezone.id',
        timeoutMs: 2500,
      });
    }
  } catch {
    console.debug('[Analytics] Geolocation fetch failed');
  }

  const mergedGeo = mergeGeo(remoteGeo, localeFallback);

  try {
    safeLocalSet(GEO_CACHE_KEY, JSON.stringify({ data: mergedGeo, timestamp: Date.now() }));
  } catch {
    /* ignore cache write error */
  }

  return hasGeoData(mergedGeo) ? mergedGeo : null;
}

function inferGeoFromLocale(): GeoLocation {
  const timezone = getBrowserTimezone() ?? undefined;
  const locale = navigator.languages?.[0] || navigator.language || 'en-US';

  const regionMatch = locale.match(/[-_]([A-Za-z]{2})\b/);
  const regionCode = regionMatch ? regionMatch[1].toUpperCase() : undefined;

  let city: string | undefined;
  if (timezone && timezone.includes('/')) {
    const timezoneCity = timezone.split('/').pop()?.replace(/_/g, ' ');
    if (timezoneCity) city = timezoneCity;
  }

  return { country: regionCode, city, timezone };
}

async function fetchGeoProvider(
  url: string,
  options: {
    countryField: string;
    cityField: string;
    timezoneField: string;
    timeoutMs: number;
  }
): Promise<GeoLocation | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) return null;

    const payload = (await response.json()) as Record<string, unknown>;
    return {
      country: readNestedString(payload, options.countryField),
      city: readNestedString(payload, options.cityField),
      timezone: readNestedString(payload, options.timezoneField),
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function readNestedString(payload: Record<string, unknown>, path: string): string | undefined {
  const segments = path.split('.');
  let current: unknown = payload;

  for (const key of segments) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' && current.trim() ? current : undefined;
}

function mergeGeo(primary: GeoLocation | null, fallback: GeoLocation): GeoLocation {
  return {
    country: primary?.country || fallback.country,
    city: primary?.city || fallback.city,
    timezone: primary?.timezone || fallback.timezone,
  };
}

function hasGeoData(geo: GeoLocation | null): boolean {
  return Boolean(geo?.country || geo?.city || geo?.timezone);
}

function formatLocation(geo: GeoLocation | null): string {
  if (!geo) return 'Unavailable';

  if (geo.country) {
    return geo.city ? `${geo.city}, ${geo.country}` : geo.country;
  }

  if (geo.city) {
    return geo.city;
  }

  if (geo.timezone) {
    return `Approx: ${geo.timezone}`;
  }

  return 'Unavailable';
}

function formatVisitorSource(source: VisitorIdentity['source']): string {
  if (source === 'utm') return 'Campaign tag';
  if (source === 'saved') return 'Returning';
  return 'Guest';
}

function createShortId(length = 8): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
  }

  let id = '';
  for (let i = 0; i < length; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}

function normalizeVisitorLabel(rawValue: string | null): string | null {
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 48);
}

function normalizeAttribution(rawValue: string | null): string | null {
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 80);
}

function resolveVisitorIdentity(
  explicitVisitor: string | null,
  lifetimeSessions: number
): VisitorIdentity {
  if (explicitVisitor) {
    safeLocalSet('portfolio-visitor-label', explicitVisitor);
    return {
      label: explicitVisitor,
      source: 'utm',
      lifetimeSessions,
    };
  }

  const savedVisitor = normalizeVisitorLabel(safeLocalGet('portfolio-visitor-label'));
  if (savedVisitor) {
    return {
      label: savedVisitor,
      source: 'saved',
      lifetimeSessions,
    };
  }

  let guestId = normalizeVisitorLabel(safeLocalGet('portfolio-guest-id'));
  if (!guestId) {
    guestId = createShortId(6);
    safeLocalSet('portfolio-guest-id', guestId);
  }

  return {
    label: `Guest-${guestId}`,
    source: 'generated',
    lifetimeSessions,
  };
}

function getSessionStats(currentPath: string): SessionStats {
  const snapshot = upsertAnalyticsSession(currentPath);
  return {
    pages: snapshot.pagesCount,
    elapsedMinutes: snapshot.elapsedMinutes,
    sessionId: snapshot.sessionId,
    lifetimeSessions: snapshot.lifetimeSessions,
  };
}

export default useAnalyticsTracking;
