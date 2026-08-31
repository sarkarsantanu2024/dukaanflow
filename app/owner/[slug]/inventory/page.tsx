import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { InventoryScreen } from '@/components/owner/InventoryScreen';
import { starterCatalogue } from '@/lib/starter-catalogue';
import { dateInputValue } from '@/lib/notice';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${BRAND_NAME} — Items`,
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

export default async function InventoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { welcome } = await searchParams;
  const { shop, plan, roadblock, locale } = await loadOwnerShop(slug);

  const items = await prisma.item.findMany({
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
  });

  return (
    <OwnerShell
      slug={shop.slug}
      roadblock={roadblock}
      locale={locale}
      plan={plan}
    >
      <InventoryScreen
        slug={shop.slug}
        items={items}
        catalogue={starterCatalogue(shop.type)}
        shopType={shop.type}
        noticeText={shop.noticeText}
        noticeFrom={dateInputValue(shop.noticeFrom)}
        noticeTo={dateInputValue(shop.noticeTo)}
        deliveryEnabled={shop.deliveryEnabled}
        deliveryFeePaise={shop.deliveryFeePaise}
        freeDeliveryAbovePaise={shop.freeDeliveryAbovePaise}
        minOrderPaise={shop.minOrderPaise}
        locale={locale}
        showWelcome={welcome === '1' && items.length === 0}
        itemLimit={plan.itemLimit}
      />
    </OwnerShell>
  );
}
