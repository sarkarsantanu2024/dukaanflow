'use client';

/**
 * A NEW ORDER RINGS THREE TIMES, AND WAITS ON SCREEN UNTIL THE OWNER GOES TO LOOK.
 *
 * Said once, an order is missed by an owner who was weighing rice or out at the
 * back. So each new order rings — the ring (`cueOrder`), then the sentence from
 * `spokenNewOrders` — up to `RINGS` times, `GAP_MS` apart, and a big bar
 * (`NewOrderBar`) stays across the top of every owner screen. Both end the
 * moment the owner acknowledges it:
 * - taps the bar, or opens the Orders screen, or opens the bell, or
 * - the order stops waiting (taken or cancelled from another phone).
 * The rings stop after three; the bar does not, because a bar costs nothing
 * and an order nobody has looked at is still a customer waiting.
 *
 * A second order arriving mid-way joins the first: the count starts again and
 * the sentence becomes "2 new orders, 450 in all", never two voices over each
 * other. On the Orders screen itself an order rings once (`ringOnce`) and
 * leaves nothing pending — it is already on the screen being looked at.
 *
 * With "say new orders out loud" off, the bar still comes and nothing rings.
 *
 * Kept at module level, not in the bell: every owner screen mounts its own
 * header, so a bell's timer would die with the screen the owner walked away
 * from, taking the remaining rings and the bar with it.
 */

import { speak } from '@/components/voice/useVoice';
import { ORDER_RING_MS, cueOrder } from '@/components/voice/cue';
import type { Locale } from '@/lib/i18n';
import { ANNOUNCE_LANG, announceOn, spokenNewOrders } from '@/lib/order-announce';

export const RINGS = 3;
/** Long enough for the owner to finish with the customer in front of them. */
const GAP_MS = 15_000;

type Alarm = {
  slug: string;
  locale: Locale;
  /** Order id → total in paise, for every order not yet acknowledged, oldest first. */
  orders: Map<string, number>;
  left: number;
};

/** What the bar shows. Replaced, never mutated, so React sees each change. */
export type AlarmView = { slug: string; count: number; totalPaise: number; newestId: string } | null;

let alarm: Alarm | null = null;
let view: AlarmView = null;
const listeners = new Set<() => void>();
let ringTimer: ReturnType<typeof setTimeout> | null = null;
let voiceTimer: ReturnType<typeof setTimeout> | null = null;

function publish() {
  if (!alarm || alarm.orders.size === 0) {
    view = null;
  } else {
    const ids = [...alarm.orders.keys()];
    view = {
      slug: alarm.slug,
      count: ids.length,
      totalPaise: [...alarm.orders.values()].reduce((all, one) => all + one, 0),
      newestId: ids[ids.length - 1]!,
    };
  }
  for (const listener of listeners) listener();
}

export function subscribeAlarm(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function alarmView(): AlarmView {
  return view;
}

function clearTimers() {
  if (ringTimer) clearTimeout(ringTimer);
  if (voiceTimer) clearTimeout(voiceTimer);
  ringTimer = voiceTimer = null;
}

/** The ring, then the words once it has finished. */
function sound(locale: Locale, totalsPaise: number[]) {
  cueOrder();
  voiceTimer = setTimeout(() => {
    speak(spokenNewOrders(locale, totalsPaise), ANNOUNCE_LANG[locale]);
  }, ORDER_RING_MS);
}

function ring() {
  clearTimers();
  const current = alarm;
  if (!current || current.left <= 0 || current.orders.size === 0) return;
  current.left -= 1;
  if (announceOn(current.slug)) sound(current.locale, [...current.orders.values()]);
  if (current.left > 0) ringTimer = setTimeout(ring, GAP_MS);
}

/** New orders have come in: ring now and again, and show the bar, until acknowledged. */
export function raiseOrderAlarm(slug: string, locale: Locale, fresh: { id: string; totalAmountPaise: number }[]) {
  if (fresh.length === 0) return;
  if (!alarm || alarm.slug !== slug) alarm = { slug, locale, orders: new Map(), left: 0 };
  for (const order of fresh) alarm.orders.set(order.id, order.totalAmountPaise);
  alarm.locale = locale;
  alarm.left = RINGS;
  ring();
  publish();
}

/** New orders while the owner is already on the Orders screen: one ring, nothing pending. */
export function ringOnce(slug: string, locale: Locale, fresh: { totalAmountPaise: number }[]) {
  if (fresh.length === 0 || !announceOn(slug)) return;
  clearTimers();
  sound(
    locale,
    fresh.map((order) => order.totalAmountPaise),
  );
}

/** The owner has seen the orders: no more rings, no bar. What is being said now finishes. */
export function silenceOrderAlarm() {
  if (!alarm) return;
  clearTimers();
  alarm = null;
  publish();
}

/** Drops orders that are no longer waiting; silent once none are left. */
export function keepWaitingOnly(slug: string, waitingIds: string[]) {
  if (!alarm || alarm.slug !== slug) return;
  const waiting = new Set(waitingIds);
  let dropped = false;
  for (const id of [...alarm.orders.keys()]) {
    if (!waiting.has(id)) {
      alarm.orders.delete(id);
      dropped = true;
    }
  }
  if (alarm.orders.size === 0) silenceOrderAlarm();
  else if (dropped) publish();
}
