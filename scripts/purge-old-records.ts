/**
 * Runs the retention purge by hand.
 *
 *   npx tsx scripts/purge-old-records.ts          # report only
 *   npx tsx scripts/purge-old-records.ts --write  # delete
 *
 * The daily Vercel cron does this on its own; this is for the first run against
 * an existing database, and for checking what the policy would take before
 * trusting it with a schedule. The dry run touches nothing.
 *
 * Each shop keeps its current subscription year, so every shop has its own
 * cutoff — the dry run prints all of them, because "what will this delete" is
 * the only question worth asking before running it with --write.
 */

import { PrismaClient } from '@prisma/client';
import {
  purgeExpiredRecords,
  retentionAnchors,
  shopCutoff,
  RETENTION_YEARS,
} from '../lib/retention';

const prisma = new PrismaClient();
const write = process.argv.includes('--write');

async function main() {
  console.log(`Retention: ${RETENTION_YEARS} subscription year per shop.\n`);

  if (write) {
    const result = await purgeExpiredRecords();
    for (const shop of result.detail) {
      if (shop.orders + shop.sales === 0) continue;
      console.log(`${shop.slug}: ${shop.orders} order(s), ${shop.sales} sale(s) deleted.`);
    }
    console.log(
      `\n${result.orders} order(s) and ${result.sales} sale(s) deleted across ${result.shops} shop(s).`,
    );
    console.log('Reports for periods before each shop\'s cutoff can no longer be produced.');
    return;
  }

  const anchors = await retentionAnchors();
  let orders = 0;
  let sales = 0;

  for (const anchor of anchors) {
    const cutoff = shopCutoff(anchor.startedAt);
    const where = { shopId: anchor.shopId, createdAt: { lt: cutoff } };
    const [shopOrders, shopSales] = await Promise.all([
      prisma.order.count({ where }),
      prisma.sale.count({ where }),
    ]);
    orders += shopOrders;
    sales += shopSales;

    const firstYear = cutoff.getTime() === anchor.startedAt.getTime();
    console.log(
      `${anchor.slug}\n` +
        `  subscription started ${anchor.startedAt.toISOString()}\n` +
        `  cutoff               ${cutoff.toISOString()}${firstYear ? '  (still in its first year — nothing ages out yet)' : ''}\n` +
        `  would delete         ${shopOrders} order(s), ${shopSales} sale(s)`,
    );
  }

  console.log(`\nTotal: ${orders} order(s) and ${sales} sale(s) would be deleted.`);
  console.log('The khata ledger and payment records are never touched by this.');
  console.log('Re-run with --write to delete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
