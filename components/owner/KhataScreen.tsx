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
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/useConfirm';
import { handledExpiredSession } from './sessionGuard';
import { TrashIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { formatPaise, paiseToInput, parsePaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import { reminderMessage } from '@/lib/khata';
import { ItemNotePicker, type PickableItem } from './ItemNotePicker';
import type { Locale } from '@/lib/i18n';

export type KhataCustomer = {
  id: string;
  name: string;
  phone: string;
  /** Which para or lane, when one was recorded. */
  area: string;
  balancePaise: number;
  entries: {
    id: string;
    kind: 'DEBIT' | 'CREDIT';
    amountPaise: number;
    note: string;
    createdAt: string;
  }[];
};

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
  const [busy, setBusy] = useState(false);
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
        <p className="text-sm text-slate-500">{t.khataTotal}</p>
        <p className="text-3xl font-bold tabular-nums text-slate-900">
          {formatPaise(outstandingPaise)}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">{t.khataTitle}</p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="font-semibold text-slate-800">{t.khataNobody}</p>
          <p className="mt-1 text-sm text-slate-500">{t.khataNobodyHint}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {customers.map((customer) => {
            const expanded = open === customer.id;
            const owes = customer.balancePaise > 0;
            const advance = customer.balancePaise < 0;

            return (
              <li key={customer.id} className="rounded-2xl bg-white shadow-card">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : customer.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span
                    aria-hidden
                    className={clsx(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      owes ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500',
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
                  </span>

                  <span className="shrink-0 text-right">
                    <span
                      className={clsx(
                        'block font-bold tabular-nums',
                        owes ? 'text-amber-700' : advance ? 'text-brand-700' : 'text-slate-400',
                      )}
                    >
                      {formatPaise(Math.abs(customer.balancePaise))}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {owes ? t.khataOwes : advance ? t.khataAdvance : t.khataSettled}
                    </span>
                  </span>
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    {owes && (
                      <a
                        href={`https://wa.me/91${customer.phone}?text=${encodeURIComponent(
                          reminderMessage(
                            shopName,
                            customer.name,
                            customer.balancePaise,
                            locale,
                            customer.entries,
                          ),
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                        {t.khataRemind}
                      </a>
                    )}

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
        </ul>
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
