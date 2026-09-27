/**
 * One demonstration shop for every kind of business, at `/shop/demo-<slug>`.
 *
 *   npm run demo:categories                     # create or top up every one
 *   npm run demo:categories -- --pins <file>    # …and give each a fresh owner PIN,
 *                                               #    written to <file> (keep it out of git)
 *   npm run demo:categories -- --remove         # delete them all again
 *
 * Added 2026-09-27 with the business pages (`app/[business]`): each page links
 * to its own demo shop and shows screenshots taken from it. `demo-grocery` is
 * left to `scripts/seed-demo-shop.ts`, which predates this and has its own
 * hand-written list; this script never touches it.
 *
 * Every shop is `isDemo`, so the console hides it behind the toggle and it
 * never counts as a live or paying shop. It is given paid time far ahead, so a
 * demo never meets the "trial over" roadblock in the middle of being shown.
 *
 * Idempotent: items are upserted by name and unit, and orders, sales and the
 * khata are only seeded into a shop that has none. Prices and stock changed by
 * hand are left alone.
 */

import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { BUSINESSES, demoSlug, type Business } from '../lib/business-types';
import { starterCatalogue, type StarterItem } from '../lib/starter-catalogue';
import { STANDARD_PLAN } from '../lib/plans';
import { generateOwnerPin, hashOwnerPin } from '../lib/password';
import { rupeesToPaise } from '../lib/money';

const prisma = new PrismaClient();

/** Every business but grocery, whose demo shop has its own script. */
const TARGETS = BUSINESSES.filter(
  // Grocery has its own script; a business marked `hasDemo: false` has had its
  // demo shop removed on purpose and must not be re-created by a top-up run.
  (business) => business.slug !== 'grocery' && business.hasDemo !== false,
);

/**
 * A shop's worth of items from its own list: sixteen, taken a round at a time
 * across its groups — enough to fill a phone screen with variety, and never a
 * screenshot that is one long category. A list with one group (a bakery) still
 * gets sixteen from it.
 */
function demoItems(business: Business): StarterItem[] {
  const groups = new Map<string, StarterItem[]>();
  for (const item of starterCatalogue(business.type)) {
    groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
  }
  const picked: StarterItem[] = [];
  for (let round = 0; picked.length < 16; round += 1) {
    let took = false;
    for (const list of groups.values()) {
      if (list[round] && picked.length < 16) {
        picked.push(list[round]!);
        took = true;
      }
    }
    if (!took) break;
  }
  return picked;
}

/** Documentation numbers: 98000000xx reaches nobody. */
const REGULARS = [
  { name: 'Rekha Das', phone: '9800000011', area: 'Bazaar side' },
  { name: 'Sujit Mondal', phone: '9800000022', area: 'Station road' },
  { name: 'Anjali Ghosh', phone: '9800000033', area: 'School lane' },
];

async function seedShop(business: Business): Promise<string> {
  const slug = demoSlug(business);
  const farAhead = new Date(Date.now() + 10 * 365 * 86_400_000);

  const shop = await prisma.shop.upsert({
    where: { slug },
    create: {
      name: business.demoName,
      slug,
      type: business.type,
      // Not an allocatable Indian mobile, so a demo order reaches nobody.
      phone: '9999900000',
      address: 'Kolkata, West Bengal',
      state: 'WB',
      ownerName: 'Demo Owner',
      locale: 'bn',
      isDemo: true,
      plan: STANDARD_PLAN,
      subscriptionStatus: 'ACTIVE',
      currentPeriodEnd: farAhead,
      activatedAt: new Date(),
    },
    // Never overwrite a demo somebody has been editing — only the flags that
    // keep it hidden and open.
    update: { isDemo: true, type: business.type, subscriptionStatus: 'ACTIVE', currentPeriodEnd: farAhead },
    select: { id: true },
  });

  const items = demoItems(business);
  for (const [index, item] of items.entries()) {
    // A few counted rows, one of them low, so stock and restock have something to show.
    const stock = index === 1 ? 2 : index === 3 ? 20 : null;
    await prisma.item.upsert({
      where: { shopId_name_unit: { shopId: shop.id, name: item.name, unit: item.unit } },
      create: {
        shopId: shop.id,
        name: item.name,
        nameBn: item.nameBn,
        nameHi: item.nameHi,
        unit: item.unit,
        category: item.category,
        pricePaise: item.pricePaise,
        // Chosen prices, so the rows are on sale — see seed-demo-shop.ts.
        priced: true,
        inStock: true,
        stockQty: stock,
      },
      update: { priced: true },
    });
  }

  await seedTrade(shop.id);
  await seedKhata(shop.id);
  return slug;
}

