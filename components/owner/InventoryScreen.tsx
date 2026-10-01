'use client';

/**
 * Cataloguing — kept apart from the till on purpose.
 *
 * First run walks the owner through saying one item, because nobody
 * spontaneously talks to a blank screen. After that it is the starter
 * catalogue, the mic, and the list.
 */

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { ItemsManager, type AdminItem } from '@/components/admin/ItemsManager';
import type { ShopType } from '@prisma/client';
import { StarterPicker } from './StarterPicker';
import { Drawer } from '@/components/ui/Drawer';
import { ownerDict } from '@/lib/owner-i18n';
import { VoiceArt } from '@/components/ui/ShopArt';
import { alreadyOwned, ownedNames, type StarterItem } from '@/lib/starter-catalogue';
import type { Locale } from '@/lib/i18n';

export function InventoryScreen({
  slug,
  shopName,
  items,
  catalogue,
  locale,
  showWelcome,
  itemLimit,
  unlimited = false,
  shopType,
  allCatalogue,
  isAdmin = false,
}: {
  slug: string;
  /** Printed at the top of the supplier's list and its PDF. */
  shopName: string;
  items: AdminItem[];
  catalogue: StarterItem[];
  locale: Locale;
  showWelcome: boolean;
  itemLimit: number;
  /** No item limit, so there is no "of N" and no meter to fill. */
  unlimited?: boolean;
  /** Drives which units this shop is offered. */
  shopType: ShopType;
  /** Every ready-made list, this shop's own first — the picker's "All items". */
  allCatalogue?: StarterItem[];
  /**
   * A super admin looking at this owner screen. Only they see the ready-made
   * list ("এক চাপে সাধারণ জিনিস যোগ করুন") and the per-shelf suggestions —
   * adding it is part of the paid shop setup (2026-09-28).
   */
  isAdmin?: boolean;
}) {
  const t = ownerDict(locale);
  const [welcome, setWelcome] = useState(showWelcome);
  // The common-items catalogue opens in a drawer, and it starts closed.
  const [picker, setPicker] = useState(false);

  const usedShare = !unlimited && itemLimit > 0 ? Math.min(1, items.length / itemLimit) : 0;

  /**
   * The catalogue minus what this shop already sells.
   *
   * Filtered here rather than inside the picker so the picker can stay a dumb
   * list — and so an owner never meets a suggestion to add something that is
   * already three rows above it. Matched by name in any language and at any
   * pack size, and it counts the owner's own hand-typed rows too: to somebody
   * looking at two identical items, where each came from is not the point.
   */
  const unlisted = useMemo(() => {
    const owned = ownedNames(items);
    return catalogue.filter((entry) => !alreadyOwned(entry, owned));
  }, [catalogue, items]);

  /** The same, for every list — what the picker's "All items" view offers. */
  const unlistedAll = useMemo(() => {
    if (!allCatalogue) return undefined;
    const owned = ownedNames(items);
    return allCatalogue.filter((entry) => !alreadyOwned(entry, owned));
  }, [allCatalogue, items]);

  if (welcome) {
    return (
      <section className="rounded-2xl border border-glass-edge bg-glass p-6 shadow-raised">
        <VoiceArt className="mx-auto mb-4 h-28 w-auto max-w-[16rem]" />
        <h2 className="text-xl font-semibold text-slate-900">{t.welcomeTitle}</h2>
        <p className="mt-2 text-slate-600">{t.welcomeBody}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="lg" onClick={() => setWelcome(false)}>
            {t.welcomeStart}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => setWelcome(false)}>
            {t.welcomeSkip}
          </Button>
        </div>
      </section>
    );
  }

  return (
    // Bottom padding so the floating + never sits on top of the last card.
    <div className="space-y-4 pb-20">
      {/* THE LIST FIRST, AND NOTHING ABOVE IT.
          The notice, the delivery terms, the common-items picker and this
          shop's own item count were all stacked over the list, so an owner
          opening the Items tab to look at their items scrolled past four cards
          to reach them — every time, for the life of the shop, in exchange for
          a number and three settings most shops touch once. The list is what
          the tab is named after. It starts at the top of the screen and
          everything about it follows underneath. */}
      <ItemsManager
        slug={slug}
        items={items}
        locale={locale}
        shopType={shopType}
        catalogue={catalogue}
        suggestions={isAdmin}
        catalogueEntry={
          isAdmin
            ? { label: t.starterTitle, count: unlisted.length, open: () => setPicker(true) }
            : undefined
        }
      />

      {/* THE SUPPLIER'S LIST MOVED TO THE HOME SCREEN (2026-10-01, by
          request): the "items running low" card there opens it in a pop-up. */}
      {/* The list ends here: a highlighted rule rather than empty space, by
          request — it separates the list from the cards about it without
          costing a screen of scrolling. */}
      <div aria-hidden className="h-0.5 rounded-full bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

      {/* THE COMMON-ITEMS CARD IS GONE FROM THIS TAB, BY REQUEST. Picking from
          the ready-made list is a way of adding an item, so it is now one row
          inside the add sheet (see `catalogueEntry` on ItemsManager), beside
          speaking, typing and the photo. The picker still opens here. */}
      {/* `inDrawer`, so the picker's own Add bar sits on the drawer's bottom
          edge instead of clearing a tab bar that is not there. */}
      {isAdmin && (
      <Drawer open={picker} title={t.starterTitle} onClose={() => setPicker(false)}>
        <StarterPicker
          slug={slug}
          catalogue={unlisted}
          allCatalogue={unlistedAll}
          locale={locale}
          remaining={unlimited ? undefined : Math.max(0, itemLimit - items.length)}
          onDismiss={() => setPicker(false)}
          inDrawer
        />
      </Drawer>
      )}

      {/* THE SETTINGS THAT USED TO BE HERE HAVE MOVED, and off this tab
          entirely. The customer notice, the delivery terms and the smallest
          order are now in one folded block at the foot of EVERY owner screen —
          see `MoreDrawer`. They were only ever on Items because Items is where
          the first of them was built, so an owner standing at the till who
          wanted to change their notice had to know to go to a tab about
          something else. What is left below is a summary of this screen's own
          list, which is the one thing that genuinely belongs to it. */}
      {/* THE LIST'S SIZE, AND HOW MUCH OF THE PLAN IT USES. The run-out and
          running-low tiles that sat beside it are gone, by request: the
          supplier card directly above already shows both numbers. */}
      <section>
        <div className="rounded-2xl border border-glass-edge bg-glass p-3 shadow-raised">
          <p className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums text-slate-900">{items.length}</span>
            <span className="text-sm text-slate-500">{t.itemsCount}</span>
            {!unlimited && (
              <span className="ml-auto text-xs tabular-nums text-slate-400">
                {t.ofLimit} {itemLimit}
              </span>
            )}
          </p>
          {/* The meter only means something against a limit. On the standard
              plan there is none, so the count stands alone. */}
          {!unlimited && (
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunk"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={itemLimit}
            aria-valuenow={items.length}
            aria-label={`${items.length} ${t.itemsCount} ${t.ofLimit} ${itemLimit}`}
          >
            <div
              className={clsx('h-full rounded-full', usedShare >= 0.9 ? 'bg-amber-500' : 'bg-brand-500')}
              style={{ width: `${Math.max(2, Math.round(usedShare * 100))}%` }}
            />
          </div>
          )}
        </div>
      </section>
    </div>
  );
}
