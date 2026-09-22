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
import { useState } from 'react';
import clsx from 'clsx';
import { ownerDict } from '@/lib/owner-i18n';
import { useHtmlLang } from '@/components/ui/useHtmlLang';
import type { Locale } from '@/lib/i18n';
import { OwnerHeader } from './OwnerHeader';
import { PlanBanner, type PlanState } from './PlanBanner';
import { OpenInChromeNotice } from './OpenInChromeNotice';
import { SubscriptionRoadblock, type RoadblockState } from './SubscriptionRoadblock';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SimpleModeProvider } from './SimpleMode';
import { MoreDrawer, type OwnerSettings } from './MoreDrawer';

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
  ownerImageData = '',
  locale,
  plan,
  settings,
  roadblock,
  ownerClosed,
  showSettings = false,
  children,
}: {
  slug: string;
  /**
   * The shop's name and the owner's photo, for the header's identity strip.
   *
   * They were dropped from the header once, to buy width for the language
   * switch and the way out. They are back because those two now sit on a row of
   * their own — and because the phone running this app is handed around, so
   * "which shop am I in" is a question somebody actually asks.
   */
  shopName: string;
  ownerImageData?: string;
  locale: Locale;
  plan: PlanState;
  /** The shopkeeper's own shutter, for the switch in the header. */
  ownerClosed: boolean;
  /**
   * The once-a-shop settings, shown behind one folded line at the foot of every
   * screen — see `MoreDrawer`. They used to be four cards stacked on the Items
   * tab, which is a tab about items.
   */
  settings: OwnerSettings;
  /** Set when the subscription has lapsed; null while the owner may work. */
  roadblock?: RoadblockState | null;
  /**
   * Whether to show the settings block — "More settings", the plan, the
   * customer notice and the simple/full switch — at the foot of the screen.
   *
   * ONLY THE HOME SCREEN. These are things a shop sets once and rarely touches,
   * and repeating them under the till, the item list, the khata and the orders
   * made every one of those screens end in the same block of admin an owner had
   * to scroll past to reach what they came for. They live on the home screen —
   * one tap away from anywhere by the house icon — and everywhere else is left
   * to the one job that screen is for.
   */
  showSettings?: boolean;
  children: React.ReactNode;
}) {
  const t = ownerDict(locale);
  const pathname = usePathname();
  /** Same test `OwnerHeader` uses, so the padding and the badge agree. */
  const atHome = pathname === `/owner/${slug}` || pathname === `/owner/${slug}/`;
  /**
   * The once-a-shop settings tray, opened by the gear beside the shop's name.
   *
   * The state is here rather than in `MoreDrawer` because the thing that opens
   * it is in the header and the thing that draws it is in `main` — two
   * components either side of this one.
   */
  const [settingsOpen, setSettingsOpen] = useState(false);
  // The owner's app speaks the shop's language; the document should say so.
  useHtmlLang(locale);

  // Items first: a shop is listed before it is sold from, and an owner opening
  // the app on day one should land beside the thing they still have to do.
  const tabs: { id: OwnerTab; href: string; label: string }[] = [
    { id: 'inventory', href: `/owner/${slug}/inventory`, label: t.tabInventory },
    { id: 'sell', href: `/owner/${slug}/sell`, label: t.tabSell },
    { id: 'khata', href: `/owner/${slug}/khata`, label: t.tabKhata },
    { id: 'orders', href: `/owner/${slug}/orders`, label: t.tabOrders },
  ];

  return (
    <SimpleModeProvider slug={slug}>
    <div className="min-h-dvh pb-24">
      <OwnerHeader
        slug={slug}
        locale={locale}
        shopName={shopName}
        ownerClosed={ownerClosed}
        ownerImageData={ownerImageData}
        onOpenSettings={showSettings ? () => setSettingsOpen((was) => !was) : undefined}
        settingsOpen={settingsOpen}
        onCloseSettings={() => setSettingsOpen(false)}
        settingsPanel={
          showSettings ? (
            <MoreDrawer
              slug={slug}
              locale={locale}
              settings={settings}
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
            />
          ) : null
        }
      />

      {/* `pt-12`, not `py-4`. The clock badge hangs off the bottom of the
          sticky header and is absolutely positioned, so it reserves no height
          of its own — without this the first card on every screen starts
          underneath it and its heading is half covered. Twelve and not seven:
          the badge is about 28px tall, so 28px of padding leaves the card
          touching its bottom edge, which reads as a mistake rather than a
          layout. This is the badge plus a real gap.

          Here rather than on each screen, so no screen can forget it. */}
      <main
        className={clsx(
          'mx-auto max-w-3xl space-y-4 px-4 pb-4',
          // The clearance follows the badge. It only hangs off the header on
          // the home screen now, so only the home screen pays for it; every
          // other screen starts where the header ends.
          atHome ? 'pt-12' : 'pt-4',
        )}
      >
        {/* First thing under the header, because everything below it may be a
            cached copy and nothing else on the page would say so. */}
        <OfflineBanner label={t.offline} hint={t.offlineHint} />
        <OpenInChromeNotice locale={locale} />
        <PlanBanner slug={slug} locale={locale} plan={plan} />
        {children}

        {/* Everything a shop sets once — the notice, the delivery terms, the
            way to pay, and the simple/full switch — behind one closed line, and
            ONLY on the home screen. See `showSettings`: repeating this block at
            the foot of every screen made each one end in admin the owner had to
            scroll past. */}
        {/* The settings are NOT here any more. They drop out of the gear in
            the header — see `settingsPanel` below — rather than sitting at the
            foot of the page an owner has just scrolled. */}
      </main>

      {/* THE TAB BAR IS DARK, and it carries the same `gloss` as the rest of
          the product's dark surfaces rather than a flat black — one hue, three
          depths. It was `chrome`, the brand blue, which made the bar itself a
          block of colour and left the SELECTED tab nothing to be coloured
          against. A dark bar is a ground; the tab you are on is the only lit
          thing on it.

          PURE BLACK, flat and opaque. No gradient, no translucency, no shadow.
          A bar pinned to the bottom has the whole page sliding under it, so
          anything see-through there shows that movement; a sheen across a 56px
          strip is a ramp nobody can see; and it is the lowest thing on the
          screen, with nothing to cast a shadow onto. Black also gives the lit
          tile on the selected tab the most it can possibly have to stand
          against — and it is why that tile's glass is layered rather than
          blurred; see the note on it below. */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-20 bg-black pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-3xl px-1">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-1 justify-center px-1 py-1.5 text-xs transition"
              >
                {/* WHERE THE ACTIVE STATE ACTUALLY LIVES.
                    It was a colour change on the label alone, which on a bar of
                    four near-identical items is the weakest signal available —
                    and the first thing lost by anyone reading slowly, or
                    glancing at a phone on a counter. The selected tab now sits
                    in a lit TILE, so it differs in SHAPE as well as in shade and
                    can be found without reading a word.

                    THE TILE HOLDS THE LABEL TOO, and it is a rounded square
                    rather than a pill round the icon. A capsule round the icon
                    alone left the word outside the selection, so the lit thing
                    and the thing it named were two objects; one block containing
                    both is a single object that says "you are here". The radius
                    is `rounded-2xl`, the same one every card in the product
                    uses — the tab bar is the last place that was still speaking
                    a different shape language.

                    GLASS, AND WHAT THAT CAN AND CANNOT MEAN HERE. The fill is
                    translucent brand over the black bar, lifted by a white
                    gradient from the top edge, a bright inset hairline along
                    that edge, and a ring round the whole tile. There is NO
                    `backdrop-blur`: the bar behind this is flat opaque black,
                    so a blur would have nothing to refract and would cost a
                    compositor layer on a cheap phone to produce no pixels. The
                    glass here is the layering, not a blur.

                    DO NOT THIN THE FILL FURTHER. At 70% over black the tile is
                    about 2.4:1 against the bar; the solid version it replaces
                    was 3.9:1, and the ring and the top highlight are what buy
                    that difference back. Below roughly 60% it stops being a lit
                    block and becomes a slightly lighter grey, which is the weak
                    signal this whole treatment exists to replace.

                    Padded and placed on every tab, lit only on the active one,
                    so nothing moves by a pixel when the selection changes. */}
                <span
                  className={clsx(
                    'flex w-full flex-col items-center gap-1 rounded-2xl px-1.5 py-1.5 transition',
                    active
                      ? 'bg-brand-600/70 bg-gradient-to-b from-white/20 to-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ring-1 ring-inset ring-white/30'
                      : 'text-white/50 hover:text-white/80',
                  )}
                >
                  <TabIcon tab={tab.id} />
                  <span
                    className={clsx(
                      'max-w-full truncate px-1',
                      // The label follows the icon rather than leading it: on
                      // the one you are on it firms up, everywhere else it
                      // recedes.
                      active ? 'font-medium' : 'font-normal',
                    )}
                  >
                    {tab.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Last in the tree and fixed over everything, so it covers the tab bar
          too. A roadblock the owner can navigate out of with one thumb is a
          banner with extra steps. */}
      {roadblock && <SubscriptionRoadblock slug={slug} locale={locale} state={roadblock} />}
    </div>
    </SimpleModeProvider>
  );
}
