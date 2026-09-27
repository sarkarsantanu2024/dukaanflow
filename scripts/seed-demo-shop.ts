import { rupeesToPaise } from '../lib/money';
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

/**
 * A real kirana's spread, not variations of rice. `stock` is set on a few so
 * the restock list and "only 2 left" have something to show; the rest are
 * untracked, as most of a real shop's list is.
 */
const ITEMS: {
  name: string;
  nameBn: string;
  nameHi: string;
  price: number;
  unit: string;
  category: string;
  stock?: number;
}[] = [
  { name: 'Rice', nameBn: 'চাল', nameHi: 'चावल', price: 72, unit: '1 kg', category: 'Staples', stock: 40 },
  { name: 'Basmati Rice', nameBn: 'বাসমতী চাল', nameHi: 'बासमती चावल', price: 130, unit: '1 kg', category: 'Staples' },
  { name: 'Atta', nameBn: 'আটা', nameHi: 'आटा', price: 48, unit: '1 kg', category: 'Staples' },
  { name: 'Dal', nameBn: 'ডাল', nameHi: 'दाल', price: 82, unit: '500 g', category: 'Staples', stock: 2 },
  { name: 'Sugar', nameBn: 'চিনি', nameHi: 'चीनी', price: 45, unit: '1 kg', category: 'Staples' },
  { name: 'Salt', nameBn: 'নুন', nameHi: 'नमक', price: 22, unit: '1 kg', category: 'Staples' },
  { name: 'Mustard Oil', nameBn: 'সরিষার তেল', nameHi: 'सरसों का तेल', price: 165, unit: '1 L', category: 'Oil & Ghee', stock: 0 },
  { name: 'Ghee', nameBn: 'ঘি', nameHi: 'घी', price: 290, unit: '500 ml', category: 'Oil & Ghee' },
  { name: 'Tea', nameBn: 'চা', nameHi: 'चाय', price: 60, unit: '250 g', category: 'Beverages' },
  { name: 'Coffee', nameBn: 'কফি', nameHi: 'कॉफ़ी', price: 95, unit: '50 g', category: 'Beverages' },
  { name: 'Milk', nameBn: 'দুধ', nameHi: 'दूध', price: 32, unit: '500 ml', category: 'Dairy', stock: 1 },
  { name: 'Eggs', nameBn: 'ডিম', nameHi: 'अंडे', price: 42, unit: '6 pc', category: 'Dairy' },
  { name: 'Potato', nameBn: 'আলু', nameHi: 'आलू', price: 30, unit: '1 kg', category: 'Vegetables' },
  { name: 'Onion', nameBn: 'পেঁয়াজ', nameHi: 'प्याज', price: 38, unit: '1 kg', category: 'Vegetables' },
  { name: 'Biscuit Pack', nameBn: 'বিস্কুট প্যাকেট', nameHi: 'बिस्कुट पैकेट', price: 20, unit: '1 packet', category: 'Snacks' },
  { name: 'Bread', nameBn: 'পাউরুটি', nameHi: 'ब्रेड', price: 40, unit: '1 packet', category: 'Snacks' },
  { name: 'Bath Soap', nameBn: 'সাবান', nameHi: 'साबुन', price: 38, unit: '1 piece', category: 'Daily Needs' },
  { name: 'Detergent Powder', nameBn: 'ডিটারজেন্ট', nameHi: 'डिटर्जेंट', price: 110, unit: '1 kg', category: 'Daily Needs' },
];

/** The regulars, by the documentation numbers below, so orders carry a name. */
const REGULAR_NAMES: Record<string, string> = {
  '9800000011': 'Rekha Das',
  '9800000022': 'Sujit Mondal',
  '9800000033': 'Anjali Ghosh',
  '9800000044': 'Bikash Pal',
};

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
      address: 'Kolkata, West Bengal',
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
      // The list above is written in rupees because a person maintains it;
      // `price` is dropped here so only the paise figure reaches the row.
      create: (({ price, stock, ...rest }) => ({
        shopId: shop.id,
        ...rest,
        pricePaise: rupeesToPaise(price),
        stockQty: stock ?? null,
        inStock: stock !== 0,
        // A HUMAN CHOSE THESE PRICES — they are written out in the list above.
        // Without this the rows default to `priced: false`, the storefront
        // filters them out (`where: { priced: true }`), and the demo shop's own
        // QR opens on "no items yet". A demo shop that cannot be shopped is the
        // one thing a demo shop must never be.
        priced: true,
      }))(item),
      // Prices and stock touched by hand are still left alone; this only
      // repairs the flag on rows seeded before it was set, which are invisible
      // to customers until it is.
      update: { priced: true },
      select: { createdAt: true, updatedAt: true },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created += 1;
  }

  console.log(`${shop.name} (/${SLUG}) — ${created} item(s) added, ${ITEMS.length} listed.`);

  if (process.argv.includes('--orders')) {
    await seedTrade(shop.id);
    await seedKhata(shop.id);
  }

  console.log('\nMarked as a demo shop. Toggle "Show demo shops" on /admin to see or hide it.');
}

