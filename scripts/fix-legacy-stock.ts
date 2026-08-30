/**
 * Puts back in stock the starter items that were listed out of stock.
 *
 *   npx tsx scripts/fix-legacy-stock.ts          # report only
 *   npx tsx scripts/fix-legacy-stock.ts --write  # apply
 *
 * Until commit 8d00523 the starter catalogue created items at Re 1 and marked
 * them out of stock, because back then the storefront hid an unpriced item by
 * requiring it to be *both*. The storefront now hides on the price alone, so
 * the out-of-stock half is dead weight — and it reads to an owner as their app
 * declaring shelves empty that nobody ever emptied.
 *
 * Only Re 1 rows, and only ones the owner has never touched since they were
 * created. A priced item marked out of stock is the owner's own word about
 * their shelf and is left exactly as it is.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const write = process.argv.includes('--write');

async function main() {
  const items = await prisma.item.findMany({
    // 100 paise — the placeholder Re 1 these rows were seeded at.
    where: { inStock: false, pricePaise: { lte: 100 } },
    select: {
      id: true,
      name: true,
      unit: true,
      createdAt: true,
      updatedAt: true,
      shop: { select: { slug: true } },
    },
    orderBy: [{ shop: { slug: 'asc' } }, { name: 'asc' }],
  });

  const untouched = items.filter((item) => item.updatedAt.getTime() === item.createdAt.getTime());
  const edited = items.filter((item) => item.updatedAt.getTime() !== item.createdAt.getTime());

  for (const item of untouched) {
    console.log(`${item.shop.slug} · ${item.name}${item.unit ? ` (${item.unit})` : ''} → in stock`);
  }

  if (write && untouched.length > 0) {
    await prisma.item.updateMany({
      where: { id: { in: untouched.map((item) => item.id) } },
      data: { inStock: true },
    });
  }

  console.log(`\n${untouched.length} item(s) ${write ? 'put back in stock' : 'would be put back in stock'}.`);

  if (edited.length > 0) {
    console.log(`\nLeft alone — unpriced, but edited since they were listed, so the`);
    console.log(`out-of-stock mark may be the owner's own:`);
    for (const item of edited) console.log(`  ${item.shop.slug} · ${item.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
