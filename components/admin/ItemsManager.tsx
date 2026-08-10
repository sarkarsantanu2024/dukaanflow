'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatRupees } from '@/lib/money';

export type AdminItem = {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  inStock: boolean;
};

type NewItem = { name: string; price: string; unit: string; category: string };

const EMPTY_NEW_ITEM: NewItem = { name: '', price: '', unit: '', category: '' };

export function ItemsManager({ slug, items }: { slug: string; items: AdminItem[] }) {
  const router = useRouter();
  const { push } = useToast();
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
      return `${item.name} ${item.unit} ${item.category}`.toLowerCase().includes(needle);
    });
  }, [items, query, category]);

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
          price: Number(draft.price),
          unit: draft.unit,
          category: draft.category,
          inStock: true,
        }),
      });
      const payload = (await response.json()) as { error?: string; errors?: Record<string, string> };

      if (!response.ok) {
        setErrors(payload.errors ?? {});
        push(payload.error ?? 'Could not save the item', 'error');
        return;
      }

      push(`${draft.name} saved`, 'success');
      setDraft(EMPTY_NEW_ITEM);
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
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
        push(payload.error ?? 'Update failed', 'error');
        return false;
      }
      router.refresh();
      return true;
    } catch {
      push('Network error. Please try again.', 'error');
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(item: AdminItem) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setBusyId(item.id);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
      if (!response.ok) {
        push('Could not delete the item', 'error');
        return;
      }
      push(`${item.name} deleted`, 'success');
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
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
      push('Price must be a whole number of rupees', 'error');
      return;
    }
    if (price === item.price) return;

    if (await patchItem(item.id, { price })) push(`${item.name} → ${formatRupees(price)}`, 'success');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addItem} className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="mb-3 font-semibold text-slate-900">Add or update an item</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Name"
            required
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            error={errors.name}
            placeholder="Rice"
          />
          <Input
            label="Price (₹)"
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
            label="Unit"
            value={draft.unit}
            onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
            error={errors.unit}
            placeholder="1 kg"
          />
          <Input
            label="Category"
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            error={errors.category}
            placeholder="Staples"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Same name and unit? The existing item is updated instead of duplicated.
        </p>
        <Button type="submit" className="mt-3" loading={adding}>
          Save item
        </Button>
      </form>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search items"
            aria-label="Search items"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
          />
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 sm:w-52"
            >
              <option value="">All categories</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No items yet"
            hint="Add items one by one above, or paste the whole price list using bulk update."
          />
        ) : visible.length === 0 ? (
          <EmptyState title="No items match that search" />
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
                  <div className="mt-1 flex items-center gap-2">
                    {item.category && <Badge>{item.category}</Badge>}
                    <Badge tone={item.inStock ? 'green' : 'red'}>
                      {item.inStock ? 'In stock' : 'Out of stock'}
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
                  {item.inStock ? 'Mark out' : 'Mark in'}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => deleteItem(item)}
                  className="text-red-600 hover:bg-red-50"
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
