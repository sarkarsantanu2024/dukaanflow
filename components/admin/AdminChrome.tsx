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
import {
  BoxIcon,
  CalendarIcon,
  ChartIcon,
  PhoneIcon,
  PlusIcon,
  RupeeIcon,
  UsersIcon,
} from '@/components/ui/Icon';

const NAV = [
  // First, because it is the only screen that answers "how is the business
  // doing" — everything below it is one shop at a time.
  { href: '/admin/dashboard', label: 'Dashboard', icon: RupeeIcon, exact: true, onPhone: true },
  { href: '/admin', label: 'Shops', icon: BoxIcon, exact: true, onPhone: true },
  { href: '/admin/owners', label: 'Owners', icon: PhoneIcon, exact: false, onPhone: false },
  { href: '/admin/customers', label: 'Customers', icon: UsersIcon, exact: false, onPhone: false },
  { href: '/admin/shops/new', label: 'Add shop', icon: PlusIcon, exact: true, onPhone: true },
  { href: '/admin/reports', label: 'Reports', icon: ChartIcon, exact: false, onPhone: true },
  { href: '/admin/occasions', label: 'Occasions', icon: CalendarIcon, exact: false, onPhone: false },
];

/**
 * The rail can hold every destination; a 375px tab bar cannot. Seven tabs come
 * out at about 50px each — under the tap target both platforms ask for, with
 * labels that truncate to nothing. The four that survive are the ones an
 * operator opens away from a desk; the rest are desk work.
 */
const PHONE_NAV = NAV.filter((item) => item.onPhone);

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The sign-in page gets no chrome — there is nothing to navigate to yet.
  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="flex min-h-dvh">
      {/* The rail carries the brand colour full-height, so the console is
          green down one edge on every screen rather than only wherever a
          button happens to sit. It is the ONLY large field of colour here:
          the bar beside it stays light, because two greens meeting at a
          corner is what makes an interface look painted rather than designed. */}
      {/* w-64, not w-56. The rail grew with the mark inside it: a 40px logo and
          a 15px label in a 224px column left the wordmark almost touching the
          edge, and navigation that looks cramped reads as an afterthought. */}
      <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-chrome text-white lg:flex">
        <BrandMark href="/admin" tone="dark" className="border-b border-white/10 px-5 py-4" />

        <nav className="flex flex-col gap-0.5 px-3 py-3">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-[0.9375rem] font-semibold transition',
                  // Solid white for the current page, not a tint of the rail.
                  // A 12%-white panel is visible on a mockup and invisible on a
                  // real monitor at an angle — and "which page am I on" is the
                  // one question navigation exists to answer, so it gets the
                  // strongest contrast available rather than the subtlest.
                  active
                    ? 'bg-white text-brand-800 shadow-sm'
                    : 'text-brand-50/85 hover:bg-white/15 hover:text-white',
                )}
              >
                {/* 20px. At 16 these line icons were thinner than the label
                    beside them, so the row read as text with a speck in front
                    rather than as an icon and its name. */}
                <Icon className={clsx('h-5 w-5 shrink-0', !active && 'opacity-80')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-auto border-t border-white/10 px-5 py-4 text-xs leading-relaxed text-brand-100/70">
          Super Admin · one account for every shop.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>

      <nav
        aria-label="Console"
        className="no-print fixed inset-x-0 bottom-0 z-20 bg-chrome pb-[env(safe-area-inset-bottom)] shadow-chrome lg:hidden"
      >
        <div className="flex">
          {PHONE_NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition',
                  // White against 85%-white is not a difference anybody can see
                  // on a phone in daylight, so the current tab gets a mark of
                  // its own above it rather than relying on brightness alone.
                  active ? 'text-white' : 'text-brand-50/70 hover:text-white',
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    'h-0.5 w-8 rounded-full transition',
                    active ? 'bg-white' : 'bg-transparent',
                  )}
                />
                <Icon className="h-7 w-7" />
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
