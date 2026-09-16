/**
 * Re-derives the category on items that were filed before the matcher worked.
 *
 *   npx tsx scripts/fix-item-categories.ts            # report, blanks only
 *   npx tsx scripts/fix-item-categories.ts --write    # apply to blanks
 *   npx tsx scripts/fix-item-categories.ts --all      # report, every item
 *   npx tsx scripts/fix-item-categories.ts --all --write
 *
 * THE BUG THIS CLEANS UP AFTER. `categoryFor` compared the typed English name,
 * character for character, against the catalogue's English names — and nothing
 * a shopkeeper types survives that. "Matar Dal" is not "Matar", "Minicate rice"
 * is not "Rice", and an item named "Puffed rice" was never once compared
 * against its own মুড়ি. Every one of them stored a blank category and piled up
 * under the storefront's "Other" heading, which is the one heading that tells
 * a customer nothing.
 *
 * Fixing the matcher only helps items added from here on. These are the rows
 * already in the shop.
 *
 * BLANKS ONLY, UNLESS ASKED OTHERWISE. A blank is unambiguous — nobody chose
 * it, it is the absence of an answer, and filling it can only improve the
 * shelf. A category that is already set might be one the matcher got right last
 * month, and rewriting the lot on the strength of a code change is how an
 * owner's shop rearranges itself overnight for no reason they were told about.
 * `--all` is there for the deliberate case, and it prints every change it
 * intends to make before `--write` lets it make them.
 *
 * Safe to run twice: it only writes rows whose category would actually differ.
 */

import { PrismaClient } from '@prisma/client';
import { categoryForNames, starterCatalogue } from '../lib/starter-catalogue';

const prisma = new PrismaClient();
const write = process.argv.includes('--write');
const all = process.argv.includes('--all');

async function main() {
  const shops = await prisma.shop.findMany({
    select: {
      slug: true,
      name: true,
      type: true,
      items: {
        select: { id: true, name: true, nameBn: true, nameHi: true, category: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  let considered = 0;
  let changed = 0;

  for (const shop of shops) {
    const catalogue = starterCatalogue(shop.type);
    const moves: { id: string; name: string; from: string; to: string }[] = [];

    for (const item of shop.items) {
      // A set category is left alone unless `--all` says otherwise; see above.
      if (item.category.trim() && !all) continue;
      considered += 1;

      const derived = categoryForNames([item.name, item.nameBn, item.nameHi], catalogue);

      // Nothing to say about an item the matcher still cannot place, and
      // blanking a category that is already set would be a step backwards.
      if (!derived || derived === item.category) continue;

      moves.push({ id: item.id, name: item.name, from: item.category || '(none)', to: derived });
    }

    if (moves.length === 0) continue;

    console.log(`\n  ${shop.name} (${shop.slug}) — ${moves.length} to change`);
    for (const move of moves) {
      console.log(`    ${move.name.padEnd(24)} ${move.from.padEnd(16)} → ${move.to}`);
    }

    if (write) {
      // One at a time rather than a single updateMany: each row gets a
      // different category, and a phone-shaped connection to a pooled Postgres
      // does better with a queue than with forty simultaneous writes.
      for (const move of moves) {
        await prisma.item.update({ where: { id: move.id }, data: { category: move.to } });
      }
    }

    changed += moves.length;
  }

  console.log(
    `\n  ${considered} items considered, ${changed} ${write ? 'changed' : 'would change'}.` +
      (write ? '\n' : '\n  Re-run with --write to apply.\n'),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
