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
    ALLOWED_ORIGINS?: string;
  }
}

const DEFAULT_ALLOWED_ORIGINS = [
  'https://moksi.studio',
  'https://www.moksi.studio',
  'http://localhost:3000',
];

const parseAllowedOrigins = (env: Env): Set<string> => {
  const configured = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS);
};

const getRequestOrigin = (request: Request): string | null => {
  const originHeader = request.headers.get('Origin');
  if (originHeader) return originHeader;

  const referer = request.headers.get('Referer');
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
};

const createCorsHeaders = (
  requestOrigin: string | null,
  allowedOrigins: Set<string>,
  includeContentType = false
): Headers => {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  });

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    headers.set('Access-Control-Allow-Origin', requestOrigin);
  }

  if (includeContentType) {
    headers.set('Content-Type', 'text/plain; charset=utf-8');
  }

  return headers;
};

const responseWithCors = (
  body: string,
  status: number,
  requestOrigin: string | null,
  allowedOrigins: Set<string>
): Response =>
  new Response(body, {
    status,
    headers: createCorsHeaders(requestOrigin, allowedOrigins, true),
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigins = parseAllowedOrigins(env);
    const requestOrigin = getRequestOrigin(request);

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
        return responseWithCors('Forbidden: origin not allowed', 403, requestOrigin, allowedOrigins);
      }

      return new Response(null, {
        status: 204,
        headers: createCorsHeaders(requestOrigin, allowedOrigins),
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return responseWithCors('Method Not Allowed', 405, requestOrigin, allowedOrigins);
    }

    if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
      return responseWithCors('Forbidden: origin not allowed', 403, requestOrigin, allowedOrigins);
    }

    const webhookUrl = env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('[Worker] DISCORD_WEBHOOK_URL secret not set');
      return responseWithCors(
        'Internal Server Error: Webhook not configured',
        500,
        requestOrigin,
        allowedOrigins
      );
    }

    try {
      // Parse as text first so sendBeacon payloads are supported consistently.
      const rawBody = await request.text();
      if (!rawBody) {
        return responseWithCors('Bad Request: Empty body', 400, requestOrigin, allowedOrigins);
      }

      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return responseWithCors('Bad Request: Invalid JSON', 400, requestOrigin, allowedOrigins);
      }

      // Forward to Discord
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`[Worker] Discord returned ${response.status}: ${response.statusText}`);
        return responseWithCors(
          'Discord webhook failed',
          response.status,
          requestOrigin,
          allowedOrigins
        );
      }

      return responseWithCors('ok', 200, requestOrigin, allowedOrigins);
    } catch (error) {
      console.error('[Worker] Error:', error);
      return responseWithCors('Error processing request', 500, requestOrigin, allowedOrigins);
    }
  },
};
