import { useEffect, useRef } from 'react';
import { safeSessionGet } from '../utils/safeStorage';

interface GeoLocation {
  country?: string;
  city?: string;
  timezone?: string;
}

/**
 * Sends enhanced page view analytics to a Discord webhook.
 * Tracks: UTM parameters, user agent, geolocation (GDPR compliant - anonymized),
 * and session statistics.
 * 
 * GDPR Compliance:
 * - No persistent cookies or device fingerprinting
 * - Geolocation is anonymized to country/city level only
 * - User Agent is public browser info, not personal data
 * - Session tracking resets on new session (sessionStorage only)
 * - No cross-site tracking
 */
const useAnalyticsTracking = (pathname: string): void => {
  const pageStartTimeRef = useRef<number>(Date.now());
  const geoCache = useRef<GeoLocation | null>(null);

  useEffect(() => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    // Parse UTM parameters from URL
    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source') || null,
      medium: params.get('utm_medium') || null,
      campaign: params.get('utm_campaign') || null,
      visitor: params.get('visitor') || null, // Custom: email or identifier
    };

    // Get user agent info
    const userAgent = navigator.userAgent;
    const browserInfo = getBrowserInfo(userAgent);

    // Track session stats
    const sessionStats = getSessionStats(pathname);

    // Format the page name for the message
    const pageName = pathname === '/' ? 'Home' : pathname.replace(/^\//, '').replace(/-/g, ' ');

    // Fetch geolocation (cached per session)
    const sendMessage = (geo: GeoLocation | null) => {
      const fields: Array<{ name: string; value: string; inline: boolean }> = [
        {
          name: 'Page',
          value: pathname,
          inline: true,
        },
        {
          name: 'Time on Page',
          value: `${Math.round((Date.now() - pageStartTimeRef.current) / 1000)}s`,
          inline: true,
        },
      ];

      // Add UTM tracking if present
      if (utm.source || utm.medium || utm.campaign) {
        fields.push({
          name: 'UTM Source',
          value: `${utm.source || '?'} / ${utm.medium || '?'}`,
          inline: true,
        });
        if (utm.campaign) {
          fields.push({
            name: 'Campaign',
            value: utm.campaign,
            inline: true,
          });
        }
      }

      // Add visitor identifier if provided
      if (utm.visitor) {
        fields.push({
          name: '👤 Visitor',
          value: utm.visitor,
          inline: true,
        });
      }

      // Add browser info
      fields.push({
        name: 'Browser',
        value: browserInfo,
        inline: true,
      });

      // Add geolocation if available (GDPR: anonymized, country/city only)
      if (geo?.country) {
        fields.push({
          name: '📍 Location',
          value: `${geo.city || 'Unknown'}, ${geo.country}`,
          inline: true,
        });
      }

      // Add session stats
      fields.push({
        name: 'Session',
        value: `${sessionStats.pages} pages, ${sessionStats.elapsedMinutes}m`,
        inline: true,
      });

      fields.push({
        name: 'Timestamp',
        value: new Date().toLocaleString(),
        inline: true,
      });

      // Send to Discord
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📊 **${pageName}**`,
          embeds: [
            {
              title: pageName,
              description: utm.visitor ? `Visitor: ${utm.visitor}` : 'Anonymous visit',
              color: utm.visitor ? 0x00ff00 : 0x5865f2,
              fields,
            },
          ],
        }),
      }).catch((err) => {
        console.debug('[Analytics] Failed to send to Discord:', err);
      });
    };

    // Try to get geolocation (cached)
    if (geoCache.current) {
      sendMessage(geoCache.current);
    } else {
      fetchGeolocation().then((geo) => {
        geoCache.current = geo;
        sendMessage(geo);
      });
    }
  }, [pathname]);
};

/**
 * Extract browser/device info from user agent (GDPR safe - public info)
 */
function getBrowserInfo(ua: string): string {
  const browsers = [
    { regex: /Chrome\/(\d+)/, name: 'Chrome' },
    { regex: /Safari\/(\d+)/, name: 'Safari' },
    { regex: /Firefox\/(\d+)/, name: 'Firefox' },
    { regex: /Edge\/(\d+)/, name: 'Edge' },
  ];

  let browser = 'Unknown';
  for (const { regex, name } of browsers) {
    if (regex.test(ua)) {
      browser = name;
      break;
    }
  }

  const isMobile = /iPhone|iPad|Android|Mobile/.test(ua);
  return `${browser} ${isMobile ? '📱 Mobile' : '🖥️ Desktop'}`;
}

/**
 * Fetch anonymized geolocation from IP (country/city level only)
 * Uses ipapi.co free tier (no auth required, GDPR compliant)
 */
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

/**
 * Track session statistics (pages visited, duration)
 */
function getSessionStats(currentPath: string): {
  pages: number;
  elapsedMinutes: number;
} {
  const rawPages = safeSessionGet('session-pages') || '[]';
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
  const elapsed = startTime
    ? Math.round((Date.now() - parseInt(startTime)) / 1000 / 60)
    : 0;

  return {
    pages: pages.length,
    elapsedMinutes: elapsed,
  };
}

export default useAnalyticsTracking;

