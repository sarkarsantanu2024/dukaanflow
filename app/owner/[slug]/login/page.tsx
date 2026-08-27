import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { OwnerLoginForm } from '@/components/owner/OwnerLoginForm';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'DukaanFlow — Shop sign in' };

export default async function OwnerLoginPage({ params }: PageProps) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug },
    // The owner's very first screen was English regardless of the shop's
    // language, which is a strange way to greet someone the rest of the app
    // then speaks Bengali to.
    select: { name: true, ownerPinHash: true, locale: true },
  });
  if (!shop) notFound();

  const locale = shop.locale as Locale;
  const t = ownerDict(locale);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10">
      {shop.ownerPinHash ? (
        <OwnerLoginForm slug={slug} shopName={shop.name} locale={locale} />
      ) : (
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
          <h1 className="text-xl font-bold text-slate-900">{shop.name}</h1>
          <p className="mt-2 text-sm text-slate-600">{t.pinNotSetUp}</p>
        </div>
      )}
    </main>
  );
}
