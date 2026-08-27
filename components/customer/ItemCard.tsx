'use client';

import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { formatRupees } from '@/lib/money';
import type { Locale } from '@/lib/i18n';
import { dict } from '@/lib/i18n';

export type CustomerItem = {
  id: string;
  name: string;
  nameBn: string;
  nameHi: string;
  price: number;
  unit: string;
  category: string;
  inStock: boolean;
  imageData?: string;
};

/**
 * The item's name in the shopper's language, falling back to the primary name.
 * A shop that only ever typed English still reads; one stocked by voice in
 * Bengali reads to a Bengali shopper in Bengali.
 */
export function itemName(item: CustomerItem, locale: Locale): string {
  if (locale === 'bn') return item.nameBn || item.name;
  if (locale === 'hi') return item.nameHi || item.name;
  return item.name;
}

export function ItemCard({
  item,
  quantity,
  onChange,
  locale,
}: {
  item: CustomerItem;
  quantity: number;
  onChange: (next: number) => void;
  locale: Locale;
}) {
  const t = dict(locale);
  const disabled = !item.inStock;
  const label = itemName(item, locale);

  return (
    <li
      className={clsx(
        'flex items-center justify-between gap-3 rounded-2xl border bg-white p-3 shadow-card',
        disabled ? 'border-slate-200 opacity-60' : 'border-slate-200',
      )}
    >
      {/* A picture does the work three names cannot: a shopper who reads none
          of the languages still knows what they are buying. Absent on most
          items, so it takes space only when there is something to show. */}
      {item.imageData && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageData}
          alt=""
          className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">{label}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-brand-700">{formatRupees(item.price)}</span>
          {item.unit && <span className="text-sm text-slate-500">/ {item.unit}</span>}
          <Badge tone={item.inStock ? 'green' : 'red'}>
            {item.inStock ? t.inStock : t.outOfStock}
          </Badge>
        </div>
      </div>

      {disabled ? (
        <span className="shrink-0 text-sm font-medium text-slate-400">{t.outOfStock}</span>
      ) : quantity === 0 ? (
        <button
          type="button"
          onClick={() => onChange(1)}
          className="h-10 shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {t.add}
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-brand-200 bg-brand-50 p-1">
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            onClick={() => onChange(quantity - 1)}
            className="h-9 w-9 rounded-lg text-lg font-bold text-brand-700 hover:bg-white"
          >
            −
          </button>
          <span aria-live="polite" className="w-7 text-center font-bold text-slate-900">
            {quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase ${label}`}
            disabled={quantity >= 99}
            onClick={() => onChange(quantity + 1)}
            className="h-9 w-9 rounded-lg text-lg font-bold text-brand-700 hover:bg-white disabled:opacity-40"
          >
            +
          </button>
        </div>
      )}
    </li>
  );
}
