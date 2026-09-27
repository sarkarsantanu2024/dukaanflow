'use client';

/**
 * A NEW ORDER RINGS THREE TIMES, AND WAITS ON SCREEN UNTIL THE OWNER GOES TO LOOK.
 *
 * Said once, an order is missed by an owner who was weighing rice or out at the
 * back. So each new order rings — the ring, then the sentence from
 * `spokenNewOrders` — up to `RINGS` times, `GAP_MS` apart, and a big bar
 * (`NewOrderBar`) stays across the top of every owner screen. Both end the
 * moment the owner acknowledges it:
 * - taps the bar, or opens the Orders screen, or opens the bell, or
 * - the order stops waiting (taken or cancelled from another phone).
 * The rings stop after three; the bar does not, because a bar costs nothing
 * and an order nobody has looked at is still a customer waiting.
 *
 * A second order arriving mid-way joins the first: the count starts again and
 * the sentence becomes "2 new orders, 450 in all". On the Orders screen itself
 * an order rings once (`ringOnce`) and leaves nothing pending — it is already on
 * the screen being looked at.
 *
 * With "say new orders out loud" off, the bar still comes and nothing rings.
 * The ringing itself is `components/voice/ring-alarm.ts`, shared with the
 * customer's alarm.
 */

import { createRingAlarm } from '@/components/voice/ring-alarm';
import type { Locale } from '@/lib/i18n';
import { ANNOUNCE_LANG, announceOn, spokenNewOrders } from '@/lib/order-announce';

export const RINGS = 3;
/** Long enough for the owner to finish with the customer in front of them. */
const GAP_MS = 15_000;

type Pending = { id: string; totalPaise: number };

/** Which shop and language the alarm is ringing for: one owner per phone at a time. */
let shop = { slug: '', locale: 'en' as Locale };

const alarm = createRingAlarm<Pending>({
  rings: RINGS,
  gapMs: GAP_MS,
  audible: () => announceOn(shop.slug),
  say: (list) => ({
    text: spokenNewOrders(
      shop.locale,
      list.map((order) => order.totalPaise),
    ),
    lang: ANNOUNCE_LANG[shop.locale],
  }),
});

/** What the bar shows. */
export type AlarmView = { slug: string; count: number; totalPaise: number; newestId: string } | null;

let lastPending: Pending[] | null = null;
let view: AlarmView = null;

export const subscribeAlarm = alarm.subscribe;

export function alarmView(): AlarmView {
  const pending = alarm.pending();
  if (pending !== lastPending) {
    lastPending = pending;
    view = pending
      ? {
          slug: shop.slug,
          count: pending.length,
          totalPaise: pending.reduce((all, order) => all + order.totalPaise, 0),
          newestId: pending[pending.length - 1]!.id,
        }
      : null;
  }
  return view;
}

/** New orders have come in: ring now and again, and show the bar, until acknowledged. */
export function raiseOrderAlarm(slug: string, locale: Locale, fresh: { id: string; totalAmountPaise: number }[]) {
  if (fresh.length === 0) return;
  if (slug !== shop.slug) alarm.silence();
  shop = { slug, locale };
  alarm.raise(fresh.map((order) => [order.id, { id: order.id, totalPaise: order.totalAmountPaise }]));
}

/** New orders while the owner is already on the Orders screen: one ring, nothing pending. */
export function ringOnce(slug: string, locale: Locale, fresh: { id: string; totalAmountPaise: number }[]) {
  shop = { slug, locale };
  alarm.ringOnce(fresh.map((order) => ({ id: order.id, totalPaise: order.totalAmountPaise })));
}

/** The owner has seen the orders: no more rings, no bar. What is being said now finishes. */
export function silenceOrderAlarm() {
  alarm.silence();
}

/** Drops orders that are no longer waiting; silent once none are left. */
export function keepWaitingOnly(slug: string, waitingIds: string[]) {
  if (slug !== shop.slug) return;
  const waiting = new Set(waitingIds);
  alarm.keepOnly((id) => waiting.has(id));
}
