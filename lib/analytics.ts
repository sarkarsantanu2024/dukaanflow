/**
 * Business analytics for the Super Admin console.
 *
 * Two rules shape everything here.
 *
 * First, a period is a run of shop days in India, never a slice of UTC. A
 * month that begins at midnight UTC begins at half past five in the morning in
 * the shop, so the first ninety minutes of trade on the 1st would land in the
 * previous month's report and the owner reconciling it would never find the
 * gap. Every boundary and every bucket goes through `lib/time.ts`.
 *
 * Second, this reads snapshots, not the live catalogue. An `Order` and a `Sale`
 * each carry an immutable record of what was sold at the price charged, so a
 * renamed, re-priced or deleted item cannot rewrite last year's numbers. The
 * cost is that the same product listed under two spellings counts as two
 * products — which is the correct trade: a report that quietly changes when
 * somebody edits a price list is worse than one that shows a typo.
 *
 * Two sections read from somewhere else, and both are deliberate.
 *
 * Occasions come from `ItemPeriodStat`, the rolled-up totals, because the raw
 * orders behind a festival are deleted long before the next one arrives — see
 * `lib/rollup.ts`. Localities come from the orders for short periods and from
 * `AreaPeriodStat` for a whole year, for the same reason.
 *
 * Neither is ever inferred. An occasion nobody has dated does not appear, and
 * orders with no area are counted and named rather than folded into a
 * bucket. A confident number built on nothing is the one output worse than a
 * missing one.
 */

import { prisma } from './prisma';
import { placeable, resolveOccasions } from './occasions';
import { shopCutoff } from './retention';
import { SHOP_TYPE_LABELS } from './validators';
import type { Granularity, ShopTypeId, TypeFilter } from './report-query';
import {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  formatHourBucket,
  shopClock,
  shopDayStart,
  shopMonthStart,
} from './time';

export type ReportPeriod = {
  granularity: Granularity;
  year: number;
  /** 1–12 for a daily or monthly report, null for a yearly one. */
  month: number | null;
  /** 1–31 for a daily report, null otherwise. */
  day: number | null;
  label: string;
  from: Date;
  /** Exclusive. */
  to: Date;
};

/* ------------------------------------------------------------------ period */

export function buildPeriod(
  granularity: Granularity,
  year: number,
  month: number | null,
  day: number | null = null,
): ReportPeriod {
  if (granularity === 'year') {
    return {
      granularity,
      year,
      month: null,
      day: null,
      label: String(year),
      from: shopMonthStart(year, 1),
      to: shopMonthStart(year + 1, 1),
    };
  }

  const safeMonth = Math.min(12, Math.max(1, month ?? 1));

  if (granularity === 'day') {
    const safeDay = Math.min(31, Math.max(1, day ?? 1));
    return {
      granularity,
      year,
      month: safeMonth,
      day: safeDay,
      label: `${safeDay} ${MONTH_NAMES[safeMonth - 1]} ${year}`,
      from: shopDayStart(year, safeMonth, safeDay),
      // Day 32 is the 1st of the next month — `shopDayStart` takes the
      // overflow, so the end of a month needs no special case.
      to: shopDayStart(year, safeMonth, safeDay + 1),
    };
  }

  return {
    granularity,
    year,
    month: safeMonth,
    day: null,
    label: `${MONTH_NAMES[safeMonth - 1]} ${year}`,
    from: shopMonthStart(year, safeMonth),
    // Month 13 is January of the next year — `shopMonthStart` takes the
    // overflow, so the end of December needs no special case.
    to: shopMonthStart(year, safeMonth + 1),
  };
}

/* ------------------------------------------------------- snapshot decoding */

type SnapshotLine = { name: string; unit: string; quantity: number; amountPaise: number };

/**
 * Reads the item lines out of an order's or a sale's JSON snapshot.
 *
 * Defensive on purpose: these rows were written by several versions of the app,
 * in two different units. See `linePaise` below for which key means what.
 */
function readLines(json: unknown): SnapshotLine[] {
  if (!Array.isArray(json)) return [];

  const lines: SnapshotLine[] = [];
  for (const raw of json) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;

    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name) continue;

    const quantity = toNumber(row.quantity);
    lines.push({
      name,
      unit: typeof row.unit === 'string' ? row.unit.trim() : '',
      quantity,
      amountPaise: linePaise(row, quantity),
    });
  }
  return lines;
}

/**
 * What one snapshot line came to, in paise.
 *
 * THE KEY NAMES CARRY THE UNIT, and getting this wrong is a hundredfold error
 * in a report. Snapshots written since money moved to paise use `amountPaise`
 * and `pricePaise`. Older rows use `amount`, `lineTotal` or `price`, and those
 * hold RUPEES — so they are multiplied here rather than read as paise, which
 * would report every historical order at one per cent of its real value.
 *
 * Preferring the paise keys means a row that somehow carries both is read as
 * the newer shape, which is the one that was written last.
 */
function linePaise(row: Record<string, unknown>, quantity: number): number {
  if (row.amountPaise !== undefined) return toNumber(row.amountPaise);
  if (row.pricePaise !== undefined) return toNumber(row.pricePaise) * quantity;

  const legacyRupees =
    row.amount ?? row.lineTotal ?? (row.price === undefined ? undefined : toNumber(row.price) * quantity);
  return legacyRupees === undefined ? 0 : Math.round(toNumber(legacyRupees) * 100);
}

function toNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Name and unit, the pair the catalogue itself is unique on. */
type Product = { name: string; unit: string };

/**
 * One product's identity, as a map key.
 *
 * The pipe matters. Joining on a space would make "Dal" in "1 kg" and "Dal 1"
 * in "kg" the same product — unlikely, but the kind of collision that shows up
 * once in a year of reports and cannot be spotted in the output.
 */
function productKey(item: Product): string {
  return `${item.name.toLowerCase()}|${item.unit.toLowerCase()}`;
}

function productLabel(item: Product): string {
  return item.unit ? `${item.name} · ${item.unit}` : item.name;
}

/* --------------------------------------------------------------- the shape */

export type ProductRow = {
  label: string;
  name: string;
  unit: string;
  /** Integer rupees taken by this product over the period. */
  revenuePaise: number;
  /** Units sold. Safe to sum: every row here shares one unit. */
  quantity: number;
  /** How many separate orders or sales included it. */
  transactions: number;
  /** Distinct shops that sold it — a product only one shop moves is a niche. */
  shops: number;
  /** Share of total period revenuePaise, 0–100. */
  revenueShare: number;
};

export type BucketRow = { label: string; transactions: number; revenuePaise: number };

export type ShopRow = {
  name: string;
  slug: string;
  type: ShopTypeId;
  typeLabel: string;
  revenuePaise: number;
  transactions: number;
  /** Integer rupees. */
  averageBasketPaise: number;
  /** Live items in the catalogue right now. */
  items: number;
  /** Items that took no money at all this period. */
  deadItems: number;
};

export type Report = {
  period: ReportPeriod;
  typeFilter: TypeFilter;
  typeLabel: string;
  /**
   * What this report is *about*, in one phrase: one shop's name, or the
   * business type it covers. Every title, filename and CSV header reads this
   * rather than reassembling the scope themselves.
   */
  scopeLabel: string;
  /** True when the report covers exactly one shop. */
  singleShop: boolean;
  generatedAt: Date;

  headline: {
    revenuePaise: number;
    transactions: number;
    /** Integer rupees. */
    averageBasketPaise: number;
    shops: number;
    /** Shops that took no money this period — the churn watch list. */
    silentShops: number;
    customers: number;
    /** Customers who ordered more than once, as a share 0–100. */
    repeatRate: number;
    newCustomers: number;
  };

  /** ① What sells, all period, ranked by what it actually took. */
  topProducts: ProductRow[];
  /** The tail: listed, still listed, sold nothing. Dead shelf space. */
  deadProducts: { label: string; shops: number }[];
  /** Top sellers a shop is currently showing as unavailable — live lost sales. */
  outOfStockSellers: { label: string; shop: string; slug: string; revenuePaise: number }[];

  /**
   * ② What each occasion moved, and how that compares with last year.
   *
   * Read from `ItemPeriodStat`, not from the orders — those are purged, and a
   * year-over-year comparison whose earlier half has been deleted is no
   * comparison at all. Empty until occasions are entered on the calendar.
   */
  occasions: {
    name: string;
    /** The occasion's own dates this period, for the label. */
    when: string;
    revenuePaise: number;
    /** Same occasion, same shops, the year before. Null if there is no history. */
    lastYearRevenuePaise: number | null;
    /** Change against last year, as a percentage. Null without history. */
    change: number | null;
    topItems: { label: string; quantity: number; revenuePaise: number }[];
  }[];
  /** Occasions are only reportable once somebody enters the calendar. */
  occasionCalendarEmpty: boolean;

  /** ③ Where the customers are, by the area they gave. */
  localities: {
    area: string;
    orders: number;
    revenuePaise: number;
    customers: number;
    /** Share of orders that named an area, 0–100. */
    share: number;
  }[];
  /** Orders in the period that named no area — the honesty denominator. */
  ordersWithoutArea: number;

  /** ④ When trade happens, on the shop's own clock. */
  byHour: BucketRow[];
  byWeekday: BucketRow[];
  /** Months across a yearly report, days across a monthly one. */
  overTime: BucketRow[];

  channels: {
    /** Arrived from a customer's phone via the QR page. */
    orders: { transactions: number; revenuePaise: number };
    /** Rung up at the counter on the owner's own app. */
    counter: { transactions: number; revenuePaise: number };
  };
  paymentModes: BucketRow[];
  orderTypes: BucketRow[];
  orderStatuses: BucketRow[];
  /** Orders reaching COMPLETED, as a share 0–100. */
  completionRate: number;
  cancellationRate: number;

  shops: ShopRow[];

  /**
   * ⑤ The credit book — udhaar — for the shops in scope.
   *
   * BALANCES ARE AS OF NOW, NOT AS OF THE END OF THE PERIOD. A khata is a
   * running account, and what a shopkeeper needs from a report is who owes them
   * money today; reconstructing last March's balances would answer a question
   * nobody asks and read as today's debts to anyone skimming. The period-scoped
   * columns beside each name are what moved inside the window, and those are
   * period figures.
   */
  khata: KhataReport;

  /** Anything the numbers alone would mislead about. Rendered with the report. */
  caveats: string[];
};

