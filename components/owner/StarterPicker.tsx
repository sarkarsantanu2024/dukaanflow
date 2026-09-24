'use client';

/**
 * One-tap catalogue for a shop's first day.
 *
 * Dictating a hundred item names is the reason shops never finish setting up.
 * These are the things a shop of this kind almost always carries, already named
 * in three languages with the right units — the owner ticks what they sell and
 * is left with the one job only they can do, which is setting their own prices.
 *
 * Items land priced, in stock and on sale, at the catalogue's typical retail
 * for the pack size — see `app/api/admin/shop/[slug]/starter/route.ts` for why
 * that beats the ₹1 placeholder this used to add. Every chip therefore shows
 * the price it will arrive at, because that number is the owner's to correct
 * and they cannot correct one they were never shown.
 *
 * The list is long on purpose — a kirana catalogue that only offered thirty
 * things would send the owner straight back to dictating. Long lists need
 * different handling from short ones, so groups start closed, there is a search
 * across all three languages, and each group can be taken whole. A wall of a
 * hundred chips would be worse than no list at all.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { SearchIcon } from '@/components/ui/Icon';
import { SearchMic } from '@/components/voice/SearchMic';
import { spokenSearchText, rankBySearch } from '@/lib/speech';
import { Button } from '@/components/ui/Button';
import { DrawerFooter } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';
import { ownerDict } from '@/lib/owner-i18n';
import { starterName, starterOtherNames, type StarterItem } from '@/lib/starter-catalogue';
import { matchesSearch, translateCategory } from '@/lib/speech';
import { formatPaise } from '@/lib/money';
import { localUnit, rateUnit } from '@/lib/units';
import type { Locale } from '@/lib/i18n';

export function StarterPicker({
  slug,
  catalogue,
  locale,
  remaining,
  onDismiss,
  inDrawer = false,
}: {
  slug: string;
  catalogue: StarterItem[];
  locale: Locale;
  /**
   * Room left on the plan. The server refuses an over-limit batch outright, so
   * without this an owner on Free could tick forty items and lose all of them
   * to one error — the worst possible first five minutes.
   */
  remaining?: number;
  /** How the owner leaves without taking anything; the drawer's close, on that side. */
  onDismiss?: () => void;
  /**
   * Is this inside a drawer rather than on the owner's Items tab?
   *
   * It decides one thing and it is not cosmetic: how far off the bottom the
   * Add bar sticks. On the Items tab it has to clear the app's fixed tab bar,
   * and a drawer has no tab bar — so the same offset left the bar hovering
   * three-quarters of an inch above the bottom edge with the list sliding
   * through the gap underneath it, which is exactly as broken as it sounds.
   */
  inDrawer?: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => {
    const byCategory = new Map<string, StarterItem[]>();
    for (const item of catalogue) {
      const list = byCategory.get(item.category);
      if (list) list.push(item);
      else byCategory.set(item.category, [item]);
    }
    return [...byCategory.entries()];
  }, [catalogue]);

  // The first group opens so the picker never looks like an empty box; the
  // rest stay shut so the whole list is one screen of headings.
  const [open, setOpen] = useState<Set<string>>(() => new Set(groups.slice(0, 1).map(([c]) => c)));

  /** Matches all three languages, so a Bengali owner can type চাল or "rice". */
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return null;
    // Spelling-tolerant, the same test every other item search uses, so a
    // voice search that finds something by it finds the same here.
    return rankBySearch(
      catalogue.filter((item) =>
        matchesSearch([item.name, item.nameBn, item.nameHi, item.unit, item.category], needle),
      ),
      needle,
      (item) => [item.name, item.nameBn, item.nameHi],
    );
  }, [catalogue, query]);

  const room = remaining ?? Number.POSITIVE_INFINITY;
  const full = picked.size >= room;

  function toggle(name: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else if (next.size < room) next.add(name);
      return next;
    });
  }

  /** Takes a whole group, or drops it if it is already wholly taken. */
  function toggleGroup(items: StarterItem[]) {
    setPicked((current) => {
      const next = new Set(current);
      const all = items.every((item) => next.has(item.name));
      for (const item of items) {
        if (all) next.delete(item.name);
        else if (next.size < room) next.add(item.name);
      }
      return next;
    });
  }

  function toggleOpen(category: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  async function add() {
    if (picked.size === 0) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/starter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: [...picked] }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        created?: number;
        error?: string;
      };

      if (!response.ok) {
        push(payload.error ?? t.networkError, 'error');
        return;
      }

      push(`${payload.created ?? 0} ${t.starterAdded}`, 'success');
      onDismiss?.();
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusy(false);
    }
  }

  function chip(item: StarterItem) {
    const on = picked.has(item.name);
    return (
      <button
        key={`${item.name}-${item.unit}`}
        type="button"
        onClick={() => toggle(item.name)}
        aria-pressed={on}
        disabled={!on && full}
        className={clsx(
          'rounded-2xl border px-3 py-1.5 text-left text-sm font-medium transition',
          on
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-slate-300 bg-card text-slate-700 hover:bg-slate-50',
          !on && full && 'cursor-not-allowed opacity-40',
        )}
      >
        {/* Both languages, because the operator reading this list and the
            shopkeeper they are doing it for do not read the same one, and a
            chip that says only "চাল" is unverifiable to one of them. */}
        <span className="block leading-tight">{starterName(item, locale)}</span>
        <span
          className={clsx(
            'block text-xs leading-tight',
            on ? 'text-white/70' : 'text-slate-500',
          )}
        >
          {starterOtherNames(item, locale).join(' · ')}
        </span>
        {/* THE PRICE IT WILL ARRIVE AT, AND WHAT THAT PRICE IS FOR.
            These items are added priced and on sale — the whole point of the
            list — so the chip was asking the owner to agree to a number it
            was not showing them. A suggested price nobody saw is the one most
            likely to go out to a customer uncorrected. Shown as a rate, so
            "₹55 / kg" reads as the shop's own board would. */}
        <span
          className={clsx(
            'mt-0.5 block text-xs font-semibold tabular-nums leading-tight',
            on ? 'text-white/85' : 'text-slate-600',
          )}
        >
          {formatPaise(item.pricePaise)}
          {rateUnit(item.unit) && (
            <span className={clsx('font-normal', on ? 'text-white/70' : 'text-slate-400')}>
              {' '}
              / {localUnit(rateUnit(item.unit), locale)}
            </span>
          )}
        </span>
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
      <h2 className="font-semibold text-slate-900">{t.starterTitle}</h2>
      <p className="mt-1 text-sm text-slate-600">{t.starterHint}</p>

      {/* The same search field as the shop page and the till. */}
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900/[.06] pl-3 pr-1.5 transition-colors focus-within:bg-slate-900/[.09]">
        <SearchIcon className="pointer-events-none h-[18px] w-[18px] shrink-0 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.starterSearch}
          aria-label={t.starterSearch}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none"
        />
        <SearchMic
          locale={locale}
          onText={setQuery}
          label={t.starterSearch}
          resolve={(heard) =>
            spokenSearchText(
              heard,
              catalogue.map((item, index) => ({ ...item, id: String(index) })),
              (item) => starterName(item, locale),
            )
          }
        />
      </div>

      {matches ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {matches.length === 0 ? (
            <p className="py-2 text-sm text-slate-500">{t.noMatch}</p>
          ) : (
            matches.map(chip)
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          {groups.map(([category, items]) => {
            const isOpen = open.has(category);
            const count = items.filter((item) => picked.has(item.name)).length;
            const allOn = count === items.length;

            return (
              <div key={category} className="overflow-hidden rounded-xl bg-card">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleOpen(category)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      aria-hidden
                      className={clsx(
                        'text-slate-400 transition-transform',
                        isOpen && 'rotate-90',
                      )}
                    >
                      ▸
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {translateCategory(category, locale)}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-400">
                      {count > 0 ? `${count}/${items.length}` : items.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleGroup(items)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    {allOn ? t.starterClear : t.starterSelectAll}
                  </button>
                </div>

                {isOpen && (
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
                    {items.map(chip)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* The bar the owner commits from, always in front of them.
          This catalogue is five hundred items over a dozen groups, so the
          moment the owner opens a second group an Add button at the end of the
          list is gone — leaving them ticking chips with no visible way to
          commit them, and no running count of what they have ticked. It
          carries the count and the room left, which are the two facts that
          decide whether to tick one more.

          INSIDE A DRAWER IT IS THE DRAWER'S OWN FOOTER, not a sticky child of
          the scrolling list: opaque, on the panel's bottom edge, with nothing
          showing through it and nothing sliding underneath. `DrawerFooter`
          puts it there and renders it in place everywhere else, so the sticky
          version below is only ever the one on the Items tab, where the offset
          it needs is the app's fixed tab bar. */}
      <DrawerFooter>
        <div
          className={clsx(
            'flex flex-wrap items-center gap-x-3 gap-y-2',
            !inDrawer &&
              'sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 -mx-4 -mb-4 mt-3 border-t border-brand-200 bg-brand-50 px-4 pb-3 pt-3',
          )}
        >
          <Button onClick={add} loading={busy} disabled={picked.size === 0}>
            {t.starterAdd}
            {picked.size > 0 ? ` (${picked.size})` : ''}
          </Button>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              {t.starterSkip}
            </Button>
          )}

          {/* Room left, shown only when it is finite and worth knowing about. */}
          {Number.isFinite(room) && (
            <p
              className={clsx(
                'ml-auto text-xs',
                full ? 'font-semibold text-amber-700' : 'text-slate-500',
              )}
            >
              {full ? t.starterFull : `${room - picked.size} ${t.starterRoomLeft}`}
            </p>
          )}
        </div>
      </DrawerFooter>
    </section>
  );
}
