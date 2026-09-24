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
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { WhatsAppIcon } from '@/components/ui/Icon';
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
      <section className="rounded-2xl border border-glass-edge bg-glass px-4 py-3 shadow-raised">
        <p className="text-sm font-semibold text-slate-900">{t.restockTitle}</p>
        <p className="mt-1 text-sm text-slate-500">{t.restockNone}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-glass-edge bg-glass px-4 py-3 shadow-raised">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-sm font-semibold text-slate-900">{t.restockTitle}</p>
        <p className="text-sm tabular-nums text-slate-500">
          {chosen.length} / {wanted.length} {t.restockPicked}
        </p>
      </div>
      <p className="mt-1 text-xs text-slate-500">{t.restockHint}</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPicked(new Set(wanted.map((item) => item.id)))}
          className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
        >
          {t.restockAll}
        </button>
        <button
          type="button"
          onClick={() => setPicked(new Set())}
          className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
        >
          {t.restockClear}
        </button>
      </div>

      {/* Capped in height and scrolled. A shop that has let itself run down has
          forty of these, and forty rows pushed between the item list and
          everything under it would bury the tab. */}
      {/* The order boxes' label, once, over their column: in a box this
          narrow a placeholder was cut to "কত লাগ". */}
      <p className="mt-3 text-right text-xs font-medium text-slate-500">{t.restockWanted}</p>
      <ul className="mt-1 max-h-80 divide-y divide-slate-100 overflow-y-auto">
        {wanted.map((item) => {
          const ticked = chosenIds.has(item.id);
          const finished = !item.inStock || item.stockQty === 0;

          return (
            <li key={item.id}>
              <label className="flex cursor-pointer items-center gap-3 py-2">
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
                      ticked ? 'text-slate-900' : 'text-slate-400',
                    )}
                  >
                    {restockName(item, locale)}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {[item.unit, item.category ? translateCategory(item.category, locale) : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                    finished ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800',
                  )}
                >
                  {/* "1 kg বাকি", not "2 বাকি". `stockQty` is a multiple of
                      the item's own pack, so the raw number means nothing on
                      its own — two of a 500 g pack is a kilo, and two of a
                      1 kg pack is two. `stockAmountLabel` is the same
                      conversion the item row and the till use, so one shelf
                      never reads three different ways in one app. */}
                  {finished
                    ? t.restockOut
                    : `${stockWithUnit(item.unit, item.stockQty ?? 0, t.pieceShort)} ${t.restockLow}`}
                </span>

                {/* HOW MUCH TO ORDER — the question this card never asked.
                    It listed what had run out and stopped there, so the owner
                    sent a list of names and then said the amounts out loud
                    anyway, which is the phone call the card exists to save.

                    Free text on purpose: a shop sells rice by the kilo and
                    buys it by the fifty-kilo bosta, so "2 bosta" and "5 strip"
                    have to be sayable. Blank is allowed — the shop wants the
                    item and will settle the amount at the counter.

                    Outside the label's own click target (`onClick` stops the
                    bubble) or tapping into the box would tick the row off. */}
                {/* The unit a bare number will be sent in, faint at the right
                    of the box, until the owner writes a unit of their own. */}
                {(() => {
                  const typed = orderQty[item.id] ?? '';
                  const hint = /^\s*[\d০-৯०-९]*(?:\.[\d০-৯०-९]*)?\s*$/.test(typed)
                    ? orderUnit(item.unit, t.pieceShort)
                    : '';
                  return (
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
                          'h-9 w-28 rounded-lg border border-slate-300 pl-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none',
                          hint ? 'pr-12' : 'pr-2',
                        )}
                      />
                      {hint && (
                        <span className="pointer-events-none absolute right-2 top-1/2 max-w-[2.75rem] -translate-y-1/2 truncate text-xs text-slate-400">
                          {hint}
                        </span>
                      )}
                    </span>
                  );
                })()}
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        {canSharePdf ? (
          // One tap: the share sheet opens with the PDF and the list as its
          // caption. See `sendToSupplier`.
          <button
            type="button"
            onClick={sendToSupplier}
            disabled={chosen.length === 0 || building}
            className={clsx(
              'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white transition hover:bg-[#1eb457]',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <WhatsAppIcon className="h-4 w-4" />
            {t.restockSend}
          </button>
        ) : (
          <>
            {/* A real link rather than the Button component, which only
                renders a `<button>`. WhatsApp has to be opened by a navigation
                the browser can see the owner asked for — a click handler
                calling `window.open` is what pop-up blockers exist to stop. */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener"
              aria-disabled={chosen.length === 0}
              onClick={(event) => {
                if (chosen.length === 0) event.preventDefault();
              }}
              className={clsx(
                'inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition',
                chosen.length === 0
                  ? 'cursor-not-allowed bg-[#25D366] opacity-50'
                  : 'bg-[#25D366] hover:bg-[#1eb457]',
                'text-white',
              )}
            >
              <WhatsAppIcon className="h-4 w-4" />
              {t.restockSend}
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={sendToSupplier}
              loading={building}
              disabled={chosen.length === 0}
            >
              {t.restockPdf}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