export type KhataReport = {
  /** Owed to the shops right now, in paise, ignoring anyone in credit. */
  outstandingPaise: number;
  /** Goods that left on credit during the period. */
  periodDebitPaise: number;
  /** Repayments taken during the period. */
  periodCreditPaise: number;
  customers: {
    shop: string;
    name: string;
    phone: string;
    area: string;
    /** Positive: they owe the shop. Negative: the shop owes them. */
    balancePaise: number;
    periodDebitPaise: number;
    periodCreditPaise: number;
    lastEntryAt: Date | null;
  }[];
};

/* ------------------------------------------------------------ the gathering */

type OrderRow = {
  shopId: string;
  createdAt: Date;
  totalAmountPaise: number;
  orderType: string;
  status: string;
  paymentMode: string;
  customerPhone: string;
  customerArea: string;
  itemsJson: unknown;
};

type SaleRow = {
  shopId: string;
  createdAt: Date;
  totalAmountPaise: number;
  paymentMode: string;
  itemsJson: unknown;
};

/**
 * Runs a report over one shop, or over every shop of a business type.
 *
 * `shopSlug` wins when it is set. The two scopes answer different questions —
 * "how is Ramu Grocery doing" and "how are kirana shops doing" — and they share
 * every calculation below, so they are one function rather than two that drift.
 */
export async function loadReport(
  {
    shopSlug,
    typeFilter,
    includeDemo = false,
  }: { shopSlug: string; typeFilter: TypeFilter; includeDemo?: boolean },
  period: ReportPeriod,
  now: Date = new Date(),
): Promise<Report> {
  // Naming a shop is an explicit choice and overrides the demo filter — asking
  // for the demo shop's report and getting an empty one would be absurd. Across
  // a type, demo trade is excluded unless the console's toggle is on, or every
  // headline number would be inflated by a shop that sells nothing to anybody.
  const shopWhere = shopSlug
    ? { slug: shopSlug }
    : {
        ...(typeFilter === 'ALL' ? {} : { type: typeFilter }),
        ...(includeDemo ? {} : { isDemo: false }),
      };

  const shops = await prisma.shop.findMany({
    where: shopWhere,
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      // Which regional occasions apply to this shop at all.
      state: true,
      createdAt: true,
      items: { select: { name: true, unit: true, inStock: true } },
      // The retention clock is anchored to when this shop started paying, so
      // the report knows which periods it can still honestly speak about.
      payments: { select: { periodStart: true }, orderBy: { periodStart: 'asc' }, take: 1 },
    },
    orderBy: { name: 'asc' },
  });

  const shopIds = shops.map((shop) => shop.id);
  const window = { gte: period.from, lt: period.to };

  // An empty `in` list would match nothing anyway, but Prisma still round-trips
  // for it — and a console with no shops of a type is a normal state, not an
  // error, so answer it without touching the database.
  const [orders, sales] = shopIds.length
    ? await Promise.all([
        prisma.order.findMany({
          where: { shopId: { in: shopIds }, createdAt: window },
          select: {
            shopId: true,
            createdAt: true,
            totalAmountPaise: true,
            orderType: true,
            status: true,
            paymentMode: true,
            customerPhone: true,
            customerArea: true,
            itemsJson: true,
          },
        }),
        prisma.sale.findMany({
          where: { shopId: { in: shopIds }, createdAt: window },
          select: {
            shopId: true,
            createdAt: true,
            totalAmountPaise: true,
            paymentMode: true,
            itemsJson: true,
          },
        }),
      ])
    : [[] as OrderRow[], [] as SaleRow[]];

  // When each phone first ordered anywhere in this set, over all time. A
  // customer is "new" only against their own history, not against the window —
  // otherwise every report would open by congratulating itself.
  const firstSeen = shopIds.length
    ? await prisma.order.groupBy({
        by: ['customerPhone'],
        where: { shopId: { in: shopIds } },
        _min: { createdAt: true },
      })
    : [];

  const occasions = await loadOccasions(
    shopIds,
    new Set(shops.map((shop) => shop.state).filter(Boolean)),
    period,
  );
  const localities = await loadLocalities(shopIds, period, orders);
  const khata = await loadKhata(new Map(shops.map((shop) => [shop.id, shop.name])), period);

  return assemble({
    shops,
    orders,
    sales,
    firstSeen,
    occasions,
    localities,
    khata,
    shopSlug,
    typeFilter,
    period,
    now,
  });
}

/* ------------------------------------------------------------- ② occasions */

/**
 * What each occasion overlapping this period moved, against the same occasion
 * a year earlier.
 *
 * Read entirely from `ItemPeriodStat`. Not a shortcut — the raw orders are
 * deleted on each shop's subscription anniversary, so by the time a second
 * Durga Puja arrives the first one's orders are gone. The rollup is the only
 * place the comparison can come from, and it is written before the purge runs.
 *
 * The rollup already applied each occasion's state scoping when it was
 * computed, so nothing here needs to know which state a shop is in.
 */
