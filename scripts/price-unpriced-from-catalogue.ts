/**
 * Gives every stranded Re 1 item the price its shop-type catalogue suggests.
 *
 *   npx tsx scripts/price-unpriced-from-catalogue.ts          # report only
 *   npx tsx scripts/price-unpriced-from-catalogue.ts --write  # apply
 *
 * WHY THIS EXISTS.
 *
 * The starter catalogue used to carry no prices, so every item an owner ticked
 * landed at a Re 1 placeholder and unpriced — invisible to customers until
 * somebody typed a real number into each of sixty rows. The catalogue carries
 * prices now and new picks arrive priced, but rows added before that are still
 * sitting at ₹1: the change fixed the tap, not the shop.
 *
 * Ticking the same item again repairs it one at a time, which is fine for a
 * shop with three and hopeless for a shop with sixty. This does the whole
 * estate in one pass.
 *
 * WHAT IT WILL NOT TOUCH.
 *
 *  - Anything already priced. That number is the shopkeeper's, and a shop-type
 *    average must never overwrite what somebody actually charges.
 *  - Anything the shop's own catalogue does not list by the same name and pack
 *    size. A voice-added item, a photographed packet, a name typed by hand —
 *    there is no suggestion to give those, and inventing one would put a made-up
 *    price on a shop page.
 *  - Anything sitting at a price that is not the Re 1 placeholder. This is the
 *    important one. An unpriced row at ₹50 is a price somebody CHOSE — the bulk
 *    paste used to write the number and forget the flag — and replacing it with
 *    a shop-type average would destroy real data while looking like a repair.
 *    `fix-unpriced-items.ts` is what those rows need. Without this guard the two
 *    scripts had to be run in one particular order to be safe, which is not a
 *    property anybody should have to remember at 2am.
 *
 * So an item is changed only when it is unpriced AND still at the placeholder
 * AND matches a catalogue entry for its shop's type exactly. Everything else is
 * listed at the end as still needing a human.
 */

import { PrismaClient } from '@prisma/client';
import { starterCatalogue } from '../lib/starter-catalogue';

const prisma = new PrismaClient();
const write = process.argv.includes('--write');

/** What voice, photo and the old starter list wrote for "nobody has said yet". */
const PLACEHOLDER_PAISE = 100;

function key(name: string, unit: string): string {
  return `${name.trim().toLowerCase()}|${unit.trim().toLowerCase()}`;
}

function rupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2).replace(/\.00$/, '')}`;
}

async function main() {
  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      slug: true,
      type: true,
      items: {
        // Placeholder only. An unpriced row at any other number carries a price
        // somebody chose; see the note at the top of this file.
        where: { priced: false, pricePaise: PLACEHOLDER_PAISE },
        select: { id: true, name: true, unit: true, pricePaise: true },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { slug: 'asc' },
  });

  let matched = 0;
  const orphans: string[] = [];

  for (const shop of shops) {
    if (shop.items.length === 0) continue;

    const suggestions = new Map(
      starterCatalogue(shop.type).map((entry) => [key(entry.name, entry.unit), entry.pricePaise]),
    );

    const fixes: { id: string; label: string; from: number; to: number }[] = [];
    for (const item of shop.items) {
      const suggested = suggestions.get(key(item.name, item.unit));
      const label = item.unit ? `${item.name} · ${item.unit}` : item.name;
      if (suggested === undefined) {
        orphans.push(`${shop.slug} — ${label}`);
        continue;
      }
      fixes.push({ id: item.id, label, from: item.pricePaise, to: suggested });
    }

    if (fixes.length === 0) continue;

    console.log(`\n${shop.slug} (${shop.type}) — ${fixes.length} item(s):`);
    for (const fix of fixes) {
      console.log(`  ${fix.label.padEnd(34)} ${rupees(fix.from)} → ${rupees(fix.to)}`);
    }
    matched += fixes.length;

    if (write) {
      // Grouped by price so a shop is a handful of statements, not sixty.
      const byPrice = new Map<number, string[]>();
      for (const fix of fixes) {
        const bucket = byPrice.get(fix.to);
        if (bucket) bucket.push(fix.id);
        else byPrice.set(fix.to, [fix.id]);
      }
      for (const [pricePaise, ids] of byPrice) {
        await prisma.item.updateMany({
          where: { id: { in: ids } },
          data: { pricePaise, priced: true },
        });
      }
    }
  }

  console.log(
    matched === 0
      ? '\nNothing to do — no unpriced item matches its shop-type catalogue.'
      : write
        ? `\n${matched} item(s) priced and on sale.`
        : `\n${matched} item(s) would be priced. Re-run with --write to apply.`,
  );

  if (orphans.length > 0) {
    console.log(
      `\n${orphans.length} unpriced item(s) are not in their shop's catalogue and need a` +
        ' price typed by hand — voice, photo and hand-typed items have no suggestion:',
    );
    for (const line of orphans) console.log(`  ${line}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
