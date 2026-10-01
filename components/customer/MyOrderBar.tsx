'use client';

/**
 * THE WAY BACK TO AN ORDER (2026-10-01, by request).
 *
 * The order page lost its back arrow, so a customer who leaves it with the
 * phone's back button lands on the shop with no way back to the order they
 * just placed. This bar, fixed to the bottom of the shop page, is that way
 * back: this phone's latest order at this shop, while it is still being
 * prepared or was finished in the last few hours.
 *
 * Which orders this phone placed is kept on the phone (`lib/my-orders.ts`);
 * where each one is comes from `/api/order/status`, the same answer the bell
 * reads.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRightIcon, CloseIcon } from '@/components/ui/Icon';
import { readMyOrders } from '@/lib/my-orders';
import { isWaiting, type OrderStatus } from '@/lib/order-status';
import { dict, type Locale } from '@/lib/i18n';

/** A finished order is still offered for this long, for the bill. */
const DONE_SHOWN_MS = 6 * 60 * 60 * 1000;

type Latest = { id: string; status: OrderStatus };

export function MyOrderBar({ slug, locale, refreshKey }: { slug: string; locale: Locale; refreshKey?: string }) {
  const t = dict(locale);
  const [latest, setLatest] = useState<Latest | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const mine = readMyOrders().filter((order) => order.slug === slug);
    if (mine.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/order/status?ids=${mine.map((order) => order.id).join(',')}`);
        if (!response.ok) return;
        const payload = (await response.json()) as {
          orders?: { id: string; status: OrderStatus; createdAt: string; completedAt: string | null }[];
        };
        const now = Date.now();
        const shown = (payload.orders ?? [])
          .filter(
            (order) =>
              isWaiting(order.status) ||
              (order.status === 'COMPLETED' &&
                now - new Date(order.completedAt ?? order.createdAt).getTime() < DONE_SHOWN_MS),
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        if (!cancelled) setLatest(shown ? { id: shown.id, status: shown.status } : null);
      } catch {
        // No signal: no bar, and the bell still has the order.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, refreshKey]);

  if (!latest || hidden) return null;

  return (
    <div className="pointer-events-auto flex w-full max-w-lg items-center gap-1 self-center rounded-2xl bg-brand-700 p-1 pl-1 text-white shadow-float">
      {/* The whole bar is the way in; the arrow says so. */}
      <Link
        href={`/track/${latest.id}`}
        aria-label={t.seeOrders}
        className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{t.seeOrders}</span>
          <span className="block truncate text-xs text-brand-100">
            {latest.status === 'COMPLETED' ? t.trackStateDone : t.trackStatePreparing}
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-800">
          <ChevronRightIcon className="h-5 w-5" />
        </span>
      </Link>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label={t.saveShopLater}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/75 hover:bg-white/10 hover:text-white"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
