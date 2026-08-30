'use client';

/**
 * The shop owner's whole sign-in: six digits, on a phone, at the counter.
 * No email, no password to forget — a lost PIN is reissued by the Super Admin.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/ui/BrandMark';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export function OwnerLoginForm({
  slug,
  shopName,
  ownerImage,
  locale,
}: {
  slug: string;
  shopName: string;
  /** The owner's own photo as a data URL, or blank. */
  ownerImage: string;
  locale: Locale;
}) {
  const router = useRouter();
  const t = ownerDict(locale);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await fetch(`/api/owner/${slug}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? t.pinWrong);
        setPin('');
        return;
      }

      router.replace(`/owner/${slug}`);
      router.refresh();
    } catch {
      setError(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
      {/* The product's own mark, not a word in small caps. This is the first
          screen an owner ever opens, usually from a WhatsApp link, and it has
          to look like the thing they were shown at their counter. */}
      <BrandMark className="text-sm" />

      {/* Their own face beside their own shop's name. An owner arriving here
          from a link needs to know in one glance that this is THEIR shop and
          not another one on the same product — and the photograph says that
          faster than the name they share with two shops in the same lane. */}
      <div className="mt-4 flex items-center gap-3">
        {ownerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ownerImage}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-xl font-bold text-brand-800"
          >
            {shopName.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <h1 className="min-w-0 text-2xl font-bold leading-tight text-slate-900">{shopName}</h1>
      </div>

      <p className="mt-2 text-sm text-slate-500">{t.pinHint}</p>

      <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="owner-pin">
        {t.pinLabel}
      </label>
      <input
        id="owner-pin"
        // A numeric keypad, digits only, and no autofill history on a shared
        // counter phone.
        inputMode="numeric"
        autoComplete="off"
        type="password"
        maxLength={6}
        required
        value={pin}
        onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
        aria-invalid={error ? true : undefined}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-center text-2xl tracking-[0.5em] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <Button type="submit" fullWidth size="lg" className="mt-4" loading={busy}>
        {t.pinSignIn}
      </Button>
    </form>
  );
}
