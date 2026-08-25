import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { currentOwnerSlug, requireAdmin } from '@/lib/guard';
import { OwnerHeader } from '@/components/owner/OwnerHeader';
import { ItemsManager } from '@/components/admin/ItemsManager';
import { BulkPanel } from '@/components/admin/BulkPanel';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'DukaanFlow — My prices',
    // Each shop gets its own installable app, named after the shop.
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

export default async function OwnerPage({ params }: PageProps) {
  const { slug } = await params;

  // Middleware has already checked the cookie's signature; this re-check also
  // catches a PIN that has since been revoked, which the Edge cannot see.
  const [owner, admin] = await Promise.all([currentOwnerSlug(), requireAdmin()]);
  if (owner !== slug && !admin) redirect(`/owner/${slug}/login`);

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
    <div className="min-h-dvh bg-slate-100">
      <OwnerHeader slug={shop.slug} shopName={shop.name} />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {/* The owner gets exactly the item tools — no shop settings, no QR, no
            other shop. Everything here writes through the same endpoints the
            Super Admin uses, which authorise per shop. */}
        <ItemsManager slug={shop.slug} items={shop.items} />
        <BulkPanel slug={shop.slug} />
      </main>
    </div>
  );
}
