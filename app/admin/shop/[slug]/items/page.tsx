import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { HeaderAction } from '@/components/admin/HeaderAction';
import { PencilIcon } from '@/components/ui/Icon';
import { ItemsManager } from '@/components/admin/ItemsManager';
import { BulkPanel } from '@/components/admin/BulkPanel';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export default async function ItemsPage({ params }: PageProps) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      items: {
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
      },
    },
  });

  if (!shop) notFound();

  return (
    <>
      <AdminHeader title="Items" eyebrow={shop.name} backHref="/admin">
        <HeaderAction href={`/admin/shop/${shop.slug}`} label="Edit & QR" icon={PencilIcon} />
      </AdminHeader>

      {/* The list is the page; adding and bulk editing are things you reach for
          while looking at it. Side by side rather than stacked, so the list
          starts at the top of the screen instead of below a screenful of tools. */}
      <main className="px-4 py-6 lg:px-6">
        <ItemsManager
          slug={shop.slug}
          items={shop.items}
          wide
          sidebar={<BulkPanel slug={shop.slug} />}
        />
      </main>
    </>
  );
}
