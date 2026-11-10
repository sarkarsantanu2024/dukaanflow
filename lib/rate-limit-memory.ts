/**
 * Fixed-window counter kept in process memory.
 *
 * This is the FALLBACK behind `lib/rate-limit.ts`, used when the `RateLimit`
 * table cannot be reached (or does not exist yet on a database that has not
 * had the migration applied). On Vercel it is per serverless instance, not
 * global — good enough to slow one client down, not a guarantee. Kept pure and
 * dependency-free so the window arithmetic can be unit-tested.
 */

export type Bucket = { count: number; resetAt: number };

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

const MAX_TRACKED_KEYS = 5000;

export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  hit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      if (this.buckets.size > MAX_TRACKED_KEYS) this.sweep(now);
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, retryAfterSeconds: 0 };
    }

    existing.count += 1;
    return verdict(existing.count, limit, existing.resetAt, now);
  }

  /** Drop expired buckets so an attacker rotating keys cannot grow the map forever. */
  sweep(now = Date.now()): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }

  /** For tests. */
  get size(): number {
    return this.buckets.size;
  }
}

/** Shared by the memory and database limiters: the same count, the same answer. */
export function verdict(count: number, limit: number, resetAtMs: number, now: number): RateLimitResult {
  if (count > limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAtMs - now) / 1000)) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client identity behind Vercel's proxy. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
