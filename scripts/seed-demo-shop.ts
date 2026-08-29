/**
 * Creates one demonstration grocery shop with ten listed items.
 *
 *   npx tsx scripts/seed-demo-shop.ts            # create or top up
 *   npx tsx scripts/seed-demo-shop.ts --orders   # …and a fortnight of trade
 *   npx tsx scripts/seed-demo-shop.ts --remove   # delete it again
 *
 * Marked `isDemo`, so the console can hide it behind the toggle on the shops
 * page and it never quietly inflates a count of live shops.
 *
 * Idempotent: run it twice and you still have one shop with ten items. Prices
 * and stock you have changed by hand are left alone, because the point of a
 * demo shop is to be poked at.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SLUG = 'demo-grocery';

/** Ten items — a real kirana's spread, not ten variations of rice. */
const ITEMS = [
  { name: 'Rice', nameBn: 'চাল', nameHi: 'चावल', price: 72, unit: '1 kg', category: 'Staples' },
  { name: 'Atta', nameBn: 'আটা', nameHi: 'आटा', price: 48, unit: '1 kg', category: 'Staples' },
  { name: 'Dal', nameBn: 'ডাল', nameHi: 'दाल', price: 82, unit: '500 g', category: 'Staples' },
  { name: 'Sugar', nameBn: 'চিনি', nameHi: 'चीनी', price: 45, unit: '1 kg', category: 'Staples' },
  { name: 'Mustard Oil', nameBn: 'সরিষার তেল', nameHi: 'सरसों का तेल', price: 165, unit: '1 L', category: 'Oil & Ghee' },
  { name: 'Tea', nameBn: 'চা', nameHi: 'चाय', price: 60, unit: '250 g', category: 'Beverages' },
  { name: 'Salt', nameBn: 'নুন', nameHi: 'नमक', price: 22, unit: '1 kg', category: 'Staples' },
  { name: 'Potato', nameBn: 'আলু', nameHi: 'आलू', price: 30, unit: '1 kg', category: 'Vegetables' },
  { name: 'Onion', nameBn: 'পেঁয়াজ', nameHi: 'प्याज', price: 38, unit: '1 kg', category: 'Vegetables' },
  { name: 'Biscuit Pack', nameBn: 'বিস্কুট প্যাকেট', nameHi: 'बिस्कुट पैकेट', price: 20, unit: '1 packet', category: 'Snacks' },
];

async function remove() {
  const shop = await prisma.shop.findUnique({ where: { slug: SLUG }, select: { id: true } });
  if (!shop) {
    console.log('No demo shop to remove.');
    return;
  }
  // Items, orders, sales, customers and ledger rows all cascade with the shop.
  await prisma.shop.delete({ where: { id: shop.id } });
  console.log('Demo shop removed.');
}

