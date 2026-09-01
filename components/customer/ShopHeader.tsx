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
  /**
   * What delivery costs and the smallest order the shop will send, in PAISE.
   * All zero means free delivery with no minimum, which is what a shop that has
   * never opened the settings card goes on doing.
   */
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number;
  minOrderPaise: number;
  /** "HH:MM" each, or blank when the shop has not said. */
  openTime: string;
  closeTime: string;
  /**
   * The shopkeeper's own notice, already checked against today's date by the
   * server — blank means there is nothing running, not that nothing is stored.
   */
  notice: string;
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
          <span className="hidden text-xs text-slate-400 sm:inline">Scan → Select → Order</span>
          {/* The push lives on the toggle itself, not on the tagline. The
              tagline is hidden below `sm`, and with `ml-auto` on it the toggle
              simply sat against the logo on every phone — which is where this
              page is actually read. */}
          <div className="ml-auto">
            <LangToggle value={locale} onChange={onLocaleChange} />
          </div>
        </div>
      </header>

      {/* ONE COMPACT CARD, BECAUSE THIS IS A PHONE.
          This was a 160px shopfront banner, a 96px avatar hanging over the
          seam, the name, the type, a full-width phone pill and then a row of
          address and hours — the better part of a screen before the shopper
          saw a single price. Everything on it was true and none of it was what
          they came for.

          It is all still here, in a third of the height: the photo as a tile,
          the name and trade beside it, and where-and-when on one small line
          underneath. Contact is two round buttons, because a shopper taps
          WhatsApp — they do not read the number off the screen. */}
      <div className="mx-auto max-w-6xl px-4 pt-3">
        <div className="rounded-2xl bg-white p-3 shadow-card">
          <div className="flex items-center gap-3">
            {/* BOTH PICTURES, IN THE SPACE OF ONE.
                The shopfront says "this is the shop you are standing in"; the
                owner's face says who the money is going to, and a shopper
                deciding whether to hand it over looks at a face. Stacking them
                as tile and badge keeps the pair inside 64px — a row each, as
                it was before, cost a third of the screen. */}
            <span className="relative shrink-0">
              {shop.imageData || shop.ownerImageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shop.imageData || shop.ownerImageData}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-100 text-2xl font-bold text-brand-800"
                >
                  {shop.name.trim().charAt(0).toUpperCase()}
                </span>
              )}

              {/* Only when it is a second picture. With no shopfront photo the
                  owner's face is already the tile, and a badge of the same
                  photo over itself reads as a rendering fault. */}
              {shop.imageData && shop.ownerImageData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shop.ownerImageData}
                  alt=""
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full object-cover ring-2 ring-white"
                />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold leading-tight text-slate-900">
                {shop.name}
              </h1>
              <p className="truncate text-xs text-slate-500">
                {SHOP_TYPE_LABELS[shop.type]}
                {shop.ownerName && ` · ${shop.ownerName}`}
              </p>

              {/* Where and when, tucked under the name rather than given a
                  band of their own. */}
              {/* The number in words as well as behind the button. A shopper
                  who wants to ring from a landline, or save the shop to their
                  contacts, cannot read a number out of an icon. */}
              <a
                href={`tel:+91${shop.phone}`}
                // A 16px-tall tap target is a number you can read and cannot
                // hit. The padding grows the target without growing the text.
                className="inline-flex min-h-11 items-center text-xs font-semibold tabular-nums text-slate-600 hover:text-brand-700"
              >
                +91 {shop.phone}
              </a>

              {(shop.address || hours) && (
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  {shop.address && (
                    <span className="flex min-w-0 items-center gap-1">
                      <PinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{shop.address}</span>
                    </span>
                  )}
                  {hours && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="tabular-nums">{hours}</span>
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Round, thumb-sized, and labelled for a screen reader. The number
                was printed in full across a pill the width of the card; nobody
                dials it by reading it off a page that can dial it. */}
            <div className="flex shrink-0 flex-col gap-1.5">
              <a
                href={`https://wa.me/91${shop.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp +91 ${shop.phone}`}
                title={`+91 ${shop.phone}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:brightness-95"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
              {shop.upiId && (
                <a
                  href={upiPayUrl(shop.upiId, shop.name)}
                  aria-label={payLabel}
                  title={payLabel}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                >
                  <RupeeIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* The shopkeeper's own words to their customers — "no delivery this
            week", "puja orders close Friday".

            Below the shop's card rather than above it: a shopper who has just
            scanned a code needs to see whose shop this is first, and a strip of
            amber above the name would read as an error banner. Below, and in
            the shop's own voice, it reads as a note on the door. */}
        {shop.notice && (
          <p className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-base font-medium text-amber-900">
            {shop.notice}
          </p>
        )}
      </div>
    </>
  );
}
