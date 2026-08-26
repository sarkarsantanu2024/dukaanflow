'use client';

/**
 * The console frame: a persistent sidebar and a full-width content area.
 *
 * The admin was a centred 1152px column, which on a desk monitor left roughly
 * 400px of dead grey down each side. That is the right shape for something you
 * read and the wrong shape for something you operate — an operations console
 * should put the width to work. The left gutter is now navigation that is
 * always there, and the content runs to the edge of the window.
 *
 * The sidebar is desktop-only: below `lg` the same links live in the header,
 * because a shopkeeper's operator checking one shop from a phone needs the
 * screen for the shop, not for a nav rail.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { BoxIcon, PlusIcon } from '@/components/ui/Icon';

const NAV = [
  { href: '/admin', label: 'Shops', icon: BoxIcon, exact: true },
  { href: '/admin/shops/new', label: 'Add shop', icon: PlusIcon, exact: true },
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The sign-in page gets no chrome — there is nothing to navigate to yet.
  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="flex min-h-dvh bg-slate-100">
      <aside className="no-print sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-5 py-4">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white"
          >
            DF
          </span>
          <span className="font-bold leading-tight text-slate-900">DukaanFlow</span>
        </Link>

        <nav className="flex flex-col gap-0.5 px-3 py-2">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition',
                  active
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-auto px-5 py-4 text-xs leading-relaxed text-slate-400">
          Super Admin · one account for every shop.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
