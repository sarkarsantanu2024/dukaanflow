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
  shopMonthStart,
} from './time';

export type ReportPeriod = {
  granularity: Granularity;
  year: number;
  /** 1–12 for a monthly report, null for a yearly one. */
  month: number | null;
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
): ReportPeriod {
  if (granularity === 'year') {
    return {
      granularity,
      year,
      month: null,
      label: String(year),
      from: shopMonthStart(year, 1),
      to: shopMonthStart(year + 1, 1),
    };
  }

  const safeMonth = Math.min(12, Math.max(1, month ?? 1));
  return {
    granularity,
    year,
    month: safeMonth,
    label: `${MONTH_NAMES[safeMonth - 1]} ${year}`,
    from: shopMonthStart(year, safeMonth),
    // Month 13 is January of the next year — `shopMonthStart` takes the
    // overflow, so the end of December needs no special case.
    to: shopMonthStart(year, safeMonth + 1),
  };
}

/* ------------------------------------------------------- snapshot decoding */

type SnapshotLine = { name: string; unit: string; quantity: number; amount: number };

/**
 * Reads the item lines out of an order's or a sale's JSON snapshot.
 *
 * Defensive on purpose: these rows were written by several versions of the
 * app. Orders placed before the two shapes were reconciled call the line total
 * `lineTotal` rather than `amount`, and a report that silently totals those as
 * zero is worse than one that refuses to run.
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
    const amount = toNumber(row.amount ?? row.lineTotal ?? toNumber(row.price) * quantity);
    lines.push({
      name,
      unit: typeof row.unit === 'string' ? row.unit.trim() : '',
      quantity,
      amount,
    });
  }
  return lines;
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
  revenue: number;
  /** Units sold. Safe to sum: every row here shares one unit. */
  quantity: number;
  /** How many separate orders or sales included it. */
  transactions: number;
  /** Distinct shops that sold it — a product only one shop moves is a niche. */
  shops: number;
  /** Share of total period revenue, 0–100. */
  revenueShare: number;
};

export type BucketRow = { label: string; transactions: number; revenue: number };

export type ShopRow = {
  name: string;
  slug: string;
  type: ShopTypeId;
  typeLabel: string;
  revenue: number;
  transactions: number;
  /** Integer rupees. */
  averageBasket: number;
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
    revenue: number;
    transactions: number;
    /** Integer rupees. */
    averageBasket: number;
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
  outOfStockSellers: { label: string; shop: string; slug: string; revenue: number }[];

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
    revenue: number;
    /** Same occasion, same shops, the year before. Null if there is no history. */
    lastYearRevenue: number | null;
    /** Change against last year, as a percentage. Null without history. */
    change: number | null;
    topItems: { label: string; quantity: number; revenue: number }[];
  }[];
  /** Occasions are only reportable once somebody enters the calendar. */
  occasionCalendarEmpty: boolean;

  /** ③ Where the customers are, by the area they gave. */
  localities: {
    area: string;
    orders: number;
    revenue: number;
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
    orders: { transactions: number; revenue: number };
    /** Rung up at the counter on the owner's own app. */
    counter: { transactions: number; revenue: number };
  };
  paymentModes: BucketRow[];
  orderTypes: BucketRow[];
  orderStatuses: BucketRow[];
  /** Orders reaching COMPLETED, as a share 0–100. */
  completionRate: number;
  cancellationRate: number;

  shops: ShopRow[];

  /** Anything the numbers alone would mislead about. Rendered with the report. */
  caveats: string[];
};

/* ------------------------------------------------------------ the gathering */

