'use client';

/**
 * One-tap catalogue for a shop's first day.
 *
 * Dictating a hundred item names is the reason shops never finish setting up.
 * These are the things a shop of this kind almost always carries, already named
 * in three languages with the right units — the owner ticks what they sell and
 * is left with the one job only they can do, which is setting their own prices.
 *
 * Everything lands out of stock at ₹1 for exactly that reason: nothing reaches
 * a customer until the owner has said what it costs.
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
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ownerDict } from '@/lib/owner-i18n';
import { starterName, type StarterItem } from '@/lib/starter-catalogue';
import { translateCategory } from '@/lib/speech';
import type { Locale } from '@/lib/i18n';

export function StarterPicker({
  slug,
  catalogue,
  locale,
  remaining,
  onDismiss,
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
  onDismiss: () => void;
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
    return catalogue.filter((item) =>
      `${item.name} ${item.nameBn} ${item.nameHi} ${item.unit} ${item.category}`
        .toLowerCase()
        .includes(needle),
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
      onDismiss();
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
          'rounded-full border px-3 py-1.5 text-sm font-medium transition',
          on
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
          !on && full && 'cursor-not-allowed opacity-40',
        )}
      >
        {starterName(item, locale)}
        {item.unit && (
          <span className={on ? 'text-white/70' : 'text-slate-400'}> · {item.unit}</span>
        )}
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
      <h2 className="font-semibold text-slate-900">{t.starterTitle}</h2>
      <p className="mt-1 text-sm text-slate-600">{t.starterHint}</p>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.starterSearch}
        aria-label={t.starterSearch}
        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base"
      />

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
              <div key={category} className="overflow-hidden rounded-xl bg-white">
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

      {/* Room left, shown only when it is finite and worth knowing about. */}
      {Number.isFinite(room) && (
        <p className={clsx('mt-3 text-xs', full ? 'font-semibold text-amber-700' : 'text-slate-500')}>
          {full ? t.starterFull : `${room - picked.size} ${t.starterRoomLeft}`}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={add} loading={busy} disabled={picked.size === 0}>
          {t.starterAdd}
          {picked.size > 0 ? ` (${picked.size})` : ''}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          {t.starterSkip}
        </Button>
      </div>
    </section>
  );
}
