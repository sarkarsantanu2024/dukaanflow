'use client';

/**
 * The shop list.
 *
 * Rebuilt for density. The old cards were mostly air: three lines of text in a
 * tall white box, with five buttons of identical weight wrapping onto a second
 * row so the card looked broken. An operator scanning twenty shops needs to see
 * which ones need something done — so each card now leads with identity, states
 * plan and catalogue in one line, and ranks its actions instead of offering
 * five equal ones.
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { EmptyState } from '@/components/ui/EmptyState';
import { BoxIcon, ExternalIcon, PlusIcon, SearchIcon } from '@/components/ui/Icon';
import { SHOP_TYPE_LABELS, SHOP_TYPES } from '@/lib/validators';
import { ShopRowActions } from './ShopRowActions';

export type ShopRow = {
  id: string;
  name: string;
  slug: string;
  type: (typeof SHOP_TYPES)[number];
  phone: string;
  active: boolean;
  imageData: string;
  isDemo: boolean;
  planName: string;
  /** Short state word: Trial, Paid, Due, Cancelled. */
  planState: 'trial' | 'paid' | 'due' | 'cancelled';
  /** Set when this shop wants the operator's attention. */
  attention: string | null;
  itemCount: number;
  itemLimit: number;
  orderCount: number;
};

const PLAN_TONE: Record<ShopRow['planState'], string> = {
  trial: 'bg-sky-50 text-sky-700 ring-sky-200',
  paid: 'bg-green-50 text-green-700 ring-green-200',
  due: 'bg-amber-50 text-amber-800 ring-amber-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

type Filter = 'all' | 'attention' | 'paused';

/**
 * auto-fill rather than a fixed column count: the row keeps filling with 300px
 * cards for as wide as the window happens to be, instead of three cards
 * stretching across a desk monitor.
 */
const CARD_GRID = 'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]';

export function ShopGrid({ shops }: { shops: ShopRow[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const needsAttention = useMemo(() => shops.filter((shop) => shop.attention), [shops]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shops.filter((shop) => {
      if (filter === 'attention' && !shop.attention) return false;
      if (filter === 'paused' && shop.active) return false;
      if (!needle) return true;
      return `${shop.name} ${shop.slug} ${shop.phone}`.toLowerCase().includes(needle);
    });
  }, [shops, query, filter, needsAttention]);

  if (shops.length === 0) {
    return (
      <EmptyState
        art="shop"
        title="No shops yet"
        hint="Add your first shop, print its QR, and stick it on the counter."
        action={
          <Link
            href="/admin/shops/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add shop
          </Link>
        }
      />
    );
  }

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: shops.length },
    { id: 'attention', label: 'Needs attention', count: needsAttention.length },
    { id: 'paused', label: 'Paused', count: shops.filter((shop) => !shop.active).length },
  ];

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, slug or phone"
            aria-label="Search shops"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
          />
        </div>

        <div className="flex shrink-0 gap-1 rounded-xl bg-slate-200/70 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              aria-pressed={filter === tab.id}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-sm font-semibold transition',
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {tab.label}
              <span
                className={clsx(
                  'ml-1.5 tabular-nums',
                  tab.id === 'attention' && tab.count > 0 ? 'text-amber-700' : 'text-slate-400',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing here" hint="Try a different search or filter." />
      ) : (
        <ul className={CARD_GRID}>
          {filtered.map((shop) => (
            <li
              key={shop.id}
              className={clsx(
                'flex flex-col overflow-hidden rounded-2xl bg-white shadow-card',
                !shop.active && 'opacity-75',
              )}
            >
              <div className="flex items-start gap-3 p-4 pb-3">
                {shop.imageData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shop.imageData}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                  >
                    <BoxIcon className="h-5 w-5" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-semibold leading-tight text-slate-900">
                    <span className="truncate">{shop.name}</span>
                    {/* Labelled on the card, not only behind the toggle: once
                        demo shops are being shown, nothing else on this screen
                        distinguishes one from a real customer. */}
                    {shop.isDemo && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-300">
                        Demo
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {SHOP_TYPE_LABELS[shop.type]} · +91 {shop.phone}
                  </p>
                </div>

                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
                    shop.active ? PLAN_TONE[shop.planState] : 'bg-slate-100 text-slate-500 ring-slate-200',
                  )}
                >
                  {shop.active ? shop.planName : 'Paused'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3 text-xs text-slate-500">
                <span className="tabular-nums">
                  <strong className="font-semibold text-slate-700">{shop.itemCount}</strong>/
                  {shop.itemLimit} items
                </span>
                <span className="tabular-nums">{shop.orderCount} orders</span>
                <span className="truncate font-mono text-slate-400">/{shop.slug}</span>
              </div>

              {shop.attention && (
                <p className="mx-4 mb-3 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">
                  {shop.attention}
                </p>
              )}

              <div className="mt-auto flex items-center gap-2 border-t border-slate-100 px-4 py-2.5">
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
                  Edit
                </Link>
                <a
                  href={`/shop/${shop.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${shop.name}`}
                  title="Open shop page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  <ExternalIcon className="h-4 w-4" />
                </a>

                {/* Secondary and destructive actions sit apart and lighter, so
                    the row reads as a hierarchy rather than five equal buttons
                    wrapping onto a second line. */}
                <span className="ml-auto flex items-center gap-1 text-xs">
                  <ShopRowActions slug={shop.slug} shopName={shop.name} active={shop.active} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
