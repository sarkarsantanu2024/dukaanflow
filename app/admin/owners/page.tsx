import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { demoFilter, showingDemoShops } from '@/lib/demo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'DukaanFlow — Shop owners' };

/**
 * Every shop owner, in one table: who they are and how to reach them.
 *
 * The shops dashboard is a grid of cards built for working one shop at a time —
 * open this one, fix its prices, print its QR. This is the contact list: the
 * page somebody has open when they need to ring three owners in a row.
 *
 * It deliberately carries nothing else. Plans, item counts, PIN status and
 * trading hours all live on the shop's own page, where they can be acted on;
 * repeating them here would make this a dashboard rather than a list of people,
 * and there is already a dashboard.
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
      ownerName: true,
      phone: true,
      address: true,
    },
  });

  return (
    <>
      <AdminHeader title="Shop owners" eyebrow="One row per shop" backHref="/admin" />

      <main className="px-4 py-5 lg:px-6">
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Phone / WhatsApp</th>
                <th className="px-4 py-2.5">Address</th>
                {/* An owner is only ever an owner *of* something, and the name
                    of the shop is how anybody actually refers to them. */}
                <th className="px-4 py-2.5">Shop</th>
              </tr>
            </thead>
            <tbody>
              {shops.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No shops yet.
                  </td>
                </tr>
              )}

              {shops.map((shop) => (
                <tr key={shop.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {shop.ownerName || <span className="text-slate-400">Not recorded</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <a
                      href={`https://wa.me/91${shop.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-700"
                    >
                      +91 {shop.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {shop.address || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/shop/${shop.slug}`}
                      className="text-slate-700 hover:text-brand-700"
                    >
                      {shop.name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {shops.length} shop{shops.length === 1 ? '' : 's'} ·{' '}
          {showingDemo ? 'demo shops included' : 'demo shops hidden'}
        </p>
      </main>
    </>
  );
}
