/**
 * The shopkeeper's notice, and the one question anybody asks of it: is it
 * running today?
 *
 * Kept in one module because three places need the same answer and must never
 * disagree — the storefront that shows it, the closed page that falls back to
 * it, and the owner's own card that says whether customers can see it yet.
 *
 * Everything here works in CALENDAR DAYS IN SHOP TIME, never in instants. A
 * notice that runs "until the 14th" runs to the end of the 14th in the shop,
 * not to midnight UTC — which is half past five on the morning of the 14th,
 * and would take the notice down while the shutter was still up.
 */

import { shopClock } from './time';

/** "2026-08-30" for an instant, read on the shop's own calendar. */
export function shopDateKey(value: Date | string | number = new Date()): string {
  const clock = shopClock(value);
  return `${clock.year}-${String(clock.month).padStart(2, '0')}-${String(clock.day).padStart(2, '0')}`;
}

/**
 * A `@db.Date` column as "YYYY-MM-DD".
 *
 * Postgres `DATE` arrives through Prisma as midnight UTC, so the parts are read
 * in UTC rather than shifted into shop time — shifting would turn the 30th into
 * the 29th and move every notice a day early.
 */
export function dateInputValue(value: Date | null | undefined): string {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → the instant a `@db.Date` column stores for it. Blank → null. */
export function dateColumnValue(value: string): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export type ShopNotice = {
  noticeText: string;
  noticeFrom: Date | null;
  noticeTo: Date | null;
};

/**
 * The notice a customer should see right now, or `''`.
 *
 * Blank dates mean no bound on that end: "from Friday" runs until it is
 * cleared, and a notice with neither date runs until it is cleared. Both ends
 * are inclusive, because an owner writing "until the 14th" means the 14th.
 */
export function liveNotice(shop: ShopNotice, now: Date = new Date()): string {
  const text = shop.noticeText?.trim() ?? '';
  if (!text) return '';

  const today = shopDateKey(now);
  const from = dateInputValue(shop.noticeFrom);
  const to = dateInputValue(shop.noticeTo);

  if (from && today < from) return '';
  if (to && today > to) return '';
  return text;
}

/** Why a written notice is not on the shop page yet — or null when it is. */
export function noticeState(
  shop: ShopNotice,
  now: Date = new Date(),
): 'live' | 'scheduled' | 'finished' | 'none' {
  if (!shop.noticeText?.trim()) return 'none';
  const today = shopDateKey(now);
  const from = dateInputValue(shop.noticeFrom);
  const to = dateInputValue(shop.noticeTo);
  if (from && today < from) return 'scheduled';
  if (to && today > to) return 'finished';
  return 'live';
}