async function main() {
  if (process.argv.includes('--remove')) return remove();

  const now = new Date();
  const shop = await prisma.shop.upsert({
    where: { slug: SLUG },
    create: {
      name: 'Demo Grocery',
      slug: SLUG,
      type: 'GROCERY',
      // A documentation number, not a real one: 9999900000 is not an
      // allocatable Indian mobile, so a demo order cannot reach a stranger.
      phone: '9999900000',
      address: 'Dum Dum Road, Kolkata',
      state: 'WB',
      ownerName: 'Demo Owner',
      locale: 'bn',
      isDemo: true,
      plan: 'PRO',
      subscriptionStatus: 'TRIALING',
      trialEndsAt: new Date(now.getTime() + 14 * 86_400_000),
      activatedAt: now,
    },
    // Never overwrite a demo shop somebody has been editing — except the flag
    // itself, which must be true or the toggle cannot hide it.
    update: { isDemo: true },
    select: { id: true, name: true },
  });

  let created = 0;
  for (const item of ITEMS) {
    const result = await prisma.item.upsert({
      where: { shopId_name_unit: { shopId: shop.id, name: item.name, unit: item.unit } },
      create: { shopId: shop.id, ...item, inStock: true },
      update: {},
      select: { createdAt: true, updatedAt: true },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created += 1;
  }

  console.log(`${shop.name} (/${SLUG}) — ${created} item(s) added, ${ITEMS.length} listed.`);

  if (process.argv.includes('--orders')) await seedTrade(shop.id);

  console.log('\nMarked as a demo shop. Toggle "Show demo shops" on /admin to see or hide it.');
}

/**
 * A fortnight of plausible trade, so the reports have a shape to show.
 *
 * Deliberately uneven: an evening peak, busier weekends, and a couple of
 * areas — a flat random spread would make every chart a straight line and
 * demonstrate nothing.
 */
async function seedTrade(shopId: string) {
  const items = await prisma.item.findMany({
    where: { shopId },
    select: { id: true, name: true, nameBn: true, nameHi: true, unit: true, price: true },
  });
  if (items.length === 0) return;

  const existing = await prisma.order.count({ where: { shopId } });
  if (existing > 0) {
    console.log(`${existing} order(s) already here — leaving the trade alone.`);
    return;
  }

  const AREAS = ['Bazaar side', 'Bazaar side', 'Bazaar side', 'Station road', 'Station road', 'School lane'];
  const PHONES = ['9800000011', '9800000022', '9800000033', '9800000044'];
  // Shop-hour weights, 6am to 9pm: a morning trickle and an evening rush.
  const HOURS = [7, 8, 9, 9, 10, 11, 17, 18, 18, 19, 19, 19, 20, 20, 21];

  let orders = 0;
  let sales = 0;

  for (let daysAgo = 13; daysAgo >= 0; daysAgo -= 1) {
    const day = new Date(Date.now() - daysAgo * 86_400_000);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const count = weekend ? 5 : 3;

    for (let n = 0; n < count; n += 1) {
      // Deterministic spread, so two runs of this script look the same and a
      // screenshot taken from it stays reproducible.
      const seed = daysAgo * 7 + n * 3;
      const hour = HOURS[seed % HOURS.length];
      const when = new Date(day);
      // Stored in UTC; IST is +5:30, so subtract it to land on the shop's clock.
      when.setUTCHours(hour - 5, 30 + (seed % 30), 0, 0);

      const picked = [items[seed % items.length], items[(seed * 5 + 2) % items.length]].filter(
        (item, index, all) => all.findIndex((other) => other.id === item.id) === index,
      );

      const lines = picked.map((item) => {
        const quantity = 1 + (seed % 3);
        return {
          itemId: item.id,
          name: item.name,
          nameBn: item.nameBn,
          nameHi: item.nameHi,
          unit: item.unit,
          price: item.price,
          quantity,
          amount: item.price * quantity,
        };
      });
      const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);

      // Two thirds arrive on WhatsApp, one third is rung up at the counter —
      // roughly what a shop running both looks like.
      if (n % 3 === 2) {
        await prisma.sale.create({
          data: {
            shopId,
            itemsJson: lines.map(({ itemId, nameBn, nameHi, ...rest }) => rest),
            totalAmount,
            paymentMode: seed % 2 === 0 ? 'CASH' : 'UPI',
            createdAt: when,
          },
        });
        sales += 1;
      } else {
        await prisma.order.create({
          data: {
            shopId,
            customerName: '',
            customerPhone: PHONES[seed % PHONES.length],
            customerAddress: '',
            customerArea: AREAS[seed % AREAS.length],
            orderType: seed % 4 === 0 ? 'PICKUP' : 'DELIVERY',
            itemsJson: lines,
            totalAmount,
            status: daysAgo > 1 ? 'COMPLETED' : 'NEW',
            createdAt: when,
          },
        });
        orders += 1;
      }
    }
  }

  console.log(`${orders} order(s) and ${sales} counter sale(s) over the last 14 days.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
