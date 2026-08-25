import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { OwnerLoginForm } from '@/components/owner/OwnerLoginForm';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'DukaanFlow — Shop sign in' };

export default async function OwnerLoginPage({ params }: PageProps) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: { name: true, ownerPinHash: true },
  });
  if (!shop) notFound();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10">
      {shop.ownerPinHash ? (
        <OwnerLoginForm slug={slug} shopName={shop.name} />
      ) : (
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
          <h1 className="text-xl font-bold text-slate-900">{shop.name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Owner access has not been set up for this shop yet. Ask your DukaanFlow contact to issue
            a PIN.
          </p>
        </div>
      )}
    </main>
  );
}
