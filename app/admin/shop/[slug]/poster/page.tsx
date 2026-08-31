import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PosterSheet } from '@/components/admin/PosterSheet';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export default async function PosterPage({ params }: PageProps) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      phone: true,
      address: true,
      upiId: true,
      upiQrData: true,
      ownerImageData: true,
    },
  });

  if (!shop) notFound();

  return (
    <>
      <AdminHeader title="QR poster" eyebrow={shop.name} backHref={`/admin/shop/${shop.slug}`} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <PosterSheet
          shopName={shop.name}
          slug={shop.slug}
          phone={shop.phone}
          address={shop.address}
          ownerImage={shop.ownerImageData}
        />
      </main>
    </>
  );
}
