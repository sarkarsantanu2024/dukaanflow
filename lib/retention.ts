/**
 * How long DukaanFlow keeps a shop's transactions, and what it never deletes.
 *
 * Orders and counter sales are the two tables that grow without limit — a busy
 * kirana writes a few hundred rows a month, forever, and every one of them is
 * read by the reports and by nothing else.
 *
 * THE WINDOW IS PER SHOP, ANCHORED TO ITS SUBSCRIPTION.
 *
 * Not one global cutoff. A shop keeps the transactions of its **current
 * subscription year**: on each anniversary of the day its subscription began,
 * everything from before that anniversary is deleted. So a shop that started in
 * March is cleared each March, and one that started in November each November —
 * the window a shop is paying for is the window it can report on, and the purge
 * lands on the same date its billing does.
 *
 * The anchor is the earliest `Payment.periodStart` on record — the day the shop
 * actually started paying. A shop that has never paid falls back to `createdAt`,
 * the day its trial began, because a trial is still the start of a relationship
 * and something has to anchor the clock.
 *
 * WHAT IS NEVER PURGED, and why each one stays:
 *
 * - `LedgerEntry` — the khata. A balance here is derived by summing entries, so
 *   deleting old ones silently changes what a customer owes. This is somebody's
 *   money on a shopkeeper's word; it is the last thing in this database that
 *   may be quietly dropped. (A `LedgerEntry.saleId` may point at a purged sale.
 *   It is a plain column, not a foreign key, precisely so this can happen.)
 * - `Payment` — what a shop paid DukaanFlow. A billing record, and the anchor
 *   this whole policy is computed from: purging it would move the window.
 * - `Customer`, `Shop`, `Item` — not transactions. They do not grow with trade.
 *
 * THE COST, stated plainly: once a period falls before a shop's cutoff, no
 * report can be produced for it — the rows are gone. `shopCutoff` is exported so
 * the report can say so on its own face rather than quietly showing zeroes.
 */

import { prisma } from './prisma';

/** The window, in years. One subscription year. */
export const RETENTION_YEARS = 1;

/** What a shop's retention clock is anchored to. */
export type RetentionAnchor = {
  shopId: string;
  slug: string;
  /** Subscription start: first payment's period start, else the trial's start. */
  startedAt: Date;
};

/**
 * The instant before which a shop's transactions are deleted: the most recent
 * anniversary of its subscription start that has already passed.
 *
 * Before the first anniversary this is the start date itself, so a shop in its
 * first year loses nothing.
 *
 * February 29 anchors land on March 1 in common years — `Date.UTC` rolls the
 * overflow forward. That is a day either way on a policy measured in years, and
 * it is deliberate: the alternative is a cutoff that silently fails to advance.
 */
export function shopCutoff(startedAt: Date, now: Date = new Date()): Date {
  let years = now.getUTCFullYear() - startedAt.getUTCFullYear();

  const anniversary = (count: number) =>
    new Date(
      Date.UTC(
        startedAt.getUTCFullYear() + count,
        startedAt.getUTCMonth(),
        startedAt.getUTCDate(),
        startedAt.getUTCHours(),
        startedAt.getUTCMinutes(),
        startedAt.getUTCSeconds(),
        startedAt.getUTCMilliseconds(),
      ),
    );

  // This year's anniversary may not have arrived yet.
  if (anniversary(years).getTime() > now.getTime()) years -= 1;

  // Round down to whole retention windows, so a 2-year policy would keep two.
  const kept = Math.floor(years / RETENTION_YEARS) * RETENTION_YEARS;
  return kept <= 0 ? startedAt : anniversary(kept);
}

/** Every shop's anchor, for the purge and for the report's caveats. */
export async function retentionAnchors(): Promise<RetentionAnchor[]> {
  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      slug: true,
      createdAt: true,
      payments: {
        select: { periodStart: true },
        orderBy: { periodStart: 'asc' },
        take: 1,
      },
    },
  });

  return shops.map((shop) => ({
    shopId: shop.id,
    slug: shop.slug,
    startedAt: shop.payments[0]?.periodStart ?? shop.createdAt,
  }));
}

export type PurgeResult = {
  shops: number;
  orders: number;
  sales: number;
  /** Per shop, for the log — a purge nobody can audit is a purge nobody trusts. */
  detail: { slug: string; cutoff: Date; orders: number; sales: number }[];
};

/**
 * Deletes each shop's orders and counter sales from before its own cutoff.
 *
 * Idempotent, and safe to run twice in a day: the second pass finds nothing.
 */
export async function purgeExpiredRecords(now: Date = new Date()): Promise<PurgeResult> {
  const anchors = await retentionAnchors();
  const result: PurgeResult = { shops: 0, orders: 0, sales: 0, detail: [] };

  // One shop at a time, sequentially. Nothing is waiting on this job, and a
  // scheduled cleanup that saturates the connection pool starves the requests
  // it exists to speed up.
  for (const anchor of anchors) {
    const cutoff = shopCutoff(anchor.startedAt, now);
    const where = { shopId: anchor.shopId, createdAt: { lt: cutoff } };

    const orders = await purgeTable(
      (take) => prisma.order.findMany({ where, select: { id: true }, take }),
      (ids) => prisma.order.deleteMany({ where: { id: { in: ids } } }),
    );
    const sales = await purgeTable(
      (take) => prisma.sale.findMany({ where, select: { id: true }, take }),
      (ids) => prisma.sale.deleteMany({ where: { id: { in: ids } } }),
    );

    result.orders += orders;
    result.sales += sales;
    if (orders + sales > 0) result.shops += 1;
    result.detail.push({ slug: anchor.slug, cutoff, orders, sales });
  }

  return result;
}

/** Rows per delete. Small enough that no single statement holds locks for long. */
const BATCH = 500;
/** A ceiling on one run, so a first purge of a long backlog cannot run forever. */
const MAX_BATCHES = 200;

async function purgeTable(
  find: (take: number) => Promise<{ id: string }[]>,
  remove: (ids: string[]) => Promise<{ count: number }>,
): Promise<number> {
  let total = 0;
  for (let pass = 0; pass < MAX_BATCHES; pass += 1) {
    const doomed = await find(BATCH);
    if (doomed.length === 0) break;
    const { count } = await remove(doomed.map((row) => row.id));
    total += count;
    // A short batch means this shop is clear; anything left is for the next run.
    if (doomed.length < BATCH) break;
  }
  return total;
}
