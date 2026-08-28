import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { InventoryScreen } from '@/components/owner/InventoryScreen';
import { starterCatalogue } from '@/lib/starter-catalogue';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'DukaanFlow — Items',
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

export default async function InventoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { welcome } = await searchParams;
  const { shop, plan, locale } = await loadOwnerShop(slug);

  const items = await prisma.item.findMany({
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
  });

  return (
    <OwnerShell
      slug={shop.slug}
      shopName={shop.name}
      ownerImage={shop.ownerImageData}
      locale={locale}
      plan={plan}
    >
      <InventoryScreen
        slug={shop.slug}
        items={items}
        catalogue={starterCatalogue(shop.type)}
        shopType={shop.type}
        openTime={shop.openTime}
        closeTime={shop.closeTime}
        active={shop.active}
        closedNote={shop.closedNote}
        locale={locale}
        showWelcome={welcome === '1' && items.length === 0}
        itemLimit={plan.itemLimit}
      />
    </OwnerShell>
  );
}
