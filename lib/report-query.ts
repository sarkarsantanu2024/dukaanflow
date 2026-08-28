/**
 * The report's URL, parsed once.
 *
 * The console page and the CSV endpoint have to agree exactly on what a query
 * string means — a download that quietly differs from the table above the
 * button is the kind of bug nobody reports and everybody stops trusting the
 * tool over. So they read it through here, and nowhere else.
 *
 * Everything is clamped rather than rejected. This is a report, not a form: an
 * out-of-range year in a hand-edited URL should show the nearest sensible
 * period, not a 422.
 *
 * The query types live here rather than in `lib/analytics.ts` for one blunt
 * reason: the filter controls are a client component, and importing them from
 * the analytics module would pull Prisma into the browser bundle.
 */

import { shopClock } from './time';
import { SHOP_TYPES } from './validators';

export type ShopTypeId = (typeof SHOP_TYPES)[number];
/** `'ALL'` reports every shop together; a type id narrows to that trade. */
export type TypeFilter = ShopTypeId | 'ALL';
export type Granularity = 'month' | 'year';

export type ReportQuery = {
  /**
   * One shop's slug, or `''` for every shop that matches `typeFilter`.
   *
   * A shop, when named, wins over the type: the report is about that business,
   * and a type filter left over from the previous view must not be able to
   * empty it.
   */
  shopSlug: string;
  typeFilter: TypeFilter;
  granularity: Granularity;
  year: number;
  /** 1–12 for a monthly report, null for a yearly one. */
  month: number | null;
};

/** Nothing was recorded before DukaanFlow existed; no report can reach past it. */
export const FIRST_YEAR = 2026;

type Source = URLSearchParams | Record<string, string | string[] | undefined>;

function read(source: Source, key: string): string {
  if (source instanceof URLSearchParams) return source.get(key) ?? '';
  const value = source[key];
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export function parseReportQuery(source: Source, now: Date = new Date()): ReportQuery {
  // Default to the month in progress, not the one that just ended.
  //
  // The finished month is the tidier answer — its numbers are final — but on
  // the 3rd it means opening Reports to a page about five weeks ago, and on a
  // shop onboarded this month it means opening to nothing at all. The report
  // says on its own face that the period is unfinished, which costs a line and
  // buys a first screen that is about now.
  const today = shopClock(now);
  const fallback = { year: today.year, month: today.month };
  // The current year is reportable while it is still running — the report says
  // so in its caveats rather than refusing to show a period in progress.
  const latestYear = today.year;

  // Shape only — whether this slug names a real shop is the database's answer,
  // not this function's.
  const slug = read(source, 'shop').trim().toLowerCase();
  const shopSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : '';

  const type = read(source, 'type');
  const typeFilter: TypeFilter = (SHOP_TYPES as readonly string[]).includes(type)
    ? (type as TypeFilter)
    : 'ALL';

  const granularity: Granularity = read(source, 'granularity') === 'year' ? 'year' : 'month';

  const year = clamp(Number(read(source, 'year')), FIRST_YEAR, latestYear, fallback.year);
  const month =
    granularity === 'year' ? null : clamp(Number(read(source, 'month')), 1, 12, fallback.month);

  return { shopSlug, typeFilter, granularity, year, month };
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

/** The query string for a report, so links and the download button never drift. */
export function reportSearch(query: ReportQuery): string {
  const params = new URLSearchParams({
    type: query.typeFilter,
    granularity: query.granularity,
    year: String(query.year),
  });
  if (query.shopSlug) params.set('shop', query.shopSlug);
  if (query.granularity === 'month' && query.month) params.set('month', String(query.month));
  return params.toString();
}
