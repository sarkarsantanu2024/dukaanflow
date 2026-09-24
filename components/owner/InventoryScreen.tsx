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
import { needsRestock } from '@/lib/restock';
import { ItemsManager, type AdminItem } from '@/components/admin/ItemsManager';
import { RestockCard } from './RestockCard';
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
  shopType,
}: {
  slug: string;
  /** Printed at the top of the supplier's list and its PDF. */
  shopName: string;
  items: AdminItem[];
  catalogue: StarterItem[];
  locale: Locale;
  showWelcome: boolean;
  itemLimit: number;
  /** Drives which units this shop is offered. */
  shopType: ShopType;
}) {
  const t = ownerDict(locale);
  const [welcome, setWelcome] = useState(showWelcome);
  // The common-items catalogue opens in a drawer, and it starts closed.
  const [picker, setPicker] = useState(false);

  const outOfStock = items.filter((item) => !item.inStock).length;
  // In stock but at or under the low mark — the same rule the supplier's list uses.
  const runningLow = useMemo(
    () => needsRestock(items).filter((item) => item.inStock && item.stockQty !== 0).length,
    [items],
  );
  const usedShare = itemLimit > 0 ? Math.min(1, items.length / itemLimit) : 0;

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
        catalogueEntry={{ label: t.starterTitle, count: unlisted.length, open: () => setPicker(true) }}
      />

      {/* THE SUPPLIER'S LIST SITS DIRECTLY UNDER THE ITEMS, AND IN SIMPLE MODE.
          It is not a setting — it is a job, done weekly, standing at the
          counter with a vendor in front of you, and the moment it is needed is
          too short to go hunting behind "More settings" for it. It costs one
          quiet line on a shop whose shelves are full. */}
      <RestockCard slug={slug} shopName={shopName} items={items} locale={locale} />

      {/* THE COMMON-ITEMS CARD IS GONE FROM THIS TAB, BY REQUEST. Picking from
          the ready-made list is a way of adding an item, so it is now one row
          inside the add sheet (see `catalogueEntry` on ItemsManager), beside
          speaking, typing and the photo. The picker still opens here. */}
      {/* `inDrawer`, so the picker's own Add bar sits on the drawer's bottom
          edge instead of clearing a tab bar that is not there. */}
      <Drawer open={picker} title={t.starterTitle} onClose={() => setPicker(false)}>
        <StarterPicker
          slug={slug}
          catalogue={unlisted}
          locale={locale}
          remaining={Math.max(0, itemLimit - items.length)}
          onDismiss={() => setPicker(false)}
          inDrawer
        />
      </Drawer>

      {/* THE SETTINGS THAT USED TO BE HERE HAVE MOVED, and off this tab
          entirely. The customer notice, the delivery terms and the smallest
          order are now in one folded block at the foot of EVERY owner screen —
          see `MoreDrawer`. They were only ever on Items because Items is where
          the first of them was built, so an owner standing at the till who
          wanted to change their notice had to know to go to a tab about
          something else. What is left below is a summary of this screen's own
          list, which is the one thing that genuinely belongs to it. */}
      {/* THREE NUMBERS, THREE TILES. This was one grey line — "31 items / 1000
          · 1 out" — that read as a footnote. The list's size now shows how much
          of the plan it uses as a bar, and what has run out or is running low
          each get a tile in the colour the rest of the app uses for them. */}
      <section className="grid grid-cols-3 gap-2">
        <div className="col-span-3 rounded-2xl border border-glass-edge bg-glass p-3 shadow-raised sm:col-span-1">
          <p className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums text-slate-900">{items.length}</span>
            <span className="text-sm text-slate-500">{t.itemsCount}</span>
            <span className="ml-auto text-xs tabular-nums text-slate-400">
              {t.ofLimit} {itemLimit}
            </span>
          </p>
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
        </div>
        <div className="col-span-3 grid grid-cols-2 gap-2 sm:col-span-2">
          <div className={clsx('rounded-2xl border p-3 shadow-raised', outOfStock > 0 ? 'border-rose-200 bg-rose-50' : 'border-glass-edge bg-glass')}>
            <p className={clsx('text-2xl font-semibold tabular-nums', outOfStock > 0 ? 'text-rose-700' : 'text-slate-400')}>{outOfStock}</p>
            <p className="text-sm text-slate-600">{t.outOfStockCount}</p>
          </div>
          <div className={clsx('rounded-2xl border p-3 shadow-raised', runningLow > 0 ? 'border-amber-200 bg-amber-50' : 'border-glass-edge bg-glass')}>
            <p className={clsx('text-2xl font-semibold tabular-nums', runningLow > 0 ? 'text-amber-800' : 'text-slate-400')}>{runningLow}</p>
            <p className="text-sm text-slate-600">{t.runningLowCount}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
