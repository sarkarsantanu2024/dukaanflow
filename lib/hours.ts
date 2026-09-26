/**
 * The hours a shop keeps, formatted for whoever is reading.
 *
 * Stored as "HH:MM" on a 24-hour clock because that is what `<input
 * type="time">` speaks, and shown as "9:30 am – 9:00 pm" because that is how a
 * shop's board is written. One place does the conversion so the customer page
 * and the owner's own card can never disagree about what the shop said.
 */

/** "18:30" → "6:30 pm". Blank or malformed in, blank out. */
export function formatClockTime(value: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return '';

  const hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour < 12 ? 'am' : 'pm';
  // 0 and 12 both read as 12 on a clock face — midnight and noon.
  const display = hour % 12 === 0 ? 12 : hour % 12;

  return minute === '00' ? `${display} ${suffix}` : `${display}:${minute} ${suffix}`;
}

/**
 * Whether `now` falls inside the shop's hours, by the clock of the phone in
 * the shop. True when the shop has not said its hours: then the owner's own
 * shutter is the only word on it. A close before the open is a shop that runs
 * past midnight; equal times are a shop that never shuts.
 */
export function withinHours(openTime: string, closeTime: string, now: Date): boolean {
  const minutes = (value: string) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const open = minutes(openTime);
  const close = minutes(closeTime);
  if (open === null || close === null || open === close) return true;
  const at = now.getHours() * 60 + now.getMinutes();
  return open < close ? at >= open && at < close : at >= open || at < close;
}

/**
 * "9 am – 9 pm", or blank when the shop has not said.
 *
 * Both halves or neither: one time alone tells a customer nothing useful, and
 * the validator refuses to store a half-set pair for the same reason.
 */
export function formatClockRange(openTime: string, closeTime: string): string {
  const open = formatClockTime(openTime);
  const close = formatClockTime(closeTime);
  return open && close ? `${open} – ${close}` : '';
}
