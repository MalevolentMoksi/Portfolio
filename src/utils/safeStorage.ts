type StorageName = 'localStorage' | 'sessionStorage';

const localFallback = new Map<string, string>();
const sessionFallback = new Map<string, string>();

const canUseStorage = (storageName: StorageName): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    return !!window[storageName];
  } catch {
    return false;
  }
};

const getStorage = (storageName: StorageName): Storage | null => {
  if (!canUseStorage(storageName)) return null;
  try {
    return window[storageName];
  } catch {
    return null;
  }
};

const safeGet = (
  storageName: StorageName,
  fallbackMap: Map<string, string>,
  key: string
): string | null => {
  const storage = getStorage(storageName);
  if (storage) {
    try {
      const value = storage.getItem(key);
      if (value !== null) return value;
    } catch {
      // Fallback map below
    }
  }
  return fallbackMap.has(key) ? fallbackMap.get(key)! : null;
};

const safeSet = (
  storageName: StorageName,
  fallbackMap: Map<string, string>,
  key: string,
  value: unknown
): boolean => {
  const stringValue = String(value);
  const storage = getStorage(storageName);
  if (storage) {
    try {
      storage.setItem(key, stringValue);
      return true;
    } catch {
      // Fallback map below
    }
  }
  fallbackMap.set(key, stringValue);
  return false;
};

const safeRemove = (
  storageName: StorageName,
  fallbackMap: Map<string, string>,
  key: string
): void => {
  const storage = getStorage(storageName);
  if (storage) {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore and still clear in fallback map
    }
  }
  fallbackMap.delete(key);
};

export const safeLocalGet = (key: string): string | null =>
  safeGet('localStorage', localFallback, key);
export const safeLocalSet = (key: string, value: unknown): boolean =>
  safeSet('localStorage', localFallback, key, value);
export const safeLocalRemove = (key: string): void =>
  safeRemove('localStorage', localFallback, key);

export const safeSessionGet = (key: string): string | null =>
  safeGet('sessionStorage', sessionFallback, key);
export const safeSessionSet = (key: string, value: unknown): boolean =>
  safeSet('sessionStorage', sessionFallback, key, value);
export const safeSessionRemove = (key: string): void =>
  safeRemove('sessionStorage', sessionFallback, key);

export const safeLocalGetJSON = <T>(key: string, fallback: T | null = null): T | null => {
  const raw = safeLocalGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const safeLocalSetJSON = <T>(key: string, value: T): boolean =>
  safeLocalSet(key, JSON.stringify(value));
