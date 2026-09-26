'use client';

/**
 * THE BIG "NEW ORDER — TAP TO SEE" BAR.
 *
 * While an order waits that the owner has not looked at (`order-alarm`), this
 * covers the top of every owner screen: one full-width target, found by thumb
 * without reading a word. The bell in the header is a small icon, and an owner
 * who cannot read needs something large, lit and moving. One tap stops the
 * ringing and opens the order — the newest one when there are several.
 *
 * Over the header rather than under it, so it is there however far the owner
 * has scrolled. Not on the Orders screen: that screen is the order.
 */

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon, ChevronRightIcon } from '@/components/ui/Icon';
import { formatPaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';
import { alarmView, silenceOrderAlarm, subscribeAlarm } from './order-alarm';

export function NewOrderBar({ slug, locale, hidden }: { slug: string; locale: Locale; hidden: boolean }) {
  const t = ownerDict(locale);
  const router = useRouter();
  const view = useSyncExternalStore(subscribeAlarm, alarmView, () => null);
  if (hidden || !view || view.slug !== slug) return null;

  const what = view.count === 1 ? t.bellNewOrder : t.orderBarMany.replace('{n}', String(view.count));

  function open() {
    const target = view!.count === 1 ? `?order=${view!.newestId}` : '';
    silenceOrderAlarm();
    router.push(`/owner/${slug}/orders${target}`);
  }

  return (
    <button
      type="button"
      onClick={open}
      className="fixed inset-x-0 top-0 z-40 animate-fade-in bg-brand-600 pt-[env(safe-area-inset-top)] text-white shadow-float"
    >
      <span className="mx-auto flex min-h-[4.5rem] max-w-3xl items-center gap-3 px-4 py-3 text-left">
        {/* The ringing bell: the ripple is the one the mic uses for "live". */}
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <span aria-hidden className="absolute inset-0 animate-ripple rounded-full bg-white/60" />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-700">
            <BellIcon className="h-7 w-7" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold leading-tight">
            {what} · {formatPaise(view.totalPaise)}
          </span>
          <span className="block text-sm text-white/85">{t.orderBarTap}</span>
        </span>
        <ChevronRightIcon className="h-7 w-7 shrink-0" />
      </span>
    </button>
  );
}
