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

import { useCallback, useEffect, useRef, useState } from 'react';
import { CustomerNewsBar } from './CustomerNewsBar';
import {
  acknowledgeOrder,
  raiseCustomerAlarm,
  ringCustomerOnce,
  silenceCustomerAlarm,
  type CustomerNews,
} from './customer-alarm';
import { useRouter } from 'next/navigation';
import { BellMenu, readStore, writeStore, type BellEntry } from '@/components/ui/BellMenu';
import { readMyOrders } from '@/lib/my-orders';
import { formatPaise } from '@/lib/money';
import { formatClock, formatDay, formatIsoDay } from '@/lib/time';
import { dict, type Locale } from '@/lib/i18n';
import { isWaiting, type OrderStatus } from '@/lib/order-status';

type OrderState = {
  id: string;
  status: OrderStatus;
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
const ANNOUNCED_KEY = 'halkhata:customer-bell:announced';

function updateFor(order: OrderState): Update {
  const base = { orderId: order.id, shopName: order.shopName, totalAmountPaise: order.totalAmountPaise };
  if (order.status === 'CANCELLED') return { ...base, key: `${order.id}:cancelled`, kind: 'cancelled', at: order.createdAt };
  if (order.status === 'COMPLETED')
    return { ...base, key: `${order.id}:done`, kind: 'done', at: order.completedAt ?? order.createdAt };
  if (order.revisedAt)
    return { ...base, key: `${order.id}:changed:${order.revisedAt}`, kind: 'changed', at: order.revisedAt };
  return { ...base, key: `${order.id}:received`, kind: 'received', at: order.createdAt };
}

/**
 * Which update this phone has already rung for, per order. Missing entirely
 * on a phone's first look, which only sets the marks: a customer opening the
 * shop should not be read a week of old news.
 */
function readAnnounced(): Record<string, string> | null {
  try {
    const raw = window.localStorage.getItem(ANNOUNCED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return {};
  }
}

export function CustomerBell({
  locale,
  viewingOrderId,
}: {
  locale: Locale;
  /** The order whose page is open, if any: its news is seen, and rings once. */
  viewingOrderId?: string;
}) {
  const t = dict(locale);
  const router = useRouter();
  const [updates, setUpdates] = useState<Update[]>([]);
  /** Is any of this phone's orders still with the shop? Then keep listening when hidden. */
  const openRef = useRef(false);

  // Looking at an order's page is seeing its news.
  useEffect(() => {
    if (viewingOrderId) acknowledgeOrder(viewingOrderId);
  }, [viewingOrderId]);

  /**
   * Rings for anything the shop did that this phone has not rung for yet — see
   * `customer-alarm.ts`. The order already on screen rings once; the rest ring
   * until the customer looks.
   */
  const announce = useCallback(
    (list: Update[], slugs: Map<string, string>) => {
      const marks = readAnnounced();
      const next: Record<string, string> = {};
      for (const update of list) next[update.orderId] = update.key;
      writeStore(ANNOUNCED_KEY, next);
      if (!marks) return;
      const fresh: CustomerNews[] = list
        .filter(
          (update) =>
            update.kind !== 'received' &&
            marks[update.orderId] !== update.key &&
            // A finished order that later vanishes was cleared with age, not
            // turned away: never ring "could not take your order" for it.
            !marks[update.orderId]?.endsWith(':done'),
        )
        .reverse() // oldest first, so the newest is said last and opened by the bar
        .map((update) => ({
          key: update.key,
          orderId: update.orderId,
          kind: update.kind as CustomerNews['kind'],
          shopName: update.shopName,
          shopSlug: slugs.get(update.orderId) ?? '',
          totalPaise: update.totalAmountPaise,
        }));
      const here = fresh.filter((news) => news.orderId === viewingOrderId);
      const elsewhere = fresh.filter((news) => news.orderId !== viewingOrderId);
      if (elsewhere.length > 0) raiseCustomerAlarm(locale, elsewhere);
      else if (here.length > 0) ringCustomerOnce(locale, here);
    },
    [locale, viewingOrderId],
  );
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
      openRef.current = (payload.orders ?? []).some(
        (order) => isWaiting(order.status),
      );
      // WHAT THE SHOP DID: changed the order, could not take it, or finished
      // it (bill on WhatsApp). The same three things the customer's phone is
      // alerted about. "The shop has your order" is not listed: it was news
      // to nobody who had just placed it.
      //
      // An order the server no longer has was turned away — turning an order
      // away deletes it — and says so rather than silently vanishing.
      const list = mine
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
        .sort((a, b) => b.at.localeCompare(a.at));
      setUpdates(list);
      announce(list, new Map(mine.map((order) => [order.id, order.slug])));
    } catch {
      // Offline: keep what is showing.
    }
  }, [announce]);

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
      } else if (!openRef.current) {
        // Hidden with nothing still at the shop: stop asking. While an order
        // is open the page keeps listening, so its news is said even with the
        // screen off, for as long as the phone lets the page run.
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
    // Opening the bell is looking at the news too.
    silenceCustomerAlarm();
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
    <>
      <BellMenu
        entries={entries}
        labels={{ title: t.bellTitle, empty: t.bellEmpty, clearAll: t.bellClearAll, remove: t.bellRemove }}
        onOpened={markRead}
        onRemove={(key) => remove([key])}
        onClearAll={() => remove(shown.map((update) => update.key))}
      />
      <CustomerNewsBar locale={locale} />
    </>
  );
}
