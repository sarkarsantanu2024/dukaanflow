'use client';

/**
 * The orders queue.
 *
 * Orders arrive here, from the shop's own QR page, and this is the only place
 * they arrive: WhatsApp is where the owner TELLS a customer something, never
 * where an order comes in. What the owner needs from this screen is what a
 * WhatsApp thread cannot give — a worklist showing what is still waiting, and a
 * way to mark off what has been done.
 *
 * The screen is built around one question an owner asks about twenty times a
 * day — "what still needs doing?" — so it opens on the orders that do. A flat
 * list answered that question only while the shop was quiet; by the evening the
 * three that matter are buried under thirty that are finished. Hence the tabs,
 * and hence NEW being the one you land on whenever anything is waiting.
 *
 * The strip at the top is the other question, asked once at closing: what did
 * today take? Cancelled orders are excluded from it — money that never arrived
 * is not takingsPaise, and an owner checking the figure against the cash drawer must
 * not find the app optimistic.
 */

import { formatClock, formatDay, startOfBusinessDay } from '@/lib/time';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handledExpiredSession } from './sessionGuard';
import clsx from 'clsx';
import { useToast } from '@/components/ui/Toast';
import { CheckIcon, CloseIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { useConfirm } from '@/components/ui/useConfirm';
import { formatPaise } from '@/lib/money';
import {
  amountLabel,
  baseFromQuantity,
  isLooseUnit,
  quantityFromBase,
  stepBase,
} from '@/lib/units';
import {
  buildRevisedMessage,
  buildRoundMessage,
  buildStatusMessage,
  toWhatsAppNumber,
} from '@/lib/whatsapp';
import { QRCodeCanvas } from 'qrcode.react';
import { upiPayUrlWithAmount } from '@/lib/qr';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';
import { PushToggle } from './PushToggle';

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

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type OwnerOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderType: 'DELIVERY' | 'PICKUP';
  status: OrderStatus;
  /** Goods plus delivery — what the customer owes. */
  totalAmountPaise: number;
  /** What was charged for sending it out, already inside the total above. */
  deliveryFeePaise: number;
  /** Has the owner already cut this order down to what they had? */
  revised: boolean;
  /**
   * Has this customer's phone agreed to be told things, so the server can
   * reach them on its own?
   *
   * When it can, the owner is shown nothing to tap. See `worthMessaging`.
   */
  reachable: boolean;
  createdAt: string;
  lines: {
    /** Blank on orders taken before the snapshot carried it. */
    itemId: string;
    name: string;
    nameBn?: string;
    nameHi?: string;
    unit: string;
    quantity: number;
    amountPaise: number;
  }[];
};

/**
 * IS THIS ORDER WORTH LEAVING THE APP FOR?
 *
 * The WhatsApp button used to sit on every card in every state, and by the
 * evening that is thirty invitations to do something that is usually either
 * unnecessary or already done. The real cost is not the tap: it is that
 * WhatsApp opens over the till, the owner sends, and then has to find their way
 * back — twice per order, in the middle of a rush.
 *
 * So the button appears only when a message would actually tell the customer
 * something they do not otherwise learn:
 *
 *  - **Cancelled — always, even when the phone has notifications.** This is the
 *    one piece of news that costs somebody a walk to the shop if it fails to
 *    arrive, and a notification is exactly the thing that arrives late on the
 *    phones this market runs on. Belt and braces, deliberately.
 *  - **Ready for collection — only if we cannot tell them ourselves.** They
 *    have to walk over, so somebody has to say so.
 *  - **Ready for delivery — never.** The bag arriving at the door is the
 *    message. A text saying "it is on its way" reaches them roughly when the
 *    delivery boy does.
 *  - **Still preparing — never.** An order that arrived accepted has nothing to
 *    report, and "we have your order" is news to nobody who just placed one.
 */
function worthMessaging(order: OwnerOrder): boolean {
  if (order.status === 'CANCELLED') return true;
  // READY, not COMPLETED. "Your order is ready" is an invitation to come and
  // collect, and it used to be attached to the state that means the customer
  // already has the bag.
  if (order.status !== 'READY') return false;
  if (order.orderType === 'DELIVERY') return false;
  return !order.reachable;
}

/**
 * How often an open orders screen asks the server what it has missed.
 *
 * Twenty seconds is the compromise: fast enough that a customer who orders and
 * then walks in is not ahead of the shop's own screen, slow enough to be
 * nothing on a Vercel bill or a 4G connection.
 */
