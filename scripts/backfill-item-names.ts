/**
 * Fills in Bengali and Hindi names for items created before those columns
 * existed: the vocabulary in `lib/speech.ts` where it knows the name, and a
 * phonetic spelling from `lib/transliterate.ts` where it does not (brands).
 *
 *   npx tsx scripts/backfill-item-names.ts          # report only
 *   npx tsx scripts/backfill-item-names.ts --write  # apply
 *
 * Only ever fills a blank field — a translation typed by hand always wins.
 * Names outside the vocabulary are listed at the end so they can be filled in
 * by hand on the items page.
 */

import { PrismaClient } from '@prisma/client';
import { localNames } from '../lib/transliterate';

const prisma = new PrismaClient();
const write = process.argv.includes('--write');

async function main() {
  const items = await prisma.item.findMany({
    select: { id: true, name: true, nameBn: true, nameHi: true, shop: { select: { slug: true } } },
    orderBy: { name: 'asc' },
  });

  const unknown: string[] = [];
  let changed = 0;

  for (const item of items) {
    if (item.nameBn && item.nameHi) continue;

    const known = localNames(item.name);
    if (!known.bn && !known.hi) {
      unknown.push(`${item.shop.slug} · ${item.name}`);
      continue;
    }

    const nameBn = item.nameBn || known.bn;
    const nameHi = item.nameHi || known.hi;
    if (nameBn === item.nameBn && nameHi === item.nameHi) continue;

    console.log(`${item.shop.slug} · ${item.name} → ${nameBn} / ${nameHi}`);
    changed += 1;
    if (write) await prisma.item.update({ where: { id: item.id }, data: { nameBn, nameHi } });
  }

  console.log(`\n${changed} item(s) ${write ? 'updated' : 'would be updated'}.`);

  if (unknown.length > 0) {
    console.log(`\nNot in the vocabulary — add the names by hand on the items page:`);
    for (const name of unknown) console.log(`  ${name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
