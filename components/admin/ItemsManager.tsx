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
import { ImagePicker } from './ImagePicker';
import { ItemPhoto } from './ItemPhoto';
import { formatRupees } from '@/lib/money';
import { suggestNames, translateCategory } from '@/lib/speech';
import { unitsFor, UNIT_LIST_ID } from '@/lib/units';
import { Drawer } from '@/components/ui/Drawer';
import type { ShopType } from '@prisma/client';
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
  imageData?: string;
};

type NewItem = {
  name: string;
  nameBn: string;
  nameHi: string;
  price: string;
  unit: string;
  category: string;
  imageData: string;
};

/**
 * The item's name in the reader's own language, falling back to the primary
 * name. The Super Admin console passes 'en' and so still reads in English.
 */
function displayName(item: AdminItem, locale: Locale): string {
  if (locale === 'bn') return item.nameBn || item.name;
  if (locale === 'hi') return item.nameHi || item.name;
  return item.name;
}

/**
 * The names *not* being shown as the heading, for the subtitle line. Kept as a
 * set so an item named the same in two languages is not listed twice, and so
 * the heading is never repeated underneath itself.
 */
function otherNames(item: AdminItem, locale: Locale): string[] {
  const shown = displayName(item, locale);
  return [...new Set([item.name, item.nameBn, item.nameHi])].filter(
    (name) => name && name !== shown,
  );
}

const EMPTY_NEW_ITEM: NewItem = {
  name: '',
  nameBn: '',
  nameHi: '',
  price: '',
  unit: '',
  category: '',
  imageData: '',
};

