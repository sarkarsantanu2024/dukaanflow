'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { ChevronRightIcon, TrashIcon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/useConfirm';
import { VoiceItemAdder } from './VoiceItemAdder';
import { PhotoItemAdder, type Identified } from './PhotoItemAdder';
import { starterName, type StarterItem } from '@/lib/starter-catalogue';
import { formatPaise, paiseToInput, parsePaise } from '@/lib/money';
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
  pricePaise: number;
  /** False while the price is still the placeholder nobody chose. */
  priced: boolean;
  unit: string;
  category: string;
  inStock: boolean;
  /**
   * How many are left, or null for "nobody is counting this one".
   *
   * Null is the normal state and stays right for everything sold loose off a
   * scale. See the note on `Item.stockQty` in the schema.
   */
  stockQty: number | null;
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

/**
 * HOW MANY THINGS AN OWNER LISTS AT ONE SITTING: MORE THAN ONE.
 *
 * The add sheet held a single set of three boxes, and the mic wrote into them.
 * So an owner who tapped the mic and said seven items in a row watched each one
 * overwrite the last, and saved the seventh — the other six were spoken, shown,
 * and thrown away. The only workaround was save, reopen, speak, save, six more
 * times, which is not what anybody does with a microphone.
 *
 * Three blank rows to start with, more on request, and one Save that writes all
 * of them. Three because it is enough to make the shape obvious — this is a list
 * you fill, not a form you submit — without making an owner adding one item
 * scroll past two empty ones to reach the button.
 */
const BLANK_ROWS = 3;

function blankRows(count: number = BLANK_ROWS): NewItem[] {
  return Array.from({ length: count }, () => ({ ...EMPTY_NEW_ITEM }));
}

/** A row nobody has touched — neither typed into nor dictated into. */
function isBlankRow(row: NewItem): boolean {
  return !row.name.trim() && !row.price.trim() && !row.unit.trim();
}

/**
 * The API's field names, mapped onto this form's.
 *
 * THIS IS WHY A REJECTED SAVE SAID NOTHING. The route answers 422 with
 * `{ errors: { pricePaise: 'Price must be at least 50 paise' } }`, the form
 * renders `errors.price`, and the two never met — so a zero, a negative or a
 * mistyped price produced a dead button and no explanation at all. The generic
 * toast ("please check the highlighted fields") made it worse by promising a
 * highlight that was not there.
 */
const FIELD_FOR: Record<string, string> = { pricePaise: 'price' };

