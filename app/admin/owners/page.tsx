import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { demoFilter, showingDemoShops } from '@/lib/demo';
import { entitlement, type Plan, type SubStatus } from '@/lib/plans';
import { formatClockRange } from '@/lib/hours';
import { formatDay } from '@/lib/time';
import { SHOP_TYPE_LABELS } from '@/lib/validators';
import { stateName } from '@/lib/states';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'DukaanFlow — Shop owners' };

/**
 * Every shop owner, in one table.
 *
 * The shops dashboard is a grid of cards built for working one shop at a time —
 * open this one, fix its prices, print its QR. This is the other question:
 * comparing them. Who has no PIN and therefore cannot open their own app, who
 * is on which plan, who never listed anything. A card grid answers that badly
 * and a table answers it at a glance.
 */
export default async function OwnersPage() {
  const showingDemo = await showingDemoShops();

  const shops = await prisma.shop.findMany({
    where: demoFilter(showingDemo),
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      phone: true,
      ownerName: true,
      locale: true,
      state: true,
      address: true,
      openTime: true,
      closeTime: true,
      active: true,
      isDemo: true,
      deliveryEnabled: true,
      ownerPinHash: true,
      ownerPinSetAt: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      createdAt: true,
      _count: { select: { items: true, orders: true, customers: true } },
    },
  });

  const rows = shops.map((shop) => {
    const state = entitlement({
      plan: shop.plan as Plan,
      subscriptionStatus: shop.subscriptionStatus as SubStatus,
      trialEndsAt: shop.trialEndsAt,
      currentPeriodEnd: shop.currentPeriodEnd,
    });
    return { shop, state };
  });

  return (
    <>
      <AdminHeader title="Shop owners" eyebrow="One row per shop" backHref="/admin" />

      <main className="px-4 py-5 lg:px-6">
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
          <table className="w-full min-w-[64rem] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Th>Shop</Th>
                <Th>Owner</Th>
                <Th>WhatsApp</Th>
                <Th>Where</Th>
                <Th>Hours</Th>
                <Th>App access</Th>
                <Th>Plan</Th>
                <Th right>Items</Th>
                <Th right>Orders</Th>
                <Th right>Customers</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                    No shops yet.
                  </td>
                </tr>
              )}

              {rows.map(({ shop, state }) => (
                <tr key={shop.id} className="border-b border-slate-100 last:border-0">
                  <Td>
                    <Link
                      href={`/admin/shop/${shop.slug}`}
                      className="font-semibold text-slate-900 hover:text-brand-700"
                    >
                      {shop.name}
                    </Link>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      {SHOP_TYPE_LABELS[shop.type as keyof typeof SHOP_TYPE_LABELS] ?? shop.type}
                      {shop.isDemo && <Tag tone="amber">Demo</Tag>}
                      {!shop.active && <Tag tone="red">Closed</Tag>}
                      {!shop.deliveryEnabled && <Tag tone="slate">Pickup only</Tag>}
                    </span>
                  </Td>

                  <Td>
                    {shop.ownerName || <span className="text-slate-400">—</span>}
                    <span className="mt-0.5 block text-xs uppercase text-slate-400">
                      {shop.locale}
                    </span>
                  </Td>

                  <Td>
                    <a href={`tel:+91${shop.phone}`} className="tabular-nums hover:text-brand-700">
                      +91 {shop.phone}
                    </a>
                  </Td>

                  <Td>
                    {stateName(shop.state)}
                    {shop.address && (
                      <span className="mt-0.5 block max-w-[14rem] truncate text-xs text-slate-500">
                        {shop.address}
                      </span>
                    )}
                  </Td>

                  <Td>
                    {formatClockRange(shop.openTime, shop.closeTime) || (
                      <span className="text-slate-400">Not set</span>
                    )}
                  </Td>

                  {/* The one column that is a job rather than a fact: a shop
                      with no PIN cannot open its own app at all. */}
                  <Td>
                    {shop.ownerPinHash ? (
                      <span className="text-slate-600">
                        PIN · {shop.ownerPinSetAt ? formatDay(shop.ownerPinSetAt) : '—'}
                      </span>
                    ) : (
                      <Tag tone="red">No PIN issued</Tag>
                    )}
                  </Td>

                  <Td>
                    {state.status === 'TRIALING' && state.trialDaysLeft !== null
                      ? `Trial · ${state.trialDaysLeft}d`
                      : state.plan.name}
                    {!state.canEdit && (
                      <span className="mt-0.5 block text-xs text-red-600">Cannot edit items</span>
                    )}
                  </Td>

                  <Td right>{shop._count.items}</Td>
                  <Td right>{shop._count.orders}</Td>
                  <Td right>{shop._count.customers}</Td>
                  <Td>{formatDay(shop.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {rows.length} shop{rows.length === 1 ? '' : 's'}
          {showingDemo ? ' · demo shops included' : ' · demo shops hidden'}
        </p>
      </main>
    </>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={right ? 'px-4 py-2.5 text-right' : 'px-4 py-2.5'}>{children}</th>;
}

function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <td className={right ? 'px-4 py-3 text-right tabular-nums align-top' : 'px-4 py-3 align-top'}>
      {children}
    </td>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: 'amber' | 'red' | 'slate' }) {
  const tones = {
    amber: 'text-amber-700 ring-amber-300',
    red: 'text-red-700 ring-red-300',
    slate: 'text-slate-600 ring-slate-300',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}
