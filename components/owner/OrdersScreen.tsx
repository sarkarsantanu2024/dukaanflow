'use client';

/**
 * The orders queue.
 *
 * Orders already arrive on the shop's WhatsApp — that is not going away, and it
 * is what makes DukaanFlow work on a phone with no app. But a WhatsApp thread
 * is a conversation, not a worklist: once an owner has the app open, they need
 * to see what is still waiting, and mark off what they have taken.
 *
 * The screen is built around one question an owner asks about twenty times a
 * day — "what still needs doing?" — so it opens on the orders that do. A flat
 * list answered that question only while the shop was quiet; by the evening the
 * three that matter are buried under thirty that are finished. Hence the tabs,
 * and hence NEW being the one you land on whenever anything is waiting.
 *
 * The strip at the top is the other question, asked once at closing: what did
 * today take? Cancelled orders are excluded from it — money that never arrived
 * is not takings, and an owner checking the figure against the cash drawer must
 * not find the app optimistic.
 */

import { formatClock, formatDay, startOfBusinessDay } from '@/lib/time';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useToast } from '@/components/ui/Toast';
import { PhoneIcon, PinIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { formatRupees } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

/**
 * An ordered line in the owner's language, falling back to the primary name.
 * Orders placed before the snapshot carried translations have only that one.
 */
function lineName(
  line: { name: string; nameBn?: string; nameHi?: string },
  locale: Locale,
): string {
  if (locale === 'bn') return line.nameBn || line.name;
  if (locale === 'hi') return line.nameHi || line.name;
  return line.name;
}

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type OwnerOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderType: 'DELIVERY' | 'PICKUP';
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  lines: {
    name: string;
    nameBn?: string;
    nameHi?: string;
    unit: string;
    quantity: number;
    amount: number;
  }[];
};

type Tab = 'ALL' | OrderStatus;

const TAB_ORDER: Tab[] = ['NEW', 'CONFIRMED', 'COMPLETED', 'ALL', 'CANCELLED'];

/**
 * Today in the shop's own day.
 *
 * The local-date comparison this replaces asked the *machine* what day it was,
 * which is UTC on the server and IST in the browser — so the two could count
 * different numbers of orders for the same list and React would throw the tree
 * away. Anchored to the shop's midnight, both agree.
 */
function isToday(iso: string): boolean {
  return new Date(iso) >= startOfBusinessDay();
}