function formErrors(errors: Record<string, string> | undefined): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [field, message] of Object.entries(errors ?? {})) {
    mapped[FIELD_FOR[field] ?? field] = message;
  }
  return mapped;
}

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
  const { confirm, dialog: confirmDialog } = useConfirm();
  const t = ownerDict(locale);
  // The typed form is secondary to the mic on a phone, so it starts folded
  // away and opens on request.
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  /** The add sheet's rows. One item each; the mic writes into them too. */
  const [rows, setRows] = useState<NewItem[]>(() => blankRows());
  /** Field errors from the last save, by row index. */
  const [rowErrors, setRowErrors] = useState<Record<number, Record<string, string>>>({});
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
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  /** Rows ticked for deleting together. Empty is the normal state. */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  /**
   * Which category sections are open, or null for "nobody has touched these".
   *
   * Null rather than a pre-filled set, because the answer to "which is open by
   * default" is *the first one*, and which section is first depends on the
   * items — a set built at mount would be wrong the moment a category empties.
   */
  const [openCategories, setOpenCategories] = useState<Set<string> | null>(null);
  /** The suggestion chip currently being added, keyed name|unit. */
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null);
  const units = unitsFor(shopType);

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

  /** Rows a customer cannot see, because nobody has priced them yet. */
  const unpricedCount = useMemo(() => items.filter((item) => !item.priced).length, [items]);

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
   * The list cut into its categories, each with what this kind of shop
   * usually carries and this one has not listed.
   *
   * Sixty cards in one column is a scroll nobody finishes: an owner looking for
   * their spices went past their dals, their oils and their vegetables to reach
   * them, every time. Categories are already on every item and already
   * translated, so the sections cost nothing to derive.
   *
   * Only categories the shop already has something in get a section. The whole
   * catalogue belongs behind "Add common items"; here it is trimmed to the
   * gaps in shelves the owner has actually started, which is a list they can
   * read rather than a hundred and thirty checkboxes.
   */
  const groups = useMemo(() => {
    const byCategory = new Map<string, AdminItem[]>();
    for (const item of visible) {
      const key = item.category || '';
      const bucket = byCategory.get(key);
      if (bucket) bucket.push(item);
      else byCategory.set(key, [item]);
    }

    // Matched on the whole list, not the filtered view: an item hidden by a
    // search is still listed, and offering to add it again would create a twin.
    const owned = new Set(
      items.map((item) => `${item.name.toLowerCase()}|${item.unit.toLowerCase()}`),
    );

    return [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, groupItems]) => ({
        key,
        label: key ? translateCategory(key, locale) : t.categoryNone,
        items: groupItems,
        missing: catalogue.filter(
          (entry) =>
            entry.category === key &&
            !owned.has(`${entry.name.toLowerCase()}|${entry.unit.toLowerCase()}`),
        ),
      }));
  }, [visible, items, catalogue, locale, t.categoryNone]);

  /** A search or a category filter is a request to see matches, not headings. */
  const filtering = query.trim() !== '' || category !== '';

  function isOpen(key: string, index: number): boolean {
    if (filtering) return true;
    if (openCategories === null) return index === 0;
    return openCategories.has(key);
  }

  function toggleCategory(key: string) {
    setOpenCategories((current) => {
      // The untouched state is "the first one is open", so the first tap has to
      // start from that rather than from an empty set — otherwise opening a
      // second section silently closes the first.
      const base = current ?? new Set(groups.length > 0 ? [groups[0]!.key] : []);
      const next = new Set(base);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  /**
   * Lists one suggested item, at the catalogue's price and on sale.
   *
   * The same thing the common-items picker does, one at a time and in place —
   * so an owner who notices they never listed jeera taps it while looking at
   * their spices instead of opening a hundred-and-thirty-row sheet.
   */
  async function addSuggested(suggestion: StarterItem) {
    const key = `${suggestion.name}|${suggestion.unit}`;
    setAddingSuggestion(key);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggestion.name,
          nameBn: suggestion.nameBn,
          nameHi: suggestion.nameHi,
          pricePaise: suggestion.pricePaise,
          priced: true,
          unit: suggestion.unit,
          category: suggestion.category,
          inStock: true,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        push(payload.error ?? t.networkError, 'error');
        return;
      }
      push(`${starterName(suggestion, locale)} ✓`, 'success');
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setAddingSuggestion(null);
    }
  }

  /**
   * Fills the add form from one spoken sentence.
   *
   * The mic hands over everything it heard, and anything it did not hear is
   * taken from the catalogue rather than left blank: an owner who says only
   * "চাল" gets rice, at the pack size and price this kind of shop usually sells
   * it at, and reads all three before saving. What they said always wins over
   * what the catalogue guesses — the whole point of saying it was to say it.
   */
  function applySpokenDraft(spoken: { name: string; unit: string; pricePaise: number | null }) {
    const known = suggestNames(spoken.name);
    const suggestion = catalogue.find(
      (entry) =>
        entry.name.toLowerCase() === spoken.name.toLowerCase() ||
        entry.nameBn === spoken.name ||
        entry.nameHi === spoken.name ||
        (known && entry.name.toLowerCase() === known.en.toLowerCase()),
    );

    const pricePaise = spoken.pricePaise ?? suggestion?.pricePaise ?? null;

    const spokenRow: NewItem = {
      name: spoken.name,
      nameBn: known?.bn ?? '',
      nameHi: known?.hi ?? '',
      price: pricePaise === null ? '' : paiseToInput(pricePaise),
      unit: spoken.unit || suggestion?.unit || '',
      category: suggestion?.category ?? categoryFor(spoken.name, catalogue),
    };

    /**
     * Into the first untouched row, never over one the owner has already
     * spoken or typed into. This is the whole of the "I said seven items and
     * six vanished" bug: with one set of boxes there was nowhere else for the
     * second sentence to go.
     *
     * And a blank row is always left waiting underneath, so the owner never has
     * to stop dictating to press "one more row".
     */
    setRows((current) => {
      const next = [...current];
      const slot = next.findIndex(isBlankRow);
      if (slot >= 0) next[slot] = spokenRow;
      else next.push(spokenRow);
      if (!next.some(isBlankRow)) next.push({ ...EMPTY_NEW_ITEM });
      return next;
    });
  }

  function updateRow(index: number, changes: Partial<NewItem>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  /**
   * Fills the two translations when the typed name is one we know, without
   * ever overwriting something the shopkeeper entered by hand.
   */
  function nameChanged(index: number, name: string) {
    const known = suggestNames(name);
    // Category is derived, never asked for. A shopkeeper knows they sell rice;
    // whether rice belongs under "Rice & Atta" or "Staples" is a taxonomy
    // question they did not ask to be given, and a field they leave blank -- or
    // fill with something new every time -- is worse than one that fills itself
    // from the catalogue this shop type already has.
    updateRow(index, {
      name,
      nameBn: known?.bn ?? '',
      nameHi: known?.hi ?? '',
      category: categoryFor(name, catalogue),
    });
  }

  /**
   * ONE SAVE, EVERY ROW.
   *
   * Rows are written one at a time rather than in parallel, for the same reason
   * bulk delete is: a phone on a village connection holding twenty simultaneous
   * requests starts dropping them, and a half-written list with no report of
   * which half is worse than a slow one.
   *
   * Rows that saved are cleared away and rows that failed stay exactly where
   * they are, with the server's own reason against the field that caused it —
   * so a mistyped price on the fourth row costs the owner that row and not the
   * other six. The sheet closes only when everything went in; there is nothing
   * to look at then, and leaving it open over a list the owner cannot see is
   * how a save comes to look like it did nothing.
   */
  async function addItem(event: React.FormEvent) {
    event.preventDefault();

    const pending = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.name.trim() !== '');

    if (pending.length === 0) {
      push(t.nothingToSave, 'error');
      return;
    }

    setAdding(true);
    setRowErrors({});

    const kept: NewItem[] = [];
    const failures: Record<number, Record<string, string>> = {};
    let saved = 0;
    let firstProblem = '';

    for (const { row } of pending) {
      try {
        const response = await fetch(`/api/admin/shop/${slug}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: row.name,
            nameBn: row.nameBn,
            nameHi: row.nameHi,
            pricePaise: parsePaise(row.price) ?? 0,
            unit: row.unit,
            category: row.category,
            inStock: true,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          errors?: Record<string, string>;
        };

        if (!response.ok) {
          // The specific reason, not "check the highlighted fields". The server
          // knows exactly what was wrong with the price; saying so is the whole
          // difference between a form a shopkeeper can fix and one that ignores
          // them.
          const fields = formErrors(payload.errors);
          const message = Object.values(fields)[0] ?? payload.error ?? t.networkError;
          failures[kept.length] = Object.keys(fields).length > 0 ? fields : { name: message };
          firstProblem ||= message;
          kept.push(row);
          continue;
        }

        saved += 1;
      } catch {
        failures[kept.length] = { name: t.networkError };
        firstProblem ||= t.networkError;
        kept.push(row);
      }
    }

    setAdding(false);
    setRowErrors(failures);

    if (kept.length > 0) {
      // The failures, still editable, plus one blank row to carry on into.
      setRows([...kept, { ...EMPTY_NEW_ITEM }]);
      push(firstProblem || t.networkError, 'error');
      if (saved > 0) router.refresh();
      return;
    }

    push(`${saved} ✓`, 'success');
    setRows(blankRows());
    setDrawer(null);
    router.refresh();
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
    if (
      !(await confirm({
        title: item.name,
        message: t.deleteConfirm,
        confirmLabel: t.delete,
        cancelLabel: t.no,
        danger: true,
      }))
    ) {
      return;
    }
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
   * Removes every ticked row, behind one confirmation instead of sixty.
   *
   * The thing that makes this necessary is the starter list: an owner ticks
   * "add the usual items", gets sixty rows, and finds a dozen they do not
   * actually sell. One at a time, with a dialog each, that is a job people
   * abandon halfway — which leaves the shop page listing things the shop has
   * never stocked.
   *
   * Sequential rather than parallel. Sixty simultaneous requests from a phone
   * on a village connection is how a browser starts dropping them, and a
   * half-deleted list with no report of which half is worse than a slow one.
   * Failures are counted and said out loud rather than swallowed.
   */
  async function deleteSelected() {
    const doomed = items.filter((item) => selected.has(item.id));
    if (doomed.length === 0) return;

    if (
      !(await confirm({
        title: `${doomed.length} ${doomed.length === 1 ? t.itemOne : t.itemMany}`,
        message: t.deleteConfirm,
        confirmLabel: t.delete,
        cancelLabel: t.no,
        danger: true,
      }))
    ) {
      return;
    }

    // One request, not sixty. The server takes the whole list and deletes it in
    // a single statement, so a phone on a village connection makes one round
    // trip instead of holding sixty open and dropping some of them.
    await removeMany({ ids: doomed.map((item) => item.id) }, doomed.length);
  }

  /**
   * Empties the shop.
   *
   * Deliberately separate from the ticked-rows path and deliberately noisier:
   * this is the one button here that can undo an evening of dictation, and it
   * is reached without ticking anything, so the confirmation has to carry the
   * number. "Delete 66 items?" is a question an owner can answer; "Are you
   * sure?" is one they click through.
   */
  async function deleteEverything() {
    if (items.length === 0) return;

    if (
      !(await confirm({
        title: `${items.length} ${items.length === 1 ? t.itemOne : t.itemMany}`,
        message: t.deleteAllConfirm,
        confirmLabel: t.deleteAll,
        cancelLabel: t.no,
        danger: true,
      }))
    ) {
      return;
    }

    await removeMany({ all: true }, items.length);
  }

  /** The single request both paths make, and the one report they both give. */
  async function removeMany(body: { ids: string[] } | { all: true }, expected: number) {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        deleted?: number;
        error?: string;
      };

      if (!response.ok) {
        push(payload.error ?? t.networkError, 'error');
        return;
      }

      const removed = payload.deleted ?? expected;
      // Said as a fraction when the two disagree — a row deleted from another
      // tab in the meantime is not a failure, but the owner should still see
      // that the number they were shown is not the number that went.
      push(removed === expected ? `${removed} ✓` : `${removed} / ${expected} ✓`, 'success');
      setSelected(new Set());
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setDeleting(false);
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

  /**
   * Corrects a name in place.
   *
   * Names arrive from three places that can each be slightly wrong — the mic
   * hears "Chini" as "Cheeni", a photographed packet reads the brand instead of
   * the product, the starter list spells it the way the catalogue does and not
   * the way the shop says it. Before this the only cure was deleting the item,
   * which threw away its price, its stock count and its history along with the
   * typo.
   *
   * The edit lands on whichever field is being read: an owner working in
   * Bengali is looking at `nameBn`, so that is the one their correction fixes.
   * The English name stays as the fallback every other reader sees.
   */
  async function commitName(item: AdminItem) {
    const next = nameDrafts[item.id];
    if (next === undefined) return;

    setNameDrafts((current) => {
      const copy = { ...current };
      delete copy[item.id];
      return copy;
    });

    const name = next.trim();
    if (name === displayName(item, locale)) return;
    // Emptying the box is not a rename, and an item with no name at all is one
    // no customer can order. Put the old one back.
    if (name.length < 2) {
      push(`${t.name} — ${t.nameTooShort}`, 'error');
      return;
    }

    // Which column the shown name came from. Falling back to `name` matters:
    // an owner reading in Bengali who sees the English name (because `nameBn`
    // is blank) is correcting the English one, not filling in a translation.
    const field =
      locale === 'bn' && item.nameBn ? 'nameBn' : locale === 'hi' && item.nameHi ? 'nameHi' : 'name';

    /**
     * A corrected name is a second chance at the other two languages.
     *
     * Names typed in roman — "Basmoti", "Musurir Dal" — reach the vocabulary
     * now that it matches on spelling rather than on the exact string, so a
     * name that was unknown when the item was created is often known once it
     * has been fixed. Only blanks are filled: a translation somebody typed by
     * hand is theirs, and this must never overwrite it.
     */
    const known = suggestNames(name);
    const translations = known
      ? {
          ...(!item.nameBn && known.bn !== name ? { nameBn: known.bn } : {}),
          ...(!item.nameHi && known.hi !== name ? { nameHi: known.hi } : {}),
        }
      : {};

    if (await patchItem(item.id, { [field]: name, ...translations })) push(`${name} ✓`, 'success');
  }

  async function commitPrice(item: AdminItem) {
    const raw = priceDrafts[item.id];
    if (raw === undefined) return;

    const pricePaise = parsePaise(raw);
    setPriceDrafts((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });

    // 50 paise is the floor, so a toffee is listable — see priceSchema.
    if (pricePaise === null || pricePaise < 50) {
      push(`${t.price} — 10, 12.50, 68…`, 'error');
      return;
    }
    // Typing the same number back is still an act of pricing: it is how an
    // owner confirms that a placeholder Re 1 really is one rupee.
    if (pricePaise === item.pricePaise && item.priced) return;

    // New rows arrive in stock now, so pricing one no longer has to switch it
    // on — but a row the owner had marked out *while* unpriced still should,
    // since the missing price was the only reason it was hidden.
    const changes = {
      pricePaise,
      priced: true,
      ...(!item.priced && !item.inStock ? { inStock: true } : {}),
    };

    if (await patchItem(item.id, changes)) {
      push(`${displayName(item, locale)} → ${formatPaise(pricePaise)}`, 'success');
    }
  }

  /**
   * The add sheet: a short list of rows, three boxes each, and one Save.
   *
   * Deliberately the same on the owner's phone and in the Super Admin console.
   * They were two different sheets — the console had the mic in a side column
   * and the boxes behind a separate "type instead" drawer, the phone had both
   * on one sheet — which meant two layouts to learn, two places for a bug to
   * live, and an operator on the phone to a shopkeeper working differently from
   * the shopkeeper. One panel, one shape, both screens.
   */
  const typedForm = (
    <form id="add-item-form" onSubmit={addItem} className="space-y-2">
      {rows.map((row, index) => (
        <div
          key={index}
          className="rounded-2xl bg-white p-3 shadow-card"
        >
          <div
            className={clsx(
              'grid gap-2',
              // Name takes the room; price and pack size are short and fixed,
              // and the last column is the width of the remove button so every
              // row's boxes line up with the row above whether or not it has
              // one.
              'sm:grid-cols-[minmax(0,1fr)_8rem_8rem_2.5rem]',
            )}
          >
            <Input
              // Labelled once, on the first row. Repeating "Name / Price /
              // Unit" down six rows is a form that reads as six forms.
              label={index === 0 ? t.name : undefined}
              aria-label={t.name}
              value={row.name}
              onChange={(event) => nameChanged(index, event.target.value)}
              error={rowErrors[index]?.name}
              placeholder="Rice"
            />
            <Input
              label={index === 0 ? t.price : undefined}
              aria-label={t.price}
              type="text"
              inputMode="decimal"
              value={row.price}
              onChange={(event) => updateRow(index, { price: event.target.value })}
              error={rowErrors[index]?.price}
              placeholder="68 or 68.50"
            />
            <Input
              label={index === 0 ? t.unit : undefined}
              aria-label={t.unit}
              list={UNIT_LIST_ID}
              value={row.unit}
              onChange={(event) => updateRow(index, { unit: event.target.value })}
              error={rowErrors[index]?.unit}
              placeholder={units[0]}
            />

            {/* THROWING ONE ROW AWAY.
                The mic mishears — a scrap of counter conversation lands as a
                row named "দেশ নাই" — and until now the only cure was emptying
                its three boxes by hand or clearing the whole sheet and starting
                the dictation again. Neither is a thing to ask of somebody
                halfway through listing forty items.

                Aligned with the boxes rather than the labels, so it sits beside
                the row it removes on the first row too. Never offered on the
                last remaining row: a sheet with no rows at all has nothing to
                type into and no way back except reopening it. */}
            <div className={clsx('flex justify-end', index === 0 && 'sm:pt-[1.875rem]')}>
              <button
                type="button"
                disabled={rows.length <= 1}
                onClick={() => {
                  setRows((current) => current.filter((_, i) => i !== index));
                  // The errors are keyed by position, so everything below the
                  // removed row would otherwise inherit its neighbour's message.
                  setRowErrors({});
                }}
                aria-label={`${t.delete} — ${row.name || index + 1}`}
                title={t.delete}
                className="inline-flex h-11 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => setRows((current) => [...current, { ...EMPTY_NEW_ITEM }])}
          className="text-sm font-semibold text-brand-700 underline"
        >
          + {t.addRow}
        </button>
        {/* Only where a row could be lost: with everything blank there is
            nothing to clear, and the button would be a dead control. */}
        {rows.some((row) => !isBlankRow(row)) && (
          <button
            type="button"
            onClick={() => {
              setRows(blankRows());
              setRowErrors({});
            }}
            className="text-sm text-slate-400 underline"
          >
            {t.clearLog}
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500">{t.upsertHint}</p>
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
          // The catalogue's suggestion where the packet matched one, and the
          // Re 1 placeholder where it did not. Either way `priced: false` keeps
          // the row off the shop page until somebody says the number is right.
          pricePaise: item.pricePaise || 100,
          priced: false,
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
      addLabel={t.addItem}
      photoLabel={t.photoAdd}
      photoBusy={scanning}
      aboveTabBar
    />
  );

  /**
   * One item's card.
   *
   * Lifted out of the list so the same markup can be dealt into whichever
   * category accordion the item belongs to, instead of the flat run of
   * sixty cards this used to be.
   */
  function itemRow(item: AdminItem) {
    return (
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
          {/* Ticking rows lives in the column the row numbers vacated,
              so selection costs no width. Always visible rather than
              behind a "select" mode: a mode has to be discovered, and
              the owner who needs this is the one staring at sixty
              starter items they did not want. */}
          <input
            type="checkbox"
            checked={selected.has(item.id)}
            onChange={() => toggleSelected(item.id)}
            aria-label={`${t.delete} — ${displayName(item, locale)}`}
            className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
          />

          <div className="min-w-0 flex-1">
            {/* The owner reads their own language first — and edits it
                here. Styled as the heading it replaced rather than as a
                form field: a box on every row would make the list look
                like a form to fill in, when almost every row is only
                ever read. The border appears on hover and focus, which
                is where "you can change this" needs to be said. */}
            <input
              type="text"
              aria-label={`${t.name} — ${displayName(item, locale)}`}
              value={nameDrafts[item.id] ?? displayName(item, locale)}
              onChange={(event) =>
                setNameDrafts((current) => ({ ...current, [item.id]: event.target.value }))
              }
              onBlur={() => commitName(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
                // Escape abandons the edit rather than saving it.
                if (event.key === 'Escape') {
                  setNameDrafts((current) => {
                    const copy = { ...current };
                    delete copy[item.id];
                    return copy;
                  });
                  event.currentTarget.blur();
                }
              }}
              className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 -ml-1 font-semibold leading-tight text-slate-900 transition hover:border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none"
            />
            <p className="truncate text-xs leading-tight text-slate-500">
              {[...otherNames(item, locale), item.category && translateCategory(item.category, locale)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          {/* An unpriced row is invisible to customers, so saying
              "In stock" about it is the most misleading thing this
              screen could do — the shop looks stocked and the shop
              page is empty. The missing price is the fact that
              matters, so it is the one shown. */}
          <Badge tone={!item.priced ? 'amber' : item.inStock ? 'green' : 'red'}>
            {!item.priced ? t.notOnSale : item.inStock ? t.inStock : t.outOfStock}
          </Badge>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              ₹
            </span>
            {/* `decimal` rather than `number`: paise mean the field
                now takes "12.50", and a number spinner on a phone
                offers a keypad without a decimal point on some
                Android keyboards. */}
            <input
              type="text"
              inputMode="decimal"
              aria-label={`${t.price} — ${displayName(item, locale)}`}
              value={priceDrafts[item.id] ?? paiseToInput(item.pricePaise)}
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

          {/* WHAT IS ON THE SHELF IS THE OWNER'S WORD.
              The console keeps the catalogue — the names, the prices,
              the pack sizes — because those arrive by phone and an
              operator can set them on the shop's behalf. Whether the
              rice ran out this afternoon is not something anybody at a
              desk can know, and a stale "in stock" set from here is
              worse than no answer: it sells a customer something that
              is not there. The badge above still reports the state, so
              the operator can see it and cannot set it. */}
          {!wide && (
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => patchItem(item.id, { inStock: !item.inStock })}
              className="h-10 shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {item.inStock ? t.markOut : t.markIn}
            </button>
          )}

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

        {/* HOW MANY ARE LEFT — for the half of the shop you can count.
            A quiet grey line by default, because most rows will never
            use it and a stock box on every one of them would say the
            shop is supposed to count its rice. Tapping it starts the
            count at what is on the shelf; from then on every sale,
            through the shop page or across the counter, takes one off,
            and zero takes the item off the shop page by itself.

            This is the fix for a customer ordering the two kilos of
            basmati that went an hour ago: the toggle it sits beside
            only ever knew "yes" or "no", and nobody remembers to move
            it.

            Owner's screen only, for the reason above the stock toggle:
            a count is a statement about a shelf, and the shelf is in
            the shop. It is also the one control here whose meaning is
            not obvious from its label, which is exactly the kind of
            thing that should not be sitting on a console whose job is
            the catalogue. */}
        {!wide &&
          (item.stockQty === null ? (
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => patchItem(item.id, { stockQty: 1 })}
              title={t.stockHint}
              className="mt-2 text-xs font-medium text-slate-400 underline decoration-dotted underline-offset-2 transition hover:text-brand-700 disabled:opacity-50"
            >
              {t.stockCount}
            </button>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">{t.stockLeft}</span>
              <span className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  aria-label={`− ${displayName(item, locale)}`}
                  disabled={busyId === item.id || item.stockQty <= 0}
                  onClick={() => patchItem(item.id, { stockQty: item.stockQty! - 1 })}
                  className="h-8 w-8 rounded text-lg font-bold text-slate-700 disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-bold tabular-nums text-slate-900">
                  {item.stockQty}
                </span>
                <button
                  type="button"
                  aria-label={`+ ${displayName(item, locale)}`}
                  disabled={busyId === item.id}
                  onClick={() => patchItem(item.id, { stockQty: item.stockQty! + 1 })}
                  className="h-8 w-8 rounded text-lg font-bold text-slate-700 disabled:opacity-30"
                >
                  +
                </button>
              </span>

              {item.stockQty === 0 && (
                <span className="text-xs font-medium text-red-600">{t.stockSoldOut}</span>
              )}

              {/* Going back to uncounted, for the item that turned out
                  to be sold by weight after all. `null` rather than 0:
                  "I am not counting this" and "there are none" are
                  different facts, and only one of them should hide the
                  item from customers. */}
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => patchItem(item.id, { stockQty: null, inStock: true })}
                className="ml-auto text-xs font-medium text-slate-400 underline decoration-dotted underline-offset-2 transition hover:text-slate-700 disabled:opacity-50"
              >
                {t.stockStop}
              </button>
            </div>
          ))}
      </li>
    );
  }

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
          {/* One category means the filter cannot change what is on screen. */}
          {categories.length > 1 && (
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

        {/* HOW MANY THINGS ARE ON THIS LIST.
            Each row used to carry its own number, which answered "which one am
            I looking at" — a question nobody asks — at the cost of a column of
            digits down the left of every card. The question owners do ask is
            how many items their shop has, and once a search or a category is
            on, how many of them are on screen.

            The owner's screen has its own count strip carrying the same number
            and the plan limit beside it, so this line would be the second
            answer to one question. It is for the console, which has no strip;
            a filter narrowing the view is worth saying on either. */}
        {/* WHAT IS TICKED, AND THE ONE THING TO DO WITH IT.
            Absent entirely until something is ticked, because a toolbar over an
            untouched list is a row of screen spent on an action nobody has
            started. Deleting sixty starter items one confirmation at a time was
            the thing this replaces. */}
        {selected.size > 0 ? (
          <div className="sticky top-2 z-10 mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-card">
            <span className="text-sm font-semibold tabular-nums text-slate-900">
              {selected.size} {t.selectedCount}
            </span>
            {/* Ticks everything the filter is currently showing, not everything
                the shop has — the list in front of the owner is the list they
                mean. Emptying the whole shop has its own button, which says so
                and counts what it will take. */}
            {selected.size < visible.length && (
              <button
                type="button"
                onClick={() => setSelected(new Set(visible.map((item) => item.id)))}
                className="text-sm font-medium text-brand-700 underline"
              >
                {t.selectAll}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm font-medium text-slate-500 underline"
            >
              {t.clearSelection}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={deleteSelected}
              className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              {t.delete}
            </button>
          </div>
        ) : (
          items.length > 0 && (
            /* EMPTYING THE SHOP, AND TICKING ROWS TO GET THERE.
               This was a scrap of grey underlined text floating on the right,
               and it could not be found — which is the correct outcome for
               something that looks like a caption. It is a bordered row now,
               labelled, with the count on the left, so it reads as the list's
               own toolbar. Still not a filled red button: an owner doing their
               prices should never have "delete everything" under their thumb.
               The confirmation names the number. */
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm font-medium tabular-nums text-slate-500">
                {visible.length === items.length
                  ? `${items.length} ${items.length === 1 ? t.itemOne : t.itemMany}`
                  : `${visible.length} / ${items.length} ${t.itemMany}`}
              </span>
              <button
                type="button"
                onClick={() => setSelected(new Set(visible.map((item) => item.id)))}
                className="text-sm font-medium text-brand-700 underline"
              >
                {t.selectAll}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={deleteEverything}
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                {t.deleteAll}
              </button>
            </div>
          )
        )}

        {items.length === 0 ? (
          <EmptyState title={t.noItems} hint={t.noItemsHint} />
        ) : visible.length === 0 ? (
          <EmptyState title={t.noMatch} />
        ) : (
          <div className="space-y-2">
            {groups.map((group, index) => {
              const open = isOpen(group.key, index);
              return (
                <div
                  key={group.key}
                  className="overflow-hidden rounded-2xl bg-white shadow-card"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.key)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <ChevronRightIcon
                      className={clsx(
                        'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                        open && 'rotate-90',
                      )}
                    />
                    <span className="min-w-0 truncate font-semibold text-slate-900">
                      {group.label}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-slate-400">
                      {group.items.length}
                    </span>
                    {/* How many things this kind of shop usually carries that
                        this one has not listed. On the closed header because it
                        is the reason to open a section you thought was done. */}
                    {group.missing.length > 0 && (
                      <span className="ml-auto shrink-0 text-xs font-medium text-brand-700">
                        +{group.missing.length}
                      </span>
                    )}
                  </button>

                  {open && (
                    <div className="border-t border-slate-100 bg-slate-50 p-2">
                      {/* WHAT IS MISSING, WHERE IT IS MISSING FROM.
                          The common-items picker lists all hundred and thirty at
                          once, which is a thing an owner does on day one and
                          never opens again. This is the same catalogue cut into
                          the section it belongs to, so an owner checking their
                          spices is told which spices they have not listed while
                          they are looking at spices. One tap lists it, priced.
                          The row disappears from here once it exists. */}
                      {group.missing.length > 0 && (
                        <div className="mb-2 rounded-xl border border-dashed border-slate-300 p-2">
                          <p className="mb-1.5 px-1 text-xs font-medium text-slate-500">
                            {t.alsoSold}
                          </p>
                          <ul className="flex flex-wrap gap-1.5">
                            {group.missing.map((suggestion) => {
                              const key = `${suggestion.name}|${suggestion.unit}`;
                              return (
                                <li key={key}>
                                  <button
                                    type="button"
                                    disabled={addingSuggestion === key}
                                    onClick={() => addSuggested(suggestion)}
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-sm font-medium text-slate-700 transition hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
                                  >
                                    <span className="text-brand-600">+</span>
                                    {starterName(suggestion, locale)}
                                    {suggestion.unit && (
                                      <span className="text-xs text-slate-400">
                                        {suggestion.unit}
                                      </span>
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      <ul
                        className={clsx(
                          'space-y-2',
                          wide && 'xl:grid xl:grid-cols-2 xl:gap-2 xl:space-y-0',
                        )}
                      >
                        {group.items.map((item) => itemRow(item))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      {/* THE WARNINGS GO UNDER THE LIST, NOT OVER IT.
          Both of these are about a handful of rows out of sixty, and both sat
          above the search box — so every owner opening the tab read a warning
          before reaching a single item, every time, for as long as one row
          anywhere was unpriced. Underneath, they are still found by anyone who
          scrolls the list they are about, and they cost nobody the top of the
          screen. */}
      {unpricedCount > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">
            {t.unpricedTitle} — {unpricedCount}
          </p>
          <p className="mt-0.5 text-sm text-amber-800">{t.unpricedHint}</p>
        </div>
      )}

      {clashes.length > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-3">
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
          onDraft={applySpokenDraft}
        />
        {/* Said once, above the rows. The mic no longer answers each item with
            a line of its own — the row filling itself in is the answer — so
            something has to tell a first-time owner that they may keep going. */}
        <p className="text-sm text-slate-600">{t.rowsHint}</p>
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
        {/* WITHOUT THIS, DELETE DID NOTHING AT ALL.
            `useConfirm` hands back a promise and the dialog that resolves it.
            Only the console's branch rendered the dialog, so on the owner's
            phone — the screen where deleting actually happens — the trash
            button awaited an answer from a dialog that was never on the page.
            No error, no prompt, nothing: the tap looked ignored, because it
            was. */}
        {confirmDialog}
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
        {/* THE CONSOLE OPENS THE SAME SHEET THE OWNER'S PHONE DOES.
            It used to have its own arrangement: the mic parked in this column,
            the boxes behind a second drawer, and a spoken item bouncing between
            the two. That was a different tool from the one the operator is
            talking a shopkeeper through on the phone, and it had the same
            single-row limit — speaking six items saved the sixth. Both screens
            now open `addDrawer`: mic on top, rows underneath, one Save. */}
        <button
          type="button"
          onClick={() => setDrawer('add')}
          className="w-full rounded-2xl bg-white px-4 py-3 text-left shadow-card transition hover:bg-slate-50"
        >
          <span className="block font-semibold text-slate-900">{t.addItem}</span>
          <span className="mt-0.5 block text-sm text-slate-500">{t.typeInstead}</span>
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

      {addDrawer}

      <Drawer
        open={Boolean(openTool)}
        title={openTool?.label ?? ''}
        onClose={() => setDrawer(null)}
      >
        {openTool?.content}
      </Drawer>

      {confirmDialog}
    </div>
  );
}