const ORDERS_POLL_MS = 20_000;

type Tab = 'ALL' | OrderStatus;

const TAB_ORDER: Tab[] = ['NEW', 'CONFIRMED', 'READY', 'COMPLETED', 'ALL', 'CANCELLED'];

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

/**
 * One tap of the owner's revise stepper, in the same amounts the customer's
 * picker uses: 50 g at a time under a kilo, 250 g up to five, a kilo above —
 * and whole packs for anything counted.
 */
function reviseStep(unit: string, quantity: number, direction: 1 | -1): number {
  if (!isLooseUnit(unit)) return quantity + direction;
  const base = baseFromQuantity(unit, quantity);
  const step = stepBase(unit, base);
  return Math.max(0, quantityFromBase(unit, base + step * direction));
}

/**
 * How much of a line, as the person packing it needs to read it.
 *
 * "× 0.05" cannot be weighed out. Since a customer may now order any amount of
 * anything sold by weight or volume — fifty grams of posto priced by the kilo —
 * the packing list has to name the amount, and only counted goods keep a
 * multiplier.
 */
function lineAmount(line: { unit: string; quantity: number }): string {
  return amountLabel(line.unit, line.quantity) ?? `× ${line.quantity}`;
}

export function OrdersScreen({
  slug,
  shopName,
  orders,
  locale,
  upiId,
  upiQrData,
  labourPhone,
}: {
  slug: string;
  /** Named in the message the owner sends the customer, and in the UPI QR. */
  shopName: string;
  /**
   * Whoever runs the deliveries, set by the operator, or blank.
   *
   * Blank is a supported state, not a missing setting: the send button then
   * opens WhatsApp's own contact picker, which is also how the round reaches a
   * second boy or the owner's son on a day the usual one is off.
   */
  labourPhone: string;
  orders: OwnerOrder[];
  locale: Locale;
  /** Generates a QR carrying the exact amount, so the customer confirms rather than types. */
  upiId: string;
  /** The shop's own printed code, used when there is no UPI ID. */
  upiQrData: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { confirm, dialog } = useConfirm();
  const t = ownerDict(locale);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** The order whose payment question is currently open, if any. */
  const [settling, setSettling] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);

  /**
   * The order being cut down to what the shop actually has, and the amounts
   * the owner is proposing — item id to quantity.
   *
   * A draft rather than a save on every tap: an owner going from 2 kg to 1 kg
   * passes through nothing meaningful, and the customer must be told once, at
   * the end, rather than twice on the way.
   */
  const [revising, setRevising] = useState<string | null>(null);
  const [revision, setRevision] = useState<Record<string, number>>({});
  /**
   * The message waiting to be sent about an order that has just been changed.
   *
   * Kept until the owner sends it or leaves the screen. Push has already gone
   * to whoever allowed it, but push is not the system of record — the WhatsApp
   * message is what actually reaches everybody, and this is the one moment the
   * shopkeeper genuinely must not skip it.
   */
  const [pendingShare, setPendingShare] = useState<{ orderId: string; url: string } | null>(null);

  const counts = useMemo(() => {
    const tally: Record<Tab, number> = {
      ALL: orders.length,
      NEW: 0,
      CONFIRMED: 0,
      READY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const order of orders) tally[order.status] += 1;
    return tally;
  }, [orders]);

  const today = useMemo(() => {
    let count = 0;
    let takingsPaise = 0;
    for (const order of orders) {
      if (!isToday(order.createdAt) || order.status === 'CANCELLED') continue;
      count += 1;
      // Only money the owner has actually agreed to. An order sitting
      // unanswered is not takingsPaise, and a figure checked against the cash
      // drawer must never be the optimistic one.
      if (
        order.status === 'CONFIRMED' ||
        order.status === 'READY' ||
        order.status === 'COMPLETED'
      ) {
        takingsPaise += order.totalAmountPaise;
      }
    }
    return { count, takingsPaise };
  }, [orders]);

  // A READY order is still waiting: it is packed and nobody has it yet.
  const waiting = counts.NEW + counts.CONFIRMED + counts.READY;

  /**
   * What is still to go out, oldest first — the round, in the order it should
   * be walked. Finished and cancelled orders are not somebody's afternoon.
   */
  const pending = useMemo(
    () =>
      orders
        .filter(
          (order) =>
            order.status === 'NEW' || order.status === 'CONFIRMED' || order.status === 'READY',
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [orders],
  );

  const visible = useMemo(() => {
    // One list, so it has to carry both jobs at once. Work still to be done
    // sits on top, oldest first — whoever ordered first is served first, the
    // rule a queue at a counter already follows. Everything finished sits
    // under it, newest first, because that half is a record being read
    // backwards from now.
    const rank = (status: OrderStatus) =>
      status === 'NEW' || status === 'CONFIRMED' || status === 'READY' ? 0 : 1;
    return [...orders].sort((a, b) => {
      const byRank = rank(a.status) - rank(b.status);
      if (byRank !== 0) return byRank;
      return rank(a.status) === 0
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt);
    });
  }, [orders]);

  /**
   * THE SCREEN CANNOT BE A SNAPSHOT.
   *
   * An owner leaves this open on the counter all day. Until now the only thing
   * that ever refreshed it was the owner's own tap, so an order placed while
   * they were looking at it never appeared — the waiting count sat there being
   * wrong, and the only alert was a push notification, which is exactly the
   * thing the phones in this market drop.
   *
   * So: a poll while the tab is actually being looked at, and an immediate
   * refresh the moment it is looked at again. `router.refresh()` re-runs the
   * server component and diffs — it does not scroll, does not clear a form and
   * does not close the panel the owner has open.
   *
   * Paused while hidden on purpose. A phone in a pocket with a dozen tabs open
   * should not be polling anybody's database, and coming back to the tab
   * refreshes anyway.
   */
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => router.refresh(), ORDERS_POLL_MS);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [router]);

  /**
   * A new order that arrived on its own is worth a word, once.
   *
   * The poll above makes it appear; this makes the owner look up. Only ever an
   * increase, and never on first render — a screen that announces the orders
   * already on it every time it loads is a screen people learn to ignore.
   */
  const seenWaiting = useRef<number | null>(null);
  useEffect(() => {
    const previous = seenWaiting.current;
    seenWaiting.current = waiting;
    if (previous === null || waiting <= previous) return;
    push(t.newOrderAlert, 'success');
  }, [waiting, push, t.newOrderAlert]);

  async function setStatus(
    id: string,
    status: OrderStatus,
    paymentReceived = false,
    paymentMode: '' | 'CASH' | 'UPI' = '',
  ) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, paymentReceived, paymentMode }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;
      if (!response.ok) {
        push(t.networkError, 'error');
        return;
      }

      // Say it out loud when money has just become a debt. An owner who taps
      // "not yet" and sees nothing happen has no reason to believe the khata
      // knows about it, and will go and write it on paper as well.
      const payload = (await response.json().catch(() => ({}))) as { khataAmountPaise?: number };
      if (payload.khataAmountPaise && payload.khataAmountPaise > 0) {
        push(`${t.paymentKhataDone} · ${formatPaise(payload.khataAmountPaise)}`, 'success');
      }

      setSettling(null);
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusyId(null);
    }
  }

  /**
   * Save what the shop can actually give, and put the message in the owner's
   * hand.
   *
   * The server is the authority on the new total — it re-reads the delivery
   * terms, which a shorter order may now fail to qualify for — so the message
   * is built from what it sends back rather than from what this screen guessed.
   */
  async function saveRevision(order: OwnerOrder) {
    setBusyId(order.id);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          lines: order.lines
            .filter((line) => line.itemId)
            .map((line) => ({
              itemId: line.itemId,
              quantity: revision[line.itemId] ?? line.quantity,
            })),
        }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        changed?: boolean;
        totalAmountPaise?: number;
        lines?: { itemId: string; name: string; unit: string; quantity: number; amountPaise: number }[];
        removed?: { name: string; unit: string; quantity: number }[];
      };

      if (!response.ok) {
        push(payload.error ?? t.networkError, 'error');
        return;
      }

      setRevising(null);
      setRevision({});

      if (payload.changed === false) {
        router.refresh();
        return;
      }

      // Each line's old quantity, so the message can say what it was rather
      // than only what it now is — which is the question the customer has.
      const before = new Map(order.lines.map((line) => [line.itemId, line.quantity]));
      const message = buildRevisedMessage({
        shopName,
        customerName: order.customerName,
        totalAmountPaise: payload.totalAmountPaise ?? order.totalAmountPaise,
        lines: (payload.lines ?? []).map((line) => ({
          name: line.name,
          unit: line.unit,
          quantity: line.quantity,
          wasQuantity: before.get(line.itemId) ?? line.quantity,
          amountPaise: line.amountPaise,
        })),
        removed: payload.removed ?? [],
      });

      setPendingShare({
        orderId: order.id,
        url: `https://wa.me/91${order.customerPhone}?text=${encodeURIComponent(message)}`,
      });
      push(t.reviseDone, 'success');
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
    READY: t.orderReady,
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
            {formatPaise(today.takingsPaise)}
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

      {/* THE ASK LANDS HERE, AND ONLY HERE.
          This screen returns early when there are no orders at all, so an
          owner never meets this before they have seen the product do
          something. That is the whole placement argument: the browser's
          permission prompt cannot be shown twice, and a shopkeeper looking at
          an order that arrived while they were serving somebody is the one
          moment the answer is obviously yes. */}
      <PushToggle slug={slug} locale={locale} />

      {/* THE ROUND, IN ONE MESSAGE.
          Whoever runs the deliveries has a phone and WhatsApp and nothing
          else — no login, and there never will be one. Until now the owner
          read the orders off this screen and dictated them, or forwarded four
          separate customer messages, and the address is the part that gets
          lost doing that at six in the evening.

          Straight to his number when the operator has set one, and to
          WhatsApp's contact picker when they have not — which is also how the
          round reaches a second boy, or the owner's own son. */}
      {pending.length > 0 && (
        <a
          href={`https://wa.me/${labourPhone ? toWhatsAppNumber(labourPhone) : ''}?text=${encodeURIComponent(
            buildRoundMessage({ shopName, orders: pending }),
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 font-semibold text-white transition hover:brightness-95"
        >
          <WhatsAppIcon className="h-5 w-5" />
          {t.ordersSendRound}
          <span className="tabular-nums opacity-90">({pending.length})</span>
        </a>
      )}

      {/* The status filter strip lived here. Five chips, four of them usually
          reading zero, above a list short enough to read whole — it cost a row
          of screen and answered a question nobody was asking. The badge on each
          card already says what state it is in. */}

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
                {/* Said on the card, not only in the message that went out.
                    An owner scrolling back through the day has to be able to
                    see which orders they cut, because that is the one the
                    customer will ring about. */}
                {order.revised && (
                  <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                    {t.revisedBadge}
                  </span>
                )}
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                    order.status === 'NEW' && 'bg-amber-50 text-amber-700',
                    order.status === 'CONFIRMED' && 'bg-blue-50 text-blue-700',
                    order.status === 'READY' && 'bg-amber-50 text-amber-800',
                    order.status === 'COMPLETED' && 'bg-green-50 text-green-700',
                    order.status === 'CANCELLED' && 'bg-slate-100 text-slate-500',
                  )}
                >
                  {statusLabel[order.status]}
                </span>
              </div>

              {revising === order.id ? (
                /* WHAT THE SHOP CAN ACTUALLY GIVE.
                   A customer asks for two kilos of basmati and the sack has
                   one. Cancelling is wrong — the shop wants to send the kilo
                   and the customer wants it — and a phone call leaves the app
                   still insisting on a total nobody is going to pay, which is
                   then what the khata would post if the order were completed
                   unpaid.

                   So: one stepper per line, capped at what was ordered. The
                   amounts only ever come down. Putting something INTO
                   somebody's order on their behalf is the shop deciding what a
                   customer buys, and the server refuses it too. */
                <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-sm font-semibold text-slate-800">{t.reviseTitle}</p>
                  <p className="text-xs text-slate-600">{t.reviseHint}</p>

                  <ul className="space-y-1.5">
                    {order.lines.map((line, index) => {
                      const next = revision[line.itemId] ?? line.quantity;
                      return (
                        <li
                          key={`${order.id}-revise-${index}`}
                          className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                            {lineName(line, locale)}
                            {line.unit ? ` · ${line.unit}` : ''}
                            {next !== line.quantity && (
                              <span className="text-slate-400">
                                {' '}
                                · {t.reviseWas} {lineAmount(line)}
                              </span>
                            )}
                          </span>

                          {/* A line with no item id cannot be named to the
                              server, so it is shown and left alone rather than
                              offered as something changeable that would then
                              silently do nothing. */}
                          {line.itemId ? (
                            <span className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 p-1">
                              <button
                                type="button"
                                aria-label="−"
                                onClick={() =>
                                  setRevision((current) => ({
                                    ...current,
                                    [line.itemId]: Math.max(0, reviseStep(line.unit, next, -1)),
                                  }))
                                }
                                className="h-8 w-8 rounded text-lg font-bold text-slate-700"
                              >
                                −
                              </button>
                              <span className="w-16 text-center font-bold tabular-nums">
                                {lineAmount({ unit: line.unit, quantity: next })}
                              </span>
                              <button
                                type="button"
                                aria-label="+"
                                disabled={next >= line.quantity}
                                onClick={() =>
                                  setRevision((current) => ({
                                    ...current,
                                    [line.itemId]: Math.min(
                                      line.quantity,
                                      reviseStep(line.unit, next, 1),
                                    ),
                                  }))
                                }
                                className="h-8 w-8 rounded text-lg font-bold text-slate-700 disabled:opacity-30"
                              >
                                +
                              </button>
                            </span>
                          ) : (
                            <span className="shrink-0 text-sm tabular-nums text-slate-500">
                              {lineAmount(line)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRevising(null);
                        setRevision({});
                      }}
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                    >
                      {t.reviseCancel}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => saveRevision(order)}
                      className="h-10 flex-1 rounded-lg bg-brand-600 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {t.reviseSave}
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                  {order.lines.map((line, index) => (
                    <li
                      key={`${order.id}-${index}`}
                      className="flex justify-between gap-3 text-slate-600"
                    >
                      <span className="min-w-0 truncate">
                        {lineName(line, locale)}
                        {line.unit ? ` · ${line.unit}` : ''} {lineAmount(line)}
                      </span>
                      <span className="shrink-0 tabular-nums">{formatPaise(line.amountPaise)}</span>
                    </li>
                  ))}

                  {/* Broken out, because a total that silently includes a
                      journey is a total the owner cannot check against the
                      goods in the bag. */}
                  {order.deliveryFeePaise > 0 && (
                    <li className="flex justify-between gap-3 text-slate-500">
                      <span>{t.delivery}</span>
                      <span className="shrink-0 tabular-nums">
                        {formatPaise(order.deliveryFeePaise)}
                      </span>
                    </li>
                  )}
                </ul>
              )}

              {/* AFTER AN ORDER IS CUT, WHO SAYS SO.
                  A cut order changes what the customer pays, so somebody has
                  to tell them — but not necessarily the shopkeeper. The server
                  has already sent it to any phone that agreed to be told, and
                  the tracking page carries the full new list.

                  So this is loud only when the server could not reach them: a
                  green bar that stays put until it is sent. When it could, it
                  shrinks to one line saying so, with a quiet way to send it
                  anyway — the owner who wants to add a word of their own can,
                  and everyone else carries on serving. */}
              {pendingShare?.orderId === order.id &&
                (order.reachable ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <CheckIcon className="h-4 w-4 shrink-0 text-brand-600" />
                    {t.reviseToldCustomer}
                    <a
                      href={pendingShare.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setPendingShare(null)}
                      className="ml-auto shrink-0 font-semibold text-[#25D366] underline"
                    >
                      {t.reviseSendAnyway}
                    </a>
                  </p>
                ) : (
                  <a
                    href={pendingShare.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPendingShare(null)}
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    {t.reviseTellCustomer}
                  </a>
                ))}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <p className="mr-auto font-bold tabular-nums text-slate-900">
                  {formatPaise(order.totalAmountPaise)}
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
                {/* Only when a message would tell the customer something they
                    do not otherwise learn — see `worthMessaging` above. On
                    every other card there is simply nothing here, and the
                    owner never leaves the app. */}
                {worthMessaging(order) && (
                  <a
                    href={`https://wa.me/91${order.customerPhone}?text=${encodeURIComponent(
                      buildStatusMessage({
                        shopName,
                        customerName: order.customerName,
                        status: order.status,
                        totalAmountPaise: order.totalAmountPaise,
                        orderType: order.orderType,
                        lines: order.lines,
                      }),
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.messageCustomer}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-[#25D366]"
                  >
                    <WhatsAppIcon className="h-[18px] w-[18px]" />
                  </a>
                )}

                {/* "We only have one." The third answer, between doing the
                    order and turning it away — and the one a kirana actually
                    gives most often. Hidden while the panel is open, and on
                    orders whose snapshot is too old to name its items. */}
                {(order.status === 'NEW' || order.status === 'CONFIRMED') &&
                  revising !== order.id &&
                  order.lines.some((line) => line.itemId) && (
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => {
                        setRevising(order.id);
                        setRevision({});
                        setSettling(null);
                      }}
                      className="h-10 shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {t.reviseOpen}
                    </button>
                  )}

                {/* One forward action per state, so the common tap is never a
                    choice: a new order is accepted, an accepted one is done. */}
                {/* No Accept button. Orders arrive accepted, so the only
                    decisions left are "it is done" and "we cannot do it".
                    `NEW` is still handled below for orders placed before this
                    changed — they must not become unfinishable. */}
                {(order.status === 'CONFIRMED' ||
                  order.status === 'NEW' ||
                  order.status === 'READY') &&
                  (settling === order.id ? (
                    /* The one question that decides where the money goes, asked
                       at the only moment the owner knows the answer. Two plain
                       buttons rather than a dialog: this is a phone held in one
                       hand across a counter. */
                    <span className="w-full">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        {t.paymentAsk}
                      </span>

                      {/* The same code the till shows, on the order itself.
                          Without it the till was the only screen that could
                          take a UPI payment, so an owner whose customer wanted
                          to scan had to re-enter the whole order over there —
                          and that second record is the double count. */}
                      {(upiId || upiQrData) && (
                        <span className="mb-3 flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 p-3">
                          {upiId ? (
                            <QRCodeCanvas
                              value={upiPayUrlWithAmount(upiId, shopName, order.totalAmountPaise)}
                              size={148}
                              includeMargin
                              level="M"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={upiQrData} alt="UPI QR" className="max-w-[9rem]" />
                          )}
                          <span className="text-xs text-slate-600">{t.sellScanToPay}</span>
                        </span>
                      )}

                      <span className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => setStatus(order.id, 'COMPLETED', true, 'CASH')}
                          className="h-10 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 disabled:opacity-50"
                        >
                          {t.sellCash}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => setStatus(order.id, 'COMPLETED', true, 'UPI')}
                          className="h-10 rounded-lg bg-brand-600 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {t.sellUpi}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => setStatus(order.id, 'COMPLETED', false)}
                          className="h-10 rounded-lg border border-amber-400 bg-amber-50 text-sm font-semibold text-amber-800 disabled:opacity-50"
                        >
                          {t.sellKhata}
                        </button>
                      </span>
                    </span>
                  ) : (
                    // An icon, the size of the call and message buttons beside
                    // it: three actions on one row, one shape, no wrapping.
                    // The word is still there for a screen reader and on a
                    // long press.
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => setSettling(order.id)}
                      aria-label={t.markCompleted}
                      title={t.markCompleted}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white disabled:opacity-50"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                  ))}
                {/* PACKED AND WAITING — the step that did not exist.
                    Without it the only way to tell a customer their order was
                    ready was to mark it done and answer for money nobody had
                    handed over yet. One tap sets READY, which is what sends
                    the customer their notification; the WhatsApp button beside
                    it then carries the same words for a customer whose phone
                    cannot be reached. */}
                {(order.status === 'NEW' || order.status === 'CONFIRMED') &&
                  settling !== order.id &&
                  revising !== order.id && (
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => void setStatus(order.id, 'READY')}
                      className="h-10 shrink-0 rounded-lg bg-amber-500 px-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
                    >
                      {t.markReady}
                    </button>
                  )}

                {/* An icon like the other three, and now behind a question.
                    It was the odd one out as a word because it is the one act
                    on this card with no undo, and an unlabelled ✗ beside a ✓
                    is a mis-tap that turns a customer away. Asking first buys
                    the consistency safely — and the dialog says what it means
                    in the owner's own language, which the icon cannot. */}
                {(order.status === 'NEW' ||
                  order.status === 'CONFIRMED' ||
                  order.status === 'READY') && (
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: t.markCancelled,
                          message: t.markCancelledConfirm,
                          confirmLabel: t.markCancelled,
                          cancelLabel: t.no,
                          danger: true,
                        })
                      ) {
                        void setStatus(order.id, 'CANCELLED');
                      }
                    }}
                    aria-label={t.markCancelled}
                    title={t.markCancelled}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {dialog}
    </div>
  );
}
