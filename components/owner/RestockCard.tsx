'use client';

/**
 * What has run out, as a list to hand the supplier standing at the counter.
 *
 * The moment this exists for is a specific one and it is short. A vendor comes
 * in once a week, asks what is needed, and the owner answers from memory and
 * from glancing at the shelves — which is why the same two things are forgotten
 * every week and bought twice the week after. Halkhata already knows the answer:
 * the count comes down on every storefront order and every counter sale, and an
 * item that reaches zero takes itself off the shop page.
 *
 * EVERY LINE IS UNTICKABLE, AND THAT IS THE FEATURE. An owner does not reorder
 * everything that is out: some of it they have stopped stocking, some they buy
 * from a different supplier, some is out because it is out of season. A list
 * that cannot be edited is a list that gets ignored in favour of the back of a
 * calendar, so the ticking happens here, before anything is sent.
 *
 * TWO WAYS OUT, because there are two kinds of supplier. A message is for the
 * man standing in the shop with his phone; a PDF is for the wholesaler who
 * takes orders as files, and for the sheet that gets printed and ticked off
 * with a pen. They are the same list.
 *
 * NO PRICES ANYWHERE. What the shop sells something for is not what it pays,
 * and putting a retail price in front of a wholesaler shows him the shop's
 * margin for no reason at all.
 */

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useToast } from '@/components/ui/Toast';
import { CheckIcon, PdfIcon, TruckIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { ownerDict } from '@/lib/owner-i18n';
import { translateCategory } from '@/lib/speech';
import { formatDay } from '@/lib/time';
import { orderQuantityText, orderUnit, stockWithUnit } from '@/lib/units';
import {
  buildRestockMessage,
  needsRestock,
  restockFilename,
  restockName,
  type RestockItem,
} from '@/lib/restock';
import type { Locale } from '@/lib/i18n';

export function RestockCard({
  slug,
  shopName,
  items,
  locale,
}: {
  /** Keys the order amounts kept on this phone — see `orderQty`. */
  slug: string;
  shopName: string;
  /** The shop's whole list. What needs reordering is worked out from it here. */
  items: RestockItem[];
  locale: Locale;
}) {
  const t = ownerDict(locale);
  const { push } = useToast();

  const wanted = useMemo(() => needsRestock(items), [items]);

  /**
   * Which lines are going to the vendor. Everything, until the owner says
   * otherwise.
   *
   * Ticked by default rather than empty: the common case is "order the lot",
   * and a list that opens with nothing selected makes the owner do the work
   * twice — once to read it and once to re-tick it.
   */
  const [picked, setPicked] = useState<Set<string> | null>(null);
  /**
   * HOW MUCH TO ORDER OF EACH, in the owner's own words, keyed by item id.
   *
   * This is the field the whole card was missing. It named what had run out and
   * never asked the one question the supplier actually needs answering, so the
   * owner sent a list of names and then said the amounts out loud anyway —
   * which is the phone call this exists to save.
   *
   * Free text, and not checked against anything: a shop sells rice by the kilo
   * and buys it by the fifty-kilo bosta. See `RestockLine`.
   */
  const [orderQty, setOrderQty] = useState<Record<string, string>>({});

  /**
   * KEPT ON THIS PHONE, so a refresh does not throw the list away.
   *
   * An owner fills these in over a morning (half the amounts now, the rest
   * after checking the back room) and the page reloads under them: a pull to
   * refresh, a sale rung up in another tab, the app reopened from the home
   * screen. Every amount used to vanish with it.
   *
   * Browser storage rather than the server: this is a draft for one phone, not
   * a record anybody else needs. An item that has been restocked drops off the
   * list, and its amount is forgotten with it. Storage that is missing or
   * blocked (a private window) just means the old behaviour.
   */
  const storageKey = `halkhata:restock:${slug}`;
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as unknown;
      if (saved && typeof saved === 'object') {
        setOrderQty(
          Object.fromEntries(
            Object.entries(saved as Record<string, unknown>).filter(
              ([, value]) => typeof value === 'string',
            ),
          ) as Record<string, string>,
        );
      }
    } catch {
      // Unreadable or unavailable storage: start empty.
    }
    setRestored(true);
  }, [storageKey]);

  useEffect(() => {
    // Not before the saved copy has been read, or the empty first render would
    // overwrite it.
    if (!restored) return;
    const stillWanted = new Set(needsRestock(items).map((item) => item.id));
    const kept = Object.fromEntries(
      Object.entries(orderQty).filter(([id, value]) => stillWanted.has(id) && value.trim()),
    );
    try {
      if (Object.keys(kept).length === 0) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, JSON.stringify(kept));
    } catch {
      // Full or blocked storage: the amounts still work for this visit.
    }
  }, [orderQty, items, restored, storageKey]);
  const chosenIds = picked ?? new Set(wanted.map((item) => item.id));
  const chosen = wanted.filter((item) => chosenIds.has(item.id));
  const [building, setBuilding] = useState(false);

  /**
   * Whether this browser can hand a PDF to WhatsApp through the share sheet.
   * Asked once, up front, with a stand-in file, so the card shows one button
   * where it can and the old message-plus-download pair where it cannot. The
   * fallback cannot be decided after the tap: a WhatsApp window opened once
   * the PDF has been built is what pop-up blockers stop.
   */
  const [canSharePdf, setCanSharePdf] = useState(false);
  useEffect(() => {
    try {
      const probe = new File([''], 'list.pdf', { type: 'application/pdf' });
      setCanSharePdf(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanSharePdf(false);
    }
  }, []);

  function toggle(id: string) {
    const next = new Set(chosenIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  }

  /**
   * The list as it will be sent: what to bring, and how much of it.
   *
   * THE PACK SIZE IS NOT IN IT. The card still shows it under each name,
   * because it is how the owner recognises which of their two dal rows this is
   * — but it is the shop's own retail pack, and a supplier loading a van has no
   * use for it. See the note in `lib/restock.ts`.
   */
  const lines = chosen.map((item) => ({
    name: restockName(item, locale),
    // A bare "5" goes to the supplier as "5 kg": see `orderQuantityText`.
    wanted: orderQuantityText(orderQty[item.id] ?? '', item.unit, t.pieceShort),
  }));

  const message = buildRestockMessage({
    shopName,
    lines,
    labels: {
      heading: t.restockHeading,
      total: t.restockTotal,
      empty: t.restockEmptyLine,
    },
  });

  /**
   * WhatsApp with no number in the link, so the owner picks the contact.
   *
   * There is nowhere to store a supplier's number and there should not be: a
   * kirana buys from four or five people depending on what it is, and a field
   * for "the supplier" would be wrong most weeks. WhatsApp's own contact picker
   * already knows all of them. Same shape the delivery round uses.
   */
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  /**
   * THE LIST GOES AS A MESSAGE AND A PDF IN ONE TAP.
   *
   * There used to be two buttons, a WhatsApp message and a PDF download, and
   * the owner then had to attach the file by hand. `navigator.share` with a
   * file is the only way a browser can put a document into WhatsApp (a wa.me
   * link carries text only), so on the Android phones this runs on the share
   * sheet opens with WhatsApp in it and the PDF goes with the message as its
   * caption. The owner picks the supplier there; the sheet cannot be told who.
   *
   * Where a browser cannot share files (desktop, mostly) the PDF is downloaded
   * and the WhatsApp chat opens with the list as text, the way the khata
   * statement does it.
   */
  async function sendToSupplier() {
    setBuilding(true);
    try {
      // Imported here rather than at the top: this pulls in jsPDF and a page of
      // canvas drawing, and an owner who never opens this card should not pay
      // for it on every load of the Items tab.
      const { restockPdf } = await import('@/lib/restock-pdf');
      const { saveBlob } = await import('@/lib/khata-pdf');

      const now = new Date();
      const blob = await restockPdf({
        shopName,
        dateLabel: formatDay(now),
        // Name and pack size only. What is left on the shop's own shelf is the
        // shop's business, not the supplier's — see the note in `restock-pdf`.
        rows: chosen.map((item) => ({
          name: restockName(item, locale),
          wanted: orderQuantityText(orderQty[item.id] ?? '', item.unit, t.pieceShort),
        })),
        labels: {
          heading: t.restockHeading,
          item: t.restockItemCol,
          wanted: t.restockWanted,
          total: t.restockTotal,
          empty: t.restockEmptyLine,
        },
      });

      const file = new File([blob], restockFilename(shopName, now), { type: 'application/pdf' });

      // Checked with the actual file: a browser can share text and still
      // refuse a PDF, and calling `share` blind throws.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: message });
        return;
      }

      saveBlob(blob, file.name);
      push(t.restockDownloaded, 'success');
    } catch (error) {
      // Closing the share sheet rejects with AbortError: the owner changed
      // their mind, which is not a failure.
      if ((error as { name?: string })?.name === 'AbortError') return;
      push(t.networkError, 'error');
    } finally {
      setBuilding(false);
    }
  }

  // A SHOP WITH NO ITEMS AT ALL GETS NOTHING HERE, not even the quiet line.
  // "Nothing has run out, everything is in stock" is true of an empty shop in
  // the way that it is true of an empty room, and the first screen an owner
  // ever sees should say one thing: add your first item. A card about
  // reordering from a supplier, above a list that does not exist yet, is the
  // clearest possible signal that this app was not built for today.
  if (items.length === 0) return null;

  // Nothing out of stock is the good case and it does not need a card. A shop
  // with full shelves should not be shown an empty list every time it opens the
  // Items tab — one quiet line, and out of the way.
  if (wanted.length === 0) {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-glass-edge bg-glass px-4 py-3 shadow-raised">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <CheckIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">{t.restockTitle}</span>
          <span className="block text-sm text-slate-500">{t.restockNone}</span>
        </span>
      </section>
    );
  }

  const isFinished = (item: RestockItem) => !item.inStock || item.stockQty === 0;
  const outCount = wanted.filter(isFinished).length;
  const lowCount = wanted.length - outCount;
  const allTicked = chosen.length === wanted.length;
  const noneTicked = chosen.length === 0;

  /**
   * THE CARD, REBUILT BY REQUEST — "too plain, and it wastes the space".
   *
   * The old card was a caption, a hint, two grey pills and a list whose status
   * chips took a column of their own, which on a 375px phone squeezed every
   * name down to a few letters. Now:
   *
   *  - A header that says what this is at a glance: an icon, the title, and the
   *    two numbers that matter (how many have run out, how many are running
   *    low) as coloured chips — the owner learns the state of the shelf before
   *    reading a single row.
   *  - Tick all / untick all as one small segmented control beside the count,
   *    instead of two loose pills on a line of their own.
   *  - The status moves INTO the row, under the name, and the row carries it as
   *    a coloured edge (red run out, amber running low). That frees the width
   *    the chip column took, so names are readable and the amount box keeps
   *    its size.
   *  - A column header once, over the list, instead of a floating caption.
   *  - The send action is a full-width bar at the foot of the card, saying how
   *    many lines will go — the one thing to do here, where the thumb is.
   */
  return (
    <section className="overflow-hidden rounded-2xl border border-glass-edge bg-glass shadow-raised">
      <header className="flex items-start gap-3 px-4 pt-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <TruckIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-tight text-slate-900">{t.restockTitle}</h2>
          <p className="mt-1 text-xs leading-snug text-slate-500">{t.restockHint}</p>
        </span>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-2 px-4">
        {outCount > 0 && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-rose-700">
            {outCount} {t.restockOut}
          </span>
        )}
        {lowCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-800">
            {lowCount} {t.runningLowCount}
          </span>
        )}
        <div className="ml-auto inline-flex rounded-xl bg-sunk p-1 text-xs font-medium" role="group" aria-label={t.restockPicked}>
          <button
            type="button"
            onClick={() => setPicked(new Set(wanted.map((item) => item.id)))}
            aria-pressed={allTicked}
            className={clsx(
              'min-h-9 rounded-lg px-3 transition',
              allTicked ? 'bg-card text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {t.restockAll}
          </button>
          <button
            type="button"
            onClick={() => setPicked(new Set())}
            aria-pressed={noneTicked}
            className={clsx(
              'min-h-9 rounded-lg px-3 transition',
              noneTicked ? 'bg-card text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {t.restockClear}
          </button>
        </div>
      </div>

      {/* The column headings, once. The amount box's label used to float on a
          line of its own because a placeholder that narrow was cut to "কত লাগ". */}
      <div className="mt-3 flex items-center justify-between border-y border-slate-200/70 bg-sunk/60 px-4 py-1.5 text-xs font-semibold text-slate-500">
        <span>
          {t.restockItemCol} · <span className="tabular-nums">{chosen.length}/{wanted.length}</span> {t.restockPicked}
        </span>
        <span className="w-28 text-right">{t.restockWanted}</span>
      </div>

      {/* Capped in height and scrolled. A shop that has let itself run down has
          forty of these, and forty rows pushed between the item list and
          everything under it would bury the tab. */}
      <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {wanted.map((item) => {
          const ticked = chosenIds.has(item.id);
          const finished = isFinished(item);
          const typed = orderQty[item.id] ?? '';
          // The unit a bare number will be sent in, faint at the right of the
          // box, until the owner writes a unit of their own.
          const hint = /^\s*[\d০-৯०-९]*(?:\.[\d০-৯०-९]*)?\s*$/.test(typed)
            ? orderUnit(item.unit, t.pieceShort)
            : '';

          return (
            <li
              key={item.id}
              className={clsx('relative transition', !ticked && 'bg-sunk/40')}
            >
              {/* The status edge is its own bar: the list's divide-y colours every
                  border but the first row's, so a border-l colour was lost. */}
              <span
                aria-hidden
                className={clsx('absolute inset-y-0 left-0 w-1', finished ? 'bg-rose-400' : 'bg-amber-400')}
              />
              <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2 pl-3 pr-4">
                <input
                  type="checkbox"
                  checked={ticked}
                  onChange={() => toggle(item.id)}
                  className="h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={clsx(
                      'block truncate text-sm font-medium',
                      ticked ? 'text-slate-900' : 'text-slate-400 line-through decoration-slate-300',
                    )}
                  >
                    {restockName(item, locale)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs">
                    {/* "1 kg বাকি", not "2 বাকি" — `stockWithUnit` is the same
                        conversion the item row and the till use, so one shelf
                        never reads three different ways in one app. */}
                    <span className={clsx('font-semibold tabular-nums', finished ? 'text-rose-700' : 'text-amber-800')}>
                      {finished
                        ? t.restockOut
                        : `${stockWithUnit(item.unit, item.stockQty ?? 0, t.pieceShort)} ${t.restockLow}`}
                    </span>
                    <span className="text-slate-500">
                      {[item.unit, item.category ? translateCategory(item.category, locale) : '']
                        .filter(Boolean)
                        .map((part) => ` · ${part}`)
                        .join('')}
                    </span>
                  </span>
                </span>

                {/* HOW MUCH TO ORDER. Free text on purpose: a shop sells rice by
                    the kilo and buys it by the fifty-kilo bosta. Blank is fine.
                    `onClick` stops the label ticking the row off. */}
                <span className="relative shrink-0">
                  <input
                    type="text"
                    value={typed}
                    onChange={(event) =>
                      setOrderQty((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    onClick={(event) => event.preventDefault()}
                    aria-label={`${t.restockWanted} — ${restockName(item, locale)}`}
                    className={clsx(
                      'h-10 w-28 rounded-xl border border-slate-300 bg-card pl-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none',
                      hint ? 'pr-12' : 'pr-3',
                    )}
                  />
                  {hint && (
                    <span className="pointer-events-none absolute right-2.5 top-1/2 max-w-[2.75rem] -translate-y-1/2 truncate text-xs text-slate-400">
                      {hint}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <footer className="border-t border-slate-200/70 bg-sunk/50 px-4 py-3">
        <p className="mb-2 text-xs tabular-nums text-slate-500">
          {t.restockWillSend.replace('{n}', String(chosen.length))}
        </p>
        <div className="flex gap-2">
          {canSharePdf ? (
            // One tap: the share sheet opens with the PDF and the list as its
            // caption. See `sendToSupplier`.
            <button
              type="button"
              onClick={sendToSupplier}
              disabled={noneTicked || building}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1eb457] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t.restockSend}
            </button>
          ) : (
            <>
              {/* A real link: WhatsApp has to be opened by a navigation the
                  browser can see the owner asked for — `window.open` from a
                  handler is what pop-up blockers exist to stop. */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener"
                aria-disabled={noneTicked}
                onClick={(event) => {
                  if (noneTicked) event.preventDefault();
                }}
                className={clsx(
                  'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white shadow-sm transition',
                  noneTicked ? 'cursor-not-allowed opacity-50' : 'hover:bg-[#1eb457]',
                )}
              >
                <WhatsAppIcon className="h-5 w-5" />
                {t.restockSend}
              </a>
              <button
                type="button"
                onClick={sendToSupplier}
                disabled={noneTicked || building}
                aria-label={t.restockPdf}
                title={t.restockPdf}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-card px-4 text-sm font-semibold text-slate-700 transition hover:bg-sunk disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PdfIcon className="h-5 w-5" />
                {/* Icon only on a phone, so Send keeps one line. */}
                <span className="hidden sm:inline">{t.restockPdf}</span>
              </button>
            </>
          )}
        </div>
      </footer>
    </section>
  );
}
