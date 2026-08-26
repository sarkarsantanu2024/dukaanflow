import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { StoreFront } from '@/components/customer/StoreFront';

// The menu changes whenever the admin edits an item, so this page is always
// rendered fresh. Reads go straight to Prisma — no API hop for GETs.
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

async function loadShop(slug: string) {
  return prisma.shop.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      type: true,
      phone: true,
      address: true,
      upiId: true,
      active: true,
      ownerName: true,
      imageData: true,
      ownerImageData: true,
      items: {
        // Starter-catalogue rows land at Re 1 and out of stock so the owner can
        // set a real price before anyone sees them. Until they do, they are not
        // a product — showing a customer "Atta — Rs 1 — out of stock" makes a
        // working shop look broken.
        where: { NOT: { price: { lte: 1 }, inStock: false } },
        orderBy: [{ category: 'asc' }, { inStock: 'desc' }, { name: 'asc' }],
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
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug }, select: { name: true } });
  return {
    title: shop ? `${shop.name} — Order on WhatsApp` : 'Shop not found',
  };
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await loadShop(slug);

  if (!shop) notFound();

  if (!shop.active) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{shop.name}</h1>
        <p className="mt-2 text-slate-600">
          This shop is not accepting orders right now. / এই দোকান এখন অর্ডার নিচ্ছে না। / यह दुकान अभी
          ऑर्डर नहीं ले रही है।
        </p>
      </main>
    );
  }

  const { items, active: _active, ...summary } = shop;
  return <StoreFront shop={summary} items={items} />;
}
