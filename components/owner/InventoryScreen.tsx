'use client';

/**
 * Cataloguing — kept apart from the till on purpose.
 *
 * First run walks the owner through saying one item, because nobody
 * spontaneously talks to a blank screen. After that it is the starter
 * catalogue, the mic, and the list.
 */

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
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
    <div className="space-y-4">
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
      {unlisted.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-50/60">
          <button
            type="button"
            onClick={() => setPicker(true)}
            aria-expanded={picker}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-brand-50"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-900">{t.starterTitle}</span>
              <span className="mt-0.5 block text-sm text-slate-600">{t.starterHint}</span>
            </span>
            <span className="shrink-0 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
              {unlisted.length}
            </span>
            <span aria-hidden className="shrink-0 text-slate-400">
              ▸
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
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-2xl border border-glass-edge bg-glass px-4 py-3 shadow-raised">
        <p className="font-semibold tabular-nums text-slate-900">
          {items.length} <span className="font-normal text-slate-500">{t.itemsCount}</span>
          <span className="font-normal text-slate-400">
            {' '}
            {t.ofLimit} {itemLimit}
          </span>
        </p>
        {outOfStock > 0 && (
          <p className="text-sm tabular-nums text-amber-700">
            {outOfStock} {t.outOfStockCount}
          </p>
        )}
      </div>
    </div>
  );
}
