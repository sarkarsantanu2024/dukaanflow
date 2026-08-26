import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { KhataScreen, type KhataCustomer } from '@/components/owner/KhataScreen';
import { customerBalances, totalOutstanding } from '@/lib/khata';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'DukaanFlow — Khata',
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

export default async function KhataPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop, plan, locale } = await loadOwnerShop(slug);

  const [balances, entries] = await Promise.all([
    customerBalances(shop.id),
    prisma.ledgerEntry.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
      // Enough history to settle any argument, without loading years of it.
      take: 400,
      select: { id: true, customerId: true, kind: true, amount: true, note: true, createdAt: true },
    }),
  ]);

  const byCustomer = new Map<string, KhataCustomer['entries']>();
  for (const entry of entries) {
    const list = byCustomer.get(entry.customerId) ?? [];
    list.push({
      id: entry.id,
      kind: entry.kind,
      amount: entry.amount,
      note: entry.note,
      createdAt: entry.createdAt.toISOString(),
    });
    byCustomer.set(entry.customerId, list);
  }

  const customers: KhataCustomer[] = balances.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    balance: row.balance,
    entries: byCustomer.get(row.id) ?? [],
  }));

  return (
    <OwnerShell slug={shop.slug} shopName={shop.name} locale={locale} plan={plan}>
      <KhataScreen
        slug={shop.slug}
        shopName={shop.name}
        customers={customers}
        outstanding={totalOutstanding(balances)}
        locale={locale}
      />
    </OwnerShell>
  );
}
