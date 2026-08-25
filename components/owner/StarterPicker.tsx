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
 */

import { useState } from 'react';
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
  onDismiss,
}: {
  slug: string;
  catalogue: StarterItem[];
  locale: Locale;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const groups = catalogue.reduce<Record<string, StarterItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  function toggle(name: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
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

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
      <h2 className="font-semibold text-slate-900">{t.starterTitle}</h2>
      <p className="mt-1 text-sm text-slate-600">{t.starterHint}</p>

      <div className="mt-3 space-y-3">
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {translateCategory(category, locale)}
            </h3>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => {
                const on = picked.has(item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggle(item.name)}
                    aria-pressed={on}
                    className={clsx(
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                      on
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    {starterName(item, locale)}
                    {item.unit && (
                      <span className={on ? 'text-white/70' : 'text-slate-400'}> · {item.unit}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
