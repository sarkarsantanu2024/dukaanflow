/**
 * Rolls a year of raw orders and sales up into `ItemPeriodStat` and
 * `AreaPeriodStat`, so the answers survive the rows.
 *
 * WHY THIS EXISTS. Each shop's transactions are deleted on its subscription
 * anniversary (`lib/retention.ts`). Without this job that policy would make two
 * of the reports permanently impossible, not merely thin:
 *
 * - "Did Durga Puja sell better than last year?" needs two years of Durga Puja
 *   on file. The first year is deleted before the second one happens, so the
 *   comparison could never be made even once.
 * - "Which localities do our customers come from?" is only on orders, and
 *   orders go.
 *
 * A year of a busy shop's trade is thousands of rows. Rolled up it is a few
 * hundred. Those few hundred are never purged, so the history is kept at a cost
 * the database does not notice.
 *
 * ORDER OF OPERATIONS IS THE WHOLE THING. This must run BEFORE the purge, in
 * the same job — `app/api/cron/purge/route.ts` does exactly that, and the
 * ordering there is not incidental. Roll up what is about to be deleted, then
 * delete it.
 *
 * Re-running is safe and is the normal case: the current year is rolled up
 * nightly and each run overwrites the last with better numbers.
 */

import { prisma } from './prisma';
import { placeable, resolveOccasions } from './occasions';
import { shopClock, shopMonthStart } from './time';

/** Snapshot line shape, as written by both the order and the sale routes. */
type Line = { name: string; unit: string; quantity: number; amountPaise: number };

function readLines(json: unknown): Line[] {
  if (!Array.isArray(json)) return [];
  const lines: Line[] = [];
  for (const raw of json) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name) continue;
    const quantity = num(row.quantity);
    lines.push({
      name,
      unit: typeof row.unit === 'string' ? row.unit.trim() : '',
      quantity,
      amountPaise: linePaise(row, quantity),
    });
  }
  return lines;
}

