'use client';

/**
 * The frame every owner screen sits in: a compact header, the plan state, and
 * a bottom tab bar.
 *
 * Bottom tabs rather than a menu because this is used one-handed, standing at a
 * counter, often while a customer waits — the three things an owner does have
 * to be one thumb-reach apart, not behind a hamburger.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';
import { OwnerHeader } from './OwnerHeader';
import { PlanBanner, type PlanState } from './PlanBanner';
import { OpenInChromeNotice } from './OpenInChromeNotice';

export type OwnerTab = 'sell' | 'inventory' | 'khata' | 'orders';

function TabIcon({ tab }: { tab: OwnerTab }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (tab === 'sell') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...common} aria-hidden>
        <path d="M3 6h18l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8L4 6" />
        <path d="M9 21h.01M17 21h.01" />
        <path d="M9 10h6" />
      </svg>
    );
  }
  if (tab === 'khata') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...common} aria-hidden>
        <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v18H6.5A1.5 1.5 0 0 1 5 19.5z" />
        <path d="M9 3v18" />
        <path d="M12 9h4M12 13h4" />
      </svg>
    );
  }
  if (tab === 'inventory') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...common} aria-hidden>
        <path d="M4 7h16v13H4z" />
        <path d="M4 7l2-3h12l2 3" />
        <path d="M10 12h4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...common} aria-hidden>
      <path d="M5 4h14v16l-3.5-2-3.5 2-3.5-2L5 20z" />
      <path d="M9 9h6M9 13h4" />
    </svg>
  );
}

export function OwnerShell({
  slug,
  shopName,
  ownerImage,
  locale,
  plan,
  children,
}: {
  slug: string;
  shopName: string;
  /** The owner's photo, shown beside the shop name. */
  ownerImage?: string;
  locale: Locale;
  plan: PlanState;
  children: React.ReactNode;
}) {
  const t = ownerDict(locale);
  const pathname = usePathname();

  // Items first: a shop is listed before it is sold from, and an owner opening
  // the app on day one should land beside the thing they still have to do.
  const tabs: { id: OwnerTab; href: string; label: string }[] = [
    { id: 'inventory', href: `/owner/${slug}/inventory`, label: t.tabInventory },
    { id: 'sell', href: `/owner/${slug}/sell`, label: t.tabSell },
    { id: 'khata', href: `/owner/${slug}/khata`, label: t.tabKhata },
    { id: 'orders', href: `/owner/${slug}/orders`, label: t.tabOrders },
  ];

  return (
    <div className="min-h-dvh bg-slate-100 pb-24">
      <OwnerHeader slug={slug} shopName={shopName} ownerImage={ownerImage} locale={locale} />

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        <OpenInChromeNotice locale={locale} />
        <PlanBanner slug={slug} locale={locale} plan={plan} />
        {children}
      </main>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-3xl">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition',
                  active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                <TabIcon tab={tab.id} />
                <span className="max-w-full truncate px-1">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
