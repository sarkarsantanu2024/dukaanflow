'use client';

/**
 * The udhaar book.
 *
 * Built to look like the paper book it replaces, not like accounting software:
 * a name, what they took, what they paid, what is left. Two buttons — gave
 * goods, got payment — because that is the entire vocabulary a shopkeeper uses
 * for this, and anything more would be a worse notebook.
 *
 * The one thing paper cannot do is nudge, so each name carries a WhatsApp
 * reminder with the amountPaise already written.
 */

import { formatDay } from '@/lib/time';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/useConfirm';
import { handledExpiredSession } from './sessionGuard';
import { PdfIcon, SheetIcon, TrashIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { formatPaise, paiseToInput, parsePaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import { reminderMessage } from '@/lib/khata';
import {
  khataStatementPdf,
  saveBlob,
  statementFilename,
  type StatementAccount,
} from '@/lib/khata-pdf';
import { ItemNotePicker, type PickableItem } from './ItemNotePicker';
import type { Locale } from '@/lib/i18n';

export type KhataCustomer = {
  id: string;
  name: string;
  phone: string;
  /** Which para or lane, when one was recorded. */
  area: string;
  balancePaise: number;
  /** ISO date the CURRENT debt began, or null when they owe nothing. */
  owingSince: string | null;
  entries: {
    id: string;
    kind: 'DEBIT' | 'CREDIT';
    amountPaise: number;
    note: string;
    createdAt: string;
  }[];
};

/**
 * How long this debt has run, in the words a shopkeeper would use.
 *
 * Days up to two months, then months — "owing 94 days" is a number nobody
 * converts in their head, and "owing 3 months" is the sentence they would say
 * out loud. Today's debt gets no line at all: everything is a day old at some
 * point, and a badge on every fresh entry would mean nothing.
 */
function owingFor(
  since: string | null,
  t: ReturnType<typeof ownerDict>,
): { label: string; months: number } | null {
  if (!since) return null;

  const days = Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000);
  if (days < 1) return null;

  const months = Math.floor(days / 30);
  return months >= 2
    ? { label: t.khataOwingMonths.replace('{n}', String(months)), months }
    : { label: t.khataOwingDays.replace('{n}', String(days)), months };
}

export function KhataScreen({
  slug,
  shopName,
  customers,
  items,
  outstandingPaise,
  locale,
}: {
  slug: string;
  shopName: string;
  customers: KhataCustomer[];
  /** The shop's own list, so goods given on credit are picked, not typed. */
  items: PickableItem[];
  outstandingPaise: number;
  locale: Locale;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const t = ownerDict(locale);

  const [open, setOpen] = useState<string | null>(null);
  /**
   * ONCE THEY HAVE PAID, THEY LEAVE THE LIST.
   *
   * A khata is a list of who owes money. A settled customer sitting in it at
   * ₹0 is answering a question nobody asked, and on a shop with two hundred
   * regulars — nearly all of whom are square nearly all of the time — the three
   * names that matter were buried among them.
   *
   * SHOWN AGAIN ON REQUEST rather than deleted, and that difference is the
   * whole of it. The commonest reason to want a settled customer is an argument
   * about whether they actually paid, and answering that means reaching their
   * statement; a row that is gone for good is a statement nobody can reach and
   * a customer who has to be typed in from scratch the next time they ask for
   * credit. So they fold away behind a line that says how many there are.
   *
   * Somebody holding an advance is NOT settled — the shop owes them, which is
   * an open account pointing the other way, and it stays on the list.
   */
  const [showSettled, setShowSettled] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Which PDF is being drawn — the whole book, or one customer's id. */
  const [building, setBuilding] = useState<string | null>(null);

  /** The sheet's wording, in the shop's own language. */
  const pdfLabels = {
    book: t.khataTitle,
    statement: t.khataStatement,
    history: t.khataHistory,
    gave: t.khataGave,
    got: t.khataGot,
    total: t.khataTotal,
    outstanding: t.khataTotal,
    nobody: t.khataNobody,
  };

  function accountFor(customer: KhataCustomer): StatementAccount {
    return {
      name: customer.name,
      phone: customer.phone,
      area: customer.area,
      balancePaise: customer.balancePaise,
      entries: customer.entries,
    };
  }

  /** The whole book as one PDF, a page per customer. */
  async function downloadBook() {
    setBuilding('all');
    try {
      const now = new Date();
      const blob = await khataStatementPdf({
        shopName,
        accounts: customers.map(accountFor),
        labels: pdfLabels,
        generatedAt: now,
      });
      saveBlob(blob, statementFilename(shopName, now));
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBuilding(null);
    }
  }

  /**
   * ONE CUSTOMER'S STATEMENT, HANDED TO WHATSAPP AS A FILE.
   *
   * `navigator.share` with a `files` array is the only thing in a browser that
   * can put a document into WhatsApp. A `wa.me` link cannot: it carries text
   * and nothing else, and no amount of encoding changes that — actually
   * attaching a PDF to a number without the owner touching it needs the
   * WhatsApp Business Cloud API, a registered sender and a media upload, which
   * is a paid integration rather than a link.
   *
   * So this is as close as the web gets, and on the Android phones this product
   * lives on it is genuinely close: the PDF is built, the share sheet opens
   * with WhatsApp in it, the owner picks the customer, and the file goes with
   * the message. What it cannot do is pre-address the chat — the sheet has no
   * way to be told which contact.
   *
   * Where files cannot be shared at all — desktop Chrome on Windows, mostly —
   * the PDF is downloaded and the wa.me chat opens with the account written out
   * as text, which is what this button did before. The owner attaches the file
   * they have just been given. Nothing silently does less than it says.
   */
  async function sendStatement(customer: KhataCustomer) {
    setBuilding(customer.id);
    const now = new Date();
    const message = reminderMessage(
      shopName,
      customer.name,
      customer.balancePaise,
      locale,
      customer.entries,
    );

    try {
      const blob = await khataStatementPdf({
        shopName,
        accounts: [accountFor(customer)],
        labels: pdfLabels,
        generatedAt: now,
      });
      const file = new File([blob], statementFilename(shopName, now, customer), {
        type: 'application/pdf',
      });

      // `canShare` is checked with the actual file: a browser can support
      // sharing text and still refuse a PDF, and calling `share` blind throws.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: message });
        return;
      }

      saveBlob(blob, file.name);
      window.open(
        `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener',
      );
      push(t.khataPdfAttach, 'success');
    } catch (error) {
      // Dismissing the share sheet rejects with AbortError. That is the owner
      // changing their mind, not a failure, and must not raise an error toast.
      if ((error as { name?: string })?.name === 'AbortError') return;
      push(t.networkError, 'error');
    } finally {
      setBuilding(null);
    }
  }
  /**
   * `amount` HOLDS RUPEES — what the shopkeeper typed into a box marked ₹.
   *
   * It used to be called `amountPaise` and was sent to the server unconverted,
   * so ₹250 of goods was written to the book as 250 paise: two rupees fifty.
   * Every khata in the product was out by a hundred, and it looked plausible
   * enough on screen that nothing complained. Rupees in the field, paise on the
   * wire, and `parsePaise` is the only crossing point.
   */
  const [form, setForm] = useState({ name: '', phone: '', area: '', amount: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Anybody with an open account either way — see `showSettled`. */
  const outstanding = customers.filter((customer) => customer.balancePaise !== 0);
  const settled = customers.filter((customer) => customer.balancePaise === 0);
  const listed = showSettled ? customers : outstanding;

  async function addEntry(kind: 'DEBIT' | 'CREDIT') {
    const amountPaise = parsePaise(form.amount);
    if (amountPaise === null || amountPaise < 1) {
      setErrors({ amountPaise: t.khataAmount });
      return;
    }

    setBusy(true);
    setErrors({});
    try {
      const response = await fetch(`/api/admin/shop/${slug}/khata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: form.phone,
          customerName: form.name,
          customerArea: form.area,
          kind,
          amountPaise,
          note: form.note,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        setErrors(payload.errors ?? {});
        push(payload.error ?? t.networkError, 'error');
        return;
      }

      setForm({ name: '', phone: '', area: '', amount: '', note: '' });
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusy(false);
    }
  }

  /**
   * One entry against a customer already in the book, posted from their own
   * row rather than from the form at the bottom of the page.
   *
   * The row used to carry a link that silently prefilled that distant form,
   * with no scroll and no feedback — so it read as a button that did nothing.
   * Acting where the balancePaise is shown is the whole point.
   */
  async function addFor(
    customer: KhataCustomer,
    kind: 'DEBIT' | 'CREDIT',
    amountPaise: number,
    note = '',
  ) {
    if (!Number.isFinite(amountPaise) || amountPaise < 1) {
      push(t.khataAmount, 'error');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/khata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: customer.phone,
          customerName: customer.name,
          customerArea: customer.area,
          kind,
          amountPaise,
          note,
        }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;
      if (!response.ok) {
        push(t.networkError, 'error');
        return;
      }
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(id: string) {
    if (
      !(await confirm({
        title: t.khataDeleteConfirm,
        confirmLabel: t.delete,
        cancelLabel: t.no,
        danger: true,
      }))
    ) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/khata`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        push(t.networkError, 'error');
        return;
      }
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-card">
        {/* THE TWO EXPORTS MOVED UP HERE, AS ICONS.
            They were a pair of wide labelled buttons and a line of hint text on
            their own row under the total — which on a 375px phone stacked into
            two full-width rows and a third of explanation, roughly a fifth of
            the screen spent on two things a shopkeeper taps once a month. The
            space beside a three-character total was empty the whole time.

            Labels survive as `title` and `aria-label` rather than being
            dropped: a bare icon is a guess for a sighted user and nothing at
            all for a screen reader. */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500">{t.khataTotal}</p>
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {formatPaise(outstandingPaise)}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">{t.khataTitle}</p>
          </div>

          {customers.length > 0 && (
            <div className="flex shrink-0 items-center gap-1">
              {/* Plain links, not fetch-and-blob: a download link is the one
                  thing every Android WebView handles the same way. */}
              <a
                href={`/api/owner/${slug}/khata/export`}
                aria-label={t.khataExportCsv}
                title={`${t.khataExportCsv} — ${t.khataExportHint}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <SheetIcon className="h-5 w-5" />
              </a>
              {/* A real PDF file, not a print dialogue. It used to link to a
                  printable page and leave the shopkeeper to find "Save as PDF"
                  in a browser menu — which on an Android phone is three taps
                  into a sheet most people have never opened. This downloads the
                  book, a page per customer. */}
              <button
                type="button"
                onClick={downloadBook}
                disabled={building !== null}
                aria-label={t.khataExportPdf}
                title={`${t.khataExportPdf} — ${t.khataExportHint}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              >
                {building === 'all' ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <PdfIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* THE BOOK COMES OUT OF THE APP.
            This is the shopkeeper's own money, and until now the only copy of
            it was in our database. A tool you cannot get your accounts out of
            is not a tool, it is a dependency — and "what happens to my khata if
            you disappear" is a question about trust that gets asked long before
            any question about features.

            Two shapes, because they are two different jobs: a spreadsheet for
            anything that has to be added up, and a printable statement for the
            customer who wants it on paper. Both are the two icons above. */}
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="font-semibold text-slate-800">{t.khataNobody}</p>
          <p className="mt-1 text-sm text-slate-500">{t.khataNobodyHint}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {listed.map((customer) => {
            const expanded = open === customer.id;
            const owes = customer.balancePaise > 0;
            const advance = customer.balancePaise < 0;
            const ageing = owes ? owingFor(customer.owingSince, t) : null;

            return (
              <li key={customer.id} className="rounded-2xl bg-white shadow-card">
                {/* THE TWO THINGS DONE TO A DEBTOR, ON THE ROW ITSELF.
                    Reminding somebody and handing them their statement were
                    both a tap inside the expanded row — so chasing five people
                    meant open, tap, collapse, open, tap, five times, and the
                    reminder was invisible until you had already opened the one
                    row you wanted. They live on the row now.

                    A sibling of the toggle rather than inside it: an <a> nested
                    in a <button> is invalid, and browsers respond by moving or
                    dropping it, which is a bug that shows up in one browser and
                    not another. */}
                <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : customer.id)}
                  aria-expanded={expanded}
                  className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left"
                >
                  <span
                    aria-hidden
                    className={clsx(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      owes
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                        : advance
                          ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                          : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {(customer.name || customer.phone).slice(0, 2).toUpperCase()}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">
                      {customer.name || `+91 ${customer.phone}`}
                    </span>
                    <span className="block truncate text-sm text-slate-500">
                      {[customer.name ? `+91 ${customer.phone}` : '', customer.area]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>

                    {/* HOW LONG, not just how much.
                        "Who owes me" was on this row already; "who has owed me
                        since Puja" was not, and that is the one a shopkeeper
                        acts on — a fortnight is a reminder, four months is a
                        visit. It deepens with age, so the oldest debts are the
                        ones the eye lands on. */}
                    {ageing && (
                      <span
                        className={clsx(
                          'mt-0.5 block truncate text-xs font-semibold',
                          ageing.months >= 3
                            ? 'text-red-600'
                            : ageing.months >= 1
                              ? 'text-amber-700'
                              : 'text-slate-500',
                        )}
                      >
                        {ageing.label}
                      </span>
                    )}
                  </span>

                  {/* Owed, advance and settled are three different facts and
                      now look like it. They used to differ only in a word
                      under the number, so a customer holding ₹250 of credit
                      read at a glance exactly like one owing ₹250 — and on a
                      list of forty names, a glance is all anybody gives it. */}
                  <span
                    className={clsx(
                      'shrink-0 rounded-xl px-2.5 py-1 text-right',
                      owes && 'bg-amber-50 ring-1 ring-amber-200',
                      advance && 'bg-brand-50 ring-1 ring-brand-200',
                    )}
                  >
                    <span
                      className={clsx(
                        'block font-bold tabular-nums',
                        owes ? 'text-amber-800' : advance ? 'text-brand-800' : 'text-slate-400',
                      )}
                    >
                      {advance && '+'}
                      {formatPaise(Math.abs(customer.balancePaise))}
                    </span>
                    <span
                      className={clsx(
                        'block text-xs font-medium',
                        owes ? 'text-amber-700' : advance ? 'text-brand-700' : 'text-slate-400',
                      )}
                    >
                      {owes ? t.khataOwes : advance ? t.khataAdvance : t.khataSettled}
                    </span>
                  </span>
                </button>

                {/* ONE ACTION ON THE ROW, NOT TWO.
                    A separate statement icon beside this one was two buttons
                    for what a shopkeeper thinks of as one job — telling
                    somebody what they owe. The WhatsApp button now carries the
                    statement with it, so the row asks one question and answers
                    it. The book as a whole is still a download at the top.

                    Only where there is something to ask for: a reminder to
                    somebody who owes nothing would read "₹0 is pending", and to
                    somebody holding credit it would be the wrong way round
                    entirely — the shop owes them. */}
                {owes && (
                  <span className="flex shrink-0 items-center pr-2">
                    <button
                      type="button"
                      onClick={() => sendStatement(customer)}
                      disabled={building !== null}
                      aria-label={`${t.khataRemind} — ${customer.name || customer.phone}`}
                      title={t.khataRemind}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#25D366] transition hover:bg-green-50 disabled:opacity-50"
                    >
                      {building === customer.id ? (
                        <Spinner className="h-5 w-5" />
                      ) : (
                        <WhatsAppIcon className="h-5 w-5" />
                      )}
                    </button>
                  </span>
                )}
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    {/* The reminder and the statement used to be here, and are
                        now on the row itself — see the note above the toggle.
                        Repeating them inside would be two buttons for one job
                        sitting a centimetre apart. What is left in here is what
                        opening a row is actually for: the entries. */}
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {t.khataHistory}
                    </p>
                    <ul className="divide-y divide-slate-100">
                      {customer.entries.map((entry) => (
                        <li key={entry.id} className="flex items-center gap-3 py-2 text-sm">
                          <span className="min-w-0 flex-1">
                            <span className="block text-slate-700">
                              {entry.kind === 'DEBIT' ? t.khataGave : t.khataGot}
                              {entry.note && (
                                <span className="text-slate-400"> · {entry.note}</span>
                              )}
                            </span>
                            <span className="block text-xs text-slate-400">
                              {formatDay(entry.createdAt)}
                            </span>
                          </span>
                          <span
                            className={clsx(
                              'shrink-0 font-semibold tabular-nums',
                              entry.kind === 'DEBIT' ? 'text-amber-700' : 'text-brand-700',
                            )}
                          >
                            {entry.kind === 'DEBIT' ? '+' : '−'}
                            {formatPaise(entry.amountPaise)}
                          </span>
                          {/* A bin, sized as a real target and asking before
                              it acts. It was a small underlined word at the
                              end of every row — the same weight as the date
                              beside it, and the only way to correct a
                              mistyped line. A khata that cannot be corrected
                              is one the shopkeeper stops trusting. */}
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            disabled={busy}
                            aria-label={`${t.khataDelete} — ${formatPaise(entry.amountPaise)}`}
                            title={t.khataDelete}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>

                    <SettleRow
                      customer={customer}
                      items={items}
                      locale={locale}
                      t={t}
                      busy={busy}
                      onSettle={(kind, amountPaise, note) =>
                        addFor(customer, kind, amountPaise, note)
                      }
                    />
                  </div>
                )}
              </li>
            );
          })}

          {/* Everybody is square. Worth saying out loud rather than leaving an
              empty space where the list was — an empty list reads as data
              having gone missing, and this is the one state a shopkeeper is
              actually pleased to see. */}
          {listed.length === 0 && (
            <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="font-semibold text-slate-800">{t.khataAllSettled}</p>
            </li>
          )}
        </ul>
      )}

      {settled.length > 0 && (
        <button
          type="button"
          onClick={() => setShowSettled((current) => !current)}
          aria-expanded={showSettled}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          {showSettled ? t.khataHideSettled : `${t.khataShowSettled} (${settled.length})`}
        </button>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-card">
        {/* This form is for somebody not in the book yet. Anyone already
            listed above is settled on their own row, where their balancePaise is —
            which is what the old "+ Gave goods / Got payment" link was
            fumbling towards by silently prefilling this. */}
        <h2 className="font-semibold text-slate-900">{t.khataNewCustomer}</h2>
        <p className="mb-3 mt-0.5 text-sm text-slate-500">{t.khataNewHint}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t.khataCustomer}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            error={errors.customerName}
            placeholder="Rekha Di"
          />
          <Input
            label={t.khataPhone}
            inputMode="numeric"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            error={errors.customerPhone}
            placeholder="9876543210"
          />
          {/* Free text, and not required. Its job is telling two Rekhas apart
              on a list of forty names, not feeding a report. */}
          <Input
            label={t.khataArea}
            value={form.area}
            onChange={(event) => setForm({ ...form, area: event.target.value })}
            error={errors.customerArea}
            placeholder="Bazaar side"
          />
          <Input
            label={t.khataAmount}
            inputMode="decimal"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            error={errors.amountPaise}
            placeholder="250"
          />
          {/* The note used to be an empty box with "chal, tel" as its
              placeholder: typing, on a phone, in a script the keyboard may not
              be set to, while a customer waits — and it left the amount to be
              worked out in the shopkeeper's head. The picks write the note and
              add themselves up. */}
          <ItemNotePicker
            items={items}
            locale={locale}
            onNoteChange={(note) => setForm((current) => ({ ...current, note }))}
            onUseTotal={(paise) =>
              setForm((current) => ({ ...current, amount: paiseToInput(paise) }))
            }
          />
        </div>

        {/* Two verbs, because that is the whole vocabulary of a paper khata. */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            loading={busy}
            disabled={!form.phone || !form.amount}
            onClick={() => addEntry('DEBIT')}
            className="border-amber-300 text-amber-800"
          >
            {t.khataGave}
          </Button>
          <Button
            loading={busy}
            disabled={!form.phone || !form.amount}
            onClick={() => addEntry('CREDIT')}
          >
            {t.khataGot}
          </Button>
        </div>
      </section>

      {confirmDialog}
    </div>
  );
}

/**
 * The one row that settles an account, sitting on the customer it belongs to.
 *
 * The amountPaise starts at whatever they owe, so the common case — "they have paid
 * it all" — is a single tap, and a part payment is the same tap after editing
 * one number. That ordering matters: a shopkeeper handed an empty box has to
 * work out the balancePaise themselves, which is exactly the arithmetic a khata is
 * meant to take off them.
 */
function SettleRow({
  customer,
  items,
  locale,
  t,
  busy,
  onSettle,
}: {
  customer: KhataCustomer;
  items: PickableItem[];
  locale: Locale;
  t: ReturnType<typeof ownerDict>;
  busy: boolean;
  onSettle: (kind: 'DEBIT' | 'CREDIT', amountPaise: number, note: string) => void;
}) {
  const owed = Math.max(0, customer.balancePaise);

  /**
   * The box holds RUPEES, like every other money field a shopkeeper types into.
   *
   * It used to be prefilled with the balance in paise — a ₹5 debt put "500" in
   * a box labelled ₹, and an owner who corrected that to "250" recorded two
   * rupees fifty. The figure round-tripped, so the arithmetic looked right
   * while the screen lied about it.
   */
  const [amount, setAmount] = useState(owed > 0 ? paiseToInput(owed) : '');

  // The balance moves when an entry is added, so the box has to follow it —
  // otherwise the next tap pays off a figure that is no longer true.
  useEffect(() => {
    setAmount(owed > 0 ? paiseToInput(owed) : '');
  }, [owed]);

  /**
   * What was handed over, on the row where it is handed over.
   *
   * The picker only existed on the "somebody new" form at the foot of the
   * page, which is the rarer case by far — a khata is mostly the same twenty
   * names, week after week. Giving goods to one of them recorded an amount and
   * nothing else, so the history read "Gave goods · ₹130" with no way to
   * settle an argument about what the ₹130 was.
   */
  const [note, setNote] = useState('');

  const value = parsePaise(amount);
  const valid = value !== null && value >= 1;
  const settlesInFull = valid && value === owed && owed > 0;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-label={t.khataAmount}
            className="h-10 w-28 rounded-lg border border-slate-300 pl-6 pr-2 text-base tabular-nums"
          />
        </label>

        <Button
          size="sm"
          disabled={busy || !valid}
          onClick={() => value !== null && onSettle('CREDIT', value, note)}
        >
          {settlesInFull ? t.khataSettle : t.khataGot}
        </Button>

        <Button
          size="sm"
          variant="secondary"
          disabled={busy || !valid}
          onClick={() => value !== null && onSettle('DEBIT', value, note)}
        >
          {t.khataGave}
        </Button>
      </div>

      <div className="mt-2">
        <ItemNotePicker
          items={items}
          locale={locale}
          onNoteChange={setNote}
          onUseTotal={(paise) => setAmount(paiseToInput(paise))}
        />
      </div>

      {owed > 0 && <p className="mt-1.5 text-xs text-slate-500">{t.khataPartHint}</p>}
    </div>
  );
}