async function loadOccasions(
  shopIds: string[],
  shopStates: Set<string>,
  period: ReportPeriod,
): Promise<Report['occasions']> {
  if (shopIds.length === 0) return [];

  // Occasions that can be placed in this year, then narrowed to the ones whose
  // days fall inside the reported period. A yearly report catches all of them;
  // an October report catches the pujas and nothing else.
  //
  // Occasions still waiting for their dates simply are not here — a festival
  // nobody has dated cannot be matched to an order, and inventing a window for
  // it would file ordinary trade under a festival.
  const rows = placeable(await resolveOccasions(period.year))
    .filter(
      (occasion) =>
        occasion.from!.getTime() < period.to.getTime() &&
        occasion.to!.getTime() > period.from.getTime(),
    )
    // Onam is not kept in West Bengal. Listing it at ₹0 for a Bengali shop
    // would read as a festival that failed rather than one that was never
    // theirs, and a page of such rows would bury the ones that matter.
    .filter((occasion) => !occasion.state || shopStates.has(occasion.state))
    .sort((a, b) => a.from!.getTime() - b.from!.getTime());

  if (rows.length === 0) return [];

  const stats = await prisma.itemPeriodStat.findMany({
    where: {
      shopId: { in: shopIds },
      occasionKey: { in: rows.map((row) => row.id) },
    },
    select: { occasionKey: true, itemName: true, itemUnit: true, quantity: true, revenuePaise: true },
  });

  // Last year's figures are matched by NAME, not by id: "Durga Puja 2026" and
  // "Durga Puja 2027" are separate calendar rows, and the name is the only
  // thing that survives between them.
  const priorStats = await prisma.itemPeriodStat.findMany({
    where: {
      shopId: { in: shopIds },
      year: period.year - 1,
      occasionName: { in: rows.map((row) => row.name) },
    },
    select: { occasionName: true, revenuePaise: true },
  });

  const priorByName = new Map<string, number>();
  for (const stat of priorStats) {
    if (!stat.occasionName) continue;
    priorByName.set(stat.occasionName, (priorByName.get(stat.occasionName) ?? 0) + stat.revenuePaise);
  }

  const built = rows.map((row) => {
    const mine = stats.filter((stat) => stat.occasionKey === row.id);
    const revenuePaise = mine.reduce((sum, stat) => sum + stat.revenuePaise, 0);

    const items = new Map<string, { quantity: number; revenuePaise: number }>();
    for (const stat of mine) {
      const label = stat.itemUnit ? `${stat.itemName} · ${stat.itemUnit}` : stat.itemName;
      const tally = items.get(label) ?? { quantity: 0, revenuePaise: 0 };
      tally.quantity += stat.quantity;
      tally.revenuePaise += stat.revenuePaise;
      items.set(label, tally);
    }

    const lastYearRevenuePaise = priorByName.get(row.name) ?? null;

    return {
      name: row.name,
      when: row.startsOn === row.endsOn ? row.startsOn! : `${row.startsOn} → ${row.endsOn}`,
      revenuePaise,
      lastYearRevenuePaise,
      // A rise from zero is not a percentage, it is a first year. Left null.
      change:
        lastYearRevenuePaise && lastYearRevenuePaise > 0
          ? Math.round(((revenuePaise - lastYearRevenuePaise) / lastYearRevenuePaise) * 1000) / 10
          : null,
      topItems: [...items.entries()]
        .map(([label, tally]) => ({ label, ...tally }))
        .sort((a, b) => b.revenuePaise - a.revenuePaise)
        .slice(0, 8),
      order: row.from!.getTime(),
    };
  });

  // Biggest first — this is a sales report, and "which occasion moved the most"
  // is the question. The ones that took nothing keep their calendar order at the
  // bottom, where they still say something worth knowing: a festival that has
  // not happened yet, or one that passed without the tills noticing.
  return built
    .sort((a, b) => b.revenuePaise - a.revenuePaise || a.order - b.order)
    .map(({ order, ...occasion }) => occasion);
}

/* ----------------------------------------------------------------- ⑤ khata */

/**
 * The credit book for the shops in scope.
 *
 * Balances are summed from the ledger, never read from a stored total — the
 * same rule `lib/khata.ts` follows, and for the same reason: a running total
 * that can drift from its own history is how a paper khata starts an argument.
 *
 * Two different windows on purpose. The balance is all-time and current,
 * because "who owes me money" is a question about today. The debit and credit
 * columns are the period's, because "how much went out on credit in August" is
 * a question about the period. Mixing them into one number would answer
 * neither.
 */
