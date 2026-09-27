/**
 * NEW ORDERS, SAID OUT LOUD.
 *
 * A push notification is a buzz and a line of text on a phone lying face down
 * beside the scales, and on some phones and browsers it does not arrive at all.
 * An owner asked for the phone to simply say it: "২০০ টাকার একটা নতুন অর্ডার
 * এসেছে". The bell (`OwnerBell`) already asks for waiting orders every twenty
 * seconds on every owner screen, so it is the one place that knows an order is
 * new — this file holds the sentence and the on/off switch it reads.
 *
 * On this phone only (localStorage), on by default. It works while Halkhata is
 * open; an order that arrived while it was closed is said the moment it opens —
 * which is also what tapping a push notification does.
 */

import type { Locale } from './i18n';
import type { VoiceLang } from './speech';

const ON_KEY = (slug: string) => `halkhata:announce:${slug}`;
const MARK_KEY = (slug: string) => `halkhata:announce:mark:${slug}`;

export const ANNOUNCE_LANG: Record<Locale, VoiceLang> = { en: 'en-IN', bn: 'bn-IN', hi: 'hi-IN' };

export function announceOn(slug: string): boolean {
  try {
    return window.localStorage.getItem(ON_KEY(slug)) !== 'off';
  } catch {
    return true;
  }
}

export function setAnnounceOn(slug: string, on: boolean) {
  try {
    window.localStorage.setItem(ON_KEY(slug), on ? 'on' : 'off');
  } catch {
    // Storage refused: the switch lasts for this visit only.
  }
}

/** The newest order time already said on this phone (ISO), or '' before the first look. */
export function announcedUpTo(slug: string): string {
  try {
    return window.localStorage.getItem(MARK_KEY(slug)) ?? '';
  } catch {
    return '';
  }
}

export function setAnnouncedUpTo(slug: string, iso: string) {
  try {
    window.localStorage.setItem(MARK_KEY(slug), iso);
  } catch {
    // Nothing to do; the worst case is saying one order twice.
  }
}

/**
 * What the CUSTOMER's phone says when the shop does something to their order:
 * changed it (with the new total), finished it, or could not take it. In the
 * language the shopper chose on their own phone. Several at once are said one
 * after another, newest last.
 */
export function spokenCustomerUpdates(
  locale: Locale,
  updates: { kind: 'changed' | 'done' | 'cancelled'; totalPaise: number | null }[],
): string {
  const rupees = (paise: number) => String(Math.round(paise / 100));
  const one = (update: (typeof updates)[number]): string => {
    if (update.kind === 'changed') {
      const total = update.totalPaise !== null ? rupees(update.totalPaise) : '';
      if (locale === 'bn') return total ? `দোকান আপনার অর্ডার বদলেছে, নতুন মোট ${total} টাকা` : 'দোকান আপনার অর্ডার বদলেছে';
      if (locale === 'hi') return total ? `दुकान ने आपका ऑर्डर बदला है, नया कुल ${total} रुपये` : 'दुकान ने आपका ऑर्डर बदला है';
      return total ? `The shop changed your order. The new total is ${total} rupees` : 'The shop changed your order';
    }
    if (update.kind === 'done') {
      if (locale === 'bn') return 'আপনার অর্ডার সম্পূর্ণ হয়েছে, বিল হোয়াটসঅ্যাপে দেখুন';
      if (locale === 'hi') return 'आपका ऑर्डर पूरा हो गया है, बिल व्हाट्सऐप पर देखें';
      return 'Your order is complete. Check your bill on WhatsApp';
    }
    if (locale === 'bn') return 'দুঃখিত, দোকান এবার আপনার অর্ডারটি নিতে পারল না';
    if (locale === 'hi') return 'माफ़ कीजिए, दुकान इस बार आपका ऑर्डर नहीं ले पाई';
    return 'Sorry, the shop could not take your order this time';
  };
  return updates.map(one).join(locale === 'en' ? '. ' : '। ');
}

/**
 * What the phone says. Digits, not number words, with no separators: the
 * synthesiser reads digits in the utterance's own language (see
 * `lib/spoken-money.ts`), so "200" is said "দুশো" under bn-IN.
 */
export function spokenNewOrders(locale: Locale, totalsPaise: number[]): string {
  const rupees = (paise: number) => String(Math.round(paise / 100));
  const sum = totalsPaise.reduce((all, one) => all + one, 0);
  if (totalsPaise.length === 1) {
    const one = rupees(totalsPaise[0]!);
    if (locale === 'bn') return `${one} টাকার একটা নতুন অর্ডার এসেছে`;
    if (locale === 'hi') return `${one} रुपये का एक नया ऑर्डर आया है`;
    return `A new order for ${one} rupees has come in`;
  }
  const n = totalsPaise.length;
  if (locale === 'bn') return `${n}টা নতুন অর্ডার এসেছে, সব মিলিয়ে ${rupees(sum)} টাকার`;
  if (locale === 'hi') return `${n} नए ऑर्डर आए हैं, कुल ${rupees(sum)} रुपये के`;
  return `${n} new orders have come in, ${rupees(sum)} rupees in all`;
}
