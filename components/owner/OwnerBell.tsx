'use client';

/**
 * THE OWNER'S BELL: NEW ORDERS, ON EVERY SCREEN.
 *
 * An order that arrived while the owner was on the till or the khata used to
 * be found only by opening Orders. The bell sits in the header of every owner
 * screen and lists the orders still waiting, newest first. Tapping one opens
 * Orders with that order selected.
 *
 * NOTHING IS STORED ON THE SERVER. The list is the shop's waiting orders, read
 * from the orders themselves; which of them this phone has read or removed is
 * kept on this phone only. Removing one hides it here and does nothing to the
 * order.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellMenu, readStore, writeStore, type BellEntry } from '@/components/ui/BellMenu';
import { formatPaise } from '@/lib/money';
import { formatClock, formatDay, formatIsoDay } from '@/lib/time';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

type BellOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  orderType: 'DELIVERY' | 'PICKUP';
  totalAmountPaise: number;
  createdAt: string;
};

/** How often an open screen asks for new orders. The orders screen's own rate. */
const POLL_MS = 20_000;

export function OwnerBell({ slug, locale }: { slug: string; locale: Locale }) {
  const t = ownerDict(locale);
  const router = useRouter();
  const seenKey = `halkhata:bell:seen:${slug}`;
  const removedKey = `halkhata:bell:removed:${slug}`;

  const [orders, setOrders] = useState<BellOrder[]>([]);
  /** Newest order time this phone has seen in the list, ISO. */
  const [seenUpTo, setSeenUpTo] = useState('');
  const [removed, setRemoved] = useState<string[]>([]);

  useEffect(() => {
    setSeenUpTo(readStore(seenKey, ''));
    setRemoved(readStore<string[]>(removedKey, []));
  }, [seenKey, removedKey]);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/owner/${slug}/notifications`, { cache: 'no-store' });
      if (!response.ok) return;
      const payload = (await response.json()) as { orders?: BellOrder[] };
      setOrders(payload.orders ?? []);
    } catch {
      // Offline: keep what is showing.
    }
  }, [slug]);

  // Polled while the screen is being looked at, and at once when it comes back.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(load, POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void load();
        start();
      } else {
        stop();
      }
    };
    void load();
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);

  const today = formatIsoDay(new Date());
  const shown = useMemo(() => orders.filter((order) => !removed.includes(order.id)), [orders, removed]);

  const entries: BellEntry[] = shown.map((order) => ({
    key: order.id,
    title: `${order.customerName || order.customerPhone} · ${formatPaise(order.totalAmountPaise)}`,
    detail: `${t.bellNewOrder} · ${order.customerPhone} · ${order.orderType === 'DELIVERY' ? t.delivery : t.pickup}`,
    when:
      formatIsoDay(order.createdAt) === today ? formatClock(order.createdAt) : formatDay(order.createdAt),
    unread: order.createdAt > seenUpTo,
    onOpen: () => router.push(`/owner/${slug}/orders?order=${order.id}`),
  }));

  function markRead() {
    const newest = shown[0]?.createdAt;
    if (newest && newest > seenUpTo) {
      setSeenUpTo(newest);
      writeStore(seenKey, newest);
    }
  }

  function remove(keys: string[]) {
    // Kept only for orders still in the list, so the phone's store stays small.
    const next = [...new Set([...removed, ...keys])].filter((id) =>
      orders.some((order) => order.id === id),
    );
    setRemoved(next);
    writeStore(removedKey, next);
  }

  return (
    <BellMenu
      entries={entries}
      labels={{ title: t.bellTitle, empty: t.bellEmpty, clearAll: t.bellClearAll, remove: t.bellRemove }}
      onOpened={markRead}
      onRemove={(key) => remove([key])}
      onClearAll={() => remove(shown.map((order) => order.id))}
      tone="light"
    />
  );
}
