'use client';

/**
 * A NEW ORDER IS SAID THREE TIMES, OR UNTIL THE OWNER GOES TO LOOK.
 *
 * Said once, an order is missed by an owner who was weighing rice or out at the
 * back. So each new order rings — ding-dong, then the sentence from
 * `spokenNewOrders` — up to `RINGS` times, `GAP_MS` apart, and stops early the
 * moment the owner acknowledges it:
 * - opens the Orders screen, or
 * - opens the bell, or
 * - the order stops waiting (taken or cancelled from another phone).
 *
 * A second order arriving mid-way joins the first: the count starts again and
 * the sentence becomes "2 new orders, 450 in all", never two voices over each
 * other. On the Orders screen itself an order rings once — it is already on
 * the screen being looked at.
 *
 * Kept at module level, not in the bell: every owner screen mounts its own
 * header, so a bell's timer would die with the screen the owner walked away
 * from, taking the remaining rings with it.
 */

import { speak } from '@/components/voice/useVoice';
import { cueOrder } from '@/components/voice/cue';
import type { Locale } from '@/lib/i18n';
import { ANNOUNCE_LANG, announceOn, spokenNewOrders } from '@/lib/order-announce';

export const RINGS = 3;
/** Long enough for the owner to finish with the customer in front of them. */
const GAP_MS = 15_000;
/** Lets the chime finish before the voice starts. */
const CHIME_MS = 700;

type Alarm = {
  slug: string;
  locale: Locale;
  /** Order id → total in paise, for every order not yet acknowledged. */
  orders: Map<string, number>;
  left: number;
};

let alarm: Alarm | null = null;
let ringTimer: ReturnType<typeof setTimeout> | null = null;
let voiceTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (ringTimer) clearTimeout(ringTimer);
  if (voiceTimer) clearTimeout(voiceTimer);
  ringTimer = voiceTimer = null;
}

function ring() {
  clearTimers();
  const current = alarm;
  if (!current || current.left <= 0 || current.orders.size === 0 || !announceOn(current.slug)) {
    alarm = null;
    return;
  }
  current.left -= 1;
  cueOrder();
  voiceTimer = setTimeout(() => {
    speak(spokenNewOrders(current.locale, [...current.orders.values()]), ANNOUNCE_LANG[current.locale]);
  }, CHIME_MS);
  if (current.left > 0) ringTimer = setTimeout(ring, GAP_MS);
}

/** New orders have come in: ring now, and again until acknowledged or `rings` is used up. */
export function raiseOrderAlarm(
  slug: string,
  locale: Locale,
  fresh: { id: string; totalAmountPaise: number }[],
  rings = RINGS,
) {
  if (fresh.length === 0) return;
  if (!alarm || alarm.slug !== slug) alarm = { slug, locale, orders: new Map(), left: 0 };
  for (const order of fresh) alarm.orders.set(order.id, order.totalAmountPaise);
  alarm.locale = locale;
  alarm.left = rings;
  ring();
}

/** The owner has seen the orders: no more rings. What is being said now finishes. */
export function silenceOrderAlarm() {
  clearTimers();
  alarm = null;
}

/** Drops orders that are no longer waiting; silent once none are left. */
export function keepWaitingOnly(slug: string, waitingIds: string[]) {
  if (!alarm || alarm.slug !== slug) return;
  const waiting = new Set(waitingIds);
  for (const id of [...alarm.orders.keys()]) if (!waiting.has(id)) alarm.orders.delete(id);
  if (alarm.orders.size === 0) silenceOrderAlarm();
}
