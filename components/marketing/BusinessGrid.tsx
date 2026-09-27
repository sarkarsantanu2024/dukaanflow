/**
 * Every kind of business Halkhata is built for, as cards that open that
 * business's own page. Used on the landing page and at the foot of each
 * business page, so a visitor can move sideways between them.
 *
 * Server component; every word through `Say`, so all three languages are in
 * the HTML and the page's chosen one shows.
 */

import Link from 'next/link';
import clsx from 'clsx';
import { ChevronRightIcon } from '@/components/ui/Icon';
import { BUSINESSES, type BusinessSlug } from '@/lib/business-types';
import { LANDING } from '@/lib/marketing-copy';
import { Say } from './Say';

/**
 * One picture per kind of shop. Emoji rather than drawn icons: they are what
 * the shopkeeper's own phone keyboard shows for the same thing, they cost no
 * bytes, and they read at a glance where a line icon of a "sweet" would not.
 * Decorative — the name beside each says the same thing in words.
 */
export const BUSINESS_MARK: Record<BusinessSlug, string> = {
  grocery: '🛒',
  restaurant: '🍛',
  'street-food': '🥙',
  'tea-stall': '☕',
  'roll-momo': '🥟',
  'home-kitchen': '🍱',
  bakery: '🎂',
  'sweet-shop': '🍬',
  'vegetables-fruits': '🥦',
  dairy: '🥛',
  'meat-fish': '🐟',
  stationery: '✏️',
  cosmetics: '💄',
  hardware: '🔧',
  'flowers-puja': '🌼',
  garments: '👕',
};

export function BusinessGrid({
  className,
  exclude,
}: {
  className?: string;
  /** Leave one out — the page the grid is sitting on. */
  exclude?: BusinessSlug;
}) {
  return (
    <ul className={clsx('grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4', className)}>
      {BUSINESSES.filter((business) => business.slug !== exclude).map((business) => (
        <li key={business.slug}>
          <Link
            href={`/${business.slug}`}
            className="group flex h-full items-center gap-3 rounded-2xl border border-brand-100 bg-card p-4 shadow-raised transition hover:border-brand-300 hover:shadow-float focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl"
            >
              {BUSINESS_MARK[business.slug]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-snug text-slate-900">
                <Say t={business.name} />
              </span>
              <span className="mt-0.5 block text-sm text-brand-700">
                <Say t={LANDING.businesses.see} />
              </span>
            </span>
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
