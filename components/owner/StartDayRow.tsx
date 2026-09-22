'use client';

/**
 * The top of the home, and the start of the day: today's cash, and the way to
 * the till, side by side.
 *
 * The opening float used to sit inside the takings panel with its own "start
 * the day" button. It belongs at the very top instead — it is the first thing
 * an owner does on opening up — and it no longer needs a button of its own: the
 * amount saves when the box loses focus, and the one button on this row is the
 * one an owner actually wants next, "বিক্রি করুন". Typing the cash and tapping
 * sell are the morning, in one row.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CartIcon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { handledExpiredSession } from './sessionGuard';
import { paiseToInput, parsePaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';
import type { Drawer } from '@/lib/takings';

export function StartDayRow({
  slug,
  drawer,
  locale,
}: {
  slug: string;
  /** Today's drawer, so a float already set for the day shows in the box. */
  drawer: Drawer | null;
  locale: Locale;
}) {
  const t = ownerDict(locale);
  const router = useRouter();
  const { push } = useToast();
  const [cash, setCash] = useState(drawer ? paiseToInput(drawer.openingPaise) : '');
  const [busy, setBusy] = useState(false);

  /** Saves the opening float, on blur or on the way to the till. Silent on a
   *  blank box: an owner who has not typed anything has not asked to save. */
  async function saveOpening() {
    const value = parsePaise(cash);
    if (value === null) return;
    if (drawer && value === drawer.openingPaise) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingPaise: value }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;
      if (response.ok) {
        push(t.drawerStarted, 'success');
        router.refresh();
      } else {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        push(payload.error ?? t.networkError, 'error');
      }
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-glass-edge bg-glass p-4 shadow-raised">
      <p className="font-semibold text-slate-900">{t.drawerStartTitle}</p>
      <p className="mt-0.5 text-sm text-slate-600">{t.drawerStartHint}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
          <input
            inputMode="decimal"
            value={cash}
            onChange={(event) => setCash(event.target.value)}
            onBlur={saveOpening}
            disabled={busy}
            aria-label={t.drawerStartTitle}
            className="h-11 w-full rounded-xl border border-brand-200 bg-sunk pl-6 pr-2 text-sm font-medium tabular-nums"
          />
        </label>
        <Link
          href={`/owner/${slug}/sell`}
          onClick={saveOpening}
          className="btn-ring flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium text-white shadow-raised transition hover:brightness-110 active:scale-[0.99] [--ring-fill:theme(colors.brand.600)]"
        >
          <CartIcon className="h-5 w-5" />
          {t.todaySellNow}
        </Link>
      </div>
    </div>
  );
}
