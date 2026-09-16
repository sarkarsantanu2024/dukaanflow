/**
 * What minimum order each live shop is actually enforcing right now.
 *
 *   npx tsx scripts/basket-floor-check.ts
 *
 * The floor is derived from how many items a shop has ON SALE — priced and in
 * stock — so it moves on its own as a shop fills its list in, and nobody sets
 * it. This prints the derivation for every shop so it can be checked against
 * what an owner is seeing, rather than reasoned about from the tier table.
 *
 * Read-only.
 */

import { PrismaClient } from '@prisma/client';
import { minBasketPaise, NO_FLOOR_BELOW_ITEMS } from '../lib/basket';
import { formatPaise } from '../lib/money';

const prisma = new PrismaClient();

async function main() {
  const shops = await prisma.shop.findMany({
    select: {
      name: true,
      type: true,
      _count: { select: { items: { where: { priced: true, inStock: true } } } },
    },
    orderBy: { name: 'asc' },
  });

  for (const shop of shops) {
    const onSale = shop._count.items;
    const floor = minBasketPaise(onSale);
    const note =
      floor === 0
        ? `no minimum (under ${NO_FLOOR_BELOW_ITEMS} items on sale)`
        : `minimum ${formatPaise(floor)}`;
    console.log(`  ${shop.name.padEnd(30)} ${shop.type.padEnd(11)} onSale=${String(onSale).padStart(3)}  ${note}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
