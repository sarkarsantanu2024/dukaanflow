'use client';

/**
 * The owner app's top bar — the same bar the shop page has.
 *
 * It used to be a green chrome strip carrying the owner's photo and their
 * shop's name. Both were decoration by the second visit: an owner knows whose
 * shop they are in, and the name was already on every screen they had just come
 * from. What they actually reach for up here is the language switch, the
 * install button and the way out, and those were being squeezed by a name.
 *
 * So it is now the product's bar: white, sticky, hairline under it, the mark on
 * the left and the controls on the right — identical to what a customer sees on
 * the shop page. One product, one header.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { SignOutIcon } from '@/components/ui/Icon';
import { BrandMark } from '@/components/ui/BrandMark';
import { Spinner } from '@/components/ui/Spinner';
import { OwnerInstallButton } from './OwnerInstallButton';
import { ownerDict } from '@/lib/owner-i18n';
import { LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n';

export function OwnerHeader({ slug, locale }: { slug: string; locale: Locale }) {
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
    </header>
  );
}
