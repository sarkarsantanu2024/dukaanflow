/**
 * Puts back on sale the items that already have a price but were never flagged
 * as priced.
 *
 *   npx tsx scripts/fix-unpriced-items.ts          # report only
 *   npx tsx scripts/fix-unpriced-items.ts --write  # apply
 *
 * The bug: the bulk price paste wrote `pricePaise` and left `priced` alone. The
 * owner saw "₹50" in the box and "No price set" on the same row, and the
 * customer saw no row at all — the storefront hides on the flag, not on the
 * number.
 *
 * The placeholder is exactly 100 paise (Re 1), written by voice, photo and the
 * starter list for "we have this, nobody has said what it costs". Those rows
 * are genuinely unpriced and are left alone. Anything else unpriced carries a
 * number somebody chose, and the only way it got there is the paste.
 *
 * ONE-OFF, AND FENCED SO IT STAYS ONE-OFF.
 *
 * The starter catalogue now carries suggested prices, so from this point on an
 * unpriced row at ₹85 is a suggestion nobody has confirmed — exactly what this
 * script would wrongly push live. The cutoff below is the date that shipped:
 * rows created after it are suggestions and are never touched, rows created
 * before it can only have got a non-placeholder price from the paste. Delete
 * this script once it has been run rather than loosening the fence.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const write = process.argv.includes('--write');

/** What voice, photo and an unmatched packet write when nobody has said a price. */
const PLACEHOLDER_PAISE = 100;

/** The day suggested prices shipped. Nothing created on or after it is touched. */
const SUGGESTED_PRICES_FROM = new Date('2026-09-01T00:00:00Z');

async function main() {
  const stranded = await prisma.item.findMany({
    where: {
      priced: false,
      pricePaise: { not: PLACEHOLDER_PAISE },
      createdAt: { lt: SUGGESTED_PRICES_FROM },
    },
    select: {
      id: true,
      name: true,
      unit: true,
      pricePaise: true,
      shop: { select: { name: true, slug: true } },
    },
    orderBy: [{ shop: { slug: 'asc' } }, { name: 'asc' }],
  });

  if (stranded.length === 0) {
    console.log('Nothing to fix — every unpriced item is still at the ₹1 placeholder.');
    return;
  }

  console.log(`${stranded.length} item(s) priced but hidden from customers:\n`);
  for (const item of stranded) {
    const rupees = (item.pricePaise / 100).toFixed(2).replace(/\.00$/, '');
    const label = item.unit ? `${item.name} · ${item.unit}` : item.name;
    console.log(`  ${item.shop.slug.padEnd(20)} ${label.padEnd(32)} ₹${rupees}`);
  }

  if (!write) {
    console.log('\nReport only. Re-run with --write to put these on sale.');
    return;
  }

  const result = await prisma.item.updateMany({
    where: { id: { in: stranded.map((item) => item.id) } },
    data: { priced: true },
  });

  console.log(`\n${result.count} item(s) are now on sale.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
