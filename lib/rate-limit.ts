import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { MemoryRateLimiter, verdict, type RateLimitResult } from './rate-limit-memory';

export { clientIp, type RateLimitResult } from './rate-limit-memory';

/**
 * Fixed-window rate limiter backed by the `RateLimit` table, so the count is
 * GLOBAL across every serverless instance.
 *
 * The in-memory limiter this replaces was per instance: on Vercel a login
 * brute-force spread across instances saw a fresh "8 attempts" on each one,
 * and a cold start forgot everything. A 6-digit owner PIN is a million codes;
 * a limit that only sometimes applies is not a limit.
 *
 * One statement per hit — an upsert whose CASE expressions start a new window
 * when the old one has lapsed — so two requests arriving together cannot both
 * read "7" and both write "8". Postgres serialises the row; the counter is
 * exact.
 *
 * If the table cannot be reached (or has not been created yet — the migration
 * is additive and may land after the code), the limiter FALLS BACK to memory
 * rather than failing open or closed: a database blip must not lock every
 * shopkeeper out of their till, and must not switch rate limiting off either.
 * The fallback is logged once per process so the gap is visible.
 */

const memory = new MemoryRateLimiter();
let warnedFallback = false;

/** Rows older than this are dead weight; swept opportunistically. */
const SWEEP_AFTER_MS = 24 * 60 * 60 * 1000;
const SWEEP_PROBABILITY = 0.01;

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"
    `;
    const row = rows[0];
    if (!row) throw new Error('RateLimit upsert returned no row');

    if (Math.random() < SWEEP_PROBABILITY) void sweepExpired(now);

    return verdict(Number(row.count), limit, row.resetAt.getTime(), now.getTime());
  } catch (error) {
    if (!warnedFallback) {
      warnedFallback = true;
      const missingTable =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
      console.error(
        missingTable
          ? 'RateLimit table is missing — run the migration (npm run db:push). Falling back to per-instance memory.'
          : 'RateLimit table unreachable — falling back to per-instance memory.',
        missingTable ? '' : error,
      );
    }
    return memory.hit(key, limit, windowMs, now.getTime());
  }
}

async function sweepExpired(now: Date): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({
      where: { resetAt: { lt: new Date(now.getTime() - SWEEP_AFTER_MS) } },
    });
  } catch {
    // Housekeeping only; the next hit will try again.
  }
}
