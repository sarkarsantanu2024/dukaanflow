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
import { ChevronRightIcon, PlusIcon } from '@/components/ui/Icon';
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
  const starterName = (entry: StarterItem) =>
    (locale === 'bn' ? entry.nameBn : locale === 'hi' ? entry.nameHi : '') || entry.name;

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
  /** A few real names off the catalogue, so the card shows what is behind it. */
  const preview = unlisted.slice(0, 4);

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
      />

      {/* THE SUPPLIER'S LIST SITS DIRECTLY UNDER THE ITEMS, AND IN SIMPLE MODE.
          It is not a setting — it is a job, done weekly, standing at the
          counter with a vendor in front of you, and the moment it is needed is
          too short to go hunting behind "More settings" for it. It costs one
          quiet line on a shop whose shelves are full. */}
      <RestockCard slug={slug} shopName={shopName} items={items} locale={locale} />

      {/* THE CATALOGUE IS NOW ONE CLOSED LINE, AND IT OPENS A DRAWER.
          It used to unfold on the tab itself: a heading, a search box and a
          dozen category rows, five hundred items deep, sitting under the list
          on every load while the shop was young. That is a screen and a half
          of something the owner is not doing right now, between them and
          everything below it.

          Closed, it costs one row and says what is behind it. Opened, it gets
          the whole drawer — which is also the right shape for the job, because
          ticking eighty chips wants the screen, not a box halfway down a page.
          It is offered for the life of the shop rather than only while the
          shop has fewer than five items: a row this quiet never gets in the
          way, and a shop that adds a new line of goods in year two should not
          have to dictate it. */}
      {/* STILL ONE CARD, BUT IT SHOWS WHAT IS INSIDE. A title, a hint and a
          faint ▸ read as a footnote; the owner could not tell there were five
          hundred ready-made items behind it. Now a few real names from the
          catalogue sit on it as chips, the count says how many more, and the
          way in is a button that says "Choose". */}
      {unlisted.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-card shadow-raised">
          <button
            type="button"
            onClick={() => setPicker(true)}
            aria-expanded={picker}
            className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-brand-50/60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <PlusIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold leading-tight text-slate-900">{t.starterTitle}</span>
              <span className="mt-1 block text-xs leading-snug text-slate-600">{t.starterHint}</span>
              <span className="mt-2.5 flex flex-wrap gap-1.5">
                {preview.map((entry) => (
                  <span
                    key={`${entry.name}-${entry.unit}`}
                    className="rounded-full bg-card px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-brand-200"
                  >
                    {starterName(entry)}
                  </span>
                ))}
                {unlisted.length > preview.length && (
                  <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
                    +{unlisted.length - preview.length}
                  </span>
                )}
              </span>
              {/* On a phone the button goes under the chips, full width, so the
                  title and hint keep the whole row instead of a narrow column. */}
              <span className="mt-3 flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm sm:hidden">
                {t.starterChoose}
                <ChevronRightIcon className="h-4 w-4" />
              </span>
            </span>
            <span className="hidden h-10 shrink-0 items-center sm:inline-flex gap-1 self-center rounded-xl bg-brand-600 pl-3 pr-2 text-sm font-semibold text-white shadow-sm">
              {t.starterChoose}
              <ChevronRightIcon className="h-4 w-4" />
            </span>
          </button>
        </section>
      )}

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
