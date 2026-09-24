'use client';

/**
 * What was handed over, picked from the shop's own list.
 *
 * This replaced a free-text "Note" box whose placeholder was "chal, tel". Three
 * problems with that, all of them the shopkeeper's: it is typing, on a phone,
 * in a script the keyboard may not be set to, while somebody waits; the same
 * item ends up spelled three ways across a year of entries; and the box gave no
 * help at all with the number that actually matters, the amount.
 *
 * Tapping an item adds one, tapping again adds another — the same gesture the
 * till and the shop page use for exactly this. The note is written from the
 * picks, and the picks also add up, so the amount can be filled from them
 * instead of being done in the shopkeeper's head.
 *
 * NOTHING HERE IS COMPULSORY. An entry with no items is still a valid entry —
 * "₹200, gave cash" is a real line in a paper khata — so the picker starts
 * closed and the amount is always editable by hand.
 */

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { SearchIcon } from '@/components/ui/Icon';
import { SearchMic } from '@/components/voice/SearchMic';
import { spokenSearchText, rankBySearch } from '@/lib/speech';
import { formatPaise, paiseToInput } from '@/lib/money';
import { localUnit, MOST_PER_LINE } from '@/lib/units';
import { matchesSearch } from '@/lib/speech';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export type PickableItem = {
  id: string;
  name: string;
  nameBn: string;
  nameHi: string;
  unit: string;
  pricePaise: number;
};

/** How many items before the search box earns its place. */
const SEARCH_FROM = 12;

function label(item: PickableItem, locale: Locale): string {
  if (locale === 'bn') return item.nameBn || item.name;
  if (locale === 'hi') return item.nameHi || item.name;
  return item.name;
}

export function ItemNotePicker({
  items,
  locale,
  /** The note as it stands — the picker owns it once anything is picked. */
  onNoteChange,
  /** Called with the picks' total in paise, so the caller can fill the amount. */
  onUseTotal,
}: {
  items: PickableItem[];
  locale: Locale;
  onNoteChange: (note: string) => void;
  onUseTotal: (paise: number) => void;
}) {
  const t = ownerDict(locale);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  /** itemId → how many of it. Absent means not picked. */
  const [picked, setPicked] = useState<Record<string, number>>({});

  // Best match first, as on the shop page and the till — see `rankBySearch`.
  const visible = useMemo(
    () =>
      rankBySearch(
        items.filter((item) => matchesSearch([item.name, item.nameBn, item.nameHi, item.unit], query)),
        query,
        (item) => [item.name, item.nameBn, item.nameHi],
      ),
    [items, query],
  );

  const chosen = useMemo(
    () => items.filter((item) => (picked[item.id] ?? 0) > 0),
    [items, picked],
  );

  const totalPaise = chosen.reduce((sum, item) => sum + item.pricePaise * picked[item.id]!, 0);

  /** "Atta 1 kg ×2, Rice ×1" — what the entry will read as in the history. */
  function noteFrom(next: Record<string, number>): string {
    return items
      .filter((item) => (next[item.id] ?? 0) > 0)
      .map((item) => {
        const count = next[item.id]!;
        const name = [label(item, locale), item.unit].filter(Boolean).join(' ');
        return count > 1 ? `${name} ×${count}` : name;
      })
      .join(', ');
  }

  function change(id: string, delta: number) {
    setPicked((current) => {
      const next = { ...current };
      const count = (next[id] ?? 0) + delta;
      if (count <= 0) delete next[id];
      else next[id] = Math.min(count, MOST_PER_LINE);
      onNoteChange(noteFrom(next));
      return next;
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">{t.khataItems}</span>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex min-h-10 items-center px-1 text-sm font-semibold text-brand-700 underline"
        >
          {open ? t.khataItemsClose : t.khataItemsPick}
        </button>

        {/* The total sits with the picks and fills the amount on a tap. It is
            never applied on its own: a shop gives goods at a discount, or
            throws in a handful of dhania, and the book has to follow what
            actually happened rather than what the price list says. */}
        {totalPaise > 0 && (
          <button
            type="button"
            onClick={() => onUseTotal(totalPaise)}
            className="ml-auto rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-800"
          >
            {formatPaise(totalPaise)} · {t.khataItemsUseTotal}
          </button>
        )}
      </div>

      {/* What is picked, always visible — the panel can be shut and the entry
          still has to say what it is for. */}
      {chosen.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chosen.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => change(item.id, -picked[item.id]!)}
              aria-label={`${t.delete} — ${label(item, locale)}`}
              className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-sm font-medium text-white"
            >
              {label(item, locale)}
              {picked[item.id]! > 1 && <span className="tabular-nums">×{picked[item.id]}</span>}
              <span aria-hidden className="text-white/80">
                ✕
              </span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-sunk p-2">
          {items.length >= SEARCH_FROM && (
            <div className="flex items-center gap-2 rounded-xl bg-card pl-3 pr-1.5 ring-1 ring-slate-300/70 focus-within:ring-brand-500">
              <SearchIcon className="pointer-events-none h-[18px] w-[18px] shrink-0 text-slate-500" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchItems}
                aria-label={t.searchItems}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
              <SearchMic
                locale={locale}
                onText={setQuery}
                label={t.searchItems}
                resolve={(heard) => spokenSearchText(heard, items, (item) => label(item, locale))}
              />
            </div>
          )}

          {/* Capped in height and scrolled: a hundred-item kirana would
              otherwise push the two buttons that finish this form off the
              bottom of the screen. */}
          <ul className="mt-2 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg bg-card">
            {visible.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-slate-500">{t.noMatch}</li>
            ) : (
              visible.map((item) => {
                const count = picked[item.id] ?? 0;
                return (
                  <li key={item.id} className="flex items-center gap-2 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => change(item.id, 1)}
                      className={clsx(
                        'min-w-0 flex-1 rounded-lg px-1 py-1 text-left',
                        count > 0 && 'font-semibold text-brand-800',
                      )}
                    >
                      <span className="block truncate text-sm">
                        {label(item, locale)}
                        {item.unit && <span className="text-slate-500"> · {localUnit(item.unit, locale)}</span>}
                      </span>
                      <span className="text-xs tabular-nums text-slate-500">
                        {formatPaise(item.pricePaise)}
                      </span>
                    </button>

                    {count > 0 ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-50 p-0.5">
                        <button
                          type="button"
                          aria-label={`− ${label(item, locale)}`}
                          onClick={() => change(item.id, -1)}
                          className="h-8 w-8 rounded-md text-lg font-semibold text-brand-800"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {count}
                        </span>
                        <button
                          type="button"
                          aria-label={`+ ${label(item, locale)}`}
                          onClick={() => change(item.id, 1)}
                          className="h-8 w-8 rounded-md text-lg font-semibold text-brand-800"
                        >
                          +
                        </button>
                      </span>
                    ) : (
                      <span className="shrink-0 pr-2 text-xs tabular-nums text-slate-400">
                        {paiseToInput(item.pricePaise)}
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
