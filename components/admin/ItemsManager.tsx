'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { TrashIcon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { VoiceItemAdder } from './VoiceItemAdder';
import { PhotoItemAdder, type Identified } from './PhotoItemAdder';
import type { StarterItem } from '@/lib/starter-catalogue';
import { formatRupees } from '@/lib/money';
import { suggestNames, translateCategory } from '@/lib/speech';
import { unitsFor, UNIT_LIST_ID } from '@/lib/units';
import { Drawer } from '@/components/ui/Drawer';
import { FloatingTools } from './FloatingTools';
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
};

type NewItem = {
  name: string;
  nameBn: string;
  nameHi: string;
  price: string;
  unit: string;
  category: string;
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

/**
 * The category an item belongs in, worked out rather than asked for.
 *
 * A shopkeeper knows they sell rice. Whether rice files under "Rice & Atta" or
 * "Staples" is a taxonomy question they never asked to be given, and a field
 * they leave blank — or fill with a different word every time — makes the
 * customer's category filter worse than having none at all. The shop-type
 * catalogue already answers it for the things a shop of this kind carries.
 */
function categoryFor(name: string, catalogue: StarterItem[]): string {
  const needle = name.trim().toLowerCase();
  if (!needle) return '';

  const hit = catalogue.find(
    (item) =>
      item.name.toLowerCase() === needle ||
      item.nameBn.toLowerCase() === needle ||
      item.nameHi.toLowerCase() === needle,
  );

  return hit?.category ?? '';
}

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
  wide = false,
  shopType = 'OTHER',
  catalogue = [],
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
  /** The shop-type catalogue, matched against when reading a photographed packet. */
  catalogue?: StarterItem[];
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
  const [scanning, setScanning] = useState(false);
  /** Filled by the hidden file input, called by the floating camera button. */
  const openPhoto = useRef<(() => void) | null>(null);
  // Price edits are local until blur/Enter, so typing "6" of "68" doesn't save.
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [unitDrafts, setUnitDrafts] = useState<Record<string, string>>({});
  const units = unitsFor(shopType);

  /**
   * Items a customer cannot tell apart.
   *
   * Two pack sizes of one product is normal for a kirana — Dal 500 g beside Dal
   * 1 kg is a shop doing its job, and merging them would destroy a real price.
   * What is not normal is the same name where at least one row has no pack
   * size, because then the menu simply lists the word twice and a customer
   * picking either has no idea which they are getting.
   *
   * So this flags only the ambiguous case, and the fix is the unit box already
   * sitting on the row.
   */
  const clashes = useMemo(() => {
    const byName = new Map<string, AdminItem[]>();
    for (const item of items) {
      const key = item.name.trim().toLowerCase();
      const group = byName.get(key);
      if (group) group.push(item);
      else byName.set(key, [item]);
    }

    return [...byName.values()].filter(
      (group) => group.length > 1 && group.some((item) => !item.unit.trim()),
    );
  }, [items]);

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
    // Category is derived, never asked for. A shopkeeper knows they sell rice;
    // whether rice belongs under "Rice & Atta" or "Staples" is a taxonomy
    // question they did not ask to be given, and a field they leave blank -- or
    // fill with something new every time -- is worse than one that fills itself
    // from the catalogue this shop type already has.
    const knownCategory = categoryFor(name, catalogue);
    setDraft((current) => ({
      ...current,
      name,
      nameBn: known?.bn ?? '',
      nameHi: known?.hi ?? '',
      category: knownCategory,
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

    // New rows arrive in stock now, so pricing one no longer has to switch it
    // on — but a row the owner had marked out *while* unpriced still should,
    // since the missing price was the only reason it was hidden.
    const wasUnpriced = item.price <= 1 && !item.inStock;
    const changes = wasUnpriced && price > 1 ? { price, inStock: true } : { price };

    if (await patchItem(item.id, changes)) {
      push(`${displayName(item, locale)} → ${formatRupees(price)}`, 'success');
    }
  }

  const typedForm = (
    <form id="add-item-form" onSubmit={addItem} className="rounded-2xl bg-white p-4 shadow-card">
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
        </div>

        <p className="mt-2 text-xs text-slate-500">{t.upsertHint}</p>
    </form>
  );

  /**
   * Save lives in the drawer header, not under the form. Below the fields it
   * was reached by scrolling past them; in the header it is in the same place
   * every time, and `form` ties it to the form it submits from outside.
   */
  const saveAction = (
    <Button type="submit" form="add-item-form" size="sm" loading={adding}>
      {t.saveItem}
    </Button>
  );

  /**
   * Several packets at once become several rows, unpriced and out of stock —
   * the same landing place voice and the starter list use. Pricing one puts it
   * on sale, so the owner works down the list once rather than stopping at a
   * form between every photograph.
   */
  async function addIdentified(found: Identified[], unreadable: number) {
    let created = 0;

    for (const item of found) {
      const response = await fetch(`/api/admin/shop/${slug}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          nameBn: item.nameBn,
          nameHi: item.nameHi,
          price: 1,
          unit: item.unit,
          category: item.category,
          inStock: true,
        }),
      });
      if (response.ok) created += 1;
    }

    push(
      unreadable > 0
        ? `${created} ${t.voiceSetPrice} · ${unreadable} ✗`
        : `${created} ${t.voiceSetPrice}`,
      created > 0 ? 'success' : 'error',
    );
    if (created > 0) router.refresh();
  }

  /**
   * Photographing a packet is the shop owner's tool, not the console's.
   *
   * The Super Admin is at a desk with the shop on the phone; they have no
   * packet to point a camera at, so the button was dead weight on that screen
   * and read as a feature that did not work. The owner, standing in front of
   * the shelf, is exactly who it was built for — so it stays there and goes
   * from here, rather than being deleted.
   *
   * `wide` is the console's layout, which makes it the honest test of which of
   * the two is rendering this.
   */
  const photoAvailable = !wide && catalogue.length > 0;

  // Only offered when there is a catalogue to match against — without one the
  // scan can do no better than the largest text on the wrapper.
  const photoAdder = photoAvailable && (
    <PhotoItemAdder
      catalogue={catalogue}
      onBatch={addIdentified}
      onBusyChange={setScanning}
      openRef={openPhoto}
      onError={(message) => push(message, 'error')}
    />
  );

  const floatingTools = (
    <FloatingTools
      onVoice={() => setDrawer('add')}
      onPhoto={photoAvailable ? () => openPhoto.current?.() : undefined}
      voiceLabel={t.voiceTitle}
      photoLabel={t.photoAdd}
      photoBusy={scanning}
      aboveTabBar
    />
  );

  const list = (
    <section className="min-w-0">
      {clashes.length > 0 && (
        <div className="mb-3 rounded-2xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">{t.clashTitle}</p>
          <p className="mt-0.5 text-sm text-amber-800">{t.clashHint}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {clashes.map((group) => (
              <li
                key={group[0]!.id}
                className="rounded-full bg-white px-2.5 py-1 text-sm font-medium text-amber-900 ring-1 ring-amber-200"
              >
                {displayName(group[0]!, locale)} × {group.length}
              </li>
            ))}
          </ul>
        </div>
      )}

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
                  'rounded-2xl bg-white p-3 shadow-card',
                  busyId === item.id && 'opacity-60',
                )}
              >
                {/* Two rows, both edge to edge. The controls were a wrapping
                    strip of four fixed-width things, which left a ragged gap
                    down the right of every card and put the delete button on a
                    line of its own. Now the two fields share the free width and
                    the two actions sit at a fixed size against the right edge,
                    so every card lines up with the one above it. All controls
                    are the same 40px height. */}
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {/* The owner reads their own language first. */}
                    <p className="truncate font-semibold leading-tight text-slate-900">
                      {displayName(item, locale)}
                    </p>
                    <p className="truncate text-xs leading-tight text-slate-500">
                      {[...otherNames(item, locale), item.category && translateCategory(item.category, locale)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>

                  <Badge tone={item.inStock ? 'green' : 'red'}>
                    {item.inStock ? t.inStock : t.outOfStock}
                  </Badge>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <label className="relative min-w-0 flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={1}
                      aria-label={`${t.price} — ${displayName(item, locale)}`}
                      value={priceDrafts[item.id] ?? String(item.price)}
                      onChange={(event) =>
                        setPriceDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                      onBlur={() => commitPrice(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') event.currentTarget.blur();
                      }}
                      className="h-10 w-full rounded-lg border border-slate-300 pl-6 pr-2 text-left text-sm tabular-nums"
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
                    className="h-10 w-full min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 text-sm"
                  />

                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => patchItem(item.id, { inStock: !item.inStock })}
                    className="h-10 shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {item.inStock ? t.markOut : t.markIn}
                  </button>

                  {/* An icon, not the word. "Delete" spelled out in three
                      languages was the widest thing on the row and the least
                      often wanted. */}
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => deleteItem(item)}
                    aria-label={`${t.delete} — ${displayName(item, locale)}`}
                    title={t.delete}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <TrashIcon className="h-[18px] w-[18px]" />
                  </button>
                </div>
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

  /**
   * One panel for adding something, however the owner prefers to do it. The
   * mic and the form were two drawers with a link between them, and the outer
   * one repeated its own title back at itself. Speaking and typing are the same
   * job; they belong on the same sheet.
   */
  const addDrawer = (
    <Drawer
      open={drawer === 'add'}
      title={t.addItem}
      action={saveAction}
      onClose={() => setDrawer(null)}
    >
      <div className="space-y-4">
        <VoiceItemAdder
          slug={slug}
          items={items}
          locale={locale}
          onName={(name) => nameChanged(name)}
        />
        {typedForm}
      </div>
    </Drawer>
  );

  if (!wide) {
    return (
      // Room at the bottom for the floating buttons, so the last item is never
      // trapped underneath them.
      <div className="space-y-4 pb-24">
        {unitOptions}
        {photoAdder}
        {list}
        {floatingTools}
        {addDrawer}
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

      {photoAdder}

      <Drawer
        open={drawer === 'form'}
        title={t.typeInstead}
        action={saveAction}
        onClose={() => setDrawer(null)}
      >
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