/**
 * Four regulars and their credit book.
 *
 * The khata is the screen the pitch leans on hardest — it is the one thing a
 * shopkeeper already keeps on paper — and a demo shop that showed an empty one
 * demonstrated the opposite of the point. So it is seeded alongside the trade
 * rather than left to whoever is giving the demo to type in by hand.
 *
 * Balances are deliberately unlike each other: one large and old, one small and
 * fresh, one settled to zero, one part-paid. A column of similar numbers proves
 * nothing, and "who has been owing the longest" needs somebody to be longest.
 *
 * Nothing here is stored as a balance — every rupee is a `LedgerEntry` and the
 * screen sums them, which is the behaviour being demonstrated.
 */
async function seedKhata(shopId: string) {
  const existing = await prisma.customer.count({ where: { shopId } });
  if (existing > 0) {
    console.log(`${existing} khata customer(s) already here — leaving the book alone.`);
    return;
  }

  /** `daysAgo` so the ageing is real, and the oldest debt reads as the oldest. */
  const REGULARS: {
    name: string;
    // Documentation numbers, as above: 98000000xx reaches nobody.
    phone: string;
    area: string;
    entries: { daysAgo: number; kind: 'DEBIT' | 'CREDIT'; rupees: number; note: string }[];
  }[] = [
    {
      name: 'Rekha Das',
      phone: '9800000011',
      area: 'Bazaar side',
      entries: [
        { daysAgo: 47, kind: 'DEBIT', rupees: 420, note: 'চাল, ডাল' },
        { daysAgo: 33, kind: 'DEBIT', rupees: 285, note: 'তেল, চিনি' },
        { daysAgo: 21, kind: 'CREDIT', rupees: 300, note: '' },
        { daysAgo: 6, kind: 'DEBIT', rupees: 190, note: 'আলু, পেঁয়াজ' },
      ],
    },
    {
      name: 'Sujit Mondal',
      phone: '9800000022',
      area: 'Station road',
      entries: [
        { daysAgo: 12, kind: 'DEBIT', rupees: 260, note: 'আটা, নুন' },
        { daysAgo: 2, kind: 'DEBIT', rupees: 145, note: 'চা, বিস্কুট' },
      ],
    },
    {
      name: 'Anjali Ghosh',
      phone: '9800000033',
      area: 'School lane',
      entries: [
        { daysAgo: 18, kind: 'DEBIT', rupees: 530, note: 'মাসের বাজার' },
        { daysAgo: 4, kind: 'CREDIT', rupees: 530, note: '' },
      ],
    },
    {
      name: 'Bikash Pal',
      phone: '9800000044',
      area: 'Bazaar side',
      entries: [
        { daysAgo: 9, kind: 'DEBIT', rupees: 610, note: 'সরিষার তেল, চাল' },
        { daysAgo: 3, kind: 'CREDIT', rupees: 200, note: '' },
      ],
    },
  ];

  let people = 0;
  let lines = 0;

  for (const regular of REGULARS) {
    const customer = await prisma.customer.create({
      data: { shopId, name: regular.name, phone: regular.phone, area: regular.area },
      select: { id: true },
    });
    people += 1;

    for (const entry of regular.entries) {
      await prisma.ledgerEntry.create({
        data: {
          shopId,
          customerId: customer.id,
          kind: entry.kind,
          amountPaise: rupeesToPaise(entry.rupees),
          note: entry.note,
          // Only a repayment carries one, and only cash needs reconciling.
          paymentMode: entry.kind === 'CREDIT' ? 'CASH' : '',
          createdAt: new Date(Date.now() - entry.daysAgo * 86_400_000),
        },
      });
      lines += 1;
    }
  }

  console.log(`${people} khata customer(s) and ${lines} ledger line(s).`);
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
    select: { id: true, name: true, nameBn: true, nameHi: true, unit: true, pricePaise: true },
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
          pricePaise: item.pricePaise,
          quantity,
          amountPaise: item.pricePaise * quantity,
        };
      });
      const totalAmountPaise = lines.reduce((sum, line) => sum + line.amountPaise, 0);

      // Two thirds arrive on WhatsApp, one third is rung up at the counter —
      // roughly what a shop running both looks like.
      if (n % 3 === 2) {
        await prisma.sale.create({
          data: {
            shopId,
            itemsJson: lines.map(({ itemId, nameBn, nameHi, ...rest }) => rest),
            totalAmountPaise,
            paymentMode: seed % 2 === 0 ? 'CASH' : 'UPI',
            createdAt: when,
          },
        });
        sales += 1;
      } else {
        await prisma.order.create({
          data: {
            shopId,
            customerName: REGULAR_NAMES[PHONES[seed % PHONES.length]!] ?? '',
            customerPhone: PHONES[seed % PHONES.length]!,
            customerAddress: '',
            customerArea: AREAS[seed % AREAS.length],
            orderType: seed % 4 === 0 ? 'PICKUP' : 'DELIVERY',
            itemsJson: lines,
            totalAmountPaise,
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
