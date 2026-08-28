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
 * reminder with the amount already written.
 */

import { formatDay } from '@/lib/time';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { WhatsAppIcon } from '@/components/ui/Icon';
import { formatRupees } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import { reminderMessage } from '@/lib/khata';
import type { Locale } from '@/lib/i18n';

export type KhataCustomer = {
  id: string;
  name: string;
  phone: string;
  /** Which para or lane, when one was recorded. */
  area: string;
  balance: number;
  entries: {
    id: string;
    kind: 'DEBIT' | 'CREDIT';
    amount: number;
    note: string;
    createdAt: string;
  }[];
};

export function KhataScreen({
  slug,
  shopName,
  customers,
  outstanding,
  locale,
}: {
  slug: string;
  shopName: string;
  customers: KhataCustomer[];
  outstanding: number;
  locale: Locale;
}) {
  const router = useRouter();
  const { push } = useToast();
  const t = ownerDict(locale);

  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', area: '', amount: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function addEntry(kind: 'DEBIT' | 'CREDIT') {
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
          amount: Number(form.amount),
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

  async function removeEntry(id: string) {
    if (!window.confirm(t.khataDeleteConfirm)) return;
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
          {formatRupees(outstanding)}
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
            const owes = customer.balance > 0;
            const advance = customer.balance < 0;

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
                      {formatRupees(Math.abs(customer.balance))}
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
                          reminderMessage(shopName, customer.name, customer.balance, locale),
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
                            {formatRupees(entry.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            disabled={busy}
                            className="shrink-0 text-xs text-slate-400 underline hover:text-red-600"
                          >
                            {t.khataDelete}
                          </button>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, name: customer.name, phone: customer.phone })}
                      className="mt-2 text-sm font-semibold text-brand-700 underline"
                    >
                      + {t.khataGave} / {t.khataGot}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="mb-3 font-semibold text-slate-900">{t.khataTitle}</h2>
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
            type="number"
            inputMode="numeric"
            min={1}
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            error={errors.amount}
            placeholder="250"
          />
          <Input
            label={t.khataNote}
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            error={errors.note}
            placeholder="chal, tel"
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
    </div>
  );
}
