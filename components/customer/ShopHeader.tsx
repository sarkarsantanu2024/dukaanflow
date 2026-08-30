'use client';

/**
 * The top of a shop's page: the product's bar, then the shop's own card.
 *
 * This used to be a 300px slab of saturated brand green. It was striking, and
 * it made the storefront look like a different product from the console and the
 * owner's app — those are light, neutral and card-based, with green reserved
 * for things you can act on. One shared colour is not one design system.
 *
 * So the bar is the same one the console has — white, sticky, hairline under
 * it — and the page behind is the same slate.
 *
 * The shop's card is laid out the way a profile header is, and for a concrete
 * reason: THE PHOTOGRAPH CANNOT BE DESIGNED AROUND. It is taken on a shopkeeper's
 * phone, in whatever light, of whatever is in front of the shutter — bright sky
 * one time, a dark interior the next.
 *
 * Setting the name on top of it, which is the obvious thing to do, means either
 * darkening the photo until it is unreadable or letting white text land on a
 * white wall. Both were tried here and both were worse than the small thumbnail
 * they replaced.
 *
 * So the two are separated: the photo is a clean band across the top with
 * nothing over it, and the name, address, hours and actions sit below on white,
 * where they are legible no matter what the photo turns out to be. The owner's
 * face straddles the seam, which ties the halves together and puts the person
 * a shopper is about to buy from at the size of a face rather than an icon.
 */

import { SHOP_TYPE_LABELS } from '@/lib/validators';
import { upiPayUrl } from '@/lib/qr';
import { LangToggle } from './LangToggle';
import { BrandMark } from '@/components/ui/BrandMark';
import { formatClockRange } from '@/lib/hours';
import { ClockIcon, PinIcon, RupeeIcon, WhatsAppIcon } from '@/components/ui/Icon';
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
  /** Off means collection only — the checkout never offers delivery. */
  deliveryEnabled: boolean;
  /** "HH:MM" each, or blank when the shop has not said. */
  openTime: string;
  closeTime: string;
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
  const hours = formatClockRange(shop.openTime, shop.closeTime);

  return (
    <>
      {/* The same bar the console has: white, sticky, hairline beneath. This
          one line does most of the work of making the page feel like part of
          the product a shopkeeper was shown. */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <BrandMark className="text-sm" />
          <span className="ml-auto hidden text-xs text-slate-400 sm:inline">
            Scan → Select → Order
          </span>
          <LangToggle value={locale} onChange={onLocaleChange} />
        </div>
      </header>

      {/* The shopfront photo IS the card, not a thumbnail beside it.
          It was a 112×176 tile at the end of a row of text — the one thing on
          this page that tells a shopper standing at a counter that they scanned
          the right code, printed smaller than the phone number. Behind the
          name, at the width of the page, it does that job at a glance.

          A dark scrim, not a lighter photo: shop fronts are photographed on
          phones in every possible light, and white text over an unmodified one
          is legible on some and invisible on others. */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-card">
          {/* The shop front, unobstructed. No scrim, no text on it. */}
          {shop.imageData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.imageData}
              alt={shop.name}
              className="h-40 w-full object-cover sm:h-56"
            />
          ) : (
            // A shop with no photo still needs the band, or the avatar below
            // has nothing to overlap and the card starts with a bald margin.
            <div aria-hidden className="h-24 bg-chrome sm:h-28" />
          )}

          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            {/* The actions used to share this row. On a phone that left the
                shop's own name squeezed to "M." beside a full-width phone
                number — the one line that must never truncate, truncated by
                the one that could have wrapped. They sit below now, and only
                rejoin the row where there is width for both. */}
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              {/* Pulled up over the seam, and large. A shopper deciding whether
                  to hand money to a stranger looks at the face; at 56px it was
                  smaller than the phone number underneath it. */}
              {shop.ownerImageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shop.ownerImageData}
                  alt={shop.ownerName || shop.name}
                  className="-mt-10 h-24 w-24 shrink-0 rounded-2xl object-cover ring-4 ring-white sm:-mt-12 sm:h-28 sm:w-28"
                />
              ) : (
                <span
                  aria-hidden
                  className="-mt-10 flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-3xl font-bold text-brand-800 ring-4 ring-white sm:-mt-12 sm:h-28 sm:w-28"
                >
                  {shop.name.trim().charAt(0).toUpperCase()}
                </span>
              )}

              <div className="min-w-0 flex-1 pt-1">
                <h1 className="truncate text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                  {shop.name}
                </h1>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {SHOP_TYPE_LABELS[shop.type]}
                  {shop.ownerName && ` · ${shop.ownerName}`}
                </p>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <a
                  href={`https://wa.me/91${shop.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  +91 {shop.phone}
                </a>
                {shop.upiId && (
                  <a
                    href={upiPayUrl(shop.upiId, shop.name)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    <RupeeIcon className="h-4 w-4" />
                    {payLabel}
                  </a>
                )}
              </div>
            </div>

            {/* Where and when, on one line under the identity — the two things
                a shopper checks before setting out, and neither is worth its
                own row. */}
            {(shop.address || hours) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
                {shop.address && (
                  <p className="flex min-w-0 items-start gap-1.5">
                    <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0">{shop.address}</span>
                  </p>
                )}
                {hours && (
                  <p className="flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="tabular-nums">{hours}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
