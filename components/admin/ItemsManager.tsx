'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { VoiceItemAdder } from './VoiceItemAdder';
import { formatRupees } from '@/lib/money';
import { suggestNames } from '@/lib/speech';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export type AdminItem = {
  id: string;
  name: string;
  nameBn: string;
  nameHi: string;
  price: number;
  unit: string;
  category: string;
  inStock: boolean;
};

type NewItem = {
  name: string;
  nameBn: string;
  nameHi: string;
  price: string;
  unit: string;
  category: string;
};

const EMPTY_NEW_ITEM: NewItem = {
  name: '',
  nameBn: '',
  nameHi: '',
  price: '',
  unit: '',
  category: '',
};

export function ItemsManager({
  slug,
  items,
  locale = 'en',
}: {
  slug: string;
  items: AdminItem[];
  /** The owner's language. The Super Admin console stays English. */
  locale?: Locale;
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);
  // The typed form is secondary to the mic on a phone, so it starts folded
  // away and opens on request.
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [draft, setDraft] = useState<NewItem>(EMPTY_NEW_ITEM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Price edits are local until blur/Enter, so typing "6" of "68" doesn't save.
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort(),
    [items],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category && item.category !== category) return false;
      if (!needle) return true;
      return `${item.name} ${item.nameBn} ${item.nameHi} ${item.unit} ${item.category}`
        .toLowerCase()
        .includes(needle);
    });
  }, [items, query, category]);

  /**
   * Fills the two translations when the typed name is one we know, without
   * ever overwriting something the shopkeeper entered by hand.
   */
  function nameChanged(name: string) {
    const known = suggestNames(name);
    setDraft((current) => ({
      ...current,
      name,
      nameBn: current.nameBn || known?.bn || '',
      nameHi: current.nameHi || known?.hi || '',
    }));
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);
    setErrors({});

    try {
      const response = await fetch(`/api/admin/shop/${slug}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          nameBn: draft.nameBn,
          nameHi: draft.nameHi,
          price: Number(draft.price),
          unit: draft.unit,
          category: draft.category,
          inStock: true,
        }),
      });
      const payload = (await response.json()) as { error?: string; errors?: Record<string, string> };

      if (!response.ok) {
        setErrors(payload.errors ?? {});
        push(payload.error ?? t.networkError, 'error');
        return;
      }

      push(`${draft.name} ✓`, 'success');
      setDraft(EMPTY_NEW_ITEM);
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setAdding(false);
    }
  }

  async function patchItem(id: string, changes: Record<string, unknown>) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        push(payload.error ?? t.networkError, 'error');
        return false;
      }
      router.refresh();
      return true;
    } catch {
      push(t.networkError, 'error');
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(item: AdminItem) {
    if (!window.confirm(`${item.name} — ${t.deleteConfirm}`)) return;
    setBusyId(item.id);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
      if (!response.ok) {
        push(t.networkError, 'error');
        return;
      }
      push(`${item.name} ✓`, 'success');
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function commitPrice(item: AdminItem) {
    const raw = priceDrafts[item.id];
    if (raw === undefined) return;

    const price = Number(raw);
    setPriceDrafts((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });

    if (!Number.isInteger(price) || price < 1) {
      push(`${t.price} — 1, 2, 3…`, 'error');
      return;
    }
    if (price === item.price) return;

    if (await patchItem(item.id, { price })) push(`${item.name} → ${formatRupees(price)}`, 'success');
  }

  return (
    <div className="space-y-6">
      <VoiceItemAdder slug={slug} items={items} locale={locale} />

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <button
          type="button"
          onClick={() => setTyping((open) => !open)}
          aria-expanded={typing}
          className="text-sm font-semibold text-brand-700 underline"
        >
          {typing ? t.hideForm : t.typeInstead}
        </button>
      </div>

      <form
        onSubmit={addItem}
        hidden={!typing}
        className="rounded-2xl bg-white p-4 shadow-card"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t.name}
            required
            value={draft.name}
            onChange={(event) => nameChanged(event.target.value)}
            error={errors.name}
            placeholder="Rice"
          />
          <Input
            label={t.price}
            required
            type="number"
            inputMode="numeric"
            min={1}
            value={draft.price}
            onChange={(event) => setDraft({ ...draft, price: event.target.value })}
            error={errors.price}
            placeholder="68"
          />
          <Input
            label={t.unit}
            value={draft.unit}
            onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
            error={errors.unit}
            placeholder="1 kg"
          />
          <Input
            label={t.category}
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            error={errors.category}
            placeholder="Staples"
          />
          <Input
            label={t.nameBn}
            value={draft.nameBn}
            onChange={(event) => setDraft({ ...draft, nameBn: event.target.value })}
            error={errors.nameBn}
            placeholder="চাল"
          />
          <Input
            label={t.nameHi}
            value={draft.nameHi}
            onChange={(event) => setDraft({ ...draft, nameHi: event.target.value })}
            error={errors.nameHi}
            placeholder="चावल"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">{t.upsertHint}</p>
        <Button type="submit" className="mt-3" loading={adding}>
          {t.saveItem}
        </Button>
      </form>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchItems}
            aria-label={t.searchItems}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
          />
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label={t.allCategories}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 sm:w-52"
            >
              <option value="">{t.allCategories}</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState title={t.noItems} hint={t.noItemsHint} />
        ) : visible.length === 0 ? (
          <EmptyState title={t.noMatch} />
        ) : (
          <ul className="space-y-2">
            {visible.map((item) => (
              <li
                key={item.id}
                className={clsx(
                  'flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-card',
                  busyId === item.id && 'opacity-60',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {item.name}
                    {item.unit && <span className="font-normal text-slate-500"> · {item.unit}</span>}
                  </p>
                  {(item.nameBn || item.nameHi) && (
                    <p className="truncate text-xs text-slate-500">
                      {[item.nameBn, item.nameHi].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {item.category && <Badge>{item.category}</Badge>}
                    <Badge tone={item.inStock ? 'green' : 'red'}>
                      {item.inStock ? t.inStock : t.outOfStock}
                    </Badge>
                  </div>
                </div>

                <label className="flex items-center gap-1">
                  <span className="text-slate-500">₹</span>
                  <input
                    type="number"
                    min={1}
                    aria-label={`Price of ${item.name}`}
                    value={priceDrafts[item.id] ?? String(item.price)}
                    onChange={(event) =>
                      setPriceDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    onBlur={() => commitPrice(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                    }}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right"
                  />
                </label>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => patchItem(item.id, { inStock: !item.inStock })}
                >
                  {item.inStock ? t.markOut : t.markIn}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => deleteItem(item)}
                  className="text-red-600 hover:bg-red-50"
                >
                  {t.delete}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