async function loadKhata(
  shopNames: Map<string, string>,
  period: ReportPeriod,
): Promise<KhataReport> {
  const shopIds = [...shopNames.keys()];
  const empty: KhataReport = {
    outstandingPaise: 0,
    periodDebitPaise: 0,
    periodCreditPaise: 0,
    customers: [],
  };
  if (shopIds.length === 0) return empty;

  const [allTime, inPeriod, latest, customers] = await Promise.all([
    prisma.ledgerEntry.groupBy({
      by: ['customerId', 'kind'],
      where: { shopId: { in: shopIds } },
      _sum: { amountPaise: true },
    }),
    prisma.ledgerEntry.groupBy({
      by: ['customerId', 'kind'],
      where: { shopId: { in: shopIds }, createdAt: { gte: period.from, lt: period.to } },
      _sum: { amountPaise: true },
    }),
    prisma.ledgerEntry.groupBy({
      by: ['customerId'],
      where: { shopId: { in: shopIds } },
      _max: { createdAt: true },
    }),
    prisma.customer.findMany({
      where: { shopId: { in: shopIds } },
      select: { id: true, shopId: true, name: true, phone: true, area: true },
    }),
  ]);

  const balances = new Map<string, number>();
  for (const row of allTime) {
    const signed = (row.kind === 'DEBIT' ? 1 : -1) * (row._sum.amountPaise ?? 0);
    balances.set(row.customerId, (balances.get(row.customerId) ?? 0) + signed);
  }

  const debits = new Map<string, number>();
  const credits = new Map<string, number>();
  for (const row of inPeriod) {
    const target = row.kind === 'DEBIT' ? debits : credits;
    target.set(row.customerId, (target.get(row.customerId) ?? 0) + (row._sum.amountPaise ?? 0));
  }

  const lastSeen = new Map(latest.map((row) => [row.customerId, row._max.createdAt]));

  const rows = customers
    .map((customer) => ({
      shop: shopNames.get(customer.shopId) ?? '',
      name: customer.name,
      phone: customer.phone,
      area: customer.area,
      balancePaise: balances.get(customer.id) ?? 0,
      periodDebitPaise: debits.get(customer.id) ?? 0,
      periodCreditPaise: credits.get(customer.id) ?? 0,
      lastEntryAt: lastSeen.get(customer.id) ?? null,
    }))
    // A regular with no ledger at all is a name in the phone book, not a khata
    // entry, and a page of zeroes buries the handful of names that owe money.
    .filter(
      (row) => row.balancePaise !== 0 || row.periodDebitPaise > 0 || row.periodCreditPaise > 0,
    )
    .sort((a, b) => b.balancePaise - a.balancePaise || a.name.localeCompare(b.name));

  return {
    // Anyone in credit is left out of the total rather than netted off: money
    // the shop holds for a customer does not reduce what other customers owe.
    outstandingPaise: rows.reduce((sum, row) => sum + Math.max(0, row.balancePaise), 0),
    periodDebitPaise: rows.reduce((sum, row) => sum + row.periodDebitPaise, 0),
    periodCreditPaise: rows.reduce((sum, row) => sum + row.periodCreditPaise, 0),
    customers: rows,
  };
}

/* ------------------------------------------------------------ ③ localities */

/**
 * Where the customers ordered from, by the area they gave.
 *
 * A yearly report reads the rollup, which survives the purge and is
 * authoritative for a whole calendar year. Anything shorter is computed from
 * the orders themselves, because the rollup has no month-sized buckets.
 */
async function loadLocalities(
  shopIds: string[],
  period: ReportPeriod,
  orders: OrderRow[],
): Promise<{ rows: Report['localities']; missing: number }> {
  if (shopIds.length === 0) return { rows: [], missing: 0 };

  if (period.granularity === 'year') {
    const stats = await prisma.areaPeriodStat.findMany({
      where: { shopId: { in: shopIds }, year: period.year },
      select: { area: true, orders: true, revenuePaise: true, customers: true },
    });

    const merged = new Map<string, { orders: number; revenuePaise: number; customers: number }>();
    for (const stat of stats) {
      const row = merged.get(stat.area) ?? { orders: 0, revenuePaise: 0, customers: 0 };
      row.orders += stat.orders;
      row.revenuePaise += stat.revenuePaise;
      // Summing distinct counts across shops double-counts anyone who orders
      // from two of them. Accepted: the alternative is keeping phone numbers in
      // the rollup forever, which is a privacy cost for a rounding error.
      row.customers += stat.customers;
      merged.set(stat.area, row);
    }

    if (merged.size > 0) return finish(merged, orders);
  }

  const live = new Map<string, { orders: number; revenuePaise: number; phones: Set<string> }>();
  for (const order of orders) {
    if (order.status === 'CANCELLED' || !order.customerArea) continue;
    const row = live.get(order.customerArea) ?? {
      orders: 0,
      revenuePaise: 0,
      phones: new Set<string>(),
    };
    row.orders += 1;
    row.revenuePaise += order.totalAmountPaise;
    row.phones.add(order.customerPhone);
    live.set(order.customerArea, row);
  }

  const merged = new Map(
    [...live.entries()].map(([area, row]) => [
      area,
      { orders: row.orders, revenuePaise: row.revenuePaise, customers: row.phones.size },
    ]),
  );
  return finish(merged, orders);
}

