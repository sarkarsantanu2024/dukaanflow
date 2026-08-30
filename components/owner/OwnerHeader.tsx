'use client';

/**
 * The owner app's top bar.
 *
 * Everything here competed for a phone's width: the shop name, three language
 * buttons spelled out, and "Sign out" as a word — on a Bengali screen that last
 * one reads "সাইন আউট" and takes a third of the row on its own. Words became
 * icons, the three language buttons became one dropdown, and what the space
 * bought is the thing that should have been there all along: the owner's own
 * face beside their shop's name, so the app looks like theirs.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { SignOutIcon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import { OwnerInstallButton } from './OwnerInstallButton';
import { ownerDict } from '@/lib/owner-i18n';
import { WhatsAppIcon } from '@/components/ui/Icon';
import { LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n';

export function OwnerHeader({
  slug,
  shopName,
  ownerImage,
  locale,
}: {
  slug: string;
  shopName: string;
  /** The owner's photo, when the operator has set one. */
  ownerImage?: string;
  locale: Locale;
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);
  const [busy, setBusy] = useState(false);

  const support = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '';
  const helpUrl = `https://wa.me/${support}?text=${encodeURIComponent(
    `DukaanFlow — ${shopName} (${slug}). `,
  )}`;

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
    <header className="sticky top-0 z-10 bg-chrome text-white shadow-chrome">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2 sm:px-4">
        <Link
          href={`/owner/${slug}/inventory`}
          className="mr-auto flex min-w-0 items-center gap-2.5"
        >
          {ownerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ownerImage}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/50"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white ring-1 ring-white/30"
            >
              {shopName.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <h1 className="truncate font-bold text-white">{shopName}</h1>
        </Link>

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
          // Kept a solid white control rather than a translucent one: a native
          // select paints its own dropdown list, and a light-on-glass trigger
          // would open a white menu of white text on some Android browsers.
          className="h-9 shrink-0 rounded-lg border border-transparent bg-white px-2 text-sm font-semibold text-brand-800 shadow-sm"
        >
          {LOCALES.map((option) => (
            <option key={option} value={option}>
              {LOCALE_LABELS[option]}
            </option>
          ))}
        </select>

        {/* Always here, on every screen, not only when something is wrong.
            An owner who cannot find an item, or whose price will not save, has
            one question and no way to ask it — and the shop they are standing
            in is open while they look for one. The message arrives already
            saying which shop it is about, so the operator does not have to
            start by asking. */}
        {support && (
          <a
            href={helpUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={t.blockHelp}
            title={t.blockHelp}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
        )}

        <OwnerInstallButton slug={slug} label={t.installNow} />

        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          aria-label={t.signOut}
          title={t.signOut}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
        >
          {busy ? <Spinner className="h-4 w-4" /> : <SignOutIcon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
