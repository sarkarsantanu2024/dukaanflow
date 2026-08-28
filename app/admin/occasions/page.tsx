import { AdminHeader } from '@/components/admin/AdminHeader';
import { OccasionsManager } from '@/components/admin/OccasionsManager';
import { resolveOccasions } from '@/lib/occasions';
import { OCCASION_CATALOGUE } from '@/lib/occasion-catalogue';
import { SHIPPED_YEARS } from '@/lib/occasion-dates';
import { shopClock } from '@/lib/time';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'DukaanFlow — Occasions' };

export default async function OccasionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const asked = Number(Array.isArray(params.year) ? params.year[0] : params.year);
  const thisYear = shopClock(new Date()).year;

  const years = [...new Set([...SHIPPED_YEARS, thisYear])].sort();
  const year = years.includes(asked) ? asked : years.includes(thisYear) ? thisYear : years[0];

  const occasions = await resolveOccasions(year);

  return (
    <>
      <AdminHeader title="Occasions" eyebrow="Festival calendar" backHref="/admin" />

      <main className="px-4 py-5 lg:px-6">
        <p className="mb-5 max-w-3xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm leading-relaxed text-slate-600 shadow-card">
          <strong>You do not enter dates.</strong> The festival dates ship with DukaanFlow — press
          the button below and the calendar is ready, Diwali and Eid included.
          <br />
          <br />
          Published dates are good to about a day, and regional practice varies, so any row can be
          adjusted from the list if a festival was kept differently where your shops are. Nothing
          needs adjusting for the report to work.
          <br />
          <br />
          Regional occasions only reach shops in that state, so{' '}
          <strong>a shop with no state set sees all-India occasions only</strong> — set it on the
          shop&rsquo;s own page. After adding or adjusting anything, run{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
            npm run rollup -- {year}
          </code>{' '}
          so existing orders are matched to it.
        </p>

        <OccasionsManager
          occasions={occasions}
          year={year}
          years={years}
          catalogueSize={OCCASION_CATALOGUE.length}
        />
      </main>
    </>
  );
}
