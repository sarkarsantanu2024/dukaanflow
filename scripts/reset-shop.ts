/**
 * Wipe one shop back to a clean slate for testing — without deleting the shop.
 *
 * WHAT IT CLEARS: every transaction and everything derived from one — orders,
 * counter sales, the khata ledger, customers, cash-day drawers, and the shop's
 * customer push subscriptions. WHAT IT KEEPS: the shop itself, its owner PIN and
 * settings, and its item list. By default it also resets each item to how a
 * freshly-added one looks — in stock, nobody counting — so no leftover stock
 * counts, "out of stock" flags or supplier-list entries linger. Pass
 * `--keep-stock` to leave item stock exactly as it is.
 *
 * WHY THIS EXISTS. Clearing a test shop by hand, table by table, is easy to get
 * half-right — the orders go but the ledger stays, or the stock counts linger
 * and the shop still looks used. One command, the same every time, so a fresh
 * start is actually fresh.
 *
 * SAFE ON PRODUCTION BY REFUSING IT. Local `.env` points at the production
 * database, so this prints the host and stops unless `ALLOW_PROD_DB=1` is set —
 * the same gate `scripts/db-target.ts` puts in front of schema changes.
 *
 *   npm run reset:shop <shop-slug>                    → refused on production
 *   ALLOW_PROD_DB=1 npm run reset:shop <shop-slug>    → proceeds
 *   ALLOW_PROD_DB=1 npm run reset:shop <slug> --keep-stock
 */
import { config } from 'dotenv';

config();

import { PrismaClient } from '@prisma/client';

/** Neon branch endpoints known to be production — keep in step with db-target.ts. */
const PRODUCTION_HOSTS = ['ep-holy-lab-azgo7vv2'];

function hostOf(url: string | undefined): string {
  if (!url) return '(no DATABASE_URL set)';
  try {
    return new URL(url).host;
  } catch {
    const match = url.match(/@([^/?]+)/);
    return match ? match[1]! : '(unparseable DATABASE_URL)';
  }
}

async function main() {
  const args = process.argv.slice(2);
  const keepStock = args.includes('--keep-stock');
  const slug = args.find((arg) => !arg.startsWith('--'));

  if (!slug) {
    console.error('\n  Usage: ALLOW_PROD_DB=1 npm run reset:shop <shop-slug> [--keep-stock]\n');
    process.exit(1);
  }

  const host = hostOf(process.env.DATABASE_URL);
  const isProduction = PRODUCTION_HOSTS.some((needle) => host.includes(needle));
  console.log(`\n  database: ${host}`);
  console.log(`  branch:   ${isProduction ? 'PRODUCTION' : 'non-production'}`);
  console.log(`  shop:     ${slug}${keepStock ? '  (keeping stock)' : ''}\n`);

  if (isProduction && process.env.ALLOW_PROD_DB !== '1') {
    console.error(
      '  Refused: this would change the PRODUCTION database.\n' +
        `  If that is genuinely what you want:\n\n    ALLOW_PROD_DB=1 npm run reset:shop ${slug}\n`,
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true, name: true } });
    if (!shop) {
      console.error(`  No shop has the slug "${slug}". Nothing changed.\n`);
      process.exit(1);
    }
    const where = { shopId: shop.id };

    const before = {
      items: await prisma.item.count({ where }),
      orders: await prisma.order.count({ where }),
      sales: await prisma.sale.count({ where }),
      ledger: await prisma.ledgerEntry.count({ where }),
      customers: await prisma.customer.count({ where }),
      cashDays: await prisma.cashDay.count({ where }),
    };
    console.log(`  ${shop.name} — before:`, JSON.stringify(before));

    // FK-safe order: the ledger points at customers and orders/sales, so it goes
    // first. Items and the shop are deliberately left standing.
    const ledger = await prisma.ledgerEntry.deleteMany({ where });
    const sales = await prisma.sale.deleteMany({ where });
    const orders = await prisma.order.deleteMany({ where });
    const cashDays = await prisma.cashDay.deleteMany({ where });
    const customers = await prisma.customer.deleteMany({ where });
    const push = await prisma.pushSubscription.deleteMany({ where: { shopId: shop.id, role: 'CUSTOMER' } });

    let stockReset = 0;
    if (!keepStock) {
      const r = await prisma.item.updateMany({ where, data: { stockQty: null, inStock: true } });
      stockReset = r.count;
    }

    console.log(
      `  cleared: orders=${orders.count} sales=${sales.count} ledger=${ledger.count} ` +
        `customers=${customers.count} cashDays=${cashDays.count} customerPush=${push.count}`,
    );
    if (!keepStock) console.log(`  reset ${stockReset} items to in-stock, not-counted`);

    const itemsAfter = await prisma.item.count({ where });
    console.log(`  ${shop.name} — after: ${itemsAfter} items kept, everything else cleared.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