function num(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * What one snapshot line came to, in paise.
 *
 * Kept in step with the identical reader in lib/analytics.ts — both decode the
 * same JSON, and the day they disagree about a key is the day a rollup and the
 * report built from it show different totals for the same festival.
 *
 * `amountPaise`/`pricePaise` are paise. The older `amount`, `lineTotal` and
 * `price` keys hold RUPEES and are multiplied, not read as-is; reading them as
 * paise would roll every historical order up at a hundredth of its value, and
 * rollups are never recomputed once written.
 */
function linePaise(row: Record<string, unknown>, quantity: number): number {
  if (row.amountPaise !== undefined) return num(row.amountPaise);
  if (row.pricePaise !== undefined) return num(row.pricePaise) * quantity;

  const legacyRupees =
    row.amount ?? row.lineTotal ?? (row.price === undefined ? undefined : num(row.price) * quantity);
  return legacyRupees === undefined ? 0 : Math.round(num(legacyRupees) * 100);
}

export type RollupResult = {
  year: number;
  shops: number;
  itemRows: number;
  areaRows: number;
};

/**
 * Rolls up one calendar year, in shop time, for every shop.
 *
 * Defaults to the current year, which is what the nightly run wants. Pass an
 * older year to backfill — useful once, on a database that has trade predating
 * this job.
 */
export async function rollupYear(
  year: number = shopClock(new Date()).year,
): Promise<RollupResult> {
  const from = shopMonthStart(year, 1);
  const to = shopMonthStart(year + 1, 1);

  const shops = await prisma.shop.findMany({ select: { id: true, state: true } });

  // Every occasion that can be placed in this year — fixed ones by arithmetic,
  // moving ones from the dates somebody entered. Those still waiting for dates
  // are skipped rather than guessed at.
  //
  // An occasion with a blank state is kept all over India and applies to every
  // shop; a scoped one applies only to shops in that state, which is why
  // `Shop.state` had to exist first.
  const occasions = placeable(await resolveOccasions(year));

  const result: RollupResult = { year, shops: 0, itemRows: 0, areaRows: 0 };

  for (const shop of shops) {
    const [orders, sales] = await Promise.all([
      prisma.order.findMany({
        // A cancelled order is a thing that happened, not money that was taken.
        // The rollup is about takings, so it never sees them.
        where: { shopId: shop.id, createdAt: { gte: from, lt: to }, status: { not: 'CANCELLED' } },
        select: {
          createdAt: true,
          totalAmountPaise: true,
          customerPhone: true,
          customerArea: true,
          itemsJson: true,
        },
      }),
      prisma.sale.findMany({
        where: { shopId: shop.id, createdAt: { gte: from, lt: to } },
        select: { createdAt: true, totalAmountPaise: true, itemsJson: true },
      }),
    ]);

    if (orders.length === 0 && sales.length === 0) continue;
    result.shops += 1;

    /* --- which windows this shop's trade can fall into ------------------ */

    // `""` is the whole year and always applies. Every transaction is counted
    // once against it and again against each occasion it lands inside, so an
    // occasion's numbers are a subset of the year's, never a partition of it.
    const windows: { key: string; name: string; from: number; to: number }[] = [
      { key: '', name: '', from: from.getTime(), to: to.getTime() },
    ];
    for (const occasion of occasions) {
      if (occasion.state && occasion.state !== shop.state) continue;
      windows.push({
        key: occasion.id,
        name: occasion.name,
        // `resolveOccasions` has already turned the inclusive last day into an
        // exclusive end instant. Doing that arithmetic twice, in two places, is
        // how the busiest day of a festival silently goes missing.
        from: occasion.from!.getTime(),
        to: occasion.to!.getTime(),
      });
    }

    /* --- items ---------------------------------------------------------- */

    type Tally = { quantity: number; revenuePaise: number; transactions: number };
    // windowKey → "name\funit" → tally
    const items = new Map<string, Map<string, Tally>>();
    for (const window of windows) items.set(window.key, new Map());

    const countInto = (when: Date, json: unknown) => {
      const at = when.getTime();
      const lines = readLines(json);
      for (const window of windows) {
        if (at < window.from || at >= window.to) continue;
        const bucket = items.get(window.key)!;
        const seen = new Set<string>();
        for (const line of lines) {
          // A tab cannot appear in a trimmed name or unit, so it cannot
          // collide the way a space or a hyphen could.
          const key = `${line.name}\t${line.unit}`;
          const tally = bucket.get(key) ?? { quantity: 0, revenuePaise: 0, transactions: 0 };
          tally.quantity += line.quantity;
          tally.revenuePaise += line.amountPaise;
          if (!seen.has(key)) {
            tally.transactions += 1;
            seen.add(key);
          }
          bucket.set(key, tally);
        }
      }
    };

    for (const order of orders) countInto(order.createdAt, order.itemsJson);
    for (const sale of sales) countInto(sale.createdAt, sale.itemsJson);

    for (const window of windows) {
      for (const [key, tally] of items.get(window.key)!) {
        const [itemName, itemUnit] = key.split('\t');
        await prisma.itemPeriodStat.upsert({
          where: {
            shopId_year_occasionKey_itemName_itemUnit: {
              shopId: shop.id,
              year,
              occasionKey: window.key,
              itemName,
              itemUnit,
            },
          },
          create: {
            shopId: shop.id,
            year,
            occasionKey: window.key,
            occasionName: window.name,
            itemName,
            itemUnit,
            quantity: tally.quantity,
            revenuePaise: tally.revenuePaise,
            transactions: tally.transactions,
          },
          // Overwrite, never add: a re-run recomputes the same window from the
          // same rows, so incrementing would double it.
          update: {
            occasionName: window.name,
            quantity: tally.quantity,
            revenuePaise: tally.revenuePaise,
            transactions: tally.transactions,
          },
        });
        result.itemRows += 1;
      }
    }

    /* --- localities ------------------------------------------------------ */

    const areas = new Map<string, { orders: number; revenuePaise: number; phones: Set<string> }>();
    for (const order of orders) {
      // No area, no row. An "unknown" bucket would sit at the top of every
      // locality chart for the next year and say nothing.
      if (!order.customerArea) continue;
      const area = areas.get(order.customerArea) ?? {
        orders: 0,
        revenuePaise: 0,
        phones: new Set<string>(),
      };
      area.orders += 1;
      area.revenuePaise += order.totalAmountPaise;
      area.phones.add(order.customerPhone);
      areas.set(order.customerArea, area);
    }

    for (const [label, area] of areas) {
      await prisma.areaPeriodStat.upsert({
        where: { shopId_year_area: { shopId: shop.id, year, area: label } },
        create: {
          shopId: shop.id,
          year,
          area: label,
          orders: area.orders,
          revenuePaise: area.revenuePaise,
          customers: area.phones.size,
        },
        update: {
          orders: area.orders,
          revenuePaise: area.revenuePaise,
          customers: area.phones.size,
        },
      });
      result.areaRows += 1;
    }
  }

  return result;
}
