import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PLAN_ORDER,
  PLAN_SPECS,
  TRIAL_DAYS,
  formatPlanPrice,
  yearPrice,
  yearSaving,
} from '@/lib/plans';
import { ShopArt, VoiceArt } from '@/components/ui/ShopArt';
import { CheckIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Pricing`,
  description: 'One price per shop, by how many items you sell. No commission on orders.',
  robots: { index: true, follow: true },
};

/**
 * The page a shopkeeper is sent when they ask what this costs.
 *
 * Written for someone standing behind a counter, not a procurement team: the
 * number, what they get, and how to start. The one thing it says loudest is
 * that Halkhata never takes a cut of an order — the fear every small shop
 * has about going online is that a platform will start owning their customers.
 *
 * Unlike the console this is a page to read, so it is centred at a comfortable
 * measure rather than run to the window edge.
 */

const HEADLINE_STATS = [
  { value: '0%', label: 'commission on every order you take' },
  { value: '3', label: 'languages your shop speaks — English, हिंदी, বাংলা' },
  { value: `${TRIAL_DAYS} days`, label: 'of Pro when you start, free' },
];

/** Rows are what a shopkeeper actually asks about, in the order they ask. */
const COMPARISON: { feature: string; free: boolean; starter: boolean; pro: boolean }[] = [
  { feature: 'QR shop page and printable poster', free: true, starter: true, pro: true },
  { feature: 'Orders on WhatsApp, unlimited', free: true, starter: true, pro: true },
  { feature: 'Add items by speaking', free: true, starter: true, pro: true },
  { feature: 'Counter till with UPI QR', free: true, starter: true, pro: true },
  { feature: 'Order history in the app', free: false, starter: true, pro: true },
  { feature: 'Bulk price and stock updates', free: false, starter: true, pro: true },
  { feature: 'Storefront and owner photos', free: false, starter: false, pro: true },
  { feature: 'Priority support on WhatsApp', free: false, starter: false, pro: true },
];

const STEPS = [
  'We set up your shop and print your QR — send us the name, number and address.',
  'You get a link on WhatsApp. Open it, and your shop app is ready. Nothing to download from a store.',
  'Add your items by speaking, in your own language. Your phone reads each one back.',
  'Customers scan the QR, choose, and the order arrives on your WhatsApp. You keep every rupee.',
];

export default function PricingPage() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '';
  const startUrl = support
    ? `https://wa.me/${support}?text=${encodeURIComponent('I want a ${BRAND_NAME} shop.')}`
    : '#plans';

  return (
    <main className="min-h-dvh bg-white">
      <header className="bg-gradient-to-br from-brand-700 via-brand-700 to-brand-600 px-4 pb-16 pt-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">{BRAND_NAME}</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.1] sm:text-5xl">
              One price per shop.
              <br />
              Never a cut of your orders.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/85">
              You pay for how many items you list — nothing else. Orders, customers and QR scans are
              unlimited on every plan, because charging a shop more for selling more is not a
              partnership.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={startUrl}
                target={support ? '_blank' : undefined}
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#25D366] px-6 font-semibold text-white transition hover:bg-[#1eb457]"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Start on WhatsApp
              </a>
              <a
                href="#plans"
                className="inline-flex h-12 items-center rounded-xl bg-white/15 px-6 font-semibold backdrop-blur transition hover:bg-white/25"
              >
                See the plans
              </a>
            </div>
          </div>

          <div className="w-full max-w-sm shrink-0 rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
            <ShopArt className="h-48 w-full" />
          </div>
        </div>

        <dl className="mx-auto mt-12 grid max-w-6xl gap-4 border-t border-white/15 pt-8 sm:grid-cols-3">
          {HEADLINE_STATS.map((stat) => (
            <div key={stat.label}>
              <dd className="text-3xl font-bold tabular-nums">{stat.value}</dd>
              <dt className="mt-1 text-sm text-white/75">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </header>

      <section id="plans" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-slate-900">Pick by how much you sell</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
          A tea stall with nine items and a kirana with four hundred get very different value from
          the same software. Item count is the only thing that changes the price.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const spec = PLAN_SPECS[id];
            const featured = id === 'STARTER';
            return (
              <div
                key={id}
                className={
                  featured
                    ? 'relative rounded-2xl border-2 border-brand-600 bg-white p-6 shadow-card'
                    : 'rounded-2xl border border-slate-200 bg-white p-6'
                }
              >
                {featured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Most shops
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-900">{spec.name}</h3>
                <p className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tabular-nums text-slate-900">
                    ₹{spec.price}
                  </span>
                  <span className="text-sm text-slate-500">
                    {/* No tier is free any more, so the "forever" case that
                        used to sit here would only ever be a lie waiting to be
                        printed. */}
                    / month
                  </span>
                </p>

                {/* THE YEARLY PRICE, ON THE CARD RATHER THAN BEHIND A TOGGLE.
                    A shop that pays once a year has one chance to leave instead
                    of twelve, which matters more to this business than the two
                    months given away — so the offer has to be read, not
                    discovered. ₹2,490 for a year of Pro also reads as cheaper
                    than every billing app a kirana is already paying for. */}
                <p className="mt-1 text-sm font-semibold text-brand-700">
                    ₹{yearPrice(spec.id).toLocaleString('en-IN')} for a year
                  <span className="font-normal text-slate-500">
                    {' '}— save ₹{yearSaving(spec.id).toLocaleString('en-IN')}
                  </span>
                </p>

                <p className="mt-1 text-sm text-slate-500">{spec.tagline}</p>

                <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Up to {spec.itemLimit.toLocaleString('en-IN')} items
                </p>

                <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
                  {spec.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* The table answers the question the cards raise: what exactly is
            different? Ticks and dashes read faster than three feature lists. */}
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-200 py-3 text-left font-semibold text-slate-900">
                  Everything included
                </th>
                {PLAN_ORDER.map((id) => (
                  <th
                    key={id}
                    className="w-28 border-b border-slate-200 py-3 text-center font-semibold text-slate-900"
                  >
                    {PLAN_SPECS[id].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature}>
                  <td className="border-b border-slate-100 py-3 pr-4 text-slate-700">
                    {row.feature}
                  </td>
                  {([row.free, row.starter, row.pro] as const).map((included, index) => (
                    <td
                      key={PLAN_ORDER[index]}
                      className="border-b border-slate-100 py-3 text-center"
                    >
                      {included ? (
                        <CheckIcon
                          className="mx-auto h-4 w-4 text-brand-600"
                          label={`Included in ${PLAN_SPECS[PLAN_ORDER[index]!].name}`}
                        />
                      ) : (
                        <span className="text-slate-300" aria-label="Not included">
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <ol className="mt-6 space-y-5">
              {STEPS.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
                  >
                    {index + 1}
                  </span>
                  <p className="text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card">
            <VoiceArt className="h-36 w-full" />
            <p className="mt-4 text-center text-slate-600">
              &ldquo;চাল এক কেজি ৬৮ টাকা&rdquo; — and the item is listed, priced, and live on your
              QR page.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl bg-brand-700 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Start with {TRIAL_DAYS} days of Pro, free</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            Pay by UPI when it ends — by the month or by the year, no contract, stop whenever you
            like. A year costs two months less than paying monthly. If you stop, your shop page and
            QR keep working; you simply cannot change items until you come back.
          </p>
          <a
            href={startUrl}
            target={support ? '_blank' : undefined}
            rel="noreferrer"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-[#25D366] px-6 font-semibold text-white transition hover:bg-[#1eb457]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Start on WhatsApp
          </a>
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          <Link href="/" className="underline">
            {BRAND_NAME}
          </Link>{' '}
          · Scan → Select → Order
        </p>
      </section>
    </main>
  );
}
