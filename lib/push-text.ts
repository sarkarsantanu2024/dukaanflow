/**
 * What a notification says, in three languages.
 *
 * Kept apart from `owner-i18n` and `i18n` because these are the only strings in
 * the product written by the SERVER, into a payload, for a phone that may read
 * them hours later with the app shut. They have to stand alone: no surrounding
 * screen, no context, and a lock screen's worth of room.
 *
 * The customer's notification is in the SHOP's language rather than the
 * shopper's. The shopper's choice lives in their own browser's storage and the
 * server has never seen it — and the shop's language is the language of the
 * para the shop is in, which is very nearly always the same answer.
 */

import type { Locale } from './i18n';
import { plainPaise } from './money';

type PushDictionary = {
  /** Title of the owner's "an order has come in". */
  newOrderTitle: string;
  /** "Rekha · Bazaar side" — who and where, under the title. */
  newOrderPickup: string;
  newOrderDelivery: string;

  /** Titles for what the customer is told. */
  confirmedTitle: string;
  confirmedBody: string;
  readyPickupTitle: string;
  readyPickupBody: string;
  readyDeliveryTitle: string;
  readyDeliveryBody: string;
  cancelledTitle: string;
  cancelledBody: string;
  revisedTitle: string;
  /** Followed by the new total. */
  revisedBody: string;

  /** The owner's free trial has run out. */
  trialOverTitle: string;
  trialOverBody: string;
  /** The last few days of it, so the end is not a surprise. */
  trialEndingTitle: string;
  /** "3 days left" — the number is put in front of this. */
  trialEndingDays: string;
  trialEndingBody: string;
};

const DICTIONARIES: Record<Locale, PushDictionary> = {
  en: {
    newOrderTitle: 'New order',
    newOrderPickup: 'Pickup',
    newOrderDelivery: 'Delivery',
    confirmedTitle: 'Order received',
    confirmedBody: 'is getting your order ready.',
    readyPickupTitle: 'Your order is ready',
    readyPickupBody: 'Please collect it from',
    readyDeliveryTitle: 'Your order is on its way',
    readyDeliveryBody: 'It has left',
    cancelledTitle: 'Order could not be taken',
    cancelledBody: 'could not take your order this time.',
    trialOverTitle: 'Your free trial has ended',
    trialOverBody:
      'Your shop page and QR keep working. To add or change items again, choose a plan in the app.',
    trialEndingTitle: 'Your free trial is nearly over',
    trialEndingDays: 'days left',
    trialEndingBody: 'Choose a plan in the app to carry on without a break.',
    revisedTitle: 'Your order has changed',
    revisedBody: 'did not have everything. New total:',
  },
  bn: {
    newOrderTitle: 'নতুন অর্ডার',
    newOrderPickup: 'দোকান থেকে',
    newOrderDelivery: 'ডেলিভারি',
    confirmedTitle: 'অর্ডার পেয়েছি',
    confirmedBody: 'আপনার অর্ডার তৈরি করছে।',
    readyPickupTitle: 'আপনার অর্ডার তৈরি',
    readyPickupBody: 'নিয়ে আসুন —',
    readyDeliveryTitle: 'অর্ডার রওনা হয়েছে',
    readyDeliveryBody: 'বেরিয়ে গেছে —',
    cancelledTitle: 'অর্ডার নেওয়া গেল না',
    cancelledBody: 'এবার আপনার অর্ডারটি নিতে পারল না।',
    trialOverTitle: 'আপনার ফ্রি সময় শেষ',
    trialOverBody:
      'দোকানের পাতা আর QR ঠিকই চলবে। আবার জিনিস যোগ বা বদল করতে অ্যাপে একটা প্ল্যান নিন।',
    trialEndingTitle: 'ফ্রি সময় প্রায় শেষ',
    trialEndingDays: 'দিন বাকি',
    trialEndingBody: 'কাজ না থামিয়ে চালিয়ে যেতে অ্যাপে একটা প্ল্যান নিন।',
    revisedTitle: 'অর্ডার বদলেছে',
    revisedBody: 'সব জিনিস ছিল না। নতুন মোট:',
  },
  hi: {
    newOrderTitle: 'नया ऑर्डर',
    newOrderPickup: 'दुकान से',
    newOrderDelivery: 'डिलीवरी',
    confirmedTitle: 'ऑर्डर मिल गया',
    confirmedBody: 'आपका ऑर्डर तैयार कर रहे हैं।',
    readyPickupTitle: 'आपका ऑर्डर तैयार है',
    readyPickupBody: 'यहाँ से ले जाइए —',
    readyDeliveryTitle: 'ऑर्डर रवाना हो गया',
    readyDeliveryBody: 'निकल चुका है —',
    cancelledTitle: 'ऑर्डर नहीं लिया जा सका',
    cancelledBody: 'इस बार आपका ऑर्डर नहीं ले सका।',
    trialOverTitle: 'आपका फ्री समय खत्म',
    trialOverBody:
      'दुकान का पेज और QR चलता रहेगा। दोबारा सामान जोड़ने या बदलने के लिए ऐप में प्लान चुनिए।',
    trialEndingTitle: 'फ्री समय लगभग खत्म',
    trialEndingDays: 'दिन बचे',
    trialEndingBody: 'बिना रुकावट चलाने के लिए ऐप में प्लान चुनिए।',
    revisedTitle: 'ऑर्डर बदल गया',
    revisedBody: 'सब सामान नहीं था। नया कुल:',
  },
};

