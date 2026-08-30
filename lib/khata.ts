import { escapeWhatsAppText } from './whatsapp';
import { formatDay } from './time';
import { plainPaise } from './money';
import { prisma } from './prisma';

/**
 * Udhaar — the credit book.
 *
 * Every kirana already keeps one on paper, and it is the single most-asked-for
 * thing in this market. The design follows the paper book rather than an
 * accounting package: a name, what they took, what they paid, and what is left.
 *
 * Balances are always summed from entries and never stored. A running total
 * that can drift from its own history is exactly how a paper khata starts an
 * argument, and ending those arguments is the whole point.
 */

export type CustomerBalance = {
  id: string;
  name: string;
  phone: string;
  /** Which para or lane, when the shopkeeper recorded one. */
  area: string;
  /** PAISE. Positive: the customer owes the shop. Negative: the shop owes them. */
  balancePaise: number;
  lastEntryAt: Date | null;
  /**
   * When the CURRENT debt began, or null if they owe nothing.
   *
   * Not the date of the oldest entry, and not the last time they paid: the
   * moment their balance last crossed from settled into debt and stayed there.
   * That is what a shopkeeper means by "he has owed me since Puja" — a
   * customer who ran an account for two years, cleared it in June and took
   * something last week has owed for a week, not two years.
   */
  owingSince: Date | null;
};

/** Every regular of one shop with what they currently owe, biggest debt first. */
export async function customerBalances(shopId: string): Promise<CustomerBalance[]> {
  const [customers, entries] = await Promise.all([
    prisma.customer.findMany({
      where: { shopId },
      select: { id: true, name: true, phone: true, area: true },
    }),
    // The whole book, oldest first. Summing needs no order, but working out
    // when a debt began does — it is a walk through the account, not a total.
    prisma.ledgerEntry.findMany({
      where: { shopId },
      orderBy: { createdAt: 'asc' },
      select: { customerId: true, kind: true, amountPaise: true, createdAt: true },
    }),
  ]);

  const running = new Map<string, { balancePaise: number; owingSince: Date | null; last: Date }>();

  for (const entry of entries) {
    const row = running.get(entry.customerId) ?? {
      balancePaise: 0,
      owingSince: null,
      last: entry.createdAt,
    };
    const before = row.balancePaise;
    row.balancePaise += (entry.kind === 'DEBIT' ? 1 : -1) * entry.amountPaise;
    row.last = entry.createdAt;

    // Crossed into debt: this is the day the clock starts. Crossed out of it:
    // the clock is thrown away, so paying up in full genuinely clears the
    // record rather than leaving a customer marked as an old debtor forever.
    if (before <= 0 && row.balancePaise > 0) row.owingSince = entry.createdAt;
    else if (row.balancePaise <= 0) row.owingSince = null;

    running.set(entry.customerId, row);
  }

  return customers
    .map((customer) => {
      const row = running.get(customer.id);
      return {
        id: customer.id,
        name: customer.name,
        area: customer.area,
        phone: customer.phone,
        balancePaise: row?.balancePaise ?? 0,
        lastEntryAt: row?.last ?? null,
        owingSince: row?.owingSince ?? null,
      };
    })
    .sort((a, b) => b.balancePaise - a.balancePaise || a.name.localeCompare(b.name));
}

/** What the shop is owed in total, in paise, ignoring anyone in credit. */
export function totalOutstanding(balances: CustomerBalance[]): number {
  return balances.reduce((sum, row) => sum + Math.max(0, row.balancePaise), 0);
}

/**
 * Finds or creates a regular by phone. The phone is the identity — names get
 * spelled three ways and a shopkeeper should never end up with three Rekhas.
 */
export async function upsertCustomer(
  shopId: string,
  phone: string,
  name: string,
  area = '',
  address = '',
): Promise<{ id: string; name: string; phone: string; area: string; address: string }> {
  return prisma.customer.upsert({
    where: { shopId_phone: { shopId, phone } },
    create: { shopId, phone, name, area, address },
    // A blank field on a later visit means "unchanged", never "clear it". The
    // till sends no area at all, and a counter sale must not erase the para
    // somebody typed into the khata page last week.
    update: {
      ...(name ? { name } : {}),
      ...(area ? { area } : {}),
      ...(address ? { address } : {}),
    },
    select: { id: true, name: true, phone: true, area: true, address: true },
  });
}

/** The reminder a shopkeeper sends, written to be sendable without editing. */
export function reminderMessage(
  shopName: string,
  customerName: string,
  balancePaise: number,
  locale: 'en' | 'bn' | 'hi',
  /**
   * The account, newest first. A bare total is a number a customer has no way
   * to check, and the reply it earns is "for what?" — which is the phone call
   * this message is supposed to replace. Dates and amounts turn it into
   * something they can hold against their own memory.
   */
  entries: {
    kind: 'DEBIT' | 'CREDIT';
    amountPaise: number;
    note: string;
    createdAt: Date | string;
  }[] = [],
): string {
  const who = customerName ? `${customerName}, ` : '';

  // Two openings, because the two messages are different sentences. "₹190 is
  // pending" finishes on its own; a listed account has to introduce the list.
  const words =
    locale === 'bn'
      ? {
          hello: 'নমস্কার।',
          pending: 'আপনার বাকি আছে',
          account: 'আপনার খাতা',
          please: 'সুবিধামতো দিয়ে দেবেন। ধন্যবাদ।',
          gave: 'জিনিস',
          got: 'জমা',
          total: 'মোট বাকি',
        }
      : locale === 'hi'
        ? {
            hello: 'नमस्ते।',
            pending: 'आपका बाकी है',
            account: 'आपका खाता',
            please: 'सुविधा हो तो दे दीजिए। धन्यवाद।',
            gave: 'सामान',
            got: 'जमा',
            total: 'कुल बाकी',
          }
        : {
            hello: 'hello.',
            pending: 'is pending on your account.',
            account: 'your account so far',
            please: 'Please pay when convenient. Thank you.',
            gave: 'Goods',
            got: 'Paid',
            total: 'Total due',
          };

  const greeting = `${who}${words.hello} ${shopName}`;

  if (entries.length === 0) {
    return `${greeting} — ${plainPaise(balancePaise)} ${words.pending} ${words.please}`;
  }

  const head = `${greeting} — ${words.account}`;

  // Oldest first: an account is read downwards, the way it was written.
  const lines = [...entries]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((entry) => {
      const sign = entry.kind === 'DEBIT' ? '+' : '−';
      const label = entry.kind === 'DEBIT' ? words.gave : words.got;
      const note = entry.note ? ` (${escapeWhatsAppText(entry.note)})` : '';
      return `${formatDay(entry.createdAt)} · ${label}${note} ${sign}${plainPaise(entry.amountPaise)}`;
    })
    .join('\n');

  return `${head}:\n\n${lines}\n\n${words.total}: ${plainPaise(balancePaise)}\n\n${words.please}`;
}

