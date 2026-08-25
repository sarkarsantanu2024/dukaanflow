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

/** The order snapshot is JSON, so it is narrowed here rather than trusted. */
function toLines(itemsJson: unknown): OwnerOrder['lines'] {
  if (!Array.isArray(itemsJson)) return [];
  return itemsJson.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const line = row as Record<string, unknown>;
    return [
      {
        name: String(line.name ?? ''),
        unit: String(line.unit ?? ''),
        quantity: Number(line.quantity ?? 0),
        amount: Number(line.amount ?? 0),
      },
    ];
  });
}

export default async function OrdersPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop, plan, locale } = await loadOwnerShop(slug);

  const rows = await prisma.order.findMany({
    where: { shopId: shop.id },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 50,
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

  const orders: OwnerOrder[] = rows.map((row) => ({
    id: row.id,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerAddress: row.customerAddress,
    orderType: row.orderType,
    status: row.status,
    totalAmount: row.totalAmount,
    createdAt: row.createdAt.toISOString(),
    lines: toLines(row.itemsJson),
  }));

  return (
    <OwnerShell slug={shop.slug} shopName={shop.name} locale={locale} plan={plan}>
      <OrdersScreen slug={shop.slug} orders={orders} locale={locale} />
    </OwnerShell>
  );
}
