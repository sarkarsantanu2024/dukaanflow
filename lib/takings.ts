import { prisma } from '@/lib/prisma';
import {
  formatIsoDay,
  shopClock,
  shopDayStart,
  shopMonthStart,
  startOfBusinessDay,
} from '@/lib/time';

/**
 * WHAT CAME IN, AND IN WHAT FORM.
 *
 * The one question a shopkeeper asks at closing that the app could not answer:
 * of today's takings, how much is cash sitting in the drawer, how much went to
 * the phone by UPI, and how much walked out of the shop as credit.
 *
 * Every transaction already records it — `Sale.paymentMode` on a counter sale,
 * `Order.paymentMode` on an order — so this reads, it does not estimate. The
 * arithmetic lives here rather than in a screen because the shop's own
 * reporting (`lib/analytics.ts`) answers a different question for a different
 * reader, and the owner's closing figure must not drift from it.
 *
 * A shop's day and a shop's month are the ones on the wall clock — midnight to
 * midnight IST — not the machine's. See `lib/time.ts`.
 */

/** The three ways money is taken, plus what has not been decided yet. */
export type Takings = {
  /** In the drawer. */
  cashPaise: number;
  /** On the phone. */
  upiPaise: number;
  /** Gone out on credit, and now owed. */
  khataPaise: number;
  /** The three above. Every rupee of business done in the window. */
  totalPaise: number;
  /** How many transactions each figure came from. */
  cashCount: number;
  upiCount: number;
  khataCount: number;
  /**
   * Orders accepted in the window that nobody has settled yet.
   *
   * NOT part of `totalPaise`, deliberately. It is neither in the drawer nor on
   * the book — it is a bag still on the shelf, and folding it into the day's
   * takings is how a figure checked against the cash drawer comes out wrong.
   * Shown separately so the owner can see why the two numbers differ.
   */
  pendingPaise: number;
  pendingCount: number;
  /** Repayments against old credit, taken in this window. */
  khataCollectedPaise: number;
  /**
   * Of those repayments, the part known to have come in as cash.
   *
   * It is the piece the drawer needs: a repayment is money walking in without
   * being a sale. Entries written before the form was recorded hold a blank and
   * are counted in `khataCollectedUnknownPaise` instead — guessing would put a
   * UPI repayment into a drawer that does not contain it.
   */
  khataCollectedCashPaise: number;
  khataCollectedUnknownPaise: number;
};

const EMPTY: Takings = {
  cashPaise: 0,
  upiPaise: 0,
  khataPaise: 0,
  totalPaise: 0,
  cashCount: 0,
  upiCount: 0,
  khataCount: 0,
  pendingPaise: 0,
  pendingCount: 0,
  khataCollectedPaise: 0,
  khataCollectedCashPaise: 0,
  khataCollectedUnknownPaise: 0,
};

/**
 * Which of the three a row belongs to.
 *
 * The fallback is the interesting half. Completed orders now record "KHATA"
 * when they went out unpaid, but every order completed before that wrote a
 * blank — and those rows are still in the database. A completed order with no
 * mode and no payment is credit, and reading it as anything else loses money
 * that a customer genuinely owes.
 */
function modeOf(row: { paymentMode: string; paymentReceived?: boolean }): 'CASH' | 'UPI' | 'KHATA' {
  if (row.paymentMode === 'CASH') return 'CASH';
  if (row.paymentMode === 'UPI') return 'UPI';
  if (row.paymentMode === 'KHATA') return 'KHATA';
  // A blank on a paid order can only be an old counter sale, which defaulted to
  // cash; on an unpaid one it is credit.
  return row.paymentReceived === false ? 'KHATA' : 'CASH';
}

/**
 * The takings between two instants — `from` inclusive, `to` exclusive.
 *
 * Cancelled orders are excluded outright: money that never arrived is not
 * takings, and an owner checking this against the drawer must not find the app
 * optimistic. That is the same rule the orders screen already follows.
 */
