import { useEffect, useRef } from 'react';
import { safeLocalGet, safeSessionGet } from '../utils/safeStorage';

/* ── Non-standard Navigator API extensions ─────────────── */
interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}
declare global {
  interface Navigator {
    readonly connection?: NetworkInformation;
    readonly deviceMemory?: number;
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
  const geoCache = useRef<GeoLocation | null>(null);
  const geoFetched = useRef(false);

  useEffect(() => {
    // Reset page-start time on every navigation
    pageStartTimeRef.current = Date.now();

    const proxyUrl = import.meta.env.VITE_WEBHOOK_PROXY_URL;
    if (!proxyUrl) return;

    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source') || null,
      medium: params.get('utm_medium') || null,
      campaign: params.get('utm_campaign') || null,
      visitor: params.get('visitor') || null,
    };

    const browserInfo = getBrowserInfo(navigator.userAgent);
    const metrics = collectPageMetrics();
    const prefs = collectUserPreferences();
    const referrer = getReferrerDomain();
    const sessionStats = getSessionStats(pathname);
    const pageName = formatPageName(pathname);

    const sendMessage = (geo: GeoLocation | null): void => {
      const isKnownVisitor = !!utm.visitor;
      const timeOnPage = Math.round((Date.now() - pageStartTimeRef.current) / 1000);
      const fields: EmbedField[] = [];

      // ── Row 1: Navigation ─────────────────────────────────
      fields.push({ name: '📄 Page', value: `\`${pathname}\``, inline: true });
      fields.push({ name: '⏱️ Time on Page', value: `${timeOnPage}s`, inline: true });
      fields.push({ name: '🔗 Referrer', value: referrer ?? '*direct*', inline: true });

      // ── Row 2: Location & Browser ─────────────────────────
      fields.push({
        name: '📍 Location',
        value: geo?.country ? `${geo.city ?? '?'}, ${geo.country}` : '*unavailable*',
        inline: true,
      });
      fields.push({ name: '🌐 Language', value: prefs.language.toUpperCase(), inline: true });
      fields.push({ name: '🖥️ Browser', value: browserInfo, inline: true });

      // ── Row 3: UTM tracking (only if any param present) ───
      if (utm.source || utm.medium || utm.campaign || utm.visitor) {
        fields.push({
          name: '📣 Source',
          value: `${utm.source ?? '?'} / ${utm.medium ?? '?'}`,
          inline: true,
        });
        fields.push({ name: '🎯 Campaign', value: utm.campaign ?? '*none*', inline: true });
        fields.push({ name: '👤 Visitor', value: utm.visitor ?? '*anonymous*', inline: true });
      }

      // ── Row 4: User Preferences ───────────────────────────
      fields.push({ name: '🎨 Mood', value: prefs.mood, inline: true });
      fields.push({ name: '♿ Accessibility', value: prefs.a11y, inline: true });
      fields.push({ name: '🎵 Music', value: prefs.musicState, inline: true });

      // ── Row 5: Technical ──────────────────────────────────
      fields.push({
        name: '⚡ Load Time',
        value: metrics.loadTimeMs !== null ? `${metrics.loadTimeMs}ms` : '*n/a*',
        inline: true,
      });
      fields.push({ name: '📶 Connection', value: metrics.connectionType, inline: true });
      fields.push({ name: '💾 Device RAM', value: metrics.deviceMemory, inline: true });

      // ── Row 6: Meta ───────────────────────────────────────
      fields.push({
        name: '🖥️ Display',
        value: `${metrics.viewportCategory}${metrics.isPWA ? ' · PWA' : ''}`,
        inline: true,
      });
      fields.push({
        name: '📊 Session',
        value: `${sessionStats.pages} page${sessionStats.pages !== 1 ? 's' : ''} · ${sessionStats.elapsedMinutes}min`,
        inline: true,
      });

      fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              author: { name: '📊 Portfolio Analytics' },
              title: pageName,
              description: isKnownVisitor
                ? `👤 **${utm.visitor}** is visiting`
                : '🔍 Anonymous visit',
              color: isKnownVisitor ? 0x00ff99 : 0x5865f2,
              fields,
              timestamp: new Date().toISOString(),
              footer: {
                text: geo?.timezone ?? 'timezone unknown',
              },
            },
          ],
        }),
      }).catch((err: unknown) => {
        console.debug('[Analytics] Failed to send:', err);
      });
    };

    if (geoFetched.current) {
      sendMessage(geoCache.current);
    } else {
      geoFetched.current = true;
      fetchGeolocation().then((geo) => {
        geoCache.current = geo;
        sendMessage(geo);
      });
    }
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

