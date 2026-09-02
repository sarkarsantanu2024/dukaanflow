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
import { formatDayTime, formatIsoClock, formatIsoDay } from './time';

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

/** One person's account, gathered out of the flat list of entries. */
export type Account = {
  name: string;
  phone: string;
  area: string;
  entries: KhataExportEntry[];
  gavePaise: number;
  gotPaise: number;
  balancePaise: number;
};

/**
 * Entries grouped by the person they belong to, oldest first within each.
 *
 * Keyed on the phone number rather than the name: two customers really can both
 * be "Rekha", and a shopkeeper who typed a name twice with different spacing
 * has one debtor and not two.
 */
export function accountsOf(entries: KhataExportEntry[]): Account[] {
  const byCustomer = new Map<string, Account>();

  for (const entry of entries) {
    const key = entry.customerPhone || entry.customerName.trim().toLowerCase();
    let account = byCustomer.get(key);
    if (!account) {
      account = {
        name: entry.customerName || '—',
        phone: entry.customerPhone,
        area: entry.customerArea,
        entries: [],
        gavePaise: 0,
        gotPaise: 0,
        balancePaise: 0,
      };
      byCustomer.set(key, account);
    }
    account.entries.push(entry);
    if (entry.kind === 'DEBIT') account.gavePaise += entry.amountPaise;
    else account.gotPaise += entry.amountPaise;
    account.balancePaise = account.gavePaise - account.gotPaise;
  }

  for (const account of byCustomer.values()) {
    account.entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Biggest debtor first: the shopkeeper opening this file is looking for who
  // owes the most, not for whoever happens to be alphabetically first.
  return [...byCustomer.values()].sort((a, b) => b.balancePaise - a.balancePaise);
}

/**
 * The credit book as a spreadsheet: a summary of who owes what, then every
 * entry underneath, grouped by person with that person's running balance.
 *
 * THE BALANCE COLUMN USED TO RUN ACROSS EVERYBODY. One counter walked down the
 * whole file in date order, so the number beside Santanu's ₹325 read ₹375 —
 * his 325 plus the 50 that Potol, a different customer, owed from an hour
 * earlier. Every row of a multi-customer export carried a total that belonged
 * to nobody. It only looked right in the single-customer export, where there
 * was nobody else in the file to contaminate it.
 *
 * A running balance is a fact about ONE account, so it is computed per account
 * and the rows are grouped to match. Reading down a person's block now gives
 * exactly what their own statement gives.
 *
 * OLDEST FIRST within each person, because a ledger is read forwards and a
 * running total means nothing unless the rows above it are what came before.
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
  const accounts = accountsOf(input.entries);

  const lines: string[] = [
    row([`${input.shopName} — udhaar khata`]),
    // Readable, and in the shop's own timezone. This was a raw ISO instant in
    // UTC, which is neither.
    row(['Generated', formatDayTime(input.generatedAt)]),
    row(['All amounts in rupees']),
  ];

  if (accounts.length === 0) {
    lines.push('', row(['(nothing in the book yet)']));
    return lines.join('\n');
  }

  /**
   * WHO OWES WHAT, before anything else.
   *
   * The file opened straight into a date-ordered list of every transaction the
   * shop had ever recorded, which is the raw material for the answer and not
   * the answer. The one question a shopkeeper opens their khata to ask is who
   * owes them money, and it was the one thing the export never said.
   */
  lines.push(
    '',
    row(['Summary']),
    row(['Customer', 'Phone', 'Area', 'Gave goods', 'Got payment', 'Balance']),
  );

  for (const account of accounts) {
    lines.push(
      row([
        account.name,
        account.phone,
        account.area,
        rupees(account.gavePaise),
        rupees(account.gotPaise),
        rupees(account.balancePaise),
      ]),
    );
  }

  const totals = accounts.reduce(
    (sum, account) => ({
      gave: sum.gave + account.gavePaise,
      got: sum.got + account.gotPaise,
      balance: sum.balance + account.balancePaise,
    }),
    { gave: 0, got: 0, balance: 0 },
  );

  lines.push(
    row([
      'Total outstanding',
      '',
      '',
      rupees(totals.gave),
      rupees(totals.got),
      rupees(totals.balance),
    ]),
  );

  lines.push(
    '',
    row(['Entries']),
    row([
      'Date',
      'Time',
      'Customer',
      'Phone',
      'Area',
      'Gave goods',
      'Got payment',
      'Balance',
      'Note',
    ]),
  );

  for (const account of accounts) {
    let balancePaise = 0;
    for (const entry of account.entries) {
      balancePaise += entry.kind === 'DEBIT' ? entry.amountPaise : -entry.amountPaise;
      lines.push(
        row([
          // Split in two, and both in the shop's timezone. One ISO instant in a
          // cell is a string no spreadsheet will filter, sort as a date, or
          // group by month — and its UTC date was a day out for every entry
          // made after half past six in the evening.
          formatIsoDay(entry.date),
          formatIsoClock(entry.date),
          account.name,
          account.phone,
          account.area,
          entry.kind === 'DEBIT' ? rupees(entry.amountPaise) : '',
          entry.kind === 'CREDIT' ? rupees(entry.amountPaise) : '',
          rupees(balancePaise),
          entry.note,
        ]),
      );
    }
    // A blank line between people, so a block is visibly one person's account
    // rather than a run of rows that happen to share a name.
    lines.push('');
  }

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