export async function takingsBetween(shopId: string, from: Date, to: Date): Promise<Takings> {
  const [sales, orders, repayments] = await Promise.all([
    prisma.sale.findMany({
      where: { shopId, createdAt: { gte: from, lt: to } },
      select: { totalAmountPaise: true, paymentMode: true },
    }),
    prisma.order.findMany({
      where: {
        shopId,
        createdAt: { gte: from, lt: to },
        status: { not: 'CANCELLED' },
      },
      select: { totalAmountPaise: true, paymentMode: true, paymentReceived: true, status: true },
    }),
    prisma.ledgerEntry.findMany({
      where: { shopId, kind: 'CREDIT', createdAt: { gte: from, lt: to } },
      select: { amountPaise: true, paymentMode: true },
    }),
  ]);

  const takings: Takings = { ...EMPTY };

  for (const repayment of repayments) {
    takings.khataCollectedPaise += repayment.amountPaise;
    if (repayment.paymentMode === 'CASH') {
      takings.khataCollectedCashPaise += repayment.amountPaise;
    } else if (repayment.paymentMode !== 'UPI') {
      // Written before the form was recorded. Named as unknown rather than
      // assumed either way — see the field's note.
      takings.khataCollectedUnknownPaise += repayment.amountPaise;
    }
  }

  function add(mode: 'CASH' | 'UPI' | 'KHATA', amountPaise: number) {
    if (mode === 'CASH') {
      takings.cashPaise += amountPaise;
      takings.cashCount += 1;
    } else if (mode === 'UPI') {
      takings.upiPaise += amountPaise;
      takings.upiCount += 1;
    } else {
      takings.khataPaise += amountPaise;
      takings.khataCount += 1;
    }
  }

  for (const sale of sales) add(modeOf(sale), sale.totalAmountPaise);

  for (const order of orders) {
    // An order still being prepared has taken no money in any form yet. It is
    // counted apart — see `pendingPaise`.
    if (order.status !== 'COMPLETED') {
      takings.pendingPaise += order.totalAmountPaise;
      takings.pendingCount += 1;
      continue;
    }
    add(modeOf(order), order.totalAmountPaise);
  }

  takings.totalPaise = takings.cashPaise + takings.upiPaise + takings.khataPaise;
  return takings;
}

/**
 * The day's cash drawer, as an owner would work it out on the back of a bill.
 *
 * ```
 * opening float
 *   + cash sales
 *   + repayments taken in cash
 *   = what should be in the drawer
 * ```
 *
 * WHAT IS NOT IN IT, and must not be read as though it were: money paid OUT of
 * the drawer during the day — a crate of eggs bought at the door, a tea, a
 * hundred rupees to a delivery boy — because Halkhata is not told about it. Any
 * shop that spends out of the till will count short by exactly that, which is a
 * true difference and not an error in the figures. The screen says so beside
 * the number rather than letting an owner hunt for a rupee that was spent.
 */
export type Drawer = {
  openingPaise: number;
  cashSalesPaise: number;
  cashCollectedPaise: number;
  /** The three above. What the drawer should hold. */
  expectedPaise: number;
  /** What the owner counted, or null while nobody has. */
  countedPaise: number | null;
  /** Counted minus expected: negative is short, positive is over. */
  differencePaise: number | null;
  /**
   * Repayments whose form was never recorded.
   *
   * The expected figure leaves them out, so it is understated by up to this
   * much. Surfaced because an owner counting more cash than expected deserves
   * to be told the likeliest reason before they go looking for a mistake.
   */
  unexplainedCollectedPaise: number;
};

/** The day's drawer for one shop, or null before the owner has opened it. */
export async function drawerForToday(
  shopId: string,
  takings: Takings,
  now: Date = new Date(),
): Promise<Drawer | null> {
  const record = await prisma.cashDay.findUnique({
    where: { shopId_day: { shopId, day: formatIsoDay(now) } },
    select: { openingPaise: true, countedPaise: true },
  });
  // No row means the owner has not started the day here. The screen asks for
  // the float rather than inventing a zero and reconciling against it.
  if (!record) return null;

  const expectedPaise =
    record.openingPaise + takings.cashPaise + takings.khataCollectedCashPaise;

  return {
    openingPaise: record.openingPaise,
    cashSalesPaise: takings.cashPaise,
    cashCollectedPaise: takings.khataCollectedCashPaise,
    expectedPaise,
    countedPaise: record.countedPaise,
    differencePaise: record.countedPaise === null ? null : record.countedPaise - expectedPaise,
    unexplainedCollectedPaise: takings.khataCollectedUnknownPaise,
  };
}

/** Midnight-to-now on the shop's own clock. */
export function todayWindow(now: Date = new Date()): { from: Date; to: Date } {
  const from = startOfBusinessDay(now);
  const { year, month, day } = shopClock(now);
  // Day + 1 overflows the month correctly — see `shopDayStart`.
  return { from, to: shopDayStart(year, month, day + 1) };
}

/** The first of this month to the first of next, on the shop's own clock. */
export function monthWindow(now: Date = new Date()): { from: Date; to: Date } {
  const { year, month } = shopClock(now);
  // Month 13 is January of the next year — see `shopMonthStart`.
  return { from: shopMonthStart(year, month), to: shopMonthStart(year, month + 1) };
}
