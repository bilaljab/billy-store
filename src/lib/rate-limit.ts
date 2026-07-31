// In-memory per-process rate limiter — resets on cold start / across serverless instances,
// so this is best-effort defense-in-depth, not a hard guarantee (same caveat as before this
// was extracted from the login route's original inline Map).
export interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function checkRateLimit(
  map: Map<string, RateLimitRecord>,
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = map.get(key);
  if (!record || now > record.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (record.count >= max) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }
  record.count++;
  return { allowed: true };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || 'unknown';
}
