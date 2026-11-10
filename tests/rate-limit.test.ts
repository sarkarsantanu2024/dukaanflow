import { describe, expect, it } from 'vitest';
import { MemoryRateLimiter, clientIp, verdict } from '@/lib/rate-limit-memory';

/**
 * The window arithmetic shared by the database limiter and its in-memory
 * fallback. The database path is one SQL statement whose CASE expressions
 * mirror `MemoryRateLimiter.hit`; `verdict` is the one function both call.
 */

const MINUTE = 60_000;

describe('verdict', () => {
  it('allows up to the limit and refuses the next', () => {
    const resetAt = 10 * MINUTE;
    expect(verdict(8, 8, resetAt, 0)).toEqual({ ok: true, retryAfterSeconds: 0 });
    expect(verdict(9, 8, resetAt, 0)).toEqual({ ok: false, retryAfterSeconds: 600 });
  });

  it('never tells a refused caller to retry in zero seconds', () => {
    // Window about to lapse: still at least one second.
    expect(verdict(9, 8, 1_000, 999).retryAfterSeconds).toBe(1);
    expect(verdict(9, 8, 500, 1_000).retryAfterSeconds).toBe(1);
  });
});

describe('MemoryRateLimiter', () => {
  it('counts hits within a window and refuses past the limit', () => {
    const limiter = new MemoryRateLimiter();
    const t0 = 1_000_000;
    for (let i = 1; i <= 5; i += 1) {
      expect(limiter.hit('k', 5, 15 * MINUTE, t0 + i).ok, `hit ${i}`).toBe(true);
    }
    const sixth = limiter.hit('k', 5, 15 * MINUTE, t0 + 6);
    expect(sixth.ok).toBe(false);
    expect(sixth.retryAfterSeconds).toBe(Math.ceil((15 * MINUTE - 5) / 1000));
  });

  it('starts a fresh window once the old one lapses', () => {
    const limiter = new MemoryRateLimiter();
    const t0 = 0;
    for (let i = 0; i < 3; i += 1) limiter.hit('k', 2, MINUTE, t0);
    expect(limiter.hit('k', 2, MINUTE, t0 + 1).ok).toBe(false);
    expect(limiter.hit('k', 2, MINUTE, t0 + MINUTE).ok).toBe(true);
  });

  it('keeps keys independent', () => {
    const limiter = new MemoryRateLimiter();
    for (let i = 0; i < 3; i += 1) limiter.hit('a', 2, MINUTE, 0);
    expect(limiter.hit('a', 2, MINUTE, 1).ok).toBe(false);
    expect(limiter.hit('b', 2, MINUTE, 1).ok).toBe(true);
  });

  it('sweeps lapsed buckets', () => {
    const limiter = new MemoryRateLimiter();
    limiter.hit('old', 1, MINUTE, 0);
    limiter.hit('new', 1, MINUTE, MINUTE);
    limiter.sweep(MINUTE);
    expect(limiter.size).toBe(1);
  });
});

describe('clientIp', () => {
  it('takes the first forwarded address', () => {
    const request = new Request('https://x', { headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } });
    expect(clientIp(request)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip, then "unknown"', () => {
    expect(clientIp(new Request('https://x', { headers: { 'x-real-ip': '5.6.7.8' } }))).toBe('5.6.7.8');
    expect(clientIp(new Request('https://x'))).toBe('unknown');
  });
});
