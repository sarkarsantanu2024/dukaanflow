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
  // Offered while the shop is still small; a stocked shop does not need it.
  const [starter, setStarter] = useState(items.length < 5);

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
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <VoiceArt className="mx-auto mb-4 h-28 w-auto max-w-[16rem]" />
        <h2 className="text-xl font-bold text-slate-900">{t.welcomeTitle}</h2>
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
      <RestockCard shopName={shopName} items={items} locale={locale} />

      {/* Kept in simple mode, and on purpose. This is the one card here that
          does work FOR the owner rather than asking something of them: one tap
          and a shop that has nothing in it has sixty items, priced. It also
          stops offering itself once the shop has five, so it is never part of
          what a working owner scrolls past. */}
      {starter && unlisted.length > 0 && (
        <StarterPicker
          slug={slug}
          catalogue={unlisted}
          locale={locale}
          remaining={Math.max(0, itemLimit - items.length)}
          onDismiss={() => setStarter(false)}
        />
      )}

      {/* THE SETTINGS THAT USED TO BE HERE HAVE MOVED, and off this tab
          entirely. The customer notice, the delivery terms and the smallest
          order are now in one folded block at the foot of EVERY owner screen —
          see `MoreDrawer`. They were only ever on Items because Items is where
          the first of them was built, so an owner standing at the till who
          wanted to change their notice had to know to go to a tab about
          something else. What is left below is a summary of this screen's own
          list, which is the one thing that genuinely belongs to it. */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-2xl bg-white px-4 py-3 shadow-card">
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
