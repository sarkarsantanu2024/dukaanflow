import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ShopGrid } from '@/components/admin/ShopGrid';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'DukaanFlow — Shops' };

export default async function AdminDashboard() {
  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      phone: true,
      active: true,
      imageData: true,
      _count: { select: { items: true, orders: true } },
    },
  });

  return (
    <div className="min-h-dvh bg-slate-100">
      <AdminHeader title="Shops">
        <Link
          href="/admin/shops/new"
          className="inline-flex h-9 items-center rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Add shop
        </Link>
      </AdminHeader>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Stat label="Total shops" value={shops.length} />
          <Stat label="Active" value={shops.filter((shop) => shop.active).length} />
          <Stat label="Orders" value={shops.reduce((sum, shop) => sum + shop._count.orders, 0)} />
        </div>

        <ShopGrid shops={shops} />
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