type OrderRow = {
  shopId: string;
  createdAt: Date;
  totalAmount: number;
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
  totalAmount: number;
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
            totalAmount: true,
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
            totalAmount: true,
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

  return assemble({
    shops,
    orders,
    sales,
    firstSeen,
    occasions,
    localities,
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
    select: { occasionKey: true, itemName: true, itemUnit: true, quantity: true, revenue: true },
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
    select: { occasionName: true, revenue: true },
  });

  const priorByName = new Map<string, number>();
  for (const stat of priorStats) {
    if (!stat.occasionName) continue;
    priorByName.set(stat.occasionName, (priorByName.get(stat.occasionName) ?? 0) + stat.revenue);
  }

  const built = rows.map((row) => {
    const mine = stats.filter((stat) => stat.occasionKey === row.id);
    const revenue = mine.reduce((sum, stat) => sum + stat.revenue, 0);

    const items = new Map<string, { quantity: number; revenue: number }>();
    for (const stat of mine) {
      const label = stat.itemUnit ? `${stat.itemName} · ${stat.itemUnit}` : stat.itemName;
      const tally = items.get(label) ?? { quantity: 0, revenue: 0 };
      tally.quantity += stat.quantity;
      tally.revenue += stat.revenue;
      items.set(label, tally);
    }

    const lastYearRevenue = priorByName.get(row.name) ?? null;

    return {
      name: row.name,
      when: row.startsOn === row.endsOn ? row.startsOn! : `${row.startsOn} → ${row.endsOn}`,
      revenue,
      lastYearRevenue,
      // A rise from zero is not a percentage, it is a first year. Left null.
      change:
        lastYearRevenue && lastYearRevenue > 0
          ? Math.round(((revenue - lastYearRevenue) / lastYearRevenue) * 1000) / 10
          : null,
      topItems: [...items.entries()]
        .map(([label, tally]) => ({ label, ...tally }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
      order: row.from!.getTime(),
    };
  });

  // Biggest first — this is a sales report, and "which occasion moved the most"
  // is the question. The ones that took nothing keep their calendar order at the
  // bottom, where they still say something worth knowing: a festival that has
  // not happened yet, or one that passed without the tills noticing.
  return built
    .sort((a, b) => b.revenue - a.revenue || a.order - b.order)
    .map(({ order, ...occasion }) => occasion);
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
      select: { area: true, orders: true, revenue: true, customers: true },
    });

    const merged = new Map<string, { orders: number; revenue: number; customers: number }>();
    for (const stat of stats) {
      const row = merged.get(stat.area) ?? { orders: 0, revenue: 0, customers: 0 };
      row.orders += stat.orders;
      row.revenue += stat.revenue;
      // Summing distinct counts across shops double-counts anyone who orders
      // from two of them. Accepted: the alternative is keeping phone numbers in
      // the rollup forever, which is a privacy cost for a rounding error.
      row.customers += stat.customers;
      merged.set(stat.area, row);
    }

    if (merged.size > 0) return finish(merged, orders);
  }

  const live = new Map<string, { orders: number; revenue: number; phones: Set<string> }>();
  for (const order of orders) {
    if (order.status === 'CANCELLED' || !order.customerArea) continue;
    const row = live.get(order.customerArea) ?? {
      orders: 0,
      revenue: 0,
      phones: new Set<string>(),
    };
    row.orders += 1;
    row.revenue += order.totalAmount;
    row.phones.add(order.customerPhone);
    live.set(order.customerArea, row);
  }

  const merged = new Map(
    [...live.entries()].map(([area, row]) => [
      area,
      { orders: row.orders, revenue: row.revenue, customers: row.phones.size },
    ]),
  );
  return finish(merged, orders);
}

