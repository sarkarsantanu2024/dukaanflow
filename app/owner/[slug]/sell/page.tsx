import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { SellScreen } from '@/components/owner/SellScreen';
import { MenuBroadcast } from '@/components/owner/MenuBroadcast';
import type { OrderStatus, ShopType } from '@prisma/client';
import { baseUrl } from '@/lib/qr';
import { BRAND_NAME } from '@/lib/brand';
import { readOrderLines, type SnapshotNames } from '@/lib/order-snapshot';

export const dynamic = 'force-dynamic';

/** Shop kinds whose offer changes day to day, and only those. */
const DAILY_OFFER_SHOPS: ShopType[] = ['HOME_KITCHEN', 'RESTAURANT', 'BAKERY', 'TEA_STALL'];

type PageProps = {
  params: Promise<{ slug: string }>;
  /** `?order=` — an order carried over from the queue. See `loadTillOrder`. */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Which states an order can still be worked in. A finished one is a record. */
const WORKABLE: OrderStatus[] = ['NEW', 'CONFIRMED', 'READY'];

/**
 * The order the owner asked to bring to the till, if it is still theirs to do.
 *
 * READ HERE, ON THE SERVER, FROM THE ID ALONE — never handed across from the
 * card that was tapped. The queue screen can be twenty minutes stale, and an
 * order that has since been cut down, paid or cancelled must not reappear at
 * the till at its old total. Scoped by `shopId`, so no id from anywhere can
 * reach another shop's orders.
 *
 * A missing or finished order is not an error: the till simply opens as a till.
 */
async function loadTillOrder(shopId: string, raw: string | string[] | undefined) {
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) return null;

  const order = await prisma.order.findFirst({
    where: { id, shopId, status: { in: WORKABLE } },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      customerAddress: true,
      orderType: true,
      status: true,
      totalAmountPaise: true,
      deliveryFeePaise: true,
      itemsJson: true,
    },
  });
  if (!order) return null;

  // The names the items go by now, for orders taken before snapshots carried
  // translations — the same gap the queue fills, filled the same way.
  const known: SnapshotNames = new Map(
    (
      await prisma.item.findMany({
        where: { shopId },
        select: { id: true, nameBn: true, nameHi: true },
      })
    ).map((item) => [item.id, { nameBn: item.nameBn, nameHi: item.nameHi }]),
  );

  return {
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    orderType: order.orderType,
    totalAmountPaise: order.totalAmountPaise,
    deliveryFeePaise: order.deliveryFeePaise,
    lines: readOrderLines(order.itemsJson, known),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${BRAND_NAME} — Sell`,
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

export default async function SellPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { shop, plan, roadblock, locale } = await loadOwnerShop(slug);
  const tillOrder = await loadTillOrder(shop.id, (await searchParams).order);

  // The day's takings and the list of sales rung up today used to load here and
  // sit above the till. They are gone from the screen — an owner selling with a
  // customer waiting reads neither — so they are no longer queried either.
  const [items, customers] = await Promise.all([
    prisma.item.findMany({
      where: { shopId: shop.id },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        nameBn: true,
        nameHi: true,
        pricePaise: true,
          priced: true,
        unit: true,
        category: true,
        inStock: true,
        stockQty: true,
      },
    }),
    prisma.customer.findMany({
      where: { shopId: shop.id },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: { id: true, name: true, phone: true, area: true },
    }),
  ]);

  return (
    <OwnerShell
      slug={shop.slug}
      roadblock={roadblock}
      locale={locale}
      plan={plan}
    >
      <SellScreen
        slug={shop.slug}
        shopName={shop.name}
        upiId={shop.upiId}
        upiQrData={shop.upiQrData}
        items={items}
        locale={locale}
        customers={customers}
        tillOrder={tillOrder}
      />

      {/* A kirana's list is the same today as yesterday — "today's menu" is
          noise on a shop where 99% of the items are fixed. It earns its place
          only where the offer genuinely changes: a home kitchen cooking one
          thing today, a bakery's fresh batch, a restaurant's special. */}
      {DAILY_OFFER_SHOPS.includes(shop.type) && (
      <MenuBroadcast
        shopName={shop.name}
        shopUrl={`${baseUrl()}/shop/${shop.slug}`}
        items={items.filter((item) => item.inStock && item.priced)}
        customers={customers}
        locale={locale}
      />
      )}
    </OwnerShell>
  );
}
