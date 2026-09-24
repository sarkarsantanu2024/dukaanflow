'use client';

/**
 * THE CUSTOMER'S BELL: WHAT THE SHOP DID WITH THEIR ORDERS.
 *
 * Three things, the same three the customer's phone is alerted about: the
 * shop changed the order, could not take it, or finished it with the bill on
 * WhatsApp. A customer who missed the WhatsApp message had nowhere in the app
 * to see it. "The shop has your order" is left out, by request: it was news
 * to nobody who had just placed it. Tapping one opens that order.
 *
 * NOTHING IS STORED ON THE SERVER. The orders are remembered on this phone
 * (`lib/my-orders.ts`), their state is read from the orders themselves, and
 * what has been read or removed is kept on this phone only.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellMenu, readStore, writeStore, type BellEntry } from '@/components/ui/BellMenu';
import { readMyOrders } from '@/lib/my-orders';
import { formatPaise } from '@/lib/money';
import { formatClock, formatDay, formatIsoDay } from '@/lib/time';
import { dict, type Locale } from '@/lib/i18n';

type OrderState = {
  id: string;
  status: 'NEW' | 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED';
  revisedAt: string | null;
  totalAmountPaise: number;
  createdAt: string;
  completedAt: string | null;
  shopName: string;
  shopSlug: string;
};

type Update = {
  /** Changes whenever the shop does something new to the order. */
  key: string;
  orderId: string;
  kind: 'received' | 'changed' | 'done' | 'cancelled';
  shopName: string;
  totalAmountPaise: number | null;
  at: string;
};

const POLL_MS = 30_000;
const SEEN_KEY = 'halkhata:customer-bell:seen';
const REMOVED_KEY = 'halkhata:customer-bell:removed';

function updateFor(order: OrderState): Update {
  const base = { orderId: order.id, shopName: order.shopName, totalAmountPaise: order.totalAmountPaise };
  if (order.status === 'CANCELLED') return { ...base, key: `${order.id}:cancelled`, kind: 'cancelled', at: order.createdAt };
  if (order.status === 'COMPLETED')
    return { ...base, key: `${order.id}:done`, kind: 'done', at: order.completedAt ?? order.createdAt };
  if (order.revisedAt)
    return { ...base, key: `${order.id}:changed:${order.revisedAt}`, kind: 'changed', at: order.revisedAt };
  return { ...base, key: `${order.id}:received`, kind: 'received', at: order.createdAt };
}

export function CustomerBell({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const router = useRouter();
  const [updates, setUpdates] = useState<Update[]>([]);
  /** orderId → the update key last seen for it. */
  const [seen, setSeen] = useState<Record<string, string>>({});
  /** Update keys removed. A newer update on the same order shows again. */
  const [removed, setRemoved] = useState<string[]>([]);

  useEffect(() => {
    setSeen(readStore<Record<string, string>>(SEEN_KEY, {}));
    setRemoved(readStore<string[]>(REMOVED_KEY, []));
  }, []);

  const load = useCallback(async () => {
    const mine = readMyOrders();
    if (mine.length === 0) {
      setUpdates([]);
      return;
    }
    try {
      const response = await fetch(`/api/order/status?ids=${mine.map((order) => order.id).join(',')}`, {
        cache: 'no-store',
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { orders?: OrderState[] };
      const found = new Map((payload.orders ?? []).map((order) => [order.id, order]));
      // WHAT THE SHOP DID: changed the order, could not take it, or finished
      // it (bill on WhatsApp). The same three things the customer's phone is
      // alerted about. "The shop has your order" is not listed: it was news
      // to nobody who had just placed it.
      //
      // An order the server no longer has was turned away — turning an order
      // away deletes it — and says so rather than silently vanishing.
      setUpdates(
        mine
          .map((order): Update | null => {
            const state = found.get(order.id);
            if (!state) {
              return {
                key: `${order.id}:cancelled`,
                orderId: order.id,
                kind: 'cancelled',
                shopName: '',
                totalAmountPaise: null,
                at: new Date(order.at).toISOString(),
              };
            }
            const update = updateFor(state);
            return update.kind === 'received' ? null : update;
          })
          .filter((update): update is Update => update !== null)
          .sort((a, b) => b.at.localeCompare(a.at)),
      );
    } catch {
      // Offline: keep what is showing.
    }
  }, []);

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
  const shown = updates.filter((update) => !removed.includes(update.key));
  const words = { received: t.bellReceived, changed: t.bellChanged, done: t.bellDone, cancelled: t.bellCancelled };

  const entries: BellEntry[] = shown.map((update) => ({
    key: update.key,
    title: words[update.kind],
    detail: [update.shopName, update.totalAmountPaise !== null ? formatPaise(update.totalAmountPaise) : '']
      .filter(Boolean)
      .join(' · '),
    when: formatIsoDay(update.at) === today ? formatClock(update.at) : formatDay(update.at),
    unread: seen[update.orderId] !== update.key,
    onOpen: () => router.push(`/track/${update.orderId}`),
  }));

  function markRead() {
    const next = { ...seen };
    for (const update of shown) next[update.orderId] = update.key;
    setSeen(next);
    writeStore(SEEN_KEY, next);
  }

  function remove(keys: string[]) {
    const current = new Set(updates.map((update) => update.key));
    const next = [...new Set([...removed, ...keys])].filter((key) => current.has(key));
    setRemoved(next);
    writeStore(REMOVED_KEY, next);
  }

  return (
    <BellMenu
      entries={entries}
      labels={{ title: t.bellTitle, empty: t.bellEmpty, clearAll: t.bellClearAll, remove: t.bellRemove }}
      onOpened={markRead}
      onRemove={(key) => remove([key])}
      onClearAll={() => remove(shown.map((update) => update.key))}
    />
  );
}
