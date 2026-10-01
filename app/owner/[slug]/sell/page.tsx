import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { SellScreen } from '@/components/owner/SellScreen';
import { StartDayRow } from '@/components/owner/StartDayRow';
import { openedToday } from '@/lib/cash-day';
import { MenuBroadcast } from '@/components/owner/MenuBroadcast';
import type { ShopType } from '@prisma/client';
import { baseUrl } from '@/lib/qr';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';

/** Shop kinds whose offer changes day to day, and only those. */
const DAILY_OFFER_SHOPS: ShopType[] = [
  'HOME_KITCHEN',
  'RESTAURANT',
  'BAKERY',
  'TEA_STALL',
  'SWEET_SHOP',
];

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${BRAND_NAME} — Sell`,
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

export default async function SellPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop, plan, settings, roadblock, locale } = await loadOwnerShop(slug);

  /**
   * NO TILL BEFORE TODAY'S CASH (2026-09-28). An owner who comes straight to
   * the Sell tab — past the home screen's cash box — meets that box here
   * instead of the till, and the till appears the moment it is saved. The sale
   * route refuses without it regardless; see `lib/cash-day.ts`.
   */
  if (!(await openedToday(shop.id))) {
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
      >
        <StartDayRow slug={shop.slug} drawer={null} locale={locale} gate />
      </OwnerShell>
    );
  }

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
        backOn: true,
        stockNote: true,
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
      shopName={shop.name}
      ownerImageData={shop.ownerImageData}
      roadblock={roadblock}
      locale={locale}
      plan={plan}
      settings={settings}
      ownerClosed={shop.ownerClosed}
    >
      <SellScreen
        slug={shop.slug}
        shopName={shop.name}
        upiId={shop.upiId}
        upiQrData={shop.upiQrData}
        items={items}
        locale={locale}
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
