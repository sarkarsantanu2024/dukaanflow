'use client';

/**
 * Cataloguing — kept apart from the till on purpose.
 *
 * First run walks the owner through saying one item, because nobody
 * spontaneously talks to a blank screen. After that it is the starter
 * catalogue, the mic, and the list.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ItemsManager, type AdminItem } from '@/components/admin/ItemsManager';
import type { ShopType } from '@prisma/client';
import { StarterPicker } from './StarterPicker';
import { ownerDict } from '@/lib/owner-i18n';
import { VoiceArt } from '@/components/ui/ShopArt';
import { formatRupees } from '@/lib/money';
import type { StarterItem } from '@/lib/starter-catalogue';
import type { Locale } from '@/lib/i18n';

export function InventoryScreen({
  slug,
  items,
  catalogue,
  locale,
  showWelcome,
  itemLimit,
  shopType,
}: {
  slug: string;
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
  const unpriced = items.filter((item) => !item.priced).length;

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
        {unpriced > 0 && (
          <p className="text-sm tabular-nums text-slate-500">
            {unpriced} × {formatRupees(1)}
          </p>
        )}
      </div>

      {starter && catalogue.length > 0 && (
        <StarterPicker
          slug={slug}
          catalogue={catalogue}
          locale={locale}
          remaining={Math.max(0, itemLimit - items.length)}
          onDismiss={() => setStarter(false)}
        />
      )}

      <ItemsManager
        slug={slug}
        items={items}
        locale={locale}
        shopType={shopType}
        catalogue={catalogue}
      />
    </div>
  );
}
