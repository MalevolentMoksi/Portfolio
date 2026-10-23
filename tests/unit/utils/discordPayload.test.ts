import { describe, expect, it } from 'vitest';
import { sanitizeDiscordPayload } from '@/utils/discordPayload';

describe('sanitizeDiscordPayload', () => {
  it('keeps whitelisted embed fields and disables mentions', () => {
    const result = sanitizeDiscordPayload({
      embeds: [
        {
          author: { name: 'Portfolio Analytics', url: 'https://evil.example' },
          title: 'Page view',
          color: 0xffb347,
          fields: [{ name: 'Path', value: '`/projets`', inline: true }],
          timestamp: '2026-01-01T00:00:00.000Z',
          footer: { text: 'Europe/Paris', icon_url: 'https://evil.example/x.png' },
        },
      ],
    });

    expect(result).toEqual({
      embeds: [
        {
          author: { name: 'Portfolio Analytics' },
          title: 'Page view',
          color: 0xffb347,
          fields: [{ name: 'Path', value: '`/projets`', inline: true }],
          timestamp: '2026-01-01T00:00:00.000Z',
          footer: { text: 'Europe/Paris' },
        },
      ],
      allowed_mentions: { parse: [] },
    });
  });

  it('drops free content, identity spoofing and remote images', () => {
    const result = sanitizeDiscordPayload({
      content: '@everyone free nitro',
      username: 'Discord',
      avatar_url: 'https://evil.example/avatar.png',
      tts: true,
      embeds: [
        {
          title: 'Hi',
          url: 'https://evil.example',
          image: { url: 'https://evil.example/a.png' },
          thumbnail: { url: 'https://evil.example/b.png' },
        },
      ],
    });

    expect(result).toEqual({ embeds: [{ title: 'Hi' }], allowed_mentions: { parse: [] } });
  });

  it('caps lengths and counts', () => {
    const result = sanitizeDiscordPayload({
      embeds: Array.from({ length: 5 }, () => ({
        title: 'x'.repeat(1000),
        fields: Array.from({ length: 30 }, () => ({ name: 'n', value: 'v'.repeat(5000) })),
      })),
    });

    expect(result?.embeds).toHaveLength(2);
    expect(result?.embeds[0].title).toHaveLength(256);
    expect(result?.embeds[0].fields).toHaveLength(10);
    expect(result?.embeds[0].fields?.[0].value).toHaveLength(1024);
  });

  it('rejects payloads without a usable embed', () => {
    expect(sanitizeDiscordPayload(null)).toBeNull();
    expect(sanitizeDiscordPayload({ content: 'spam' })).toBeNull();
    expect(sanitizeDiscordPayload({ embeds: [] })).toBeNull();
    expect(sanitizeDiscordPayload({ embeds: [{ color: 'red', url: 'https://x' }] })).toBeNull();
  });
});
