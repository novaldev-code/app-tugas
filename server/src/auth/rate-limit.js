export const DEFAULT_RATE_LIMIT = 10;
export const DEFAULT_RATE_WINDOW_MS = 60_000;

export function createRateLimiter({
  limit = DEFAULT_RATE_LIMIT,
  windowMs = DEFAULT_RATE_WINDOW_MS,
  now = () => Date.now(),
} = {}) {
  const buckets = new Map();

  function check(key) {
    const timestamp = now();
    let bucket = buckets.get(key);

    if (!bucket || timestamp - bucket.startedAt >= windowMs) {
      bucket = { startedAt: timestamp, count: 0 };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const allowed = bucket.count <= limit;
    const retryAfterMs = allowed
      ? 0
      : Math.max(1, windowMs - (timestamp - bucket.startedAt));

    return {
      allowed,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterMs,
    };
  }

  function reset(key) {
    buckets.delete(key);
  }

  function clear() {
    buckets.clear();
  }

  return { check, reset, clear };
}
