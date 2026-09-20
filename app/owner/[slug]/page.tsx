import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { TodayScreen } from '@/components/owner/TodayScreen';
import { takingsBetween, todayWindow } from '@/lib/takings';
import { needsRestock, type RestockItem } from '@/lib/restock';
import { customerBalances } from '@/lib/khata';
import { ownerDict } from '@/lib/owner-i18n';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${BRAND_NAME} — Today`,
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

export default async function OwnerHome({ params }: PageProps) {
  const { slug } = await params;
  const { shop, plan, settings, roadblock, locale } = await loadOwnerShop(slug);
  const { from, to } = todayWindow();

  // Everything the briefing needs, worked out from the same queries the rest of
  // the app trusts, in one round of parallel reads.
  const [ordersWaiting, ordersReady, deliveries, items, balances, takings] = await Promise.all([
    prisma.order.count({ where: { shopId: shop.id, status: { in: ['NEW', 'CONFIRMED'] } } }),
    prisma.order.count({ where: { shopId: shop.id, status: 'READY' } }),
    prisma.order.count({
      where: { shopId: shop.id, orderType: 'DELIVERY', status: { in: ['NEW', 'CONFIRMED', 'READY'] } },
    }),
    prisma.item.findMany({
      where: { shopId: shop.id },
      select: {
        id: true,
        name: true,
        nameBn: true,
        nameHi: true,
        unit: true,
        category: true,
        inStock: true,
        stockQty: true,
      },
    }),
    customerBalances(shop.id),
    takingsBetween(shop.id, from, to),
  ]);

  const lowStock = needsRestock(items as RestockItem[]).length;
  const owing = balances.filter((b) => b.balancePaise > 0).length;

  return (
    <OwnerShell
      slug={shop.slug}
      shopName={shop.name}
      ownerImageData={shop.ownerImageData}
      roadblock={roadblock}
      locale={locale}
      plan={plan}
      settings={settings}
      ownerClosed={shop.ownerClosed}
      showSettings
    >
      <TodayScreen
        slug={shop.slug}
        locale={locale}
        counts={{ ordersWaiting, ordersReady, lowStock, deliveries, owing }}
        takings={{
          totalPaise: takings.totalPaise,
          cashPaise: takings.cashPaise,
          upiPaise: takings.upiPaise,
          khataPaise: takings.khataPaise,
        }}
      />
    </OwnerShell>
  );
}
