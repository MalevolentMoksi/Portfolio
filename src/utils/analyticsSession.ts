import { safeLocalGet, safeLocalSet } from './safeStorage';

export const ANALYTICS_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const SESSION_ID_KEY = 'portfolio-analytics-session-id';
const SESSION_START_KEY = 'portfolio-analytics-session-start';
const SESSION_LAST_ACTIVITY_KEY = 'portfolio-analytics-session-last-activity';
const SESSION_PAGES_KEY = 'portfolio-analytics-session-pages';
const SESSION_LAST_PATH_KEY = 'portfolio-analytics-session-last-path';
const LIFETIME_SESSION_COUNT_KEY = 'portfolio-analytics-session-count';

export interface AnalyticsSessionSnapshot {
  sessionId: string;
  startTimeMs: number;
  lastActivityMs: number;
  pagesCount: number;
  elapsedMinutes: number;
  lifetimeSessions: number;
  previousPath: string | null;
  isNewSession: boolean;
}

function parseNumber(rawValue: string | null): number | null {
  if (!rawValue) return null;
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePages(rawValue: string | null): string[] {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
  } catch {
    return [];
  }
}

function createSessionId(length = 10): string {
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

function incrementLifetimeSessionCount(): number {
  const current = parseNumber(safeLocalGet(LIFETIME_SESSION_COUNT_KEY)) ?? 0;
  const next = current > 0 ? current + 1 : 1;
  safeLocalSet(LIFETIME_SESSION_COUNT_KEY, String(next));
  return next;
}

function createNewSession(now: number): void {
  safeLocalSet(SESSION_ID_KEY, createSessionId());
  safeLocalSet(SESSION_START_KEY, String(now));
  safeLocalSet(SESSION_LAST_ACTIVITY_KEY, String(now));
  safeLocalSet(SESSION_PAGES_KEY, '[]');
  safeLocalSet(SESSION_LAST_PATH_KEY, '');
  incrementLifetimeSessionCount();
}

export function upsertAnalyticsSession(currentPath?: string): AnalyticsSessionSnapshot {
  const now = Date.now();
  const existingId = safeLocalGet(SESSION_ID_KEY);
  const lastActivity = parseNumber(safeLocalGet(SESSION_LAST_ACTIVITY_KEY));
  const isExpired = !lastActivity || now - lastActivity > ANALYTICS_SESSION_TIMEOUT_MS;

  const isNewSession = !existingId || isExpired;
  if (isNewSession) {
    createNewSession(now);
  }

  let sessionId = safeLocalGet(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = createSessionId();
    safeLocalSet(SESSION_ID_KEY, sessionId);
  }

  let startTimeMs = parseNumber(safeLocalGet(SESSION_START_KEY));
  if (!startTimeMs) {
    startTimeMs = now;
    safeLocalSet(SESSION_START_KEY, String(startTimeMs));
  }

  const previousPathRaw = safeLocalGet(SESSION_LAST_PATH_KEY);
  const previousPath = previousPathRaw && previousPathRaw.trim() ? previousPathRaw : null;

  let pages = parsePages(safeLocalGet(SESSION_PAGES_KEY));
  if (currentPath && !pages.includes(currentPath)) {
    pages = [...pages, currentPath];
    safeLocalSet(SESSION_PAGES_KEY, JSON.stringify(pages));
  }

  if (currentPath) {
    safeLocalSet(SESSION_LAST_PATH_KEY, currentPath);
  }

  safeLocalSet(SESSION_LAST_ACTIVITY_KEY, String(now));

  const lifetimeSessions = Math.max(1, parseNumber(safeLocalGet(LIFETIME_SESSION_COUNT_KEY)) ?? 1);
  const elapsedMinutes = Math.max(0, Math.round((now - startTimeMs) / 1000 / 60));

  return {
    sessionId,
    startTimeMs,
    lastActivityMs: now,
    pagesCount: pages.length,
    elapsedMinutes,
    lifetimeSessions,
    previousPath,
    isNewSession,
  };
}

export function touchAnalyticsSessionActivity(): AnalyticsSessionSnapshot {
  return upsertAnalyticsSession();
}