/** A week of orders and counter sales, deterministic so screenshots repeat. */
async function seedTrade(shopId: string) {
  if ((await prisma.order.count({ where: { shopId } })) > 0) return;
  const items = await prisma.item.findMany({
    where: { shopId },
    select: { id: true, name: true, nameBn: true, nameHi: true, unit: true, pricePaise: true },
    orderBy: { createdAt: 'asc' },
  });
  if (items.length === 0) return;

  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    for (let n = 0; n < 3; n += 1) {
      const seed = daysAgo * 5 + n * 3;
      const when = new Date(Date.now() - daysAgo * 86_400_000);
      // 10:30–19:30 shop time, stored in UTC.
      when.setUTCHours(5 + (seed % 10), 0 + (seed % 50), 0, 0);
      const picked = [items[seed % items.length]!, items[(seed * 3 + 1) % items.length]!].filter(
        (item, index, all) => all.findIndex((other) => other.id === item.id) === index,
      );
      const lines = picked.map((item) => {
        const quantity = 1 + (seed % 2);
        return {
          itemId: item.id,
          name: item.name,
          nameBn: item.nameBn,
          nameHi: item.nameHi,
          unit: item.unit,
          pricePaise: item.pricePaise,
          quantity,
          amountPaise: item.pricePaise * quantity,
        };
      });
      const totalAmountPaise = lines.reduce((sum, line) => sum + line.amountPaise, 0);
      const regular = REGULARS[seed % REGULARS.length]!;

      if (n === 2) {
        await prisma.sale.create({
          data: {
            shopId,
            itemsJson: lines.map(({ itemId, nameBn, nameHi, ...rest }) => rest),
            totalAmountPaise,
            paymentMode: seed % 2 === 0 ? 'CASH' : 'UPI',
            createdAt: when,
          },
        });
      } else {
        await prisma.order.create({
          data: {
            shopId,
            customerName: regular.name,
            customerPhone: regular.phone,
            customerAddress: '',
            customerArea: regular.area,
            orderType: seed % 3 === 0 ? 'PICKUP' : 'DELIVERY',
            itemsJson: lines,
            totalAmountPaise,
            // Today's are waiting, so the Orders screen has something to show.
            status: daysAgo > 0 ? 'COMPLETED' : 'NEW',
            createdAt: when,
          },
        });
      }
    }
  }
}

/** Three regulars with unlike balances, so "who owes the longest" means something. */
async function seedKhata(shopId: string) {
  if ((await prisma.customer.count({ where: { shopId } })) > 0) return;
  const books: { daysAgo: number; kind: 'DEBIT' | 'CREDIT'; rupees: number }[][] = [
    [
      { daysAgo: 30, kind: 'DEBIT', rupees: 450 },
      { daysAgo: 12, kind: 'CREDIT', rupees: 200 },
      { daysAgo: 3, kind: 'DEBIT', rupees: 180 },
    ],
    [{ daysAgo: 5, kind: 'DEBIT', rupees: 260 }],
    [
      { daysAgo: 15, kind: 'DEBIT', rupees: 320 },
      { daysAgo: 2, kind: 'CREDIT', rupees: 320 },
    ],
  ];
  for (const [index, regular] of REGULARS.entries()) {
    const customer = await prisma.customer.create({
      data: { shopId, name: regular.name, phone: regular.phone, area: regular.area },
      select: { id: true },
    });
    for (const entry of books[index]!) {
      await prisma.ledgerEntry.create({
        data: {
          shopId,
          customerId: customer.id,
          kind: entry.kind,
          amountPaise: rupeesToPaise(entry.rupees),
          note: '',
          paymentMode: entry.kind === 'CREDIT' ? 'CASH' : '',
          createdAt: new Date(Date.now() - entry.daysAgo * 86_400_000),
        },
      });
    }
  }
}

async function remove() {
  for (const business of TARGETS) {
    const slug = demoSlug(business);
    const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true, isDemo: true } });
    if (!shop) continue;
    // Never delete a shop that is not a demo, whatever its slug says.
    if (!shop.isDemo) {
      console.log(`${slug}: not a demo shop — left alone.`);
      continue;
    }
    await prisma.shop.delete({ where: { id: shop.id } });
    console.log(`${slug}: removed.`);
  }
}

async function main() {
  if (process.argv.includes('--remove')) return remove();

  const pinsAt = process.argv.indexOf('--pins');
  const pinsFile = pinsAt >= 0 ? process.argv[pinsAt + 1] : undefined;
  const pins: Record<string, string> = {};

  for (const business of TARGETS) {
    const slug = await seedShop(business);
    const shop = await prisma.shop.findUniqueOrThrow({ where: { slug }, select: { id: true, isDemo: true } });
    if (pinsFile && shop.isDemo) {
      const pin = generateOwnerPin();
      await prisma.shop.update({
        where: { id: shop.id },
        data: { ownerPinHash: await hashOwnerPin(pin), ownerPinSetAt: new Date() },
      });
      pins[slug] = pin;
    }
    const count = await prisma.item.count({ where: { shopId: shop.id } });
    console.log(`${slug}: ${count} items`);
  }

  if (pinsFile) {
    writeFileSync(pinsFile, JSON.stringify(pins, null, 2));
    console.log(`\nOwner PINs written to ${pinsFile}. Keep that file out of git.`);
  }
  console.log('\nAll marked as demo shops. Toggle "Show demo shops" on /admin to see them.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