export function ItemsManager({
  slug,
  items,
  locale = 'en',
  wide = false,
  shopType = 'OTHER',
  tools,
}: {
  slug: string;
  items: AdminItem[];
  /** The owner's language. The Super Admin console stays English. */
  locale?: Locale;
  /**
   * The console has a desk's worth of width; the owner has a phone. Wide mode
   * moves the adding tools into a column beside the list instead of stacking
   * them on top of it, so the list starts at the top of the screen.
   */
  wide?: boolean;
  /** Drives which units this shop is offered. A tea stall is not weighed in kg. */
  shopType?: ShopType;
  /**
   * Heavy tools for the wide column — the common-items list, the bulk editor.
   * Each opens in a drawer rather than sitting in the column: stacked, they ran
   * to thousands of pixels and scrolled the whole page to show them, which
   * stranded the item list at the top beside an empty gutter.
   */
  tools?: { id: string; label: string; hint?: string; content: React.ReactNode }[];
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
  /** Which drawer is open, by tool id. `form` is this component's own. */
  const [drawer, setDrawer] = useState<string | null>(null);
  // Price edits are local until blur/Enter, so typing "6" of "68" doesn't save.
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [unitDrafts, setUnitDrafts] = useState<Record<string, string>>({});
  const units = unitsFor(shopType);

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
          imageData: draft.imageData,
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

  /**
   * Pack size is the shop's own decision — a starter item arrives at "1 kg"
   * and the shop selling rice by the 5 kg bag has to be able to say so. Until
   * this existed the only way to change a unit was to delete the item.
   */
  async function commitUnit(item: AdminItem) {
    const next = unitDrafts[item.id];
    if (next === undefined) return;

    setUnitDrafts((current) => {
      const copy = { ...current };
      delete copy[item.id];
      return copy;
    });

    const unit = next.trim();
    if (unit === item.unit) return;
    if (await patchItem(item.id, { unit })) push(`${displayName(item, locale)} · ${unit || '—'}`, 'success');
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

    // A starter item is parked at ₹1 and out of stock for one reason only:
    // nobody has said what it costs. Saying so is therefore also the answer to
    // why it was hidden, so pricing it puts it on sale. Leaving that as a
    // second, separate tap meant an owner priced their whole list and still
    // saw a shop full of "Out of stock".
    const wasUnpriced = item.price <= 1 && !item.inStock;
    const changes = wasUnpriced && price > 1 ? { price, inStock: true } : { price };

    if (await patchItem(item.id, changes)) {
      push(`${displayName(item, locale)} → ${formatRupees(price)}`, 'success');
    }
  }

  const typedForm = (
    <form onSubmit={addItem} className="rounded-2xl bg-white p-4 shadow-card">
        <div className={clsx('grid gap-3', wide ? 'grid-cols-2' : 'sm:grid-cols-2')}>
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
            list={UNIT_LIST_ID}
            value={draft.unit}
            onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
            error={errors.unit}
            placeholder={units[0]}
          />
          <Input
            label={t.category}
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            error={errors.category}
            placeholder="Staples"
          />
        </div>

        <div className="mt-3">
          <ImagePicker
            label={t.photo}
            hint={t.photoHint}
            shape="thumb"
            value={draft.imageData}
            onChange={(imageData) => setDraft((current) => ({ ...current, imageData }))}
            onError={(message) => push(message, 'error')}
          />
        </div>

        {/* The other two languages are filled in automatically for any name the
            product already knows, and left blank otherwise — the storefront
            falls back to the primary name. Nobody, operator or shopkeeper,
            reads all three, so asking for all three as required fields was
            asking for work that could not be done. Kept reachable, because a
            Bengali owner naming something the dictionary has never heard of is
            the one person who can supply it. */}
        <details className="mt-3 rounded-xl bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            {t.otherLanguages}
          </summary>
          <p className="mb-2 mt-1 text-xs text-slate-500">{t.otherLanguagesHint}</p>
          <div className={clsx('grid gap-3', wide ? 'grid-cols-2' : 'sm:grid-cols-2')}>
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
        </details>
        <p className="mt-2 text-xs text-slate-500">{t.upsertHint}</p>
      <Button type="submit" className="mt-3" loading={adding}>
        {t.saveItem}
      </Button>
    </form>
  );

  const adder = (
    <>
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

      <div hidden={!typing}>{typedForm}</div>
    </>
  );

  const list = (
    <section className="min-w-0">
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
              {/* The value stays the stored category so filtering still works;
                  only what the owner reads is translated. */}
              {categories.map((name) => (
                <option key={name} value={name}>
                  {translateCategory(name, locale)}
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
          <ul className={clsx('space-y-2', wide && 'xl:grid xl:grid-cols-2 xl:gap-2 xl:space-y-0')}>
            {visible.map((item) => (
              <li
                key={item.id}
                className={clsx(
                  'flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-card',
                  busyId === item.id && 'opacity-60',
                )}
              >
                <ItemPhoto
                  value={item.imageData ?? ''}
                  label={displayName(item, locale)}
                  disabled={busyId === item.id}
                  onChange={(imageData) => patchItem(item.id, { imageData })}
                  onError={(message) => push(message, 'error')}
                />

                <div className="min-w-0 flex-1">
                  {/* The owner reads their own language first. This showed the
                      primary (usually English) name to everyone, so a Bengali
                      shopkeeper got a Bengali app listing "Mustard Oil". */}
                  <p className="truncate font-semibold text-slate-900">
                    {displayName(item, locale)}
                    {item.unit && <span className="font-normal text-slate-500"> · {item.unit}</span>}
                  </p>
                  {otherNames(item, locale).length > 0 && (
                    <p className="truncate text-xs text-slate-500">
                      {otherNames(item, locale).join(' · ')}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {item.category && <Badge>{translateCategory(item.category, locale)}</Badge>}
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

                {/* Pack size, editable in place and suggested from what this
                    kind of shop actually sells in. */}
                <input
                  type="text"
                  list={UNIT_LIST_ID}
                  aria-label={`${t.unit} — ${displayName(item, locale)}`}
                  placeholder={t.unit}
                  value={unitDrafts[item.id] ?? item.unit}
                  onChange={(event) =>
                    setUnitDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                  onBlur={() => commitUnit(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                  }}
                  className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />

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
  );

  // One datalist serves every unit field on the page.
  const unitOptions = (
    <datalist id={UNIT_LIST_ID}>
      {units.map((option) => (
        <option key={option} value={option} />
      ))}
    </datalist>
  );

  if (!wide) {
    return (
      <div className="space-y-6">
        {unitOptions}
        {adder}
        {list}
      </div>
    );
  }

  const openTool = tools?.find((tool) => tool.id === drawer);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {unitOptions}
      {list}

      {/* The column holds the mic and a row of triggers, and nothing tall. It
          is sticky and stays roughly one screen high, so the page scrolls with
          the list rather than with the tools. */}
      <div className="space-y-3 max-lg:order-first lg:sticky lg:top-[4.25rem]">
        <VoiceItemAdder slug={slug} items={items} locale={locale} />

        <button
          type="button"
          onClick={() => setDrawer('form')}
          className="w-full rounded-2xl bg-white px-4 py-3 text-left shadow-card transition hover:bg-slate-50"
        >
          <span className="block font-semibold text-slate-900">{t.typeInstead}</span>
        </button>

        {tools?.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setDrawer(tool.id)}
            className="w-full rounded-2xl bg-white px-4 py-3 text-left shadow-card transition hover:bg-slate-50"
          >
            <span className="block font-semibold text-slate-900">{tool.label}</span>
            {tool.hint && <span className="mt-0.5 block text-sm text-slate-500">{tool.hint}</span>}
          </button>
        ))}
      </div>

      <Drawer open={drawer === 'form'} title={t.typeInstead} onClose={() => setDrawer(null)}>
        {typedForm}
      </Drawer>

      <Drawer
        open={Boolean(openTool)}
        title={openTool?.label ?? ''}
        onClose={() => setDrawer(null)}
      >
        {openTool?.content}
      </Drawer>
    </div>
  );
}
