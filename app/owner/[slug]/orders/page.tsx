import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { OrdersScreen, type OwnerOrder } from '@/components/owner/OrdersScreen';
import { BRAND_NAME } from '@/lib/brand';
import { readOrderLines, type SnapshotNames } from '@/lib/order-snapshot';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${BRAND_NAME} — Orders`,
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

export default async function OrdersPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop, plan, roadblock, locale } = await loadOwnerShop(slug);

  /**
   * Three questions, asked together.
   *
   * These ran one after another — orders, then the item names, then who can be
   * reached by push — and none of them needs an answer from the one before it,
   * so the screen was waiting out three round trips to render one page. On a
   * phone this is the difference between the Orders tab appearing and the
   * Orders tab seeming not to have registered the tap.
   */
  const [rows, current, subscriptions] = await Promise.all([
    prisma.order.findMany({
    /**
     * Cancelled orders are not on this screen at all.
     *
     * Turning one away deletes it now, so nothing new can be cancelled and
     * survive — but rows cancelled before that change are still in the
     * database, and they were the whole complaint: by the evening the list an
     * owner works was mostly orders that were not happening. They are hidden
     * rather than deleted behind the owner's back; a cleanup, if it is wanted,
     * is a decision to take deliberately and not a side effect of a query.
     */
    where: { shopId: shop.id, status: { not: 'CANCELLED' } },
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
      deliveryFeePaise: true,
      revisedAt: true,
      createdAt: true,
      itemsJson: true,
    },
    }),
    // Only the names, and only for items still on the list.
    prisma.item.findMany({
      where: { shopId: shop.id },
      select: { id: true, nameBn: true, nameHi: true },
    }),
    prisma.pushSubscription.findMany({
      where: { shopId: shop.id, role: 'CUSTOMER' },
      select: { customerPhone: true },
      distinct: ['customerPhone'],
    }),
  ]);

  const known: SnapshotNames = new Map(
    current.map((item) => [item.id, { nameBn: item.nameBn, nameHi: item.nameHi }]),
  );

  /**
   * Which customers this shop can reach without the owner lifting a finger.
   *
   * THIS IS WHAT DECIDES WHETHER A WHATSAPP BUTTON APPEARS AT ALL. The server
   * already tells these phones when their order is ready or has changed — so
   * showing the owner a "message the customer" button as well is asking them to
   * do, by hand, in a rush, a job that is already done. Two messages for one
   * event is also two interruptions for the customer.
   *
   * A phone number rather than a customer id, because that is what both an
   * order and a subscription carry, and a `Customer` row can be purged and
   * remade underneath both of them.
   */
  const reachable = new Set(subscriptions.map((row) => row.customerPhone));

  const orders: OwnerOrder[] = rows.map((row) => ({
    id: row.id,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerAddress: row.customerAddress,
    orderType: row.orderType,
    status: row.status,
    totalAmountPaise: row.totalAmountPaise,
    deliveryFeePaise: row.deliveryFeePaise,
    revised: row.revisedAt !== null,
    reachable: reachable.has(row.customerPhone),
    createdAt: row.createdAt.toISOString(),
    lines: readOrderLines(row.itemsJson, known),
  }));

  return (
    <OwnerShell
      slug={shop.slug}
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
        labourPhone={shop.labourPhone}
      />
    </OwnerShell>
  );
}