function finish(
  merged: Map<string, { orders: number; revenue: number; customers: number }>,
  orders: OrderRow[],
): { rows: Report['localities']; missing: number } {
  const total = [...merged.values()].reduce((sum, row) => sum + row.orders, 0);
  const rows = [...merged.entries()]
    .map(([area, row]) => ({
      area,
      orders: row.orders,
      revenue: row.revenue,
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
  shopSlug: string;
  typeFilter: TypeFilter;
  period: ReportPeriod;
  now: Date;
};

function assemble(input: Ingredients): Report {
  const { shops, orders, sales, firstSeen, occasions, localities, shopSlug, typeFilter, period, now } =
    input;

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
    revenue: number;
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
          revenue: 0,
          quantity: 0,
          transactions: 0,
          shops: new Set(),
        };
        products.set(key, tally);
      }
      tally.revenue += line.amount;
      tally.quantity += line.quantity;
      tally.shops.add(shopId);
      if (!seenHere.has(key)) {
        tally.transactions += 1;
        seenHere.add(key);
      }
    }
  }

  /* --- buckets -------------------------------------------------------- */

  const hourly = Array.from({ length: 24 }, () => ({ transactions: 0, revenue: 0 }));
  const weekly = Array.from({ length: 7 }, () => ({ transactions: 0, revenue: 0 }));
  const timeline = new Map<string, { order: number; transactions: number; revenue: number }>();

  function bucket(when: Date, amount: number) {
    const clock = shopClock(when);
    hourly[clock.hour].transactions += 1;
    hourly[clock.hour].revenue += amount;
    weekly[clock.weekday].transactions += 1;
    weekly[clock.weekday].revenue += amount;

    // A yearly report walks months; a monthly one walks days of the month.
    const order = period.granularity === 'year' ? clock.month : clock.day;
    const slot = timeline.get(String(order)) ?? { order, transactions: 0, revenue: 0 };
    slot.transactions += 1;
    slot.revenue += amount;
    timeline.set(String(order), slot);
  }

  /* --- the two channels ----------------------------------------------- */

  const perShop = new Map<string, { revenue: number; transactions: number }>();
  function credit(shopId: string, amount: number) {
    const row = perShop.get(shopId) ?? { revenue: 0, transactions: 0 };
    row.revenue += amount;
    row.transactions += 1;
    perShop.set(shopId, row);
  }

  const orderTypes = new Map<string, { transactions: number; revenue: number }>();
  const orderStatuses = new Map<string, { transactions: number; revenue: number }>();
  const paymentModes = new Map<string, { transactions: number; revenue: number }>();

  let orderRevenue = 0;
  let counterRevenue = 0;

  for (const order of orders) {
    // A cancelled order is a thing that happened but not money that was taken.
    // It counts in the funnel and nowhere else.
    const cancelled = order.status === 'CANCELLED';
    const amount = cancelled ? 0 : order.totalAmount;

    tick(orderStatuses, order.status, order.totalAmount);
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
    counterRevenue += sale.totalAmount;
    tick(paymentModes, sale.paymentMode, sale.totalAmount);
    bucket(sale.createdAt, sale.totalAmount);
    credit(sale.shopId, sale.totalAmount);
    countLines(sale.itemsJson, sale.shopId);
  }

  const liveOrders = orders.filter((order) => order.status !== 'CANCELLED');
  const revenue = orderRevenue + counterRevenue;
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

  const ranked = [...products.values()].sort((a, b) => b.revenue - a.revenue);
  const topProducts: ProductRow[] = ranked.slice(0, 25).map((tally) => ({
    label: tally.label,
    name: tally.name,
    unit: tally.unit,
    revenue: tally.revenue,
    quantity: tally.quantity,
    transactions: tally.transactions,
    shops: tally.shops.size,
    revenueShare: revenue > 0 ? round1((tally.revenue / revenue) * 100) : 0,
  }));

  // A proven seller sitting behind an "Out of stock" badge is the one loss on
  // this page that is still happening while it is being read.
  const topKeys = new Map(
    ranked.slice(0, 25).map((tally) => [productKey(tally), tally.revenue]),
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
        revenue: sellerRevenue,
      });
    }
  }
  outOfStockSellers.sort((a, b) => b.revenue - a.revenue);

  /* --- shops ---------------------------------------------------------- */

  const shopRows: ShopRow[] = shops.map((shop) => {
    const totals = perShop.get(shop.id) ?? { revenue: 0, transactions: 0 };
    const deadHere = shop.items.filter((item) => !soldKeys.has(productKey(item))).length;

    return {
      name: shop.name,
      slug: shop.slug,
      type: shop.type as ShopTypeId,
      typeLabel: SHOP_TYPE_LABELS[shop.type as ShopTypeId] ?? shop.type,
      revenue: totals.revenue,
      transactions: totals.transactions,
      averageBasket: totals.transactions > 0 ? Math.round(totals.revenue / totals.transactions) : 0,
      items: shop.items.length,
      deadItems: deadHere,
    };
  });
  shopRows.sort((a, b) => b.revenue - a.revenue);

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
      revenue,
      transactions,
      averageBasket: transactions > 0 ? Math.round(revenue / transactions) : 0,
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
        label: period.granularity === 'year' ? MONTH_NAMES[slot.order - 1] : label,
        order: slot.order,
        transactions: slot.transactions,
        revenue: slot.revenue,
      }))
      .sort((a, b) => a.order - b.order)
      .map(({ label, transactions: count, revenue: amount }) => ({
        label,
        transactions: count,
        revenue: amount,
      })),

    channels: {
      orders: { transactions: liveOrders.length, revenue: orderRevenue },
      counter: { transactions: sales.length, revenue: counterRevenue },
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
    caveats,
  };
}

function tick(
  target: Map<string, { transactions: number; revenue: number }>,
  key: string,
  amount: number,
) {
  const row = target.get(key) ?? { transactions: 0, revenue: 0 };
  row.transactions += 1;
  row.revenue += amount;
  target.set(key, row);
}

function mapToRows(source: Map<string, { transactions: number; revenue: number }>): BucketRow[] {
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
