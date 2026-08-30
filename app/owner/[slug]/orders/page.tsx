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
 * What one snapshot line came to, in paise.
 *
 * The same two-unit problem the reports have (see `linePaise` in
 * lib/analytics.ts): rows written since money moved to paise use `amountPaise`,
 * older ones use `amount` or `lineTotal` and hold RUPEES. Reading an old row as
 * paise would show a ₹130 order as ₹1.30 on the owner's own screen.
 */
function snapshotPaise(line: Record<string, unknown>): number {
  const num = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  if (line.amountPaise !== undefined) return num(line.amountPaise);
  const legacyRupees = line.lineTotal ?? line.amount;
  return legacyRupees === undefined ? 0 : Math.round(num(legacyRupees) * 100);
}

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
        // Paise, decoded defensively — see `snapshotPaise` above.
        amountPaise: snapshotPaise(line),
      },
    ];
  });
}

export default async function OrdersPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop, plan, roadblock, locale } = await loadOwnerShop(slug);

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
      totalAmountPaise: true,
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
    totalAmountPaise: row.totalAmountPaise,
    createdAt: row.createdAt.toISOString(),
    lines: toLines(row.itemsJson, known),
  }));

  return (
    <OwnerShell
      slug={shop.slug}
      shopName={shop.name}
      ownerImage={shop.ownerImageData}
      roadblock={roadblock}
      locale={locale}
      plan={plan}
    >
      <OrdersScreen
        slug={shop.slug}
        shopName={shop.name}
        orders={orders}
        locale={locale}
        upiId={shop.upiId}
        upiQrData={shop.upiQrData}
      />
    </OwnerShell>
  );
}
