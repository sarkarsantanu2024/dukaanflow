/**
 * The credit book, as a file the shopkeeper keeps.
 *
 * WHY THIS IS NOT A FEATURE. The khata is the shopkeeper's own money — who owes
 * them what, going back months — and until now the only copy of it was in
 * Halkhata's database. A shopkeeper who cannot get their own ledger out of a
 * tool has not been given a tool, they have been given a dependency, and they
 * are right to be wary of one. This is the answer to "what happens to my
 * accounts if you disappear", which is a question about trust and gets asked
 * before any question about features.
 *
 * CSV rather than a PDF, and deliberately. A PDF is a picture of a ledger; a
 * CSV opens in any spreadsheet on any phone, sums, sorts and filters, and can
 * be handed to whoever does the shop's accounts. The printable statement — for
 * the customer who wants a piece of paper — is a page the browser prints, which
 * also sidesteps the fact that no PDF library renders Bengali or Devanagari
 * without a font embedded specially for it.
 */

import { PAISE_PER_RUPEE } from './money';

/**
 * Money for a spreadsheet: rupees with two decimals, unformatted.
 *
 * Not `formatPaise`. That produces "₹1,250" for a person to read, and a
 * spreadsheet handed a currency symbol and a thousands separator stores text —
 * so the column will not sum, which is the first thing anybody does with this.
 */
function rupees(paise: number): string {
  return (Math.round(paise) / PAISE_PER_RUPEE).toFixed(2);
}

/**
 * RFC 4180 quoting, with formula characters defused.
 *
 * A leading `=`, `+`, `-` or `@` starts a formula in every spreadsheet there
 * is, and these cells carry names and notes typed by shopkeepers into their own
 * phones. Prefixing a quote is what stops a note becoming an executable cell in
 * somebody else's Excel.
 */
function cell(value: string | number): string {
  const text = String(value ?? '');
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

function row(values: (string | number)[]): string {
  return values.map(cell).join(',');
}

export type KhataExportEntry = {
  date: Date;
  customerName: string;
  customerPhone: string;
  customerArea: string;
  kind: 'DEBIT' | 'CREDIT';
  amountPaise: number;
  note: string;
};

/**
 * Every entry, oldest first, with a running balance beside it.
 *
 * OLDEST FIRST because a ledger is read forwards — the running total in the
 * last column only means anything if the rows above it are what came before.
 * The screen shows newest first, which is right for working; a statement is
 * right the other way round.
 *
 * Two money columns rather than one signed one: "gave goods" and "got payment"
 * are the two columns of every paper khata in India, and a shopkeeper checking
 * this against their own book should find the same shape.
 */
export function khataToCsv(input: {
  shopName: string;
  generatedAt: Date;
  entries: KhataExportEntry[];
}): string {
  const lines: string[] = [
    row([`${input.shopName} — udhaar khata`]),
    row(['Generated', input.generatedAt.toISOString()]),
    row(['All amounts in rupees']),
    '',
    row(['Date', 'Customer', 'Phone', 'Area', 'Gave goods', 'Got payment', 'Balance', 'Note']),
  ];

  let balancePaise = 0;
  for (const entry of input.entries) {
    balancePaise += entry.kind === 'DEBIT' ? entry.amountPaise : -entry.amountPaise;
    lines.push(
      row([
        entry.date.toISOString(),
        entry.customerName || '—',
        entry.customerPhone,
        entry.customerArea,
        entry.kind === 'DEBIT' ? rupees(entry.amountPaise) : '',
        entry.kind === 'CREDIT' ? rupees(entry.amountPaise) : '',
        rupees(balancePaise),
        entry.note,
      ]),
    );
  }

  if (input.entries.length === 0) lines.push(row(['(nothing in the book yet)']));

  lines.push('');
  lines.push(row(['Total outstanding', rupees(balancePaise)]));

  return lines.join('\n');
}

/**
 * The filename a shopkeeper will recognise in their downloads folder.
 *
 * Ascii only, and stripped of anything a filesystem or a Content-Disposition
 * header would argue about — a Bengali shop name in a header has to be encoded
 * to survive, and the name in the file's first row is where it can be read
 * properly anyway.
 */
export function khataFilename(shopName: string, on: Date): string {
  const safe = shopName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `khata-${safe || 'shop'}-${on.toISOString().slice(0, 10)}.csv`;
}
