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
import { NoticeCard } from './NoticeCard';
import { DeliveryCard } from './DeliveryCard';
import type { ShopType } from '@prisma/client';
import { StarterPicker } from './StarterPicker';
import { ownerDict } from '@/lib/owner-i18n';
import { VoiceArt } from '@/components/ui/ShopArt';
import { formatPaise } from '@/lib/money';
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
  noticeText,
  noticeFrom,
  noticeTo,
  deliveryEnabled,
  deliveryFeePaise,
  freeDeliveryAbovePaise,
  minOrderPaise,
}: {
  slug: string;
  items: AdminItem[];
  catalogue: StarterItem[];
  locale: Locale;
  /** The owner's notice to their customers, and the days it runs. */
  noticeText: string;
  /** "YYYY-MM-DD" each, or blank. */
  noticeFrom: string;
  noticeTo: string;
  /** The terms this shop delivers on. All PAISE; all zero by default. */
  deliveryEnabled: boolean;
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number;
  minOrderPaise: number;
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
            {unpriced} × {formatPaise(100)}
          </p>
        )}
      </div>

      {/* On this screen rather than behind a settings tab: a fifth tab for one
          field would cost every owner a slice of a small screen so a few of
          them could use it. Folded away until tapped, it costs one line. */}
      <NoticeCard
        slug={slug}
        locale={locale}
        noticeText={noticeText}
        noticeFrom={noticeFrom}
        noticeTo={noticeTo}
      />

      {/* Beside the notice, folded shut, for the same reason it is: three
          fields most shops set once and never open again should not cost a tab
          or a screenful. */}
      <DeliveryCard
        slug={slug}
        locale={locale}
        deliveryEnabled={deliveryEnabled}
        deliveryFeePaise={deliveryFeePaise}
        freeDeliveryAbovePaise={freeDeliveryAbovePaise}
        minOrderPaise={minOrderPaise}
      />

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
