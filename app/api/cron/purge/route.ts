import { fail, ok } from '@/lib/http';
import { purgeExpiredRecords, RETENTION_YEARS } from '@/lib/retention';
import { rollupYear } from '@/lib/rollup';
import { shopClock } from '@/lib/time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Rolling up and deleting a year's backlog takes longer than a page load. */
export const maxDuration = 60;

/**
 * GET /api/cron/purge — rolls up the year, then deletes each shop's orders and
 * counter sales from before its own subscription anniversary.
 *
 * THE TWO STEPS ARE IN THIS ORDER FOR A REASON, and it is the only thing about
 * this route that must never be changed casually. The rollup writes the yearly
 * and per-occasion totals into tables that are never purged; the purge then
 * deletes the raw rows those totals came from. Reverse them and a shop's first
 * year is deleted before it is ever summarised — and unlike the raw rows, the
 * summary cannot be recomputed afterwards from anything.
 *
 * Wired to a daily Vercel cron in `vercel.json`. Vercel signs its own cron
 * calls with `Authorization: Bearer $CRON_SECRET`, and this refuses anything
 * else: the endpoint deletes rows, and an unauthenticated URL that deletes rows
 * is a URL somebody will eventually find.
 *
 * With no `CRON_SECRET` set it refuses everything rather than defaulting to
 * open. A cleanup job that silently stops running is a slowly growing database;
 * a cleanup job that anybody can trigger is a data loss incident.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail('CRON_SECRET is not configured', 503);
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return fail('Not authenticated', 401);
  }

  // Both the current year and the previous one. A purge in, say, March deletes
  // rows from the year before, and that year's rollup has not been touched
  // since December — so it is refreshed here before those rows go.
  const thisYear = shopClock(new Date()).year;
  const rollups = [await rollupYear(thisYear - 1), await rollupYear(thisYear)];

  for (const rollup of rollups) {
    console.log(
      `[rollup] ${rollup.year}: ${rollup.itemRows} item row(s), ` +
        `${rollup.areaRows} area row(s) across ${rollup.shops} shop(s)`,
    );
  }

  // Only now, with the totals safely written.
  const result = await purgeExpiredRecords();

  // Logged as well as returned — nobody reads a cron job's response body, and
  // "did the purge run, and what did it take" is asked months later. Only the
  // shops that actually lost rows are logged; the rest would be noise.
  console.log(
    `[purge] ${RETENTION_YEARS}-year window per shop: ` +
      `${result.orders} order(s), ${result.sales} sale(s) across ${result.shops} shop(s)`,
  );
  for (const shop of result.detail) {
    if (shop.orders + shop.sales === 0) continue;
    console.log(
      `[purge]   ${shop.slug} — before ${shop.cutoff.toISOString()}: ` +
        `${shop.orders} order(s), ${shop.sales} sale(s)`,
    );
  }

  return ok({
    rolledUp: rollups,
    retentionYears: RETENTION_YEARS,
    shopsAffected: result.shops,
    ordersDeleted: result.orders,
    salesDeleted: result.sales,
    shops: result.detail.map((shop) => ({
      slug: shop.slug,
      cutoff: shop.cutoff.toISOString(),
      ordersDeleted: shop.orders,
      salesDeleted: shop.sales,
    })),
  });
}
