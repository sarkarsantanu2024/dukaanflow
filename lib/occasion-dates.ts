/**
 * When the moving festivals fall, shipped with the software.
 *
 * Diwali, Eid and Durga Puja run on lunar and solar-religious calendars, so
 * their Gregorian dates shift by weeks each year and cannot be computed from
 * anything already in this codebase. The previous design asked a human to type
 * them in once a year. That was the wrong place to put the work: nobody using
 * this console wants to maintain a panchang, and an occasion report that stays
 * empty until somebody does is a report that stays empty.
 *
 * So the dates live here instead, and the console asks for nothing.
 *
 * ACCURACY, stated plainly. These are the published dates for each festival's
 * main observance, and they are good to about a day. Regional practice varies —
 * Diwali is kept on different days in different states, and a lunar date turns
 * on a moonrise somebody has to observe. A window that is a day out will
 * attribute a day's trade to the wrong side of a festival boundary; it will not
 * meaningfully change which festival a week of trade belongs to, which is what
 * the report is actually for.
 *
 * A date here is a DEFAULT, never the last word. Anything entered through the
 * console for a specific year overrides it — see `lib/occasions.ts`, which
 * prefers an entered date over everything else.
 *
 * Years beyond this table resolve to nothing rather than to a guess. An
 * occasion missing from a report is a visible gap; an invented date is a
 * confident wrong number, and that is worse.
 */

/** `[first day, last day]`, both inclusive, as `YYYY-MM-DD`. */
export type DateSpan = [string, string];

/** Occasion name → year → the days it ran. Names match `OCCASION_CATALOGUE`. */
export const MOVING_DATES: Record<string, Record<number, DateSpan>> = {
  'Maha Shivaratri': {
    2025: ['2025-02-26', '2025-02-26'],
    2026: ['2026-02-15', '2026-02-15'],
    2027: ['2027-03-06', '2027-03-06'],
  },
  Holi: {
    2025: ['2025-03-13', '2025-03-14'],
    2026: ['2026-03-03', '2026-03-04'],
    2027: ['2027-03-21', '2027-03-22'],
  },
  Ramzan: {
    2025: ['2025-03-01', '2025-03-30'],
    2026: ['2026-02-18', '2026-03-19'],
    2027: ['2027-02-08', '2027-03-09'],
  },
  'Ugadi / Gudi Padwa': {
    2025: ['2025-03-30', '2025-03-30'],
    2026: ['2026-03-19', '2026-03-19'],
    2027: ['2027-04-07', '2027-04-07'],
  },
  'Eid al-Fitr': {
    2025: ['2025-03-31', '2025-03-31'],
    2026: ['2026-03-20', '2026-03-21'],
    2027: ['2027-03-10', '2027-03-11'],
  },
  'Ram Navami': {
    2025: ['2025-04-06', '2025-04-06'],
    2026: ['2026-03-27', '2026-03-27'],
    2027: ['2027-04-15', '2027-04-15'],
  },
  'Buddha Purnima': {
    2025: ['2025-05-12', '2025-05-12'],
    2026: ['2026-05-01', '2026-05-01'],
    2027: ['2027-05-20', '2027-05-20'],
  },
  'Eid al-Adha': {
    2025: ['2025-06-07', '2025-06-07'],
    2026: ['2026-05-27', '2026-05-28'],
    2027: ['2027-05-17', '2027-05-18'],
  },
  Muharram: {
    2025: ['2025-07-06', '2025-07-06'],
    2026: ['2026-06-16', '2026-06-17'],
    2027: ['2027-06-06', '2027-06-07'],
  },
  'Ratha Yatra': {
    2025: ['2025-06-27', '2025-06-27'],
    2026: ['2026-07-16', '2026-07-16'],
    2027: ['2027-07-05', '2027-07-05'],
  },
  'Raksha Bandhan': {
    2025: ['2025-08-09', '2025-08-09'],
    2026: ['2026-08-28', '2026-08-28'],
    2027: ['2027-08-17', '2027-08-17'],
  },
  Janmashtami: {
    2025: ['2025-08-16', '2025-08-16'],
    2026: ['2026-09-04', '2026-09-04'],
    2027: ['2027-08-25', '2027-08-25'],
  },
  Onam: {
    2025: ['2025-08-26', '2025-09-05'],
    2026: ['2026-08-17', '2026-08-27'],
    2027: ['2027-09-05', '2027-09-15'],
  },
  'Ganesh Chaturthi': {
    2025: ['2025-08-27', '2025-09-06'],
    2026: ['2026-09-14', '2026-09-24'],
    2027: ['2027-09-03', '2027-09-13'],
  },
  Navratri: {
    2025: ['2025-09-22', '2025-10-01'],
    2026: ['2026-10-11', '2026-10-19'],
    2027: ['2027-09-30', '2027-10-08'],
  },
  'Durga Puja': {
    2025: ['2025-09-28', '2025-10-02'],
    2026: ['2026-10-16', '2026-10-20'],
    2027: ['2027-10-05', '2027-10-09'],
  },
  Dussehra: {
    2025: ['2025-10-02', '2025-10-02'],
    2026: ['2026-10-20', '2026-10-20'],
    2027: ['2027-10-09', '2027-10-09'],
  },
  'Karva Chauth': {
    2025: ['2025-10-10', '2025-10-10'],
    2026: ['2026-10-29', '2026-10-29'],
    2027: ['2027-10-18', '2027-10-18'],
  },
  Dhanteras: {
    2025: ['2025-10-18', '2025-10-18'],
    2026: ['2026-11-06', '2026-11-06'],
    2027: ['2027-10-26', '2027-10-26'],
  },
  Diwali: {
    2025: ['2025-10-20', '2025-10-22'],
    2026: ['2026-11-07', '2026-11-09'],
    2027: ['2027-10-28', '2027-10-30'],
  },
  'Bhai Dooj': {
    2025: ['2025-10-23', '2025-10-23'],
    2026: ['2026-11-11', '2026-11-11'],
    2027: ['2027-10-31', '2027-10-31'],
  },
  'Chhath Puja': {
    2025: ['2025-10-25', '2025-10-28'],
    2026: ['2026-11-14', '2026-11-17'],
    2027: ['2027-11-02', '2027-11-05'],
  },
  'Guru Nanak Jayanti': {
    2025: ['2025-11-05', '2025-11-05'],
    2026: ['2026-11-24', '2026-11-24'],
    2027: ['2027-11-14', '2027-11-14'],
  },
};

/** The years this table covers, for the console to say so honestly. */
export const SHIPPED_YEARS = [2025, 2026, 2027] as const;

export function shippedDates(name: string, year: number): DateSpan | null {
  return MOVING_DATES[name]?.[year] ?? null;
}
