'use client';

/**
 * The owner app's top bar — the same bar the shop page has, with the shop's own
 * name and picture under it.
 *
 * THE CONTROLS AND THE IDENTITY ARE TWO ROWS, NOT ONE, and that is the whole
 * design here. They were one row once: a green chrome strip carrying the photo,
 * the name, the language switch, the install button and the way out, all
 * fighting for the width of a cheap phone. The name was dropped to make room —
 * on the reasoning that an owner knows whose shop they are in, which is true of
 * the owner and false of everybody else who holds that phone. A shopkeeper hands
 * it to a son, a helper, an operator on a support call; a demo phone carries
 * four shops; and an owner with two shops has no way at all to tell which one
 * they just signed into.
 *
 * So both are here and neither is squeezed. The top row is the product's bar,
 * unchanged: white, sticky, hairline under it, the mark on the left and the
 * controls on the right. Underneath it, on the same sticky block, one short
 * strip with the owner's picture and the shop's name — the same pairing the
 * customer sees on the storefront, at the size of a line rather than a card.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { SignOutIcon } from '@/components/ui/Icon';
import { BrandMark } from '@/components/ui/BrandMark';
import { Spinner } from '@/components/ui/Spinner';
import { OwnerInstallButton } from './OwnerInstallButton';
import { ownerDict } from '@/lib/owner-i18n';
import { LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n';

export function OwnerHeader({
  slug,
  locale,
  shopName,
  ownerImageData,
}: {
  slug: string;
  locale: Locale;
  /** The shop this owner is signed into, shown on every screen. */
  shopName: string;
  /**
   * The owner's photo as a data URL, or '' when they have not set one. Blank
   * falls back to the shop's initial on a brand tile — the same stand-in the
   * storefront uses, so one shop does not have two different faces.
   */
  ownerImageData: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch('/api/owner/logout', { method: 'POST' });
      router.replace(`/owner/${slug}/login`);
      router.refresh();
    } catch {
      push(t.networkError, 'error');
      setBusy(false);
    }
  }

  /**
   * The owner's language is stored on the shop, so it follows them to any
   * phone they sign in from rather than living in one browser's storage.
   */
  async function changeLocale(next: Locale) {
    try {
      await fetch(`/api/owner/${slug}/locale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-1.5 px-3 py-2 sm:px-4">
        {/* The mark leads back to the item list, which is where an owner starts
            their day. */}
        <BrandMark href={`/owner/${slug}/inventory`} className="mr-auto text-sm" />

        {/* One control instead of three buttons. A native select is also the
            one thing on this bar that a shopkeeper's phone already knows how
            to render large and legible. */}
        <label className="sr-only" htmlFor="owner-language">
          {t.language}
        </label>
        <select
          id="owner-language"
          value={locale}
          onChange={(event) => changeLocale(event.target.value as Locale)}
          className="h-9 shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-700"
        >
          {LOCALES.map((option) => (
            <option key={option} value={option}>
              {LOCALE_LABELS[option]}
            </option>
          ))}
        </select>

        <OwnerInstallButton slug={slug} label={t.installNow} />

        {/* THE ONLY PERMANENT WAY TO PAY US.
            PlanBanner covers the last week of a trial and a catalogue near its
            limit, and the roadblock covers an owner already locked out — but a
            shop comfortably inside its plan sees neither, and until this button
            existed such an owner had no route to a payment screen at all. It is
            a word rather than an icon because "where do I pay" is a question
            somebody asks in words, and a rupee glyph on a green bar reads as a
            price, not a link. */}
        <Link
          href={`/owner/${slug}/renew`}
          className="inline-flex h-9 shrink-0 items-center rounded-lg px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          {t.renewOpen}
        </Link>

        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          aria-label={t.signOut}
          title={t.signOut}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
        >
          {busy ? <Spinner className="h-4 w-4" /> : <SignOutIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* WHOSE SHOP THIS IS.
          Its own band under the controls rather than a squeeze beside them, so
          the name may run the full width of a 375px phone and the buttons above
          keep every pixel they had.

          THE PROPORTIONS ARE THE DESIGN HERE, and the first attempt got them
          wrong: a 28px circle and a small grey name on a white row, which read
          as a stray caption somebody had forgotten to delete rather than as the
          title of the app you are in. The fixes are all one idea — make it look
          deliberate:

          - A tinted ground. White under white is not a band, it is a gap. The
            slate tint says the header is two parts of one block and ends here.
          - A SQUARE tile, not a circle. This photo is a shopfront as often as
            it is a face, and a circle crops a shutter and a signboard into a
            meaningless dot. It is the same rounded tile the customer sees on
            the storefront card — one shop, one picture, one shape.
          - Big enough to see: 36px, the size at which a face is a face.
          - The name in the weight a title is set in, not the weight a footnote
            is. It is the most important word on the screen for anybody holding
            this phone who is not its owner. */}
      <div className="border-t border-slate-200/70 bg-slate-50">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-3 py-2 sm:px-4">
          {ownerImageData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ownerImageData}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-base font-bold text-brand-800"
            >
              {shopName.trim().charAt(0).toUpperCase()}
            </span>
          )}
          {/* A size ABOVE the wordmark sitting directly over it. Set level with
              "Halkhata" the two read as a pair of competing titles and the eye
              picks neither; a step up settles it, and the right one wins — in
              the owner's own app the shop is the subject and the product is the
              stationery it is printed on. */}
          <span className="truncate text-base font-bold leading-tight text-slate-900">
            {shopName}
          </span>
        </div>
      </div>
    </header>
  );
}
