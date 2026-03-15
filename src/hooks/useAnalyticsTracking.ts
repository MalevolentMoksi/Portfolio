import { useEffect } from 'react';

/**
 * Sends page view analytics to a Discord webhook.
 * Requires VITE_DISCORD_WEBHOOK_URL env var.
 * Each page view is posted as a Discord message with metadata.
 */
const useAnalyticsTracking = (pathname: string): void => {
  useEffect(() => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

    // Skip if webhook URL not configured
    if (!webhookUrl) {
      return;
    }

    // Format the page name for the message
    const pageName = pathname === '/' ? 'Home' : pathname.replace(/^\//, '').replace(/-/g, ' ');

    // POST to Discord webhook
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `📊 **Page View**`,
        embeds: [
          {
            title: pageName,
            description: pathname,
            color: 0x5865f2, // Discord blurple
            fields: [
              {
                name: 'Timestamp',
                value: new Date().toLocaleString(),
                inline: true,
              },
              {
                name: 'Referrer',
                value: document.referrer || 'Direct',
                inline: true,
              },
            ],
          },
        ],
      }),
    }).catch((err) => {
      // Silently fail - don't break the app if Discord is down
      console.debug('[Analytics] Failed to send to Discord:', err);
    });
  }, [pathname]);
};

export default useAnalyticsTracking;