export function OrdersScreen({
  slug,
  orders,
  locale,
}: {
  slug: string;
  orders: OwnerOrder[];
  locale: Locale;
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);

  const counts = useMemo(() => {
    const tally: Record<Tab, number> = {
      ALL: orders.length,
      NEW: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const order of orders) tally[order.status] += 1;
    return tally;
  }, [orders]);

  const today = useMemo(() => {
    let count = 0;
    let takings = 0;
    for (const order of orders) {
      if (!isToday(order.createdAt) || order.status === 'CANCELLED') continue;
      count += 1;
      // Only money the owner has actually agreed to. An order sitting
      // unanswered is not takings, and a figure checked against the cash
      // drawer must never be the optimistic one.
      if (order.status === 'CONFIRMED' || order.status === 'COMPLETED') {
        takings += order.totalAmount;
      }
    }
    return { count, takings };
  }, [orders]);

  // Until the owner picks a tab themselves, the screen decides: anything
  // waiting and that is what they opened the app for.
  const waiting = counts.NEW + counts.CONFIRMED;
  const activeTab: Tab = tab ?? (counts.NEW > 0 ? 'NEW' : waiting > 0 ? 'CONFIRMED' : 'ALL');

  const visible = useMemo(() => {
    const rows =
      activeTab === 'ALL' ? [...orders] : orders.filter((order) => order.status === activeTab);
    // Work still to be done runs oldest first — whoever ordered first is
    // served first, which is the rule a queue at a counter already follows.
    // Finished work runs newest first, because that is a record being read
    // backwards from now.
    const oldestFirst = activeTab === 'NEW' || activeTab === 'CONFIRMED';
    return rows.sort((a, b) =>
      oldestFirst
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
    );
  }, [orders, activeTab]);

  async function setStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) {
        push(t.networkError, 'error');
        return;
      }
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-semibold text-slate-800">{t.noOrders}</p>
        <p className="mt-1 text-sm text-slate-500">{t.noOrdersHint}</p>
      </div>
    );
  }

  const statusLabel: Record<OrderStatus, string> = {
    NEW: t.orderNew,
    CONFIRMED: t.orderConfirmed,
    COMPLETED: t.orderCompleted,
    CANCELLED: t.orderCancelled,
  };

  const tabLabel: Record<Tab, string> = { ...statusLabel, ALL: t.ordersAll };

  return (
    <div className="space-y-3">
      {/* Today at a glance. Three numbers, no chart — this gets read standing
          up, between customers. */}
      <dl className="flex items-center gap-5 rounded-2xl bg-white px-4 py-3 shadow-card">
        <div>
          <dt className="text-xs text-slate-500">{t.ordersToday}</dt>
          <dd className="text-xl font-bold tabular-nums text-slate-900">{today.count}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t.ordersTakings}</dt>
          <dd className="text-xl font-bold tabular-nums text-slate-900">
            {formatRupees(today.takings)}
          </dd>
        </div>
        <div className="ml-auto text-right">
          <dt className="text-xs text-slate-500">{t.ordersWaiting}</dt>
          <dd
            className={clsx(
              'text-xl font-bold tabular-nums',
              waiting > 0 ? 'text-amber-600' : 'text-slate-400',
            )}
          >
            {waiting}
          </dd>
        </div>
      </dl>

      {/* Sticky, because marking off ten orders means scrolling — and the tab
          you are working is the one piece of state you must not lose. */}
      <div
        role="tablist"
        aria-label={t.orders}
        className="sticky top-[3.25rem] z-10 -mx-4 flex gap-2 overflow-x-auto bg-slate-100/95 px-4 py-2 backdrop-blur"
      >
        {TAB_ORDER.map((option) => {
          const selected = activeTab === option;
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(option)}
              className={clsx(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                selected
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
            >
              {tabLabel[option]}
              <span className={clsx('ml-1.5 tabular-nums', selected ? 'text-white/80' : 'text-slate-400')}>
                {counts[option]}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{t.noOrdersHere}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => (
            <li
              key={order.id}
              className={clsx(
                'rounded-2xl bg-white p-4 shadow-card',
                busyId === order.id && 'opacity-60',
                order.status === 'CANCELLED' && 'opacity-70',
                // A new order gets an edge you can find without reading — the
                // one card in the list that is asking for something.
                order.status === 'NEW' && 'ring-2 ring-amber-300',
              )}
            >
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {order.customerName || '—'} · {order.customerPhone}
                  </p>
                  {/* Where it goes belongs with who it is for, not under the
                      list of what is in it — sitting there it read as another
                      line of the order. */}
                  {order.customerAddress && (
                    <p className="flex items-start gap-1 text-xs text-slate-500">
                      <PinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="min-w-0">{order.customerAddress}</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {order.orderType === 'DELIVERY' ? t.delivery : t.pickup} ·{' '}
                    {formatClock(order.createdAt)}
                    {!isToday(order.createdAt) &&
                      ` · ${formatDay(order.createdAt)}`}
                  </p>
                </div>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                    order.status === 'NEW' && 'bg-amber-50 text-amber-700',
                    order.status === 'CONFIRMED' && 'bg-blue-50 text-blue-700',
                    order.status === 'COMPLETED' && 'bg-green-50 text-green-700',
                    order.status === 'CANCELLED' && 'bg-slate-100 text-slate-500',
                  )}
                >
                  {statusLabel[order.status]}
                </span>
              </div>

              <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                {order.lines.map((line, index) => (
                  <li
                    key={`${order.id}-${index}`}
                    className="flex justify-between gap-3 text-slate-600"
                  >
                    <span className="min-w-0 truncate">
                      {lineName(line, locale)}
                      {line.unit ? ` · ${line.unit}` : ''} × {line.quantity}
                    </span>
                    <span className="shrink-0 tabular-nums">{formatRupees(line.amount)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <p className="mr-auto font-bold tabular-nums text-slate-900">
                  {formatRupees(order.totalAmount)}
                </p>

                {/* Reaching the customer is one tap from the order, not a
                    hunt back through WhatsApp for which message was theirs. */}
                <a
                  href={`tel:+91${order.customerPhone}`}
                  aria-label={t.callCustomer}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
                >
                  <PhoneIcon className="h-[18px] w-[18px]" />
                </a>
                <a
                  href={`https://wa.me/91${order.customerPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.messageCustomer}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-[#25D366]"
                >
                  <WhatsAppIcon className="h-[18px] w-[18px]" />
                </a>

                {/* One forward action per state, so the common tap is never a
                    choice: a new order is accepted, an accepted one is done. */}
                {order.status === 'NEW' && (
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => setStatus(order.id, 'CONFIRMED')}
                    className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {t.markConfirmed}
                  </button>
                )}
                {order.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => setStatus(order.id, 'COMPLETED')}
                    className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {t.markCompleted}
                  </button>
                )}
                {(order.status === 'NEW' || order.status === 'CONFIRMED') && (
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => setStatus(order.id, 'CANCELLED')}
                    className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {t.markCancelled}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
