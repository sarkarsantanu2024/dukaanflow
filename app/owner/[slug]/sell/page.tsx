import type { Metadata } from 'next';
import { startOfBusinessDay } from '@/lib/time';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { SellScreen } from '@/components/owner/SellScreen';
import { MenuBroadcast } from '@/components/owner/MenuBroadcast';
import type { ShopType } from '@prisma/client';
import { baseUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';

/** Shop kinds whose offer changes day to day, and only those. */
const DAILY_OFFER_SHOPS: ShopType[] = ['HOME_KITCHEN', 'RESTAURANT', 'BAKERY', 'TEA_STALL'];

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'DukaanFlow — Sell',
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

export default async function SellPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop, plan, locale } = await loadOwnerShop(slug);

  // Midnight in the shop's own day. Server-local midnight is UTC on Vercel,
  // which put the shop's "today" at 5.30am and quietly filed early sales under
  // yesterday.
  const since = startOfBusinessDay();

  const [items, today, recent, customers] = await Promise.all([
    prisma.item.findMany({
      where: { shopId: shop.id },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        nameBn: true,
        nameHi: true,
        price: true,
          priced: true,
        unit: true,
        category: true,
        inStock: true,
      },
    }),
    prisma.sale.aggregate({
      where: { shopId: shop.id, createdAt: { gte: since } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Today's sales themselves, not just their total. A shopkeeper reconciling
    // the drawer at closing needs to see the individual takings and when each
    // one happened — a single number can only be agreed with or doubted.
    prisma.sale.findMany({
      where: { shopId: shop.id, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, totalAmount: true, paymentMode: true, createdAt: true, itemsJson: true },
    }),
    prisma.customer.findMany({
      where: { shopId: shop.id },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: { id: true, name: true, phone: true, area: true },
    }),
  ]);

  /** How many things were in a sale, read defensively out of its JSON snapshot. */
  function countOf(itemsJson: unknown): number {
    if (!Array.isArray(itemsJson)) return 0;
    return itemsJson.reduce((sum: number, row) => {
      const line = row as { quantity?: unknown };
      return sum + (Number(line?.quantity) || 0);
    }, 0);
  }

  const sales = recent.map((sale) => ({
    id: sale.id,
    totalAmount: sale.totalAmount,
    paymentMode: sale.paymentMode,
    createdAt: sale.createdAt.toISOString(),
    count: countOf(sale.itemsJson),
  }));

  return (
    <OwnerShell
      slug={shop.slug}
      shopName={shop.name}
      ownerImage={shop.ownerImageData}
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
        todayTotal={today._sum.totalAmount ?? 0}
        todayCount={today._count}
        sales={sales}
        customers={customers}
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
