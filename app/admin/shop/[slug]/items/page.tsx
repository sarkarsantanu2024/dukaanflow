import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
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
      <AdminHeader title={`${shop.name} — Items`} backHref="/admin">
        <Link
          href={`/admin/shop/${shop.slug}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Edit &amp; QR
        </Link>
      </AdminHeader>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:px-6">
        <ItemsManager slug={shop.slug} items={shop.items} />
        <BulkPanel slug={shop.slug} />
      </main>
    </>
  );
}
