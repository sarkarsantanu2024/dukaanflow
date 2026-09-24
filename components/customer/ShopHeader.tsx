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
import { CustomerBell } from './CustomerBell';
import { upiPayUrl } from '@/lib/qr';
import { LangToggle } from './LangToggle';
import { BrandMark } from '@/components/ui/BrandMark';
import { AlponaMotif } from '@/components/ui/Ornament';
import { formatClockRange } from '@/lib/hours';
import { ClockIcon, PinIcon, RupeeIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { dict, type Locale } from '@/lib/i18n';

export type ShopSummary = {
  name: string;
  slug: string;
  type: keyof typeof SHOP_TYPE_LABELS;
  phone: string;
  address: string;
  upiId: string;
  ownerName: string;
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
      {/* THE SAME BAR THE OWNER HAS. A shopper who is handed a QR code and an
          owner who is handed a phone should be looking at one product, and the
          top bar is the largest single thing that says so. `#00546b` carries
          white at 8.5:1, so everything on it is light. */}
      {/* NOT STICKY ON THE SHOPPER'S PAGE, and that is the difference between
          the two apps. The owner reaches for the language switch and the
          shutter mid-task, so their bar stays pinned. A shopper reads a list
          and orders from it: past the first screen the only thing they want
          held is the search, and a brand bar above it costs 52px of a 667px
          phone for a logo they have already seen.

          IT IS PURE CSS, WHICH IS WHY IT IS SMOOTH. No scroll listener, no
          transform, nothing animating — the bar is ordinary content that
          scrolls off, and the strip below it is `sticky`. The owner's app had a
          version of this that slid the header out of the way on a scroll
          handler; it stuttered on every phone it was tried on and was removed.
          This one cannot stutter, because nothing is being driven. */}
      <header className="z-20 bg-chrome">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          {/* Home is this shop, not the landing page: a customer tapping the
              mark means "back to the shop", not "tell me about Halkhata". */}
          <BrandMark href={`/shop/${shop.slug}`} tone="dark" className="text-sm" />
          {/* The retired tagline used to sit here. "Scan → Select → Order" is
              a true description of the product and a sentence every competitor
              can write without changing a word; the landing page stopped
              leading with it long before this bar did. */}
          <span lang="bn" className="hidden text-xs text-white/60 sm:inline">
            দোকান সাজান মুখে বলে
          </span>
          {/* The push lives on the toggle itself, not on the tagline. The
              tagline is hidden below `sm`, and with `ml-auto` on it the toggle
              simply sat against the logo on every phone — which is where this
              page is actually read. */}
          {/* The shop's updates on this phone's orders — see `CustomerBell`. */}
          <div className="ml-auto flex items-center gap-1">
            <CustomerBell locale={locale} />
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
        {/* THE DARK CARD, the same `hero` the owner's money panel wears.
            It is the one object on the storefront that is about the SHOP rather
            than about the goods, and on a page that is otherwise a light grid
            of item cards that distinction is worth a colour. It is also the
            first thing a stranger looks at when deciding whether to hand this
            shop money — a solid, deliberate object reads as a business; a pale
            card reads as a row in a list.

            Card-sized, which is the licence for a gradient here — see `hero`
            in the Tailwind config. Everything on it is therefore light. */}
        <div className="relative overflow-hidden rounded-2xl bg-hero p-3 shadow-float">
          {/* The same alpona the owner's money panel carries, at the same
              weight, so the two dark cards are recognisably one family rather
              than two things that happen to be the same colour. */}
          <AlponaMotif className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 text-white/10" />

          <div className="relative flex items-center gap-3">
            {/* BOTH PICTURES, IN THE SPACE OF ONE.
                The shopfront says "this is the shop you are standing in"; the
                owner's face says who the money is going to, and a shopper
                deciding whether to hand it over looks at a face. Stacking them
                as tile and badge keeps the pair inside 64px — a row each, as
                it was before, cost a third of the screen. */}
            <span className="relative shrink-0">
              {shop.ownerImageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shop.ownerImageData}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover ring-1 ring-white/25"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/15 text-2xl font-medium text-white ring-1 ring-white/20"
                >
                  {shop.name.trim().charAt(0).toUpperCase()}
                </span>
              )}

            </span>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-medium leading-tight text-white">
                {shop.name}
              </h1>
              <p className="truncate text-xs text-brand-100">
                {dict(locale).shopTypes[shop.type]}
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
                className="inline-flex min-h-11 items-center text-xs font-medium tabular-nums text-white hover:text-brand-100"
              >
                +91 {shop.phone}
              </a>

              {(shop.address || hours) && (
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-brand-100">
                  {shop.address && (
                    <span className="flex min-w-0 items-center gap-1">
                      <PinIcon className="h-3.5 w-3.5 shrink-0 text-brand-200" />
                      <span className="truncate">{shop.address}</span>
                    </span>
                  )}
                  {hours && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5 shrink-0 text-brand-200" />
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
