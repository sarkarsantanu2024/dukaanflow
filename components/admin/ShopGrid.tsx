'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SHOP_TYPE_LABELS, SHOP_TYPES } from '@/lib/validators';

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  type: (typeof SHOP_TYPES)[number];
  phone: string;
  active: boolean;
  _count: { items: number; orders: number };
};

export function ShopGrid({ shops }: { shops: ShopRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return shops;
    return shops.filter((shop) =>
      `${shop.name} ${shop.slug} ${shop.phone}`.toLowerCase().includes(needle),
    );
  }, [shops, query]);

  if (shops.length === 0) {
    return (
      <EmptyState
        title="No shops yet"
        hint="Add your first shop, print its QR, and stick it on the counter."
        action={
          <Link
            href="/admin/shops/new"
            className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700"
          >
            + Add shop
          </Link>
        }
      />
    );
  }

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, slug or phone"
        aria-label="Search shops"
        className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
      />

      {filtered.length === 0 ? (
        <EmptyState title="No shops match that search" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((shop) => (
            <li key={shop.id} className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{shop.name}</p>
                  <p className="text-sm text-slate-500">{SHOP_TYPE_LABELS[shop.type]}</p>
                </div>
                <Badge tone={shop.active ? 'green' : 'slate'}>
                  {shop.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="mt-2 text-sm text-slate-600">+91 {shop.phone}</p>
              <p className="text-xs text-slate-400">
                /{shop.slug} · {shop._count.items} items · {shop._count.orders} orders
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/admin/shop/${shop.slug}/items`}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Items
                </Link>
                <Link
                  href={`/admin/shop/${shop.slug}`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit &amp; QR
                </Link>
                <a
                  href={`/shop/${shop.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Open shop ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
