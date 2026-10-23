/**
 * Rebuilds an analytics payload from a strict Discord embed whitelist before the
 * Cloudflare Worker (src/worker.ts) forwards it to the webhook.
 */

// The worker's Origin check only stops browsers: any HTTP client can forge the header.
// So the payload itself is never trusted: it is rebuilt from a strict embed whitelist
// before reaching Discord (no free `content`, no username/avatar spoofing, no
// mentions, no remote images), and its size is capped.
export const MAX_BODY_BYTES = 16 * 1024;
const MAX_EMBEDS = 2;
const MAX_FIELDS = 10;
const LIMITS = {
  authorName: 256,
  title: 256,
  description: 2048,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 256,
};

type DiscordEmbed = {
  author?: { name: string };
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline: boolean }[];
  timestamp?: string;
  footer?: { text: string };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const clampText = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
};

const sanitizeEmbed = (raw: unknown): DiscordEmbed | null => {
  if (!isRecord(raw)) return null;

  const embed: DiscordEmbed = {};

  const authorName = isRecord(raw.author)
    ? clampText(raw.author.name, LIMITS.authorName)
    : undefined;
  if (authorName) embed.author = { name: authorName };

  const title = clampText(raw.title, LIMITS.title);
  if (title) embed.title = title;

  const description = clampText(raw.description, LIMITS.description);
  if (description) embed.description = description;

  if (
    typeof raw.color === 'number' &&
    Number.isInteger(raw.color) &&
    raw.color >= 0 &&
    raw.color <= 0xffffff
  ) {
    embed.color = raw.color;
  }

  if (Array.isArray(raw.fields)) {
    const fields = raw.fields
      .slice(0, MAX_FIELDS)
      .filter(isRecord)
      .map((field) => ({
        name: clampText(field.name, LIMITS.fieldName),
        value: clampText(field.value, LIMITS.fieldValue),
        inline: field.inline === true,
      }))
      .filter(
        (field): field is { name: string; value: string; inline: boolean } =>
          !!field.name && !!field.value
      );
    if (fields.length > 0) embed.fields = fields;
  }

  if (typeof raw.timestamp === 'string' && !Number.isNaN(Date.parse(raw.timestamp))) {
    embed.timestamp = new Date(raw.timestamp).toISOString();
  }

  const footerText = isRecord(raw.footer)
    ? clampText(raw.footer.text, LIMITS.footerText)
    : undefined;
  if (footerText) embed.footer = { text: footerText };

  return Object.keys(embed).length > 0 ? embed : null;
};

export const sanitizeDiscordPayload = (
  payload: unknown
): { embeds: DiscordEmbed[]; allowed_mentions: { parse: never[] } } | null => {
  if (!isRecord(payload) || !Array.isArray(payload.embeds)) return null;

  const embeds = payload.embeds
    .slice(0, MAX_EMBEDS)
    .map(sanitizeEmbed)
    .filter((embed): embed is DiscordEmbed => embed !== null);
  if (embeds.length === 0) return null;

  return { embeds, allowed_mentions: { parse: [] } };
};
