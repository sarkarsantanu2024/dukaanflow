/**
 * Wipe one shop back to the day it was made — without deleting the shop.
 *
 * The same reset the console button runs (`app/api/admin/shop/[slug]/reset`);
 * keep the two in step.
 *
 * WHAT IT CLEARS: every transaction and everything derived from one — orders,
 * counter sales, the khata ledger, customers, cash-day drawers and the yearly
 * report rollups; the item list itself; the money, meaning recorded payments and
 * the payment requests raised against them; and every push subscription, owner's
 * and customers' alike. The subscription goes back to what a newly created shop
 * is given: the standard free trial of Pro, with any negotiated price forgotten.
 *
 * WHAT IT KEEPS is the shop's identity and nothing else: name, slug, QR, address,
 * hours, owner details and the owner's PIN — so printed QR posters keep working,
 * which is the point of resetting rather than deleting. Pass `--keep-items` to
 * leave the item list standing and merely put each item back to how a
 * freshly-added one looks (in stock, nobody counting).
 *
 * WHY THIS EXISTS. Clearing a test shop by hand, table by table, is easy to get
 * half-right — the orders go but the ledger stays, or the items and the paid
 * plan linger and the shop still looks used. One command, the same every time,
 * so a fresh start is actually fresh.
 *
 * SAFE ON PRODUCTION BY REFUSING IT. Local `.env` points at the production
 * database, so this prints the host and stops unless `ALLOW_PROD_DB=1` is set —
 * the same gate `scripts/db-target.ts` puts in front of schema changes.
 *
 *   npm run reset:shop <shop-slug>                    → refused on production
 *   ALLOW_PROD_DB=1 npm run reset:shop <shop-slug>    → proceeds
 *   ALLOW_PROD_DB=1 npm run reset:shop <slug> --keep-items
 */
import { config } from 'dotenv';

config();

import { PrismaClient } from '@prisma/client';
import { TRIAL_DAYS } from '../lib/plans';

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
  const keepItems = args.includes('--keep-items');
  const slug = args.find((arg) => !arg.startsWith('--'));

  if (!slug) {
    console.error('\n  Usage: ALLOW_PROD_DB=1 npm run reset:shop <shop-slug> [--keep-items]\n');
    process.exit(1);
  }

  const host = hostOf(process.env.DATABASE_URL);
  const isProduction = PRODUCTION_HOSTS.some((needle) => host.includes(needle));
  console.log(`\n  database: ${host}`);
  console.log(`  branch:   ${isProduction ? 'PRODUCTION' : 'non-production'}`);
  console.log(`  shop:     ${slug}${keepItems ? '  (keeping items)' : ''}\n`);

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
    // first; payment requests go before the payments they were raised against.
    // Only the shop row itself is left standing.
    const ledger = await prisma.ledgerEntry.deleteMany({ where });
    const sales = await prisma.sale.deleteMany({ where });
    const orders = await prisma.order.deleteMany({ where });
    const cashDays = await prisma.cashDay.deleteMany({ where });
    const customers = await prisma.customer.deleteMany({ where });
    const itemStats = await prisma.itemPeriodStat.deleteMany({ where });
    const areaStats = await prisma.areaPeriodStat.deleteMany({ where });
    const requests = await prisma.paymentRequest.deleteMany({ where });
    const payments = await prisma.payment.deleteMany({ where });
    const push = await prisma.pushSubscription.deleteMany({ where });

    let itemsCleared = 0;
    let stockReset = 0;
    if (keepItems) {
      const r = await prisma.item.updateMany({ where, data: { stockQty: null, inStock: true } });
      stockReset = r.count;
    } else {
      const r = await prisma.item.deleteMany({ where });
      itemsCleared = r.count;
    }

    // Back to what `POST /api/admin/shop` stamps on a new shop. A custom price
    // belongs to the shop that negotiated it, so it is forgotten too.
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        plan: 'PRO',
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
        currentPeriodEnd: null,
        trialEndNoticedAt: null,
        activatedAt: null,
        customPricePaise: null,
        customItemLimit: null,
        customPlanName: '',
      },
    });

    console.log(
      `  cleared: orders=${orders.count} sales=${sales.count} ledger=${ledger.count} ` +
        `customers=${customers.count} cashDays=${cashDays.count} push=${push.count} ` +
        `itemStats=${itemStats.count} areaStats=${areaStats.count} ` +
        `payments=${payments.count} paymentRequests=${requests.count} items=${itemsCleared}`,
    );
    if (keepItems) console.log(`  reset ${stockReset} items to in-stock, not-counted`);
    console.log(`  subscription: back to a fresh ${TRIAL_DAYS}-day Pro trial`);

    const itemsAfter = await prisma.item.count({ where });
    console.log(`  ${shop.name} — after: ${itemsAfter} items, everything else cleared.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
