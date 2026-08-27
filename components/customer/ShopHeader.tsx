'use client';

/**
 * The top of a shop's page: the product's bar, then the shop's own card.
 *
 * This used to be a 300px slab of saturated brand green. It was striking, and
 * it made the storefront look like a different product from the console and the
 * owner's app — those are light, neutral and card-based, with green reserved
 * for things you can act on. One shared colour is not one design system.
 *
 * So the grammar is now the same everywhere: a white bar with a hairline under
 * it, a slate page behind, white cards with the same radius and shadow, and
 * green only on the mark and the buttons. The shop still leads the page — it is
 * the first and biggest thing on it — but as a card in the product's language
 * rather than an exception to it.
 */

import { SHOP_TYPE_LABELS } from '@/lib/validators';
import { upiPayUrl } from '@/lib/qr';
import { LangToggle } from './LangToggle';
import { BrandMark } from '@/components/ui/BrandMark';
import { PinIcon, RupeeIcon, WhatsAppIcon } from '@/components/ui/Icon';
import type { Locale } from '@/lib/i18n';

export type ShopSummary = {
  name: string;
  slug: string;
  type: keyof typeof SHOP_TYPE_LABELS;
  phone: string;
  address: string;
  upiId: string;
  ownerName: string;
  imageData: string;
  ownerImageData: string;
};

export function ShopHeader({
  shop,
  locale,
  onLocaleChange,
  payLabel,
}: {
  shop: ShopSummary;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  payLabel: string;
}) {
  return (
    <>
      {/* The same bar the console has: white, sticky, hairline beneath. This
          one line does most of the work of making the page feel like part of
          the product a shopkeeper was shown. */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <BrandMark className="text-sm" />
          <span className="ml-auto hidden text-xs text-slate-400 sm:inline">
            Scan → Select → WhatsApp
          </span>
          <LangToggle value={locale} onChange={onLocaleChange} />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-start gap-4">
            {/* A shopper scanning a code on a counter should see the shop they
                are standing in front of — it is how they know the QR was the
                right one. */}
            {shop.ownerImageData && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.ownerImageData}
                alt={shop.ownerName || shop.name}
                className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-brand-100"
              />
            )}

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                {shop.name}
              </h1>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {SHOP_TYPE_LABELS[shop.type]}
                {shop.ownerName && ` · ${shop.ownerName}`}
              </p>

              {shop.address && (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
                  <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>{shop.address}</span>
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {/* Green because these are the two things a shopper can do
                    here besides ordering — accent earns its place on actions. */}
                <a
                  href={`https://wa.me/91${shop.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-brand-100 transition hover:bg-brand-100"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  +91 {shop.phone}
                </a>
                {shop.upiId && (
                  <a
                    href={upiPayUrl(shop.upiId, shop.name)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    <RupeeIcon className="h-4 w-4" />
                    {payLabel}
                  </a>
                )}
              </div>
            </div>

            {/* On a laptop the shopfront photo sits beside the details rather
                than pushing the menu down the page. */}
            {shop.imageData && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.imageData}
                alt={shop.name}
                className="hidden h-28 w-44 shrink-0 rounded-xl object-cover ring-1 ring-slate-200 lg:block"
              />
            )}
          </div>

          {shop.imageData && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.imageData}
              alt={shop.name}
              className="mt-4 h-36 w-full rounded-xl object-cover ring-1 ring-slate-200 lg:hidden"
            />
          )}
        </div>
      </div>
    </>
  );
}
