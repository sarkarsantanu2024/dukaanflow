/**
 * Rolls a year of trade up into the permanent stat tables, by hand.
 *
 *   npx tsx scripts/rollup.ts            # the current year
 *   npx tsx scripts/rollup.ts 2026       # a specific year
 *   npx tsx scripts/rollup.ts 2024 2026  # a range, oldest first
 *
 * The nightly cron does the current year and the one before it. This is for the
 * first run against a database with older trade, and after entering occasions
 * for a year that has already happened — the rollup is what teaches those
 * occasions which sales were theirs, and nothing shows in the report until it
 * has run.
 *
 * Always safe to re-run: each pass overwrites the last for the same window.
 */

import { PrismaClient } from '@prisma/client';
import { rollupYear } from '../lib/rollup';
import { shopClock } from '../lib/time';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2).map(Number).filter(Number.isFinite);
  const thisYear = shopClock(new Date()).year;

  const years =
    args.length === 0
      ? [thisYear]
      : args.length === 1
        ? [args[0]]
        : Array.from({ length: args[1] - args[0] + 1 }, (_, index) => args[0] + index);

  for (const year of years) {
    const result = await rollupYear(year);
    console.log(
      `${year}: ${result.itemRows} item row(s), ${result.areaRows} area row(s), ` +
        `${result.shops} shop(s) with trade.`,
    );
  }

  console.log('\nThese totals are never purged. The orders behind them will be.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
