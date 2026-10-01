import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { TodayScreen } from '@/components/owner/TodayScreen';
import { drawerForToday, lastMonthWindow, monthWindow, takingsBetween, todayWindow } from '@/lib/takings';
import { WAITING_STATUSES } from '@/lib/order-status';
import { needsRestock, type RestockItem } from '@/lib/restock';
import { customerBalances } from '@/lib/khata';
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
  const day = todayWindow();
  const period = monthWindow();
  const previous = lastMonthWindow();

  // Everything the briefing needs, worked out from the same queries the rest of
  // the app trusts, in one round of parallel reads. Today's, this month's and
  // last month's takings and the cash drawer moved here from the khata "হিসাব"
  // tab — this is where the day starts, so the opening cash and what came in
  // belong here. Anything older than last month is the console's report.
  const [ordersWaiting, deliveries, items, balances, today, month, lastMonth] = await Promise.all([
    prisma.order.count({ where: { shopId: shop.id, status: { in: WAITING_STATUSES } } }),
    prisma.order.count({
      where: { shopId: shop.id, orderType: 'DELIVERY', status: { in: WAITING_STATUSES } },
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
    takingsBetween(shop.id, day.from, day.to),
    takingsBetween(shop.id, period.from, period.to),
    takingsBetween(shop.id, previous.from, previous.to),
  ]);

  const drawer = await drawerForToday(shop.id, today);
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
        counts={{ ordersWaiting, lowStock, deliveries, owing }}
        today={today}
        month={month}
        lastMonth={lastMonth}
        drawer={drawer}
        shop={{ name: shop.name, address: shop.address, phone: shop.phone, ownerImageData: shop.ownerImageData }}
        restockItems={items as RestockItem[]}
      />
    </OwnerShell>
  );
}
