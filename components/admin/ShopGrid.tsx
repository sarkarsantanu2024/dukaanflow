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
import {
  BoxIcon,
  ClockIcon,
  ExternalIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
} from '@/components/ui/Icon';
import { SHOP_TYPE_LABELS, SHOP_TYPES } from '@/lib/validators';
import { ShopRowActions } from './ShopRowActions';
import { ShopReportMenu } from './ShopReportMenu';
import { ShopPinBadge } from './ShopPinBadge';

export type ShopRow = {
  id: string;
  name: string;
  slug: string;
  type: (typeof SHOP_TYPES)[number];
  phone: string;
  /** Street address, or blank when the shop has not given one. */
  address: string;
  /** Already formatted for reading — "9 am – 9 pm" — or blank when unset. */
  hours: string;
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
  /** Whether the owner can sign in at all. The PIN itself is a hash — see ShopPinBadge. */
  hasPin: boolean;
  /** When it was issued, already formatted, or null. */
  pinSetAt: string | null;
};

const PLAN_TONE: Record<ShopRow['planState'], string> = {
  trial: 'bg-sky-50 text-sky-700 ring-sky-200',
  paid: 'bg-green-50 text-green-700 ring-green-200',
  due: 'bg-amber-50 text-amber-800 ring-amber-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

type Filter = 'all' | 'attention' | 'paused';

/**
 * auto-fill rather than a fixed column count: the row keeps filling with 380px
 * cards for as wide as the window happens to be, instead of three cards
 * stretching across a desk monitor. 380 rather than 300 because at 300 the
 * name, the plan badge and the phone number all competed for one line and the
 * phone — the thing an operator actually calls — was the part that got cut.
 */
const CARD_GRID = 'grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(380px,1fr))]';

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
                'flex flex-col overflow-hidden rounded-2xl border border-brand-100/70 bg-white shadow-card transition hover:border-brand-200 hover:shadow-md',
                !shop.active && 'opacity-75',
              )}
            >
              <div className="flex items-start gap-3 p-4 pb-3">
                {shop.imageData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shop.imageData}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                  >
                    <BoxIcon className="h-6 w-6" />
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
                  <p className="truncate text-sm text-slate-500">{SHOP_TYPE_LABELS[shop.type]}</p>
                  {/* Its own line, and never truncated: the phone is what the
                      operator dials, so a long shop type must not eat it. */}
                  <a
                    href={`tel:+91${shop.phone}`}
                    className="mt-0.5 inline-block text-sm font-medium tabular-nums text-slate-700 hover:text-brand-700"
                  >
                    +91 {shop.phone}
                  </a>
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

              {/* Hours and address, and said plainly when they are missing: a
                  shop with no hours on its page is something the operator can
                  fix, so a blank line here would hide the job rather than the
                  gap. */}
              <div className="space-y-1 px-4 pb-3 text-sm">
                <p
                  className={clsx(
                    'flex items-center gap-1.5',
                    shop.hours ? 'text-slate-600' : 'text-slate-400',
                  )}
                >
                  <ClockIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{shop.hours || 'Hours not set'}</span>
                </p>
                <p
                  className={clsx(
                    'flex items-start gap-1.5',
                    shop.address ? 'text-slate-600' : 'text-slate-400',
                  )}
                >
                  <PinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {/* Two lines, then clipped: an address is worth the room a
                      phone number is not, but not a card of unbounded height. */}
                  <span className="line-clamp-2">{shop.address || 'No address'}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3 text-xs text-slate-500">
                <span className="tabular-nums">
                  <strong className="font-semibold text-slate-700">{shop.itemCount}</strong>/
                  {shop.itemLimit} items
                </span>
                <span className="tabular-nums">{shop.orderCount} orders</span>
                <span className="truncate font-mono text-slate-400">/{shop.slug}</span>
              </div>

              {/* Owner access, on the card. "What is their PIN?" is the most
                  common question this list gets asked, and the honest answer —
                  nobody can read it back, here is a new one — belongs where the
                  question is asked rather than two clicks inside the shop. */}
              <div className="flex flex-wrap items-center gap-x-2 px-4 pb-3">
                <ShopPinBadge
                  slug={shop.slug}
                  shopName={shop.name}
                  hasPin={shop.hasPin}
                  pinSetAt={shop.pinSetAt}
                />
              </div>

              {shop.attention && (
                <p className="mx-4 mb-3 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">
                  {shop.attention}
                </p>
              )}

              {/* Wraps rather than squeezes: the row now carries two links and
                  a download as well as the two buttons, and a card at the
                  narrow end of the grid would otherwise clip whichever came
                  last — which is the destructive one. */}
              <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-brand-100/70 bg-brand-50/40 px-4 py-2.5">
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
                {/* BOTH SIDES OF THE SHOP, from the operator's own list.
                    The customer page is what a shopper sees; the owner app is
                    what the shopkeeper sees, and it is where every support call
                    is actually answered — "my items are not showing", "where do
                    I take payment". Reaching it used to mean typing the URL by
                    hand from memory.

                    Relative links, so each opens on whatever host this console
                    is being used on: localhost while developing, the live
                    domain in production. */}
                <a
                  href={`/shop/${shop.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open the customer page for ${shop.name}`}
                  title="Customer shop page"
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <ExternalIcon className="h-4 w-4" />
                  Shop
                </a>
                <a
                  href={`/owner/${shop.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open the owner app for ${shop.name}`}
                  title="Owner app"
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <ExternalIcon className="h-4 w-4" />
                  Owner
                </a>
                <ShopReportMenu slug={shop.slug} shopName={shop.name} />

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
