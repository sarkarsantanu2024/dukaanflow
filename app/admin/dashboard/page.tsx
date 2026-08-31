import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { earnings } from '@/lib/earnings';
import { formatPaise, rupeesToPaise } from '@/lib/money';
import { EarningsTable } from '@/components/admin/EarningsTable';
import { ProductGuide } from '@/components/admin/ProductGuide';
import {
  AUTO_PAUSE_DAYS,
  GRACE_DAYS,
  LISTING_MINIMUM_PAISE,
  LISTING_PAISE_PER_ITEM,
  PLAN_ORDER,
  PLAN_SPECS,
  TRIAL_DAYS,
} from '@/lib/plans';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const metadata = { title: `${BRAND_NAME} — Dashboard` };

/**
 * The business, on one page.
 *
 * Distinct from Reports, which answers "how is a shop doing" for one shop at a
 * time. This answers "how is Halkhata doing" — what it earned, from how many
 * shops, on which plans — and carries the product reference the operator needs
 * when they are on the phone to a shopkeeper who has asked what they get for
 * ₹249.
 */
export default async function DashboardPage() {
  const [money, shops, itemCount, orderCount] = await Promise.all([
    earnings(),
    prisma.shop.findMany({
      where: { isDemo: false },
      select: { plan: true, subscriptionStatus: true, active: true },
    }),
    prisma.item.count(),
    prisma.order.count(),
  ]);

  const live = shops.filter((shop) => shop.active).length;
  const paying = shops.filter((shop) => shop.subscriptionStatus === 'ACTIVE').length;
  const trialing = shops.filter((shop) => shop.subscriptionStatus === 'TRIALING').length;
  const lapsed = shops.filter(
    (shop) => shop.subscriptionStatus === 'PAST_DUE' || shop.subscriptionStatus === 'CANCELLED',
  ).length;

  const byPlan = PLAN_ORDER.map((id) => ({
    spec: PLAN_SPECS[id],
    shops: shops.filter((shop) => shop.subscriptionStatus === 'ACTIVE' && shop.plan === id).length,
  }));

  return (
    <>
      <AdminHeader title="Dashboard" eyebrow="The business, not the shops" />

      <main className="space-y-6 px-4 py-5 lg:px-6">
        {/* Money first. Everything else on this page explains this row. */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="This month"
            value={formatPaise(money.thisMonthPaise)}
            hint="Everything recorded since the 1st"
            tone="brand"
          />
          <Tile
            label="This year"
            value={formatPaise(money.thisYearPaise)}
            hint="Subscriptions and listing work"
          />
          <Tile
            label="Every month, if nobody leaves"
            value={formatPaise(money.monthlyRecurringPaise)}
            hint={`${paying} paying shop${paying === 1 ? '' : 's'} at today's prices`}
            tone="muted"
          />
          <Tile
            label="All time"
            value={formatPaise(money.allTimePaise)}
            hint="Every payment ever recorded"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <EarningsTable months={money.months} years={money.years} />

          <div className="space-y-6">
            <Panel title="Shops">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Figure label="Total" value={shops.length} />
                <Figure label="Live" value={live} />
                <Figure label="Paying" value={paying} tone="brand" />
                <Figure label="On trial" value={trialing} tone="muted" />
                <Figure label="Lapsed" value={lapsed} tone={lapsed > 0 ? 'warn' : undefined} />
                <Figure label="Items listed" value={itemCount} />
                <Figure label="Orders taken" value={orderCount} />
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Demo shops are excluded here — they take no money and would
                inflate every count on the page.
              </p>
            </Panel>

            <Panel title="Who is on what">
              <ul className="space-y-2 text-sm">
                {byPlan.map(({ spec, shops: count }) => (
                  <li key={spec.id} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-slate-700">
                      {spec.name}
                      <span className="ml-1.5 text-xs text-slate-400">
                        {spec.itemLimit.toLocaleString('en-IN')} items
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-600">
                      <strong className="text-slate-900">{count}</strong> ×{' '}
                      {formatPaise(rupeesToPaise(spec.price))}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </section>

        {/* The price list and the rules, so the operator on a call has the
            answer in front of them rather than in lib/plans.ts. */}
        <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
          <h2 className="font-semibold text-slate-900">What we charge</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-3">Plan</th>
                  <th className="pb-2 pr-3">Items</th>
                  <th className="pb-2 pr-3">Per month</th>
                  <th className="pb-2 pr-3">Per item</th>
                  <th className="pb-2">Who it is for</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PLAN_ORDER.map((id) => {
                  const spec = PLAN_SPECS[id];
                  return (
                    <tr key={id}>
                      <td className="py-2 pr-3 font-semibold text-slate-900">{spec.name}</td>
                      <td className="py-2 pr-3 tabular-nums text-slate-600">
                        up to {spec.itemLimit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 pr-3 font-semibold tabular-nums text-brand-700">
                        {formatPaise(rupeesToPaise(spec.price))}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-slate-500">
                        {formatPaise(Math.round(rupeesToPaise(spec.price) / spec.itemLimit))}
                      </td>
                      <td className="py-2 text-slate-600">{spec.tagline}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Rule title="Free trial" body={`${TRIAL_DAYS} days on the top plan, so nothing is capped while a shop is deciding.`} />
            <Rule title="Grace" body={`${GRACE_DAYS} days after a period ends before item editing stops.`} />
            <Rule
              title="Auto-pause"
              body={`${AUTO_PAUSE_DAYS} days unpaid and the shop page stops taking orders. It reopens the moment a payment is recorded.`}
            />
            <Rule
              title="Listing service"
              body={`${LISTING_PAISE_PER_ITEM} paise per item we catalogue, minimum ${formatPaise(LISTING_MINIMUM_PAISE)}. Buys no subscription time.`}
            />
          </div>
        </section>

        <ProductGuide />
      </main>
    </>
  );
}

function Tile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'brand' | 'muted';
}) {
  const ring =
    tone === 'brand'
      ? 'border-brand-200 bg-brand-50'
      : tone === 'muted'
        ? 'border-slate-200 bg-slate-50'
        : 'border-slate-200 bg-white';
  const figure =
    tone === 'brand' ? 'text-brand-800' : tone === 'muted' ? 'text-slate-800' : 'text-slate-900';

  return (
    <div className={`rounded-2xl border p-4 shadow-card ${ring}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${figure}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Figure({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'brand' | 'muted' | 'warn';
}) {
  const colour =
    tone === 'brand'
      ? 'text-brand-700'
      : tone === 'muted'
        ? 'text-slate-700'
        : tone === 'warn'
          ? 'text-amber-600'
          : 'text-slate-900';
  return (
    <div>
      <dd className={`text-xl font-bold tabular-nums ${colour}`}>
        {value.toLocaleString('en-IN')}
      </dd>
      <dt className="text-xs text-slate-500">{label}</dt>
    </div>
  );
}

function Rule({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-700">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}
