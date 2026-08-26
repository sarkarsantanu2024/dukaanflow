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
  /** Positive: the customer owes the shop. Negative: the shop owes them. */
  balance: number;
  lastEntryAt: Date | null;
};

/** Every regular of one shop with what they currently owe, biggest debt first. */
export async function customerBalances(shopId: string): Promise<CustomerBalance[]> {
  const [customers, sums, latest] = await Promise.all([
    prisma.customer.findMany({
      where: { shopId },
      select: { id: true, name: true, phone: true },
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
): Promise<{ id: string; name: string; phone: string }> {
  return prisma.customer.upsert({
    where: { shopId_phone: { shopId, phone } },
    create: { shopId, phone, name },
    // A blank name on a later visit must not wipe the one already recorded.
    update: name ? { name } : {},
    select: { id: true, name: true, phone: true },
  });
}

/** The reminder a shopkeeper sends, written to be sendable without editing. */
export function reminderMessage(
  shopName: string,
  customerName: string,
  balance: number,
  locale: 'en' | 'bn' | 'hi',
): string {
  const who = customerName ? `${customerName}, ` : '';
  if (locale === 'bn') {
    return `${who}নমস্কার। ${shopName} — আপনার বাকি আছে ₹${balance}। সুবিধামতো দিয়ে দেবেন। ধন্যবাদ।`;
  }
  if (locale === 'hi') {
    return `${who}नमस्ते। ${shopName} — आपका ₹${balance} बाकी है। सुविधा हो तो दे दीजिए। धन्यवाद।`;
  }
  return `${who}hello. ${shopName} — ₹${balance} is pending on your account. Please pay when convenient. Thank you.`;
}
