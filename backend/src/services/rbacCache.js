const DEFAULT_TTL_MS = Number(process.env.RBAC_CACHE_TTL_MS || 300000);

const cache = new Map();

const getCacheKey = (userId, spaceId) => `${String(userId)}::${String(spaceId || "SYSTEM")}`;

const setAuthzCache = (userId, spaceId, value, ttlMs = DEFAULT_TTL_MS) => {
  cache.set(getCacheKey(userId, spaceId), {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

const getAuthzCache = (userId, spaceId) => {
  const key = getCacheKey(userId, spaceId);
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.value;
};

const invalidateByUserAndSpace = (userId, spaceId) => {
  cache.delete(getCacheKey(userId, spaceId));
};

const invalidateByUser = (userId) => {
  const prefix = `${String(userId)}::`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

const invalidateBySpace = (spaceId) => {
  const suffix = `::${String(spaceId)}`;
  for (const key of cache.keys()) {
    if (key.endsWith(suffix)) {
      cache.delete(key);
    }
  }
};

const clearRbacCache = () => cache.clear();

module.exports = {
  getAuthzCache,
  setAuthzCache,
  invalidateByUserAndSpace,
  invalidateByUser,
  invalidateBySpace,
  clearRbacCache,
};
