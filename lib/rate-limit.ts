const buckets = new Map<string, { count: number; resetAt: number }>();

/** Fixed-window limiter. Returns true if the call is allowed. In-memory (per server instance). */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}
