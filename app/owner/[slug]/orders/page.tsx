import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { OrdersScreen, type OwnerOrder } from '@/components/owner/OrdersScreen';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'DukaanFlow — Orders',
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

type Translations = Map<string, { nameBn: string; nameHi: string }>;

/**
 * The order snapshot is JSON, so it is narrowed here rather than trusted.
 *
 * Snapshots only began carrying translations recently, so orders taken before
 * that hold one name and would read in English on a Bengali screen. Where the
 * item is still listed, its current names fill the gap — the snapshot stays the
 * authority on price and quantity, which are the parts that must never move,
 * and borrows only the wording.
 */
function toLines(itemsJson: unknown, known: Translations): OwnerOrder['lines'] {
  if (!Array.isArray(itemsJson)) return [];
  return itemsJson.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const line = row as Record<string, unknown>;
    const fallback = known.get(String(line.itemId ?? ''));
    return [
      {
        name: String(line.name ?? ''),
        nameBn: String(line.nameBn ?? fallback?.nameBn ?? ''),
        nameHi: String(line.nameHi ?? fallback?.nameHi ?? ''),
        unit: String(line.unit ?? ''),
        quantity: Number(line.quantity ?? 0),
        // The order route writes `lineTotal`; this read `amount`, which was
        // never there — so every line on every order showed ₹0 while the total
        // underneath it was right. `amount` stays as a fallback in case any row
        // was ever written under that name.
        amount: Number(line.lineTotal ?? line.amount ?? 0),
      },
    ];
  });
}

export default async function OrdersPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop, plan, locale } = await loadOwnerShop(slug);

  const rows = await prisma.order.findMany({
    where: { shopId: shop.id },
    // The screen groups by status itself and counts today's takings across the
    // whole set, so it wants a window of history rather than a top-50 slice
    // that could cut today's own orders in half on a busy day.
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      customerAddress: true,
      orderType: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      itemsJson: true,
    },
  });

  // Only the names, and only for items still on the list.
  const current = await prisma.item.findMany({
    where: { shopId: shop.id },
    select: { id: true, nameBn: true, nameHi: true },
  });
  const known: Translations = new Map(
    current.map((item) => [item.id, { nameBn: item.nameBn, nameHi: item.nameHi }]),
  );

  const orders: OwnerOrder[] = rows.map((row) => ({
    id: row.id,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerAddress: row.customerAddress,
    orderType: row.orderType,
    status: row.status,
    totalAmount: row.totalAmount,
    createdAt: row.createdAt.toISOString(),
    lines: toLines(row.itemsJson, known),
  }));

  return (
    <OwnerShell
      slug={shop.slug}
      shopName={shop.name}
      ownerImage={shop.ownerImageData}
      locale={locale}
      plan={plan}
    >
      <OrdersScreen slug={shop.slug} orders={orders} locale={locale} />
    </OwnerShell>
  );
}
