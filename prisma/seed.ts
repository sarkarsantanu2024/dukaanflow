import { rupeesToPaise } from '../lib/money';
import { PrismaClient, ShopType } from '@prisma/client';
import { shopUrl } from '../lib/qr';

const prisma = new PrismaClient();

type SeedItem = { name: string; price: number; unit?: string; category?: string };

type SeedShop = {
  name: string;
  slug: string;
  type: ShopType;
  phone: string;
  address: string;
  upiId: string;
  items: SeedItem[];
};

const SHOPS: SeedShop[] = [
  {
    name: 'Ramu Grocery',
    slug: 'ramu-grocery',
    type: ShopType.GROCERY,
    phone: '9876543210',
    address: 'Dum Dum Road, Kolkata 700074',
    upiId: 'ramu@okaxis',
    items: [
      { name: 'Rice', price: 68, unit: '1 kg', category: 'Staples' },
      { name: 'Dal', price: 82, unit: '500 g', category: 'Staples' },
      { name: 'Mustard Oil', price: 165, unit: '1 L', category: 'Oil & Ghee' },
      { name: 'Biscuit Pack', price: 20, unit: '', category: 'Snacks' },
    ],
  },
  {
    name: 'Tasty Roll Corner',
    slug: 'tasty-roll-corner',
    type: ShopType.ROLL_MOMO,
    phone: '9876500011',
    address: 'Salt Lake Sector V, Kolkata 700091',
    upiId: 'tastyroll@ybl',
    items: [
      { name: 'Egg Roll', price: 60, unit: '', category: 'Rolls' },
      { name: 'Chicken Roll', price: 90, unit: '', category: 'Rolls' },
      { name: 'Veg Chowmein', price: 80, unit: '', category: 'Chinese' },
      { name: 'Momo', price: 70, unit: '8 pcs', category: 'Momo' },
    ],
  },
];

async function main() {
  for (const shop of SHOPS) {
    const { items, ...shopData } = shop;

    // Idempotent: re-running the seed refreshes prices instead of duplicating.
    const record = await prisma.shop.upsert({
      where: { slug: shop.slug },
      create: shopData,
      update: shopData,
      select: { id: true, slug: true, name: true },
    });

    for (const item of items) {
      await prisma.item.upsert({
        where: {
          shopId_name_unit: { shopId: record.id, name: item.name, unit: item.unit ?? '' },
        },
        create: {
          shopId: record.id,
          name: item.name,
          pricePaise: rupeesToPaise(item.price),
          unit: item.unit ?? '',
          category: item.category ?? '',
        },
        update: { pricePaise: rupeesToPaise(item.price), category: item.category ?? '' },
      });
    }

    console.log(`✔ ${record.name} → /shop/${record.slug} (${items.length} items)`);
  }
}

main()
  .then(async () => {
    console.log(`\nSeed complete. Open ${shopUrl('ramu-grocery')}`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
