type Bucket = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_MAP = new Map<string, Bucket>();
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 60;

export function checkRateLimit(
  key: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS,
): boolean {
  const now = Date.now();
  const bucket = RATE_LIMIT_MAP.get(key);

  if (!bucket || bucket.resetAt <= now) {
    RATE_LIMIT_MAP.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function clearRateLimitBuckets() {
  RATE_LIMIT_MAP.clear();
}
