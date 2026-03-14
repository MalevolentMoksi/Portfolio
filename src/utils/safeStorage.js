const localFallback = new Map();
const sessionFallback = new Map();

const canUseStorage = (storageName) => {
  try {
    if (typeof window === 'undefined') return false;
    return !!window[storageName];
  } catch {
    return false;
  }
};

const getStorage = (storageName) => {
  if (!canUseStorage(storageName)) return null;
  try {
    return window[storageName];
  } catch {
    return null;
  }
};

const safeGet = (storageName, fallbackMap, key) => {
  const storage = getStorage(storageName);
  if (storage) {
    try {
      const value = storage.getItem(key);
      if (value !== null) return value;
    } catch {
      // Fallback map below
    }
  }
  return fallbackMap.has(key) ? fallbackMap.get(key) : null;
};

const safeSet = (storageName, fallbackMap, key, value) => {
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

const safeRemove = (storageName, fallbackMap, key) => {
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

export const safeLocalGet = (key) => safeGet('localStorage', localFallback, key);
export const safeLocalSet = (key, value) => safeSet('localStorage', localFallback, key, value);
export const safeLocalRemove = (key) => safeRemove('localStorage', localFallback, key);

export const safeSessionGet = (key) => safeGet('sessionStorage', sessionFallback, key);
export const safeSessionSet = (key, value) =>
  safeSet('sessionStorage', sessionFallback, key, value);
export const safeSessionRemove = (key) => safeRemove('sessionStorage', sessionFallback, key);

export const safeLocalGetJSON = (key, fallback = null) => {
  const raw = safeLocalGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const safeLocalSetJSON = (key, value) => safeLocalSet(key, JSON.stringify(value));
