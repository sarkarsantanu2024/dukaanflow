'use client';

/**
 * THE SHOP DID SOMETHING TO YOUR ORDER — SAID OUT LOUD, UNTIL YOU LOOK.
 *
 * The customer's twin of the owner's new-order alarm (`order-alarm.ts`), on the
 * same engine (`ring-alarm.ts`). When the shop changes an order, finishes it or
 * could not take it, the customer's phone rings, says so in the language they
 * chose, up to three times, and a bar across the top of the shop or order page
 * waits for a tap. It stops when the customer:
 * - opens that order's page, or taps the bar, or opens the bell.
 *
 * On that order's own page it rings once — the news is already in front of them.
 * The push notification carries the same news when the app is shut; this is
 * for the phone that has the shop open.
 */

import { createRingAlarm } from '@/components/voice/ring-alarm';
import type { Locale } from '@/lib/i18n';
import { ANNOUNCE_LANG, spokenCustomerUpdates } from '@/lib/order-announce';

export type CustomerNews = {
  /** Changes whenever the shop does something new to the order. */
  key: string;
  orderId: string;
  kind: 'changed' | 'done' | 'cancelled';
  shopName: string;
  shopSlug: string;
  totalPaise: number | null;
};

let lang: Locale = 'bn';

const alarm = createRingAlarm<CustomerNews>({
  rings: 3,
  gapMs: 15_000,
  audible: () => true,
  say: (list) => ({ text: spokenCustomerUpdates(lang, list), lang: ANNOUNCE_LANG[lang] }),
});

export const subscribeCustomerAlarm = alarm.subscribe;
export const customerAlarmPending = alarm.pending;

/** News the customer has not looked at: ring, repeat, and show the bar. One entry per order. */
export function raiseCustomerAlarm(locale: Locale, fresh: CustomerNews[]) {
  lang = locale;
  alarm.raise(fresh.map((news) => [news.orderId, news]));
}

/** News about the order already on screen: one ring, nothing pending. */
export function ringCustomerOnce(locale: Locale, fresh: CustomerNews[]) {
  lang = locale;
  alarm.ringOnce(fresh);
}

/** The customer has looked at everything: no more rings, no bar. */
export function silenceCustomerAlarm() {
  alarm.silence();
}

/** The customer is looking at this order: its news is seen. */
export function acknowledgeOrder(orderId: string) {
  alarm.keepOnly((key) => key !== orderId);
}

/** Where tapping the news goes: the order, or the shop for one that no longer exists. */
export function newsHref(news: CustomerNews): string {
  return news.kind === 'cancelled' && news.shopSlug ? `/shop/${news.shopSlug}` : `/track/${news.orderId}`;
}
