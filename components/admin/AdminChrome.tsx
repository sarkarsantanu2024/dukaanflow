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
 * The sidebar is desktop-only. Below `lg` the same destinations become a bottom
 * tab bar, the way the owner's app does it: an operator checking a shop from a
 * phone gets the screen for the shop and their navigation under one thumb,
 * rather than a rail eating the width or links stuffed into the header.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { BrandMark } from '@/components/ui/BrandMark';
import { BoxIcon, CalendarIcon, ChartIcon, PlusIcon } from '@/components/ui/Icon';

const NAV = [
  { href: '/admin', label: 'Shops', icon: BoxIcon, exact: true },
  { href: '/admin/shops/new', label: 'Add shop', icon: PlusIcon, exact: true },
  { href: '/admin/reports', label: 'Reports', icon: ChartIcon, exact: false },
  { href: '/admin/occasions', label: 'Occasions', icon: CalendarIcon, exact: false },
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The sign-in page gets no chrome — there is nothing to navigate to yet.
  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="flex min-h-dvh bg-slate-100">
      <aside className="no-print sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <BrandMark href="/admin" className="px-5 py-4" />

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

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>

      <nav
        aria-label="Console"
        className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="flex">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition',
                  active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
