/**
 * What Halkhata itself earns.
 *
 * Every other report in this codebase answers "how is a shop doing". This one
 * answers "how is the business doing", and the two must not be confused: a
 * shop's revenue is what its customers pay it, and Halkhata's revenue is what
 * the shops pay Halkhata. Nothing here reads an order or a sale.
 *
 * All figures are PAISE (see lib/money.ts). Subscription and service income are
 * kept apart the whole way down, because a month that looks flat on
 * subscriptions but doubled on listing work is a different business than one
 * that did the reverse, and a single total hides which happened.
 */

import { prisma } from './prisma';
import { MONTH_NAMES, shopClock } from './time';
import { PLAN_SPECS } from './plans';
import { rupeesToPaise } from './money';

/**
 * Plan prices in paise, for the recurring figure.
 *
 * Derived from the live price list rather than written out again, so a price
 * change is reflected the moment it ships — this number is only useful if it is
 * what those shops would actually be billed today.
 */
const PLAN_PRICE_PAISE: Record<string, number> = Object.fromEntries(
  Object.values(PLAN_SPECS).map((spec) => [spec.id, rupeesToPaise(spec.price)]),
);

export type EarningsBucket = {
  /** Calendar year, and 1–12 for a month bucket. */
  year: number;
  month?: number;
  label: string;
  subscriptionPaise: number;
  listingPaise: number;
  totalPaise: number;
  payments: number;
};

export type EarningsSummary = {
  months: EarningsBucket[];
  years: EarningsBucket[];
  allTimePaise: number;
  thisMonthPaise: number;
  thisYearPaise: number;
  /**
   * What the currently-paying shops are worth per month if nobody churns.
   *
   * A forward number, unlike everything else here, and the only one that says
   * whether the business is growing — a good month of one-off listing work
   * flatters the totals above while changing nothing about next month.
   */
  monthlyRecurringPaise: number;
};

/**
 * Every payment, bucketed. Deliberately reads all of them rather than grouping
 * in SQL: a business with a few thousand payment rows can total them in
 * memory in a millisecond, and doing it here keeps the shop-timezone bucketing
 * identical to every other report (`shopClock`) instead of leaving Postgres to
 * bucket on UTC and quietly file a 1st-of-the-month payment under the previous
 * month.
 */
export async function earnings(monthsBack = 12): Promise<EarningsSummary> {
  const [payments, activeShops] = await Promise.all([
    prisma.payment.findMany({
      select: { amountPaise: true, kind: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    // What is actually still running, for the recurring figure.
    prisma.shop.findMany({
      where: { subscriptionStatus: 'ACTIVE', isDemo: false },
      select: { plan: true },
    }),
  ]);

  const byMonth = new Map<string, EarningsBucket>();
  const byYear = new Map<number, EarningsBucket>();
  let allTimePaise = 0;

  for (const payment of payments) {
    const { year, month } = shopClock(payment.createdAt);
    const isListing = payment.kind === 'LISTING';
    allTimePaise += payment.amountPaise;

    const monthKey = `${year}-${month}`;
    const monthBucket =
      byMonth.get(monthKey) ??
      blank({ year, month, label: `${MONTH_NAMES[month - 1]} ${year}` });
    add(monthBucket, payment.amountPaise, isListing);
    byMonth.set(monthKey, monthBucket);

    const yearBucket = byYear.get(year) ?? blank({ year, label: String(year) });
    add(yearBucket, payment.amountPaise, isListing);
    byYear.set(year, yearBucket);
  }

  const now = shopClock(new Date());
  const months = [...byMonth.values()]
    .sort(byRecency)
    .slice(0, monthsBack);
  const years = [...byYear.values()].sort(byRecency);

  // Demo shops are excluded from the recurring figure but NOT from the totals
  // above: a demo shop takes no money, so it cannot distort what was earned,
  // but it would inflate what is expected next month.
  const monthlyRecurringPaise = activeShops.reduce(
    (sum, shop) => sum + (PLAN_PRICE_PAISE[shop.plan] ?? 0),
    0,
  );

  return {
    months,
    years,
    allTimePaise,
    thisMonthPaise: byMonth.get(`${now.year}-${now.month}`)?.totalPaise ?? 0,
    thisYearPaise: byYear.get(now.year)?.totalPaise ?? 0,
    monthlyRecurringPaise,
  };
}

function blank(base: { year: number; month?: number; label: string }): EarningsBucket {
  return { ...base, subscriptionPaise: 0, listingPaise: 0, totalPaise: 0, payments: 0 };
}

function add(bucket: EarningsBucket, paise: number, isListing: boolean) {
  if (isListing) bucket.listingPaise += paise;
  else bucket.subscriptionPaise += paise;
  bucket.totalPaise += paise;
  bucket.payments += 1;
}

function byRecency(a: EarningsBucket, b: EarningsBucket): number {
  return b.year - a.year || (b.month ?? 0) - (a.month ?? 0);
}
