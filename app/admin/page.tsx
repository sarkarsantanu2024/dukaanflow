import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { HeaderAction } from '@/components/admin/HeaderAction';
import { ShopGrid, type ShopRow } from '@/components/admin/ShopGrid';
import { DemoToggle } from '@/components/admin/DemoToggle';
import { demoFilter, showingDemoShops } from '@/lib/demo';
import { PlusIcon } from '@/components/ui/Icon';
import { entitlement, type Plan, type SubStatus } from '@/lib/plans';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'DukaanFlow — Shops' };

/**
 * Turns a shop's billing state into the one line an operator needs to act on.
 * Silence means nothing is wrong — a message here is a job to do.
 */
function attentionFor(
  shop: {
    active: boolean;
    activatedAt: Date | null;
    createdAt: Date;
    _count: { items: number };
  },
  state: ReturnType<typeof entitlement>,
): string | null {
  if (!state.canEdit) return 'Subscription ended — cannot edit items';
  if (state.trialDaysLeft !== null && state.trialDaysLeft <= 3) {
    return `Trial ends in ${state.trialDaysLeft} day${state.trialDaysLeft === 1 ? '' : 's'}`;
  }
  if (state.inGrace) return 'Payment overdue — in grace period';

  // Onboarded but never started is the failure that looks like success: the
  // shop exists, the QR is printed, and nobody ever listed anything.
  const daysOld = Math.floor((Date.now() - shop.createdAt.getTime()) / 86_400_000);
  if (shop.active && !shop.activatedAt && daysOld >= 2) {
    return `No items after ${daysOld} days — owner may need help`;
  }

  if (shop._count.items >= state.itemLimit) return 'Catalogue full — needs a bigger plan';
  return null;
}

export default async function AdminDashboard() {
  const showingDemo = await showingDemoShops();

  const [shops, demoCount] = await Promise.all([
    prisma.shop.findMany({
      where: demoFilter(showingDemo),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        phone: true,
        active: true,
        imageData: true,
        isDemo: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        activatedAt: true,
        createdAt: true,
        _count: { select: { items: true, orders: true } },
      },
    }),
    prisma.shop.count({ where: { isDemo: true } }),
  ]);

  const rows: ShopRow[] = shops.map((shop) => {
    const state = entitlement({
      plan: shop.plan as Plan,
      subscriptionStatus: shop.subscriptionStatus as SubStatus,
      trialEndsAt: shop.trialEndsAt,
      currentPeriodEnd: shop.currentPeriodEnd,
    });

    const planState: ShopRow['planState'] =
      state.status === 'CANCELLED'
        ? 'cancelled'
        : state.status === 'TRIALING'
          ? 'trial'
          : state.inGrace || state.status === 'PAST_DUE'
            ? 'due'
            : 'paid';

    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      type: shop.type,
      phone: shop.phone,
      active: shop.active,
      imageData: shop.imageData,
      isDemo: shop.isDemo,
      planName:
        state.status === 'TRIALING' && state.trialDaysLeft !== null
          ? `Trial · ${state.trialDaysLeft}d`
          : state.plan.name,
      planState,
      attention: attentionFor(shop, state),
      itemCount: shop._count.items,
      itemLimit: state.itemLimit,
      orderCount: shop._count.orders,
    };
  });

  const live = rows.filter((row) => row.active).length;
  const attention = rows.filter((row) => row.attention).length;
  // Every plan costs money now, so a shop on a settled subscription is a
  // paying shop. This used to subtract the free tier by comparing the display
  // name — which would have silently kept excluding the cheapest paying shops
  // the moment that name changed.
  const paying = rows.filter((row) => row.planState === 'paid').length;
  const orders = rows.reduce((sum, row) => sum + row.orderCount, 0);

  return (
    <>
      <AdminHeader title="Shops">
        <HeaderAction href="/admin/shops/new" label="Add shop" icon={PlusIcon} variant="primary" />
      </AdminHeader>

      <main className="px-4 py-5 lg:px-6">
        {/* One strip rather than four tall cards. These numbers are context, not
            the point of the page, and they were taking up a third of it. */}
        <dl className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl bg-white px-5 py-4 shadow-card">
          <Stat label="Shops" value={rows.length} />
          <Stat label="Live" value={live} />
          <Stat label="Paying" value={paying} />
          <Stat label="Orders" value={orders} />
          <Stat label="Need attention" value={attention} tone={attention > 0 ? 'warn' : undefined} />
          {/* Pushed to the end of the strip: it changes what the numbers to its
              left are counting, so it belongs beside them rather than in the
              header where it would read as another way to add a shop. */}
          <div className="ml-auto">
            <DemoToggle showing={showingDemo} count={demoCount} />
          </div>
        </dl>

        <ShopGrid shops={rows} />
      </main>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) {
  return (
    <div className="flex items-baseline gap-2">
      <dd
        className={
          tone === 'warn'
            ? 'text-2xl font-bold tabular-nums text-amber-600'
            : 'text-2xl font-bold tabular-nums text-slate-900'
        }
      >
        {value}
      </dd>
      <dt className="text-sm text-slate-500">{label}</dt>
    </div>
  );
}
