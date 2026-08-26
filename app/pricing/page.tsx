import type { Metadata } from 'next';
import Link from 'next/link';
import { PLAN_ORDER, PLAN_SPECS, TRIAL_DAYS, formatPlanPrice } from '@/lib/plans';
import { ShopArt } from '@/components/ui/ShopArt';

export const metadata: Metadata = {
  title: 'DukaanFlow — Pricing',
  description: 'One price per shop, by how many items you sell. No commission on orders.',
  robots: { index: true, follow: true },
};

/**
 * The page a shopkeeper is sent when they ask what this costs.
 *
 * Written for someone standing behind a counter, not a procurement team: the
 * number, what they get, and how to start. The one thing it says loudest is
 * that DukaanFlow never takes a cut of an order — the fear every small shop
 * has about going online is that a platform will start owning their customers.
 */
export default function PricingPage() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '';
  const startUrl = support
    ? `https://wa.me/${support}?text=${encodeURIComponent('I want a DukaanFlow shop.')}`
    : '/';

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="bg-gradient-to-br from-brand-700 to-brand-600 px-4 py-12 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 md:flex-row">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">DukaanFlow</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              One price per shop. Never a cut of your orders.
            </h1>
            <p className="mt-3 max-w-xl text-white/85">
              You pay for how many items you list — nothing else. Orders, customers and QR scans are
              unlimited on every plan, because charging a shop more for selling more is not a
              partnership.
            </p>
          </div>
          <div className="w-full max-w-xs shrink-0 rounded-2xl bg-white/10 p-4 backdrop-blur md:w-80">
            <ShopArt className="h-44 w-full" />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const spec = PLAN_SPECS[id];
            const featured = id === 'STARTER';
            return (
              <div
                key={id}
                className={
                  featured
                    ? 'rounded-2xl border-2 border-brand-600 bg-white p-5 shadow-card'
                    : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-card'
                }
              >
                {featured && (
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">
                    Most shops
                  </p>
                )}
                <h2 className="text-lg font-bold text-slate-900">{spec.name}</h2>
                <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                  {formatPlanPrice(spec)}
                </p>
                <p className="mt-1 text-sm text-slate-500">{spec.tagline}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {spec.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-5 shadow-card">
          <h2 className="font-semibold text-slate-900">How it works</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              <strong>1.</strong> We set up your shop and print your QR — you send us the name,
              number and address.
            </li>
            <li>
              <strong>2.</strong> You get a link on WhatsApp. Open it, and your shop app is ready.
              Nothing to download from a store.
            </li>
            <li>
              <strong>3.</strong> Add your items by speaking — in Bengali, Hindi or English. Your
              phone reads each one back.
            </li>
            <li>
              <strong>4.</strong> Customers scan the QR, choose, and the order arrives on your
              WhatsApp. You keep every rupee.
            </li>
          </ol>
          <p className="mt-3 text-sm text-slate-500">
            Every new shop starts with {TRIAL_DAYS} days of Pro, free. Pay by UPI when it ends —
            monthly, no contract, stop whenever you like. If you stop, your shop page and QR keep
            working; you simply cannot change items until you come back.
          </p>

          <a
            href={startUrl}
            target={support ? '_blank' : undefined}
            rel="noreferrer"
            className="mt-5 inline-flex h-12 items-center rounded-xl bg-[#25D366] px-5 font-semibold text-white"
          >
            Start on WhatsApp
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          <Link href="/" className="underline">
            DukaanFlow
          </Link>{' '}
          · Scan → Select → WhatsApp
        </p>
      </section>
    </main>
  );
}
