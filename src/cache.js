// Simple in-memory cache with optional TTL (time-to-live)
const cache = {};

export function setCache(key, value, ttlMs) {
  const expires = ttlMs ? Date.now() + ttlMs : null;
  cache[key] = { value, expires };
}

export function getCache(key) {
  const entry = cache[key];
  if (!entry) return undefined;
  if (entry.expires && entry.expires < Date.now()) {
    delete cache[key];
    return undefined;
  }
  return entry.value;
}

export function clearCache(key) {
  if (key) {
    delete cache[key];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
} 