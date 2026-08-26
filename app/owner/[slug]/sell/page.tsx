import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { SellScreen } from '@/components/owner/SellScreen';
import { MenuBroadcast } from '@/components/owner/MenuBroadcast';
import { baseUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';

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

  // Midnight local — "today" for a shopkeeper is the day, not 24 rolling hours.
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [items, today, customers] = await Promise.all([
    prisma.item.findMany({
      where: { shopId: shop.id },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        nameBn: true,
        nameHi: true,
        price: true,
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
    prisma.customer.findMany({
      where: { shopId: shop.id },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: { id: true, name: true, phone: true },
    }),
  ]);

  return (
    <OwnerShell slug={shop.slug} shopName={shop.name} locale={locale} plan={plan}>
      <SellScreen
        slug={shop.slug}
        shopName={shop.name}
        upiId={shop.upiId}
        upiQrData={shop.upiQrData}
        items={items}
        locale={locale}
        todayTotal={today._sum.totalAmount ?? 0}
        todayCount={today._count}
        customers={customers}
      />

      <MenuBroadcast
        shopName={shop.name}
        shopUrl={`${baseUrl()}/shop/${shop.slug}`}
        items={items.filter((item) => item.inStock && item.price > 1)}
        customers={customers}
        locale={locale}
      />
    </OwnerShell>
  );
}
