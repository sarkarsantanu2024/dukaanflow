/**
 * Dates and times, in the shop's day.
 *
 * Two problems, one cause. Formatting a date without naming a timezone uses
 * whatever the machine is set to — which for a page rendered on the server and
 * then hydrated in a browser means two different answers for the same instant.
 * React notices and throws out the tree.
 *
 * The deeper version of the same bug is quieter: Vercel runs in UTC, so
 * `setHours(0,0,0,0)` gave a "today" that began at 5.30am in the shop. A sale
 * rung up at six in the morning counted toward yesterday, and the owner
 * reconciling a drawer would never work out why.
 *
 * Every shop here is in India, so the day is pinned to India. Server and
 * browser now agree, and "today" is the day the shopkeeper is standing in.
 */

const ZONE = 'Asia/Kolkata';
const LOCALE = 'en-IN';
/** India is UTC+5:30 and observes no daylight saving, so this never moves. */
const OFFSET_MINUTES = 330;

type When = Date | string | number;

function toDate(value: When): Date {
  return value instanceof Date ? value : new Date(value);
}

/** "7:30 pm" — the wall clock in the shop, wherever this is rendered. */
export function formatClock(value: When): string {
  return toDate(value).toLocaleTimeString(LOCALE, {
    timeZone: ZONE,
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "27/08/2026" */
export function formatDay(value: When): string {
  return toDate(value).toLocaleDateString(LOCALE, {
    timeZone: ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** "27/08/2026, 7:30 pm" */
export function formatDayTime(value: When): string {
  return `${formatDay(value)}, ${formatClock(value)}`;
}

/**
 * Midnight at the start of the shop's day, as a real instant.
 *
 * Used for "today's takings", which is a shopkeeper's day — opening to
 * closing — and not the last 24 hours, nor a day that turns over while the
 * shutter is still up.
 */
export function startOfBusinessDay(now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() + OFFSET_MINUTES * 60_000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - OFFSET_MINUTES * 60_000);
}

export type ShopClock = {
  /** Full year, e.g. 2026. */
  year: number;
  /** 1–12, not the 0-based month `Date` deals in. */
  month: number;
  /** 1–31. */
  day: number;
  /** 0–23 on the shop's wall clock. */
  hour: number;
  /** 0 = Monday … 6 = Sunday. The Indian week is read starting Monday. */
  weekday: number;
};

/**
 * An instant broken into the wall-clock parts a shopkeeper would read off it.
 *
 * Reporting buckets — busiest hour, busiest day — are meaningless without
 * this. A shop's evening rush lands between 18:00 and 21:00 IST, which in the
 * UTC the database stores is 12:30 to 15:30 and straddles no boundary anyone
 * recognises. Bucketing on the raw timestamp would have told an owner their
 * shop is busiest at lunchtime.
 */
export function shopClock(value: When): ShopClock {
  const shifted = new Date(toDate(value).getTime() + OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    weekday: (shifted.getUTCDay() + 6) % 7,
  };
}

/**
 * Midnight in the shop's timezone on the first of a month, as a real instant.
 * `month` is 1–12 and may overflow — month 13 is January of the next year,
 * which is how a period's exclusive end is written.
 */
export function shopMonthStart(year: number, month: number): Date {
  const utcMidnight = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  return new Date(utcMidnight - OFFSET_MINUTES * 60_000);
}

export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** "6 pm", "12 noon" — an hour bucket as a shopkeeper would say it. */
export function formatHourBucket(hour: number): string {
  if (hour === 0) return '12 midnight';
  if (hour === 12) return '12 noon';
  return hour < 12 ? `${hour} am` : `${hour - 12} pm`;
}
