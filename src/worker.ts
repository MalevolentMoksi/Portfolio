/**
 * Cloudflare Worker: Discord Webhook Proxy
 *
 * This worker proxies analytics requests to Discord, keeping the real webhook URL
 * private (stored as a secret, never exposed to the client).
 *
 * Deployment:
 * 1. wrangler secret put DISCORD_WEBHOOK_URL  # Paste your Discord webhook URL
 * 2. wrangler deploy
 * 3. Get your worker URL: https://portfolio-webhook-proxy.<your-name>.workers.dev
 */

declare global {
  interface Env {
    DISCORD_WEBHOOK_URL?: string;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const webhookUrl = env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('[Worker] DISCORD_WEBHOOK_URL secret not set');
      return new Response('Internal Server Error: Webhook not configured', {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // Parse incoming request body
      const payload = await request.json();

      // Forward to Discord
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`[Worker] Discord returned ${response.status}: ${response.statusText}`);
        return new Response('Discord webhook failed', {
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return new Response('ok', {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('[Worker] Error:', error);
      return new Response('Error processing request', {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