function finish(
  merged: Map<string, { orders: number; revenuePaise: number; customers: number }>,
  orders: OrderRow[],
): { rows: Report['localities']; missing: number } {
  const total = [...merged.values()].reduce((sum, row) => sum + row.orders, 0);
  const rows = [...merged.entries()]
    .map(([area, row]) => ({
      area,
      orders: row.orders,
      revenuePaise: row.revenuePaise,
      customers: row.customers,
      share: total > 0 ? Math.round((row.orders / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.orders - a.orders);

  const missing = orders.filter(
    (order) => order.status !== 'CANCELLED' && !order.customerArea,
  ).length;

  return { rows, missing };
}

/* ------------------------------------------------------------ the reckoning */

type Ingredients = {
  shops: {
    id: string;
    name: string;
    slug: string;
    type: string;
    createdAt: Date;
    items: { name: string; unit: string; inStock: boolean }[];
    payments: { periodStart: Date }[];
  }[];
  orders: OrderRow[];
  sales: SaleRow[];
  firstSeen: { customerPhone: string; _min: { createdAt: Date | null } }[];
  occasions: Report['occasions'];
  localities: { rows: Report['localities']; missing: number };
  khata: KhataReport;
  shopSlug: string;
  typeFilter: TypeFilter;
  period: ReportPeriod;
  now: Date;
};

function assemble(input: Ingredients): Report {
  const {
    shops,
    orders,
    sales,
    firstSeen,
    occasions,
    localities,
    khata,
    shopSlug,
    typeFilter,
    period,
    now,
  } = input;

  // Asked for one shop and got none back: the slug names nothing. Everything
  // below still runs and produces an honest empty report.
  const singleShop = shopSlug !== '';
  const typeLabel = typeFilter === 'ALL' ? 'All business types' : SHOP_TYPE_LABELS[typeFilter];
  const scopeLabel = singleShop ? (shops[0]?.name ?? shopSlug) : typeLabel;

  /* --- products ------------------------------------------------------- */

  type Tally = {
    label: string;
    name: string;
    unit: string;
    revenuePaise: number;
    quantity: number;
    transactions: number;
    shops: Set<string>;
  };
  const products = new Map<string, Tally>();

  function countLines(json: unknown, shopId: string) {
    // A product appearing twice on one bill is still one transaction for it.
    const seenHere = new Set<string>();
    for (const line of readLines(json)) {
      const key = productKey(line);
      let tally = products.get(key);
      if (!tally) {
        tally = {
          label: productLabel(line),
          name: line.name,
          unit: line.unit,
          revenuePaise: 0,
          quantity: 0,
          transactions: 0,
          shops: new Set(),
        };
        products.set(key, tally);
      }
      tally.revenuePaise += line.amountPaise;
      tally.quantity += line.quantity;
      tally.shops.add(shopId);
      if (!seenHere.has(key)) {
        tally.transactions += 1;
        seenHere.add(key);
      }
    }
  }

  /* --- buckets -------------------------------------------------------- */

  const hourly = Array.from({ length: 24 }, () => ({ transactions: 0, revenuePaise: 0 }));
  const weekly = Array.from({ length: 7 }, () => ({ transactions: 0, revenuePaise: 0 }));
  const timeline = new Map<string, { order: number; transactions: number; revenuePaise: number }>();

  function bucket(when: Date, amount: number) {
    const clock = shopClock(when);
    hourly[clock.hour].transactions += 1;
    hourly[clock.hour].revenuePaise += amount;
    weekly[clock.weekday].transactions += 1;
    weekly[clock.weekday].revenuePaise += amount;

    // A yearly report walks months, a monthly one the days of the month, and a
    // single day walks its own hours — which for one day is the only timeline
    // there is.
    const order =
      period.granularity === 'year'
        ? clock.month
        : period.granularity === 'day'
          ? clock.hour
          : clock.day;
    const slot = timeline.get(String(order)) ?? { order, transactions: 0, revenuePaise: 0 };
    slot.transactions += 1;
    slot.revenuePaise += amount;
    timeline.set(String(order), slot);
  }

  /* --- the two channels ----------------------------------------------- */

  const perShop = new Map<string, { revenuePaise: number; transactions: number }>();
  function credit(shopId: string, amount: number) {
    const row = perShop.get(shopId) ?? { revenuePaise: 0, transactions: 0 };
    row.revenuePaise += amount;
    row.transactions += 1;
    perShop.set(shopId, row);
  }

  const orderTypes = new Map<string, { transactions: number; revenuePaise: number }>();
  const orderStatuses = new Map<string, { transactions: number; revenuePaise: number }>();
  const paymentModes = new Map<string, { transactions: number; revenuePaise: number }>();

  let orderRevenue = 0;
  let counterRevenue = 0;

  for (const order of orders) {
    // A cancelled order is a thing that happened but not money that was taken.
    // It counts in the funnel and nowhere else.
    const cancelled = order.status === 'CANCELLED';
    const amount = cancelled ? 0 : order.totalAmountPaise;

    tick(orderStatuses, order.status, order.totalAmountPaise);
    if (cancelled) continue;

    orderRevenue += amount;
    tick(orderTypes, order.orderType, amount);
    // Orders can be paid on the Orders page now, so cash-versus-UPI finally
    // covers the whole shop rather than only what crossed the till.
    if (order.paymentMode) tick(paymentModes, order.paymentMode, amount);
    bucket(order.createdAt, amount);
    credit(order.shopId, amount);
    countLines(order.itemsJson, order.shopId);
  }

  for (const sale of sales) {
    counterRevenue += sale.totalAmountPaise;
    tick(paymentModes, sale.paymentMode, sale.totalAmountPaise);
    bucket(sale.createdAt, sale.totalAmountPaise);
    credit(sale.shopId, sale.totalAmountPaise);
    countLines(sale.itemsJson, sale.shopId);
  }

  const liveOrders = orders.filter((order) => order.status !== 'CANCELLED');
  const revenuePaise = orderRevenue + counterRevenue;
  const transactions = liveOrders.length + sales.length;

  /* --- customers ------------------------------------------------------ */

  const phones = new Map<string, number>();
  for (const order of liveOrders) {
    phones.set(order.customerPhone, (phones.get(order.customerPhone) ?? 0) + 1);
  }
  const repeats = [...phones.values()].filter((count) => count > 1).length;
  const firstSeenAt = new Map(
    firstSeen.map((row) => [row.customerPhone, row._min.createdAt?.getTime() ?? 0]),
  );
  const newCustomers = [...phones.keys()].filter((phone) => {
    const first = firstSeenAt.get(phone);
    return first !== undefined && first >= period.from.getTime();
  }).length;

  /* --- what sold nothing ---------------------------------------------- */

  const soldKeys = new Set(products.keys());
  const dead = new Map<string, Set<string>>();
  for (const shop of shops) {
    for (const item of shop.items) {
      if (soldKeys.has(productKey(item))) continue;
      const label = productLabel(item);
      const holders = dead.get(label) ?? new Set<string>();
      holders.add(shop.id);
      dead.set(label, holders);
    }
  }

  const ranked = [...products.values()].sort((a, b) => b.revenuePaise - a.revenuePaise);
  const topProducts: ProductRow[] = ranked.slice(0, 25).map((tally) => ({
    label: tally.label,
    name: tally.name,
    unit: tally.unit,
    revenuePaise: tally.revenuePaise,
    quantity: tally.quantity,
    transactions: tally.transactions,
    shops: tally.shops.size,
    revenueShare: revenuePaise > 0 ? round1((tally.revenuePaise / revenuePaise) * 100) : 0,
  }));

  // A proven seller sitting behind an "Out of stock" badge is the one loss on
  // this page that is still happening while it is being read.
  const topKeys = new Map(
    ranked.slice(0, 25).map((tally) => [productKey(tally), tally.revenuePaise]),
  );
  const outOfStockSellers: Report['outOfStockSellers'] = [];
  for (const shop of shops) {
    for (const item of shop.items) {
      if (item.inStock) continue;
      const sellerRevenue = topKeys.get(productKey(item));
      if (sellerRevenue === undefined) continue;
      outOfStockSellers.push({
        label: productLabel(item),
        shop: shop.name,
        slug: shop.slug,
        revenuePaise: sellerRevenue,
      });
    }
  }
  outOfStockSellers.sort((a, b) => b.revenuePaise - a.revenuePaise);

  /* --- shops ---------------------------------------------------------- */

  const shopRows: ShopRow[] = shops.map((shop) => {
    const totals = perShop.get(shop.id) ?? { revenuePaise: 0, transactions: 0 };
    const deadHere = shop.items.filter((item) => !soldKeys.has(productKey(item))).length;

    return {
      name: shop.name,
      slug: shop.slug,
      type: shop.type as ShopTypeId,
      typeLabel: SHOP_TYPE_LABELS[shop.type as ShopTypeId] ?? shop.type,
      revenuePaise: totals.revenuePaise,
      transactions: totals.transactions,
      averageBasketPaise: totals.transactions > 0 ? Math.round(totals.revenuePaise / totals.transactions) : 0,
      items: shop.items.length,
      deadItems: deadHere,
    };
  });
  shopRows.sort((a, b) => b.revenuePaise - a.revenuePaise);

  /* --- caveats -------------------------------------------------------- */

  const caveats: string[] = [];
  if (singleShop && shops.length === 0) {
    caveats.push(`No shop is listed under the slug "${shopSlug}".`);
  }
  if (transactions === 0 && shops.length > 0) {
    caveats.push('No orders or counter sales were recorded in this period.');
  }
  if (period.to.getTime() > now.getTime()) {
    caveats.push('This period has not finished — the numbers are partial and will grow.');
  }
  if (khata.customers.length > 0) {
    caveats.push(
      'Khata balances are what is owed TODAY, not at the end of the period. The "goods on credit" and "repaid" columns beside each name are the period\'s.',
    );
  }
  // Silence here would be the dangerous kind: a purged period reads as a period
  // with no trade, and the two look identical in every number on the page.
  //
  // Each shop has its own cutoff, anchored to its own subscription, so a report
  // spanning several shops can be whole for one and gutted for another.
  const cutoffs = shops.map((shop) => {
    const startedAt = shop.payments[0]?.periodStart ?? shop.createdAt;
    return { startedAt, cutoff: shopCutoff(startedAt, now) };
  });

  const purged = cutoffs.filter(
    (shop) =>
      // A shop still inside its first year has a cutoff equal to its start date.
      // That is not a purge — nothing has been deleted, the shop simply did not
      // exist yet — and warning about missing data there would be a false alarm
      // on every young shop in the console.
      shop.cutoff.getTime() > shop.startedAt.getTime() &&
      period.from.getTime() < shop.cutoff.getTime(),
  );

  if (purged.length > 0) {
    const allGone = purged.every((shop) => period.to.getTime() <= shop.cutoff.getTime());
    const one = purged.length === 1;
    const whose =
      purged.length === shops.length
        ? singleShop
          ? 'This shop has'
          : 'Every shop in this report has'
        : `${purged.length} of ${shops.length} shops ${one ? 'has' : 'have'}`;

    caveats.push(
      'A shop keeps only its current subscription year of orders and counter sales; ' +
        'older ones are deleted on each anniversary of its subscription start. ' +
        `${whose} a cutoff after this period began, ` +
        (allGone
          ? 'so this period can no longer be reported on — the figures above are not low, they are gone.'
          : 'so the earliest days are already missing.') +
        ' Occasion and locality totals are unaffected: those are rolled up before the purge runs.',
    );
  }
  // Onboarded *inside* the period, not merely after it began — a shop created
  // last week does not make a report on last January partial.
  const youngShops = shops.filter(
    (shop) =>
      shop.createdAt.getTime() >= period.from.getTime() &&
      shop.createdAt.getTime() < period.to.getTime(),
  ).length;
  if (youngShops > 0) {
    caveats.push(
      singleShop
        ? 'This shop was onboarded during the period, so the figures cover only part of it.'
        : `${youngShops} shop${youngShops === 1 ? ' was' : 's were'} onboarded during this period, so ${youngShops === 1 ? 'its' : 'their'} figures cover only part of it.`,
    );
  }
  // The two sections that depend on somebody having entered something. Saying
  // "no occasion sold anything" when the calendar is simply empty would be a
  // finding; saying the calendar is empty is the truth.
  if (occasions.length === 0) {
    caveats.push(
      'No occasion on the calendar falls in this period, so there is no festival breakdown. Add occasions under Occasions in the console.',
    );
  }
  if (localities.rows.length === 0) {
    caveats.push(
      'No order in this period named an area, so there is no locality breakdown. Orders placed before the area box existed carry none.',
    );
  } else if (localities.missing > 0) {
    const counted = localities.rows.reduce((sum, row) => sum + row.orders, 0);
    caveats.push(
      `The locality breakdown covers ${counted} of ${counted + localities.missing} orders — the rest named no area, so the shares are of what was given, not of everything.`,
    );
  }

  return {
    period,
    typeFilter,
    typeLabel,
    scopeLabel,
    singleShop,
    generatedAt: now,

    headline: {
      revenuePaise,
      transactions,
      averageBasketPaise: transactions > 0 ? Math.round(revenuePaise / transactions) : 0,
      shops: shops.length,
      silentShops: shops.filter((shop) => !perShop.has(shop.id)).length,
      customers: phones.size,
      repeatRate: phones.size > 0 ? round1((repeats / phones.size) * 100) : 0,
      newCustomers,
    },

    topProducts,
    occasions,
    occasionCalendarEmpty: occasions.length === 0,
    localities: localities.rows,
    ordersWithoutArea: localities.missing,
    deadProducts: [...dead.entries()]
      .map(([label, holders]) => ({ label, shops: holders.size }))
      .sort((a, b) => b.shops - a.shops || a.label.localeCompare(b.label))
      .slice(0, 25),
    outOfStockSellers: outOfStockSellers.slice(0, 15),

    byHour: hourly.map((slot, hour) => ({ label: formatHourBucket(hour), ...slot })),
    byWeekday: weekly.map((slot, day) => ({ label: WEEKDAY_NAMES[day], ...slot })),
    overTime: [...timeline.entries()]
      .map(([label, slot]) => ({
        label:
          period.granularity === 'year'
            ? MONTH_NAMES[slot.order - 1]
            : period.granularity === 'day'
              ? formatHourBucket(slot.order)
              : label,
        order: slot.order,
        transactions: slot.transactions,
        revenuePaise: slot.revenuePaise,
      }))
      .sort((a, b) => a.order - b.order)
      .map(({ label, transactions: count, revenuePaise: amount }) => ({
        label,
        transactions: count,
        revenuePaise: amount,
      })),

    channels: {
      orders: { transactions: liveOrders.length, revenuePaise: orderRevenue },
      counter: { transactions: sales.length, revenuePaise: counterRevenue },
    },
    paymentModes: mapToRows(paymentModes),
    orderTypes: mapToRows(orderTypes),
    orderStatuses: mapToRows(orderStatuses),
    completionRate: orders.length
      ? round1(((orderStatuses.get('COMPLETED')?.transactions ?? 0) / orders.length) * 100)
      : 0,
    cancellationRate: orders.length
      ? round1(((orderStatuses.get('CANCELLED')?.transactions ?? 0) / orders.length) * 100)
      : 0,

    shops: shopRows,
    khata,
    caveats,
  };
}

function tick(
  target: Map<string, { transactions: number; revenuePaise: number }>,
  key: string,
  amount: number,
) {
  const row = target.get(key) ?? { transactions: 0, revenuePaise: 0 };
  row.transactions += 1;
  row.revenuePaise += amount;
  target.set(key, row);
}

function mapToRows(source: Map<string, { transactions: number; revenuePaise: number }>): BucketRow[] {
  return [...source.entries()]
    .map(([label, row]) => ({ label, ...row }))
    .sort((a, b) => b.transactions - a.transactions);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * The busiest bucket — but only when there genuinely is one.
 *
 * Null on a tie, and null when the winner has a single sale to its name. Six
 * transactions scattered across six hours have no busiest hour, and picking
 * whichever the loop met first would print a confident sentence about noise.
 * The chart above still shows every bar; it is the claim that is withheld.
 */
export function peakOf(rows: BucketRow[]): BucketRow | null {
  let best: BucketRow | null = null;
  let tied = false;

  for (const row of rows) {
    if (!best || row.transactions > best.transactions) {
      best = row;
      tied = false;
    } else if (best && row.transactions === best.transactions) {
      tied = true;
    }
  }

  return best && !tied && best.transactions > 1 ? best : null;
}
