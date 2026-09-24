'use client';

/**
 * WHAT THE TILL SAYS WHEN THE SHELF RUNS OUT UNDER A SALE.
 *
 * The + on a counted item used to stop dead at the count, greyed out, and the
 * owner was left to guess why. Usually one of two things is true: the count is
 * wrong (a new carton came in and nobody wrote it down), or the shop really has
 * none and the customer should be told when to come back. This asks which.
 *
 * - ADD STOCK NOW writes the new count straight to the item and puts one more
 *   in the basket, so the sale carries on.
 * - TELL THE CUSTOMER records a date the item will be back. The bill prints it
 *   beside the item's name, so the promise goes home with the customer instead
 *   of being said across the counter and forgotten.
 */

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { itemName } from '@/components/customer/ItemCard';
import { ownerDict } from '@/lib/owner-i18n';
import { formatIsoDay } from '@/lib/time';
import { localUnit, parseStockAmount, rateUnit, stockWithUnit } from '@/lib/units';
import type { Locale } from '@/lib/i18n';
import type { SellItem } from './SellScreen';

function tomorrow(): string {
  return formatIsoDay(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

export function ShortStockModal({
  item,
  slug,
  locale,
  onClose,
  onStockAdded,
  onNoted,
}: {
  /** The item that ran out, or null when the modal is closed. */
  item: SellItem | null;
  slug: string;
  locale: Locale;
  onClose: () => void;
  /** Called once the new count is saved. */
  onStockAdded: (item: SellItem) => void;
  /** Called with the day the item will be back, "2026-09-26". */
  onNoted: (item: SellItem, isoDate: string) => void;
}) {
  const t = ownerDict(locale);
  const { push } = useToast();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(tomorrow);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // A fresh form for every item the modal opens on.
  useEffect(() => {
    setAmount('');
    setDate(tomorrow());
    setNote(item?.stockNote ?? '');
  }, [item?.id]);

  /**
   * Saved on the item, not only on this bill: every customer who reaches the
   * shelf on the shop page is shown the same date and message in a popup
   * (see `StoreFront`), until the count goes back above zero and the server
   * clears them.
   */
  async function tellCustomers() {
    if (!item || !date) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, backOn: date, stockNote: note.trim() }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        push(payload.error ?? t.networkError, 'error');
        return;
      }
      onNoted(item, date);
    } catch {
      push(t.networkError, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!item) return null;

  const name = itemName(item, locale);
  const left = localUnit(stockWithUnit(item.unit, Math.max(item.stockQty ?? 0, 0), t.pieceShort), locale);
  const hint = rateUnit(item.unit) || t.pieceShort;

  async function addStock() {
    if (!item) return;
    const parsed = parseStockAmount(amount, item.unit);
    if (parsed === null || parsed === 'bad' || parsed <= 0) {
      push(item.unit.trim() ? t.stockBadNumber : t.stockNoPack, 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Added to what the shelf already holds: the owner is saying "ten more
        // came in", not "there are ten".
        body: JSON.stringify({ id: item.id, stockQty: Math.max(item.stockQty ?? 0, 0) + parsed }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        push(payload.error ?? t.networkError, 'error');
        return;
      }
      push(`${name} · ${t.shortStockAdded}`, 'success');
      onStockAdded(item);
    } catch {
      push(t.networkError, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={item !== null} title={`${name} — ${t.shortTitle}`} onClose={onClose} size="md">
      <p className="text-sm text-slate-600">
        {t.shortLeft} <span className="font-semibold text-slate-900">{left}</span>
      </p>

      {/* ONE: the count was wrong, more is on the shelf. */}
      <section className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-3">
        <h3 className="font-semibold text-sky-900">{t.shortAddTitle}</h3>
        <p className="mt-0.5 text-xs text-sky-800">{t.shortAddHint}</p>
        <div className="mt-2 flex gap-2">
          <span className="relative min-w-0 flex-1">
            <input
              type="text"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="10"
              aria-label={t.shortAddTitle}
              className="h-11 w-full rounded-xl border border-slate-300 bg-card pl-3 pr-14 text-base tabular-nums focus:border-brand-500 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              {hint}
            </span>
          </span>
          <button
            type="button"
            onClick={addStock}
            disabled={saving}
            className="h-11 shrink-0 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {t.shortAddButton}
          </button>
        </div>
      </section>

      {/* TWO: there really is none; say when there will be. */}
      <section className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
        <h3 className="font-semibold text-amber-900">{t.shortTellTitle}</h3>
        <p className="mt-0.5 text-xs text-amber-800">{t.shortTellHint}</p>
        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={140}
          placeholder={t.shortTellNote}
          aria-label={t.shortTellNote}
          className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-card px-3 text-base focus:border-brand-500 focus:outline-none"
        />
        <div className="mt-2 flex gap-2">
          <input
            type="date"
            value={date}
            min={formatIsoDay(new Date())}
            onChange={(event) => setDate(event.target.value)}
            aria-label={t.shortTellTitle}
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-card px-3 text-base"
          />
          <button
            type="button"
            onClick={tellCustomers}
            disabled={!date || saving}
            className="h-11 shrink-0 rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-50"
          >
            {t.shortTellButton}
          </button>
        </div>
      </section>
    </Modal>
  );
}
