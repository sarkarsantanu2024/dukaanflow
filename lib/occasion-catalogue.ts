/**
 * The occasions worth watching in an Indian shop, ready to load in one click.
 *
 * Two kinds, and the difference is the whole reason this file is shaped the way
 * it is:
 *
 *  - **Fixed.** On the Gregorian calendar and never moving. Independence Day is
 *    the 15th of August this year, next year and every year. These carry their
 *    month and day here and need no upkeep from anybody, ever.
 *
 *  - **Moving.** On a lunar or solar-religious calendar — Diwali, Eid, Durga
 *    Puja — which shift by weeks against the Gregorian year. Their dates are
 *    NOT in this file, deliberately. Reproducing a panchang or a hijri
 *    conversion here would be a large amount of code that is wrong in some
 *    years and silently misfiles a festival when it is; and a wrong festival
 *    boundary is worse than an absent one, because it produces a confident
 *    number nobody can tell is false. Somebody enters those dates once a year,
 *    and the console shows exactly which are waiting.
 *
 * `state` scopes an occasion to shops in that state. Left blank for anything
 * widely kept across India — an occasion is scoped only when it would be noise
 * in a shop somewhere else, not merely because it began in one place.
 */

export type CatalogueOccasion = {
  name: string;
  /** A state code from `lib/states.ts`, or '' for all India. */
  state: string;
  /** 1–12, or null when the occasion moves. */
  fixedMonth: number | null;
  /** 1–31, or null when the occasion moves. */
  fixedDay: number | null;
  /** Days it runs, counting the first. */
  spanDays: number;
  note: string;
};

export const OCCASION_CATALOGUE: CatalogueOccasion[] = [
  /* ------------------------------- fixed dates ------------------------------ */
  { name: 'New Year', state: '', fixedMonth: 1, fixedDay: 1, spanDays: 1, note: '' },
  { name: 'Lohri', state: '', fixedMonth: 1, fixedDay: 13, spanDays: 1, note: '' },
  {
    name: 'Makar Sankranti',
    state: '',
    fixedMonth: 1,
    fixedDay: 14,
    spanDays: 1,
    note: 'Occasionally the 15th.',
  },
  {
    name: 'Pongal',
    state: 'TN',
    fixedMonth: 1,
    fixedDay: 14,
    spanDays: 4,
    note: 'Four days, Bhogi through Kaanum.',
  },
  { name: 'Republic Day', state: '', fixedMonth: 1, fixedDay: 26, spanDays: 1, note: '' },
  {
    name: 'Baisakhi',
    state: '',
    fixedMonth: 4,
    fixedDay: 13,
    spanDays: 2,
    note: 'The 13th or 14th; the two-day span covers both.',
  },
  { name: 'Ambedkar Jayanti', state: '', fixedMonth: 4, fixedDay: 14, spanDays: 1, note: '' },
  {
    name: 'Pohela Boishakh',
    state: 'WB',
    fixedMonth: 4,
    fixedDay: 14,
    spanDays: 2,
    note: 'Bengali new year — the 14th or 15th.',
  },
  {
    name: 'Bohag Bihu',
    state: 'AS',
    fixedMonth: 4,
    fixedDay: 14,
    spanDays: 3,
    note: 'Assamese new year.',
  },
  { name: 'Vishu', state: 'KL', fixedMonth: 4, fixedDay: 14, spanDays: 1, note: '' },
  { name: 'Independence Day', state: '', fixedMonth: 8, fixedDay: 15, spanDays: 1, note: '' },
  { name: 'Gandhi Jayanti', state: '', fixedMonth: 10, fixedDay: 2, spanDays: 1, note: '' },
  { name: 'Christmas', state: '', fixedMonth: 12, fixedDay: 25, spanDays: 1, note: '' },

  /* ------------------------- moving — dates needed -------------------------- */
  { name: 'Maha Shivaratri', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  {
    name: 'Holi',
    state: '',
    fixedMonth: null,
    fixedDay: null,
    spanDays: 2,
    note: 'Holika Dahan and Dhulandi.',
  },
  {
    name: 'Ugadi / Gudi Padwa',
    state: '',
    fixedMonth: null,
    fixedDay: null,
    spanDays: 1,
    note: 'Kept in Maharashtra, Karnataka, Andhra and Telangana.',
  },
  { name: 'Ram Navami', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  { name: 'Eid al-Fitr', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  {
    name: 'Ramzan',
    state: '',
    fixedMonth: null,
    fixedDay: null,
    spanDays: 30,
    note: 'The whole month — evening trade changes for all of it.',
  },
  { name: 'Buddha Purnima', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  { name: 'Ratha Yatra', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  { name: 'Eid al-Adha', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  { name: 'Muharram', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  { name: 'Raksha Bandhan', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  { name: 'Janmashtami', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  {
    name: 'Ganesh Chaturthi',
    state: '',
    fixedMonth: null,
    fixedDay: null,
    spanDays: 10,
    note: 'Ten days to visarjan.',
  },
  { name: 'Onam', state: 'KL', fixedMonth: null, fixedDay: null, spanDays: 10, note: '' },
  {
    name: 'Navratri',
    state: '',
    fixedMonth: null,
    fixedDay: null,
    spanDays: 9,
    note: 'Nine nights, running into Dussehra.',
  },
  {
    name: 'Durga Puja',
    state: 'WB',
    fixedMonth: null,
    fixedDay: null,
    spanDays: 5,
    note: 'Shashthi to Dashami — the biggest trading week of the Bengali year.',
  },
  { name: 'Dussehra', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  { name: 'Karva Chauth', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  { name: 'Dhanteras', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  {
    name: 'Diwali',
    state: '',
    fixedMonth: null,
    fixedDay: null,
    spanDays: 3,
    note: 'Choti Diwali, Lakshmi Puja, Govardhan.',
  },
  { name: 'Bhai Dooj', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
  {
    name: 'Chhath Puja',
    state: 'BR',
    fixedMonth: null,
    fixedDay: null,
    spanDays: 4,
    note: '',
  },
  { name: 'Guru Nanak Jayanti', state: '', fixedMonth: null, fixedDay: null, spanDays: 1, note: '' },
];

/** True when this occasion never moves and so never needs a yearly date. */
export function isFixed(occasion: { fixedMonth: number | null; fixedDay: number | null }): boolean {
  return occasion.fixedMonth !== null && occasion.fixedDay !== null;
}
