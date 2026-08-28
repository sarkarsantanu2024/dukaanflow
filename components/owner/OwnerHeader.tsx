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
import { OrderBell } from './OrderBell';
import { OwnerInstallButton } from './OwnerInstallButton';
import { ownerDict } from '@/lib/owner-i18n';
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
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
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
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800"
            >
              {shopName.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <h1 className="truncate font-bold text-slate-900">{shopName}</h1>
        </Link>

        {/* First on the right, before the language and install controls: it is
            the only thing on this bar that ever changes on its own, and it has
            to be reachable from whichever screen the owner is standing on. */}
        <OrderBell slug={slug} locale={locale} />

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

        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          aria-label={t.signOut}
          title={t.signOut}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
        >
          {busy ? <Spinner className="h-4 w-4" /> : <SignOutIcon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
