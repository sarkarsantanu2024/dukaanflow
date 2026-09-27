'use client';

/**
 * THE BIG "YOUR ORDER CHANGED — TAP TO SEE" BAR.
 *
 * While the shop's news about an order waits unseen (`customer-alarm`), this
 * covers the top of the shop page and the order page: one full-width target,
 * lit and moving, found without reading the small bell. One tap stops the
 * ringing and opens that order — or, for an order the shop could not take, the
 * shop, since that order's page is gone.
 *
 * Portalled to <body>: the headers it would otherwise sit in start stacking
 * contexts that a fixed bar cannot escape.
 */

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { BellIcon, ChevronRightIcon } from '@/components/ui/Icon';
import { formatPaise } from '@/lib/money';
import { dict, type Locale } from '@/lib/i18n';
import { customerAlarmPending, newsHref, silenceCustomerAlarm, subscribeCustomerAlarm } from './customer-alarm';

export function CustomerNewsBar({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const router = useRouter();
  const pending = useSyncExternalStore(subscribeCustomerAlarm, customerAlarmPending, () => null);
  if (!pending || typeof document === 'undefined') return null;

  const newest = pending[pending.length - 1]!;
  const words = { changed: t.bellChanged, done: t.bellDone, cancelled: t.bellCancelled };
  const title = pending.length === 1 ? words[newest.kind] : t.newsBarMany.replace('{n}', String(pending.length));
  const detail = [
    pending.length === 1 ? newest.shopName : '',
    pending.length === 1 && newest.kind === 'changed' && newest.totalPaise !== null ? formatPaise(newest.totalPaise) : '',
    t.newsBarTap,
  ]
    .filter(Boolean)
    .join(' · ');

  function open() {
    silenceCustomerAlarm();
    router.push(newsHref(newest));
  }

  return createPortal(
    <button
      type="button"
      onClick={open}
      className="fixed inset-x-0 top-0 z-40 animate-fade-in bg-brand-600 pt-[env(safe-area-inset-top)] text-white shadow-float"
    >
      <span className="mx-auto flex min-h-[4.5rem] max-w-3xl items-center gap-3 px-4 py-3 text-left">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <span aria-hidden className="absolute inset-0 animate-ripple rounded-full bg-white/60" />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-700">
            <BellIcon className="h-7 w-7" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold leading-tight">{title}</span>
          <span className="block truncate text-sm text-white/85">{detail}</span>
        </span>
        <ChevronRightIcon className="h-7 w-7 shrink-0" />
      </span>
    </button>,
    document.body,
  );
}
