'use client';

/**
 * The orders queue.
 *
 * Orders already arrive on the shop's WhatsApp — that is not going away, and it
 * is what makes DukaanFlow work on a phone with no app. But a WhatsApp thread
 * is a conversation, not a worklist: once an owner has the app open, they need
 * to see what is still waiting, and mark off what they have taken.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useToast } from '@/components/ui/Toast';
import { formatRupees } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export type OwnerOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderType: 'DELIVERY' | 'PICKUP';
  status: 'NEW' | 'CONFIRMED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  lines: { name: string; unit: string; quantity: number; amount: number }[];
};

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

  async function setStatus(id: string, status: OwnerOrder['status']) {
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

  const statusLabel: Record<OwnerOrder['status'], string> = {
    NEW: t.orderNew,
    CONFIRMED: t.orderConfirmed,
    CANCELLED: t.orderCancelled,
  };

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className={clsx(
            'rounded-2xl bg-white p-4 shadow-card',
            busyId === order.id && 'opacity-60',
            order.status === 'CANCELLED' && 'opacity-70',
          )}
        >
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">
                {order.customerName || '—'} · {order.customerPhone}
              </p>
              <p className="text-xs text-slate-500">
                {order.orderType === 'DELIVERY' ? t.delivery : t.pickup} ·{' '}
                {new Date(order.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
            <span
              className={clsx(
                'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                order.status === 'NEW' && 'bg-amber-50 text-amber-700',
                order.status === 'CONFIRMED' && 'bg-green-50 text-green-700',
                order.status === 'CANCELLED' && 'bg-slate-100 text-slate-500',
              )}
            >
              {statusLabel[order.status]}
            </span>
          </div>

          <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
            {order.lines.map((line, index) => (
              <li key={`${order.id}-${index}`} className="flex justify-between gap-3 text-slate-600">
                <span className="min-w-0 truncate">
                  {line.name}
                  {line.unit ? ` ${line.unit}` : ''} × {line.quantity}
                </span>
                <span className="shrink-0 tabular-nums">{formatRupees(line.amount)}</span>
              </li>
            ))}
          </ul>

          {order.customerAddress && (
            <p className="mt-2 text-sm text-slate-500">{order.customerAddress}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <p className="mr-auto font-bold tabular-nums text-slate-900">
              {formatRupees(order.totalAmount)}
            </p>

            <a
              href={`tel:+91${order.customerPhone}`}
              className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700"
            >
              {t.callCustomer}
            </a>

            {order.status !== 'CONFIRMED' && (
              <button
                type="button"
                disabled={busyId === order.id}
                onClick={() => setStatus(order.id, 'CONFIRMED')}
                className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t.markConfirmed}
              </button>
            )}
            {order.status !== 'CANCELLED' && (
              <button
                type="button"
                disabled={busyId === order.id}
                onClick={() => setStatus(order.id, 'CANCELLED')}
                className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {t.markCancelled}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
