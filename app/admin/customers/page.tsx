import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { demoFilter, showingDemoShops } from '@/lib/demo';
import { formatRupees } from '@/lib/money';
import { formatDay } from '@/lib/time';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'DukaanFlow — Customers' };

/**
 * Every customer of every shop, in one table.
 *
 * Scoped per shop in the product — one shopkeeper's regulars are not another's,
 * and DukaanFlow is not in the business of pooling them. This page does not
 * change that: it is the operator's view of the same rows, for the questions
 * only they can ask. Which shops have repeat customers. Where the money is
 * owed. Whether anybody is ordering at all.
 */
export default async function CustomersPage() {
  const showingDemo = await showingDemoShops();
  const shopWhere = demoFilter(showingDemo);

  const [customers, ledger, orders] = await Promise.all([
    prisma.customer.findMany({
      where: { shop: shopWhere },
      orderBy: [{ shop: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        phone: true,
        area: true,
        createdAt: true,
        shop: { select: { name: true, slug: true } },
      },
    }),
    // Balances are summed from entries, never stored — the same rule the khata
    // screen follows, because a total that can drift from its own history is
    // how a paper book starts an argument.
    prisma.ledgerEntry.groupBy({
      by: ['customerId', 'kind'],
      where: { shop: shopWhere },
      _sum: { amount: true },
    }),
    prisma.order.groupBy({
      by: ['shopId', 'customerPhone'],
      where: { shop: shopWhere, status: { not: 'CANCELLED' } },
      _count: { _all: true },
      _sum: { totalAmount: true },
      _max: { createdAt: true },
    }),
  ]);

  const owed = new Map<string, number>();
  for (const row of ledger) {
    const delta = (row._sum.amount ?? 0) * (row.kind === 'DEBIT' ? 1 : -1);
    owed.set(row.customerId, (owed.get(row.customerId) ?? 0) + delta);
  }

  // Orders are keyed by phone, not by customer id — the order route records a
  // number, and the Customer row is upserted alongside it.
  const byPhone = new Map(
    orders.map((row) => [
      `${row.shopId}:${row.customerPhone}`,
      {
        count: row._count._all,
        spent: row._sum.totalAmount ?? 0,
        last: row._max.createdAt,
      },
    ]),
  );

  const shopIds = await prisma.shop.findMany({
    where: shopWhere,
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(shopIds.map((shop) => [shop.slug, shop.id]));

  const rows = customers.map((customer) => {
    const shopId = idBySlug.get(customer.shop.slug) ?? '';
    const activity = byPhone.get(`${shopId}:${customer.phone}`);
    return {
      customer,
      balance: owed.get(customer.id) ?? 0,
      orders: activity?.count ?? 0,
      spent: activity?.spent ?? 0,
      last: activity?.last ?? null,
    };
  });

  const totalOwed = rows.reduce((sum, row) => sum + Math.max(0, row.balance), 0);

  return (
    <>
      <AdminHeader title="Customers" eyebrow="Across every shop" backHref="/admin" />

      <main className="px-4 py-5 lg:px-6">
        <dl className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl bg-white px-5 py-4 shadow-card">
          <Stat label="Customers" value={String(rows.length)} />
          <Stat label="Shops with customers" value={String(new Set(rows.map((r) => r.customer.shop.slug)).size)} />
          <Stat label="Outstanding udhaar" value={formatRupees(totalOwed)} tone={totalOwed > 0 ? 'warn' : undefined} />
        </dl>

        <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">Area</th>
                <th className="px-4 py-2.5">Shop</th>
                <th className="px-4 py-2.5 text-right">Orders</th>
                <th className="px-4 py-2.5 text-right">Spent</th>
                <th className="px-4 py-2.5 text-right">Owes</th>
                <th className="px-4 py-2.5">Last order</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No customers yet. A customer is recorded the first time they order or the first
                    time something goes on their khata.
                  </td>
                </tr>
              )}

              {rows.map((row) => (
                <tr key={row.customer.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {row.customer.name || <span className="text-slate-400">Guest</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <a href={`tel:+91${row.customer.phone}`} className="hover:text-brand-700">
                      +91 {row.customer.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.customer.area || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/shop/${row.customer.shop.slug}`}
                      className="text-slate-700 hover:text-brand-700"
                    >
                      {row.customer.shop.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.orders}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatRupees(row.spent)}</td>
                  <td
                    className={
                      row.balance > 0
                        ? 'px-4 py-3 text-right font-semibold tabular-nums text-amber-700'
                        : 'px-4 py-3 text-right tabular-nums text-slate-400'
                    }
                  >
                    {row.balance > 0 ? formatRupees(row.balance) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.last ? formatDay(row.last) : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {showingDemo ? 'Demo shops included.' : 'Demo shops hidden.'} Balances are summed from the
          khata, never stored.
        </p>
      </main>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
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