function pushDict(locale: Locale): PushDictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}

/**
 * What the shopkeeper's phone shows when an order lands.
 *
 * The total is in the title beside the word, not the body — a lock screen
 * truncates the body first, and the size of the order is what decides whether
 * this is worth putting a customer on hold for.
 */
export function newOrderNotification(input: {
  locale: Locale;
  customerName: string;
  customerArea: string;
  orderType: 'DELIVERY' | 'PICKUP';
  totalAmountPaise: number;
}): { title: string; body: string } {
  const t = pushDict(input.locale);
  const who = [
    input.customerName || null,
    input.customerArea || null,
    input.orderType === 'DELIVERY' ? t.newOrderDelivery : t.newOrderPickup,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    title: `${t.newOrderTitle} · ${plainPaise(input.totalAmountPaise)}`,
    body: who,
  };
}

/**
 * What the customer's phone shows when their order moves.
 *
 * Returns null for the states that are not worth interrupting somebody for. An
 * order going from NEW to CONFIRMED at the instant it is placed is not news to
 * the person who just placed it, and a notification that says nothing is how a
 * customer turns notifications off.
 */
export function orderStatusNotification(input: {
  locale: Locale;
  shopName: string;
  status: 'NEW' | 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED';
  orderType: 'DELIVERY' | 'PICKUP';
}): { title: string; body: string } | null {
  const t = pushDict(input.locale);

  /**
   * "Your order is ready" belongs to READY, and used to fire on COMPLETED.
   *
   * That was the wrong moment by one whole step: COMPLETED means the goods have
   * been handed over and the money accounted for, so the invitation to come and
   * collect arrived after the collection. COMPLETED now sends nothing — the
   * customer is standing there with the bag.
   */
  if (input.status === 'CANCELLED') {
    return { title: t.cancelledTitle, body: `${input.shopName} ${t.cancelledBody}` };
  }
  return null;
}

/** What the customer is told when the shop cut the order down to what it had. */
export function orderRevisedNotification(input: {
  locale: Locale;
  shopName: string;
  totalAmountPaise: number;
}): { title: string; body: string } {
  const t = pushDict(input.locale);
  return {
    title: t.revisedTitle,
    body: `${input.shopName} ${t.revisedBody} ${plainPaise(input.totalAmountPaise)}`,
  };
}

/**
 * What the owner's phone shows about their free trial.
 *
 * TWO MOMENTS, NOT ONE. The day it ends is too late to be the first anybody
 * hears of it — an owner who opens the app to a locked item list on a Tuesday
 * morning has been ambushed by us, and the fix takes a payment they have not
 * arranged. So there is a warning while there is still time to act on it, and
 * the plain fact when it happens.
 *
 * Neither says the shop has stopped, because it has not: the storefront and the
 * QR go on working when a trial lapses. Only editing stops. Saying "your shop
 * is closed" would be a lie that costs the owner a day of panic.
 */
export function trialNotification(input: {
  locale: Locale;
  /** Days remaining. Zero or less means it has already run out. */
  daysLeft: number;
}): { title: string; body: string } {
  const t = pushDict(input.locale);

  if (input.daysLeft <= 0) {
    return { title: t.trialOverTitle, body: t.trialOverBody };
  }

  return {
    title: `${t.trialEndingTitle} · ${input.daysLeft} ${t.trialEndingDays}`,
    body: t.trialEndingBody,
  };
}
