/**
 * Turning an occasion into a span of days in one year.
 *
 * This is the single place that answers "when did Diwali fall in 2026", and
 * everything that needs to know — the rollup, the report, the console's
 * "waiting for dates" list — asks here. Two implementations of this rule would
 * eventually disagree, and the disagreement would show up as a festival's
 * takings quietly differing between the screen and the CSV.
 */

import { prisma } from './prisma';
import { isFixed } from './occasion-catalogue';
import { shippedDates } from './occasion-dates';
import { shopMonthStart } from './time';

export type OccasionRecord = {
  id: string;
  name: string;
  state: string;
  fixedMonth: number | null;
  fixedDay: number | null;
  spanDays: number;
  note: string;
};

export type ResolvedOccasion = OccasionRecord & {
  /** Inclusive first day, `YYYY-MM-DD`, or null when the year's dates are unknown. */
  startsOn: string | null;
  endsOn: string | null;
  /** The half-open instant range `[from, to)` in shop time. Null with no dates. */
  from: Date | null;
  to: Date | null;
  /**
   * How the dates were arrived at, so the console can explain itself.
   *
   * `fixed` — arithmetic on a Gregorian date that never moves.
   * `shipped` — the published date, from `lib/occasion-dates.ts`. Good to about
   *             a day; nobody had to enter it.
   * `entered` — corrected by hand for this year, which beats both of the above.
   * `missing` — a moving occasion in a year the shipped table does not cover.
   */
  source: 'fixed' | 'shipped' | 'entered' | 'missing';
};

/** Midnight in the shop's timezone on a calendar day. */
function dayInstant(year: number, month: number, day: number): Date {
  return new Date(shopMonthStart(year, month).getTime() + (day - 1) * 86_400_000);
}

function isoDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** A `@db.Date` from Postgres is midnight UTC; only the date part is meaningful. */
function dateOnly(value: Date): { year: number; month: number; day: number } {
  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  };
}

/**
 * Places every occasion in one year.
 *
 * A fixed occasion is placed by arithmetic and needs nothing. A moving one is
 * placed from its `OccasionDate` row for that year, and is returned with
 * `source: 'missing'` when there is none — visible and fixable, rather than
 * silently absent.
 */
export async function resolveOccasions(year: number): Promise<ResolvedOccasion[]> {
  const occasions = await prisma.occasion.findMany({
    orderBy: [{ name: 'asc' }],
    select: {
      id: true,
      name: true,
      state: true,
      fixedMonth: true,
      fixedDay: true,
      spanDays: true,
      note: true,
      dates: { where: { year }, select: { startsOn: true, endsOn: true }, take: 1 },
    },
  });

  return occasions.map((occasion) => {
    const { dates, ...record } = occasion;

    // An entered date always wins. A festival that normally sits on a fixed day
    // but was observed a day out that year should report on the day it was
    // actually kept, not the day the calendar says.
    if (dates.length > 0) {
      const start = dateOnly(dates[0].startsOn);
      const end = dateOnly(dates[0].endsOn);
      const from = dayInstant(start.year, start.month, start.day);
      const to = dayInstant(end.year, end.month, end.day + 1);
      return {
        ...record,
        startsOn: isoDay(dates[0].startsOn),
        endsOn: isoDay(dates[0].endsOn),
        from,
        to,
        source: 'entered' as const,
      };
    }

    // The published date, shipped with the software. This is what makes the
    // occasion report work with nothing entered by anybody.
    const shipped = shippedDates(record.name, year);
    if (shipped) {
      const [first, last] = shipped;
      const start = { year: +first.slice(0, 4), month: +first.slice(5, 7), day: +first.slice(8, 10) };
      const end = { year: +last.slice(0, 4), month: +last.slice(5, 7), day: +last.slice(8, 10) };
      return {
        ...record,
        startsOn: first,
        endsOn: last,
        from: dayInstant(start.year, start.month, start.day),
        to: dayInstant(end.year, end.month, end.day + 1),
        source: 'shipped' as const,
      };
    }

    if (isFixed(record)) {
      const from = dayInstant(year, record.fixedMonth!, record.fixedDay!);
      const to = new Date(from.getTime() + Math.max(1, record.spanDays) * 86_400_000);
      return {
        ...record,
        // `to` is exclusive, so the last kept day is the day before it.
        startsOn: isoDay(new Date(Date.UTC(year, record.fixedMonth! - 1, record.fixedDay!))),
        endsOn: isoDay(
          new Date(
            Date.UTC(year, record.fixedMonth! - 1, record.fixedDay! + Math.max(1, record.spanDays) - 1),
          ),
        ),
        from,
        to,
        source: 'fixed' as const,
      };
    }

    return {
      ...record,
      startsOn: null,
      endsOn: null,
      from: null,
      to: null,
      source: 'missing' as const,
    };
  });
}

/** Only the ones that can actually be matched to orders. */
export function placeable(occasions: ResolvedOccasion[]): ResolvedOccasion[] {
  return occasions.filter((occasion) => occasion.from !== null && occasion.to !== null);
}
