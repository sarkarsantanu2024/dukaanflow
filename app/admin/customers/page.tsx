import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { demoFilter, showingDemoShops } from '@/lib/demo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'DukaanFlow — Customers' };

/**
 * Every customer of every shop, in one table.
 *
 * Scoped per shop in the product — one shopkeeper's regulars are not another's,
 * and DukaanFlow is not in the business of pooling them. This page does not
 * change that: it is the operator's view of the same rows.
 *
 * Name, number, address, shop, and nothing else. It carried order counts,
 * spend, balances and last-order dates as well, which made it a small report
 * rather than a list of people — and the reports page already answers those,
 * better and per shop.
 */
export default async function CustomersPage() {
  const showingDemo = await showingDemoShops();
  const shopWhere = demoFilter(showingDemo);

  const customers = await prisma.customer.findMany({
    where: { shop: shopWhere },
    orderBy: [{ shop: { name: 'asc' } }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      shop: { select: { name: true, slug: true } },
    },
  });

  return (
    <>
      <AdminHeader title="Customers" eyebrow="Across every shop" backHref="/admin" />

      <main className="px-4 py-5 lg:px-6">
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Phone / WhatsApp</th>
                <th className="px-4 py-2.5">Address</th>
                {/* Kept, because a customer belongs to a shop and this table
                    spans all of them — without it a row names nobody in
                    particular. */}
                <th className="px-4 py-2.5">Shop</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No customers yet. A customer is recorded the first time they order or the first
                    time something goes on their khata.
                  </td>
                </tr>
              )}

              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {customer.name || <span className="text-slate-400">Guest</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <a
                      href={`https://wa.me/91${customer.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-700"
                    >
                      +91 {customer.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {customer.address || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/shop/${customer.shop.slug}`}
                      className="text-slate-700 hover:text-brand-700"
                    >
                      {customer.shop.name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {customers.length} customer{customers.length === 1 ? '' : 's'} ·{' '}
          {showingDemo ? 'demo shops included' : 'demo shops hidden'}
        </p>
      </main>
    </>
  );
}
