import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { OwnerLoginForm } from '@/components/owner/OwnerLoginForm';
import { BrandMark } from '@/components/ui/BrandMark';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: `${BRAND_NAME} — Shop sign in` };

export default async function OwnerLoginPage({ params }: PageProps) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug },
    // The owner's very first screen was English regardless of the shop's
    // language, which is a strange way to greet someone the rest of the app
    // then speaks Bengali to.
    select: { name: true, ownerPinHash: true, locale: true, ownerImageData: true },
  });
  if (!shop) notFound();

  const locale = shop.locale as Locale;
  const t = ownerDict(locale);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10">
      {shop.ownerPinHash ? (
        <OwnerLoginForm
          slug={slug}
          shopName={shop.name}
          ownerImage={shop.ownerImageData}
          locale={locale}
        />
      ) : (
        // The same head as the sign-in card: an owner who has no PIN yet is
        // still arriving at their own shop, and a bare line of text reads like
        // an error page from somewhere else.
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
          <BrandMark className="text-sm" />
          <div className="mt-4 flex items-center gap-3">
            {shop.ownerImageData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.ownerImageData}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-xl font-bold text-brand-800"
              >
                {shop.name.trim().charAt(0).toUpperCase()}
              </span>
            )}
            <h1 className="min-w-0 text-2xl font-bold leading-tight text-slate-900">{shop.name}</h1>
          </div>
          <p className="mt-2 text-sm text-slate-600">{t.pinNotSetUp}</p>
        </div>
      )}
    </main>
  );
}