function collectPageMetrics(): {
  loadTimeMs: number | null;
  connectionType: string;
  deviceMemory: string;
  viewportCategory: string;
  isPWA: boolean;
} {
  let loadTimeMs: number | null = null;
  try {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (nav?.loadEventEnd > 0) {
      loadTimeMs = Math.round(nav.loadEventEnd - nav.startTime);
    }
  } catch {
    /* ignore */
  }

  const connectionType = navigator.connection?.effectiveType ?? 'unknown';
  const deviceMemory =
    navigator.deviceMemory !== undefined ? `${navigator.deviceMemory} GB` : 'unknown';

  const w = window.innerWidth;
  const viewportCategory = w < 768 ? '📱 Mobile' : w < 1024 ? '💻 Tablet' : '🖥️ Desktop';
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  return { loadTimeMs, connectionType, deviceMemory, viewportCategory, isPWA };
}

function collectUserPreferences(): {
  mood: string;
  language: string;
  a11y: string;
  musicState: string;
} {
  const moodKey = safeLocalGet('portfolio-mood') ?? 'default';
  const moodLabels: Record<string, string> = {
    default: '◆ Default',
    hacker: '> Terminal',
    vaporwave: '~ Vaporwave',
    europa: '❄ Europa',
    industrial: '⚙ Industriel',
  };
  const mood = moodLabels[moodKey] ?? moodKey;

  const language = safeLocalGet('i18nextLng') ?? 'fr';

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
  }

  const musicPaused = safeLocalGet('music-isPaused');
  let musicState: string;
  if (musicPaused === 'false') {
    musicState = '▶ Playing';
  } else if (musicPaused === 'true') {
    musicState = '⏸ Paused';
  } else {
    musicState = '*inactive*';
  }

  return {
    mood,
    language,
    a11y: a11yFlags.length > 0 ? a11yFlags.join(', ') : '*none*',
    musicState,
  };
}

function getReferrerDomain(): string | null {
  try {
    const ref = document.referrer;
    if (!ref) return null;
    // Hostname only — never the full URL (query params can contain personal data)
    return new URL(ref).hostname;
  } catch {
    return null;
  }
}

function getBrowserInfo(ua: string): string {
  // Order matters: Edge/Opera include "Chrome" in their UA string
  const browsers = [
    { regex: /Edg\//, name: 'Edge' },
    { regex: /OPR\//, name: 'Opera' },
    { regex: /Firefox\//, name: 'Firefox' },
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

  const isMobile = /iPhone|iPad|Android|Mobile/.test(ua);
  return `${browser} · ${isMobile ? 'Mobile' : 'Desktop'}`;
}

async function fetchGeolocation(): Promise<GeoLocation | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error('Geolocation unavailable');
    const data = (await response.json()) as {
      country_name?: string;
      city?: string;
      timezone?: string;
    };
    return {
      country: data.country_name,
      city: data.city,
      timezone: data.timezone,
    };
  } catch {
    console.debug('[Analytics] Geolocation fetch failed');
    return null;
  }
}

function getSessionStats(currentPath: string): { pages: number; elapsedMinutes: number } {
  const rawPages = safeSessionGet('session-pages') ?? '[]';
  let pages: string[] = [];
  try {
    pages = JSON.parse(rawPages) as string[];
  } catch {
    pages = [];
  }

  if (!pages.includes(currentPath)) {
    pages.push(currentPath);
  }

  const startTime = safeSessionGet('session-start');
  const elapsed = startTime ? Math.round((Date.now() - parseInt(startTime, 10)) / 1000 / 60) : 0;
  return { pages: pages.length, elapsedMinutes: elapsed };
}

export default useAnalyticsTracking;
