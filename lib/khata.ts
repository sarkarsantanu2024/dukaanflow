import { escapeWhatsAppText } from './whatsapp';
import { formatDay } from './time';
import { plainRupees } from './money';
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
  /** Positive: the customer owes the shop. Negative: the shop owes them. */
  balance: number;
  lastEntryAt: Date | null;
};

/** Every regular of one shop with what they currently owe, biggest debt first. */
export async function customerBalances(shopId: string): Promise<CustomerBalance[]> {
  const [customers, sums, latest] = await Promise.all([
    prisma.customer.findMany({
      where: { shopId },
      select: { id: true, name: true, phone: true, area: true },
    }),
    prisma.ledgerEntry.groupBy({
      by: ['customerId', 'kind'],
      where: { shopId },
      _sum: { amount: true },
    }),
    prisma.ledgerEntry.groupBy({
      by: ['customerId'],
      where: { shopId },
      _max: { createdAt: true },
    }),
  ]);

  const owed = new Map<string, number>();
  for (const row of sums) {
    const signed = (row.kind === 'DEBIT' ? 1 : -1) * (row._sum.amount ?? 0);
    owed.set(row.customerId, (owed.get(row.customerId) ?? 0) + signed);
  }

  const lastSeen = new Map(latest.map((row) => [row.customerId, row._max.createdAt]));

  return customers
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      area: customer.area,
      phone: customer.phone,
      balance: owed.get(customer.id) ?? 0,
      lastEntryAt: lastSeen.get(customer.id) ?? null,
    }))
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

/** What the shop is owed in total, ignoring anyone in credit. */
export function totalOutstanding(balances: CustomerBalance[]): number {
  return balances.reduce((sum, row) => sum + Math.max(0, row.balance), 0);
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
  balance: number,
  locale: 'en' | 'bn' | 'hi',
  /**
   * The account, newest first. A bare total is a number a customer has no way
   * to check, and the reply it earns is "for what?" — which is the phone call
   * this message is supposed to replace. Dates and amounts turn it into
   * something they can hold against their own memory.
   */
  entries: { kind: 'DEBIT' | 'CREDIT'; amount: number; note: string; createdAt: Date | string }[] = [],
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
    return `${greeting} — ${plainRupees(balance)} ${words.pending} ${words.please}`;
  }

  const head = `${greeting} — ${words.account}`;

  // Oldest first: an account is read downwards, the way it was written.
  const lines = [...entries]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((entry) => {
      const sign = entry.kind === 'DEBIT' ? '+' : '−';
      const label = entry.kind === 'DEBIT' ? words.gave : words.got;
      const note = entry.note ? ` (${escapeWhatsAppText(entry.note)})` : '';
      return `${formatDay(entry.createdAt)} · ${label}${note} ${sign}${plainRupees(entry.amount)}`;
    })
    .join('\n');

  return `${head}:\n\n${lines}\n\n${words.total}: ${plainRupees(balance)}\n\n${words.please}`;
}

