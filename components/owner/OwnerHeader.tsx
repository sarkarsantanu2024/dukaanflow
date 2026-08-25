'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { ownerDict } from '@/lib/owner-i18n';
import { LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n';

export function OwnerHeader({
  slug,
  shopName,
  locale,
}: {
  slug: string;
  shopName: string;
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
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2.5">
        <Link href={`/owner/${slug}/sell`} className="mr-auto min-w-0">
          <h1 className="truncate font-bold text-slate-900">{shopName}</h1>
        </Link>

        <div
          role="group"
          aria-label={t.language}
          className="flex shrink-0 overflow-hidden rounded-full border border-slate-300"
        >
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeLocale(option)}
              aria-pressed={locale === option}
              className={
                locale === option
                  ? 'bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white'
                  : 'px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50'
              }
            >
              {LOCALE_LABELS[option]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
        >
          {t.signOut}
        </button>
      </div>
    </header>
  );
}
