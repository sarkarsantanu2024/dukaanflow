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
