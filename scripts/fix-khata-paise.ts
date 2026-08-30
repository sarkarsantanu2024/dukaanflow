/**
 * Repairs khata lines written by the form that sent rupees as paise.
 *
 * The bug: the amount box was labelled ₹ and its value went to the server
 * unconverted, so ₹250 of goods was recorded as 250 paise — two rupees fifty.
 * Every line typed by hand before the fix is a hundredth of what it should be.
 *
 * WHICH LINES ARE AFFECTED, AND HOW WE KNOW.
 *
 * A ledger entry carries `saleId` when it came from the till and `orderId` when
 * it came from a completed order; both of those paths compute paise on the
 * server from real prices and were always correct. Only entries with neither —
 * the ones somebody typed into the khata screen — could be wrong.
 *
 * That still leaves one ambiguity the data cannot settle on its own. The settle
 * box used to be prefilled with the balance in paise, so an owner who simply
 * accepted the prefill recorded the right figure by accident, while one who
 * typed over it recorded a hundredth. Both look identical afterwards. So this
 * script REPORTS and lets a human decide, rather than multiplying everything by
 * a hundred and hoping.
 *
 * Usage:
 *   npx tsx scripts/fix-khata-paise.ts                 # report only
 *   npx tsx scripts/fix-khata-paise.ts --apply --ids a,b,c
 *   npx tsx scripts/fix-khata-paise.ts --apply --all-suspect
 *
 * `--apply` writes a JSON backup of every row it touches, before touching it.
 */

import { writeFileSync } from 'node:fs';
import { prisma } from '../lib/prisma';
import { formatPaise } from '../lib/money';

/**
 * Above this, a hand-typed line is almost certainly already correct.
 *
 * A wrong line holds the number of rupees the shopkeeper typed — 250 for ₹250 —
 * so wrong lines are small. ₹100 is a deliberately generous ceiling: it catches
 * a typed ₹10,000, and a genuine khata line under ₹100 is rare enough to be
 * worth a human glance, which is what the report is for.
 */
const SUSPECT_CEILING_PAISE = 10_000;

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const allSuspect = args.includes('--all-suspect');
  const idArg = args.find((arg) => arg.startsWith('--ids='));
  const chosen = new Set(idArg ? idArg.slice('--ids='.length).split(',').map((id) => id.trim()) : []);

  const entries = await prisma.ledgerEntry.findMany({
    // Typed by hand: not posted by the till, not posted by an order.
    where: { saleId: null, orderId: null },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      kind: true,
      amountPaise: true,
      note: true,
      createdAt: true,
      customer: { select: { name: true, phone: true } },
      shop: { select: { name: true, slug: true } },
    },
  });

  if (entries.length === 0) {
    console.log('No hand-typed khata entries exist. Nothing to repair.');
    return;
  }

  const suspect = entries.filter((entry) => entry.amountPaise < SUSPECT_CEILING_PAISE);

  console.log(`\nHand-typed khata entries: ${entries.length}`);
  console.log(`Below ${formatPaise(SUSPECT_CEILING_PAISE)} — likely written as rupees: ${suspect.length}\n`);

  for (const entry of suspect) {
    const who = entry.customer.name || entry.customer.phone;
    console.log(
      [
        entry.id,
        entry.shop.slug.padEnd(18),
        who.padEnd(18),
        entry.kind === 'DEBIT' ? 'gave goods' : 'got payment',
        `${formatPaise(entry.amountPaise)} → ${formatPaise(entry.amountPaise * 100)}`.padEnd(22),
        entry.createdAt.toISOString().slice(0, 10),
        entry.note,
      ].join('  '),
    );
  }

  const targets = allSuspect ? suspect : suspect.filter((entry) => chosen.has(entry.id));

  if (!apply) {
    console.log(`\nReport only. Nothing was changed.`);
    console.log(`To repair every line above:   npx tsx scripts/fix-khata-paise.ts --apply --all-suspect`);
    console.log(`To repair chosen lines:       npx tsx scripts/fix-khata-paise.ts --apply --ids=<id>,<id>`);
    return;
  }

  if (targets.length === 0) {
    console.log('\n--apply given, but no entries were chosen. Nothing was changed.');
    return;
  }

  // The book is somebody's money. Whatever happens next, the old rows are on
  // disk first.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = `khata-backup-${stamp}.json`;
  writeFileSync(backup, JSON.stringify(targets, null, 2));
  console.log(`\nBacked up ${targets.length} rows to ${backup}`);

  for (const entry of targets) {
    await prisma.ledgerEntry.update({
      where: { id: entry.id },
      data: { amountPaise: entry.amountPaise * 100 },
    });
  }

  console.log(`Repaired ${targets.length} entries. Balances re-sum themselves from these.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
