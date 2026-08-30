'use client';

/**
 * What the shop charges to send an order out, and the smallest one it will send.
 *
 * Three numbers, folded away behind one line, next to the notice card and for
 * the same reason: a fifth tab for three fields would cost every owner a slice
 * of a small screen so that some of them could use it. Most shops will set
 * these once, in the first week, and never open the card again.
 *
 * All three default to zero, which means free delivery with no minimum — what
 * nearly every kirana does inside its own para, and therefore what a shop that
 * never opens this card goes on doing.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { handledExpiredSession } from './sessionGuard';
import { ownerDict } from '@/lib/owner-i18n';
import { formatPaise, paiseToInput, parsePaise } from '@/lib/money';
import type { Locale } from '@/lib/i18n';

export function DeliveryCard({
  slug,
  locale,
  deliveryEnabled,
  deliveryFeePaise,
  freeDeliveryAbovePaise,
  minOrderPaise,
}: {
  slug: string;
  locale: Locale;
  /** Collection-only shops are told so, rather than shown three dead fields. */
  deliveryEnabled: boolean;
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number;
  minOrderPaise: number;
}) {
  const t = ownerDict(locale);
  const router = useRouter();
  const { push } = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fee, setFee] = useState(paiseToInput(deliveryFeePaise));
  const [free, setFree] = useState(paiseToInput(freeDeliveryAbovePaise));
  const [min, setMin] = useState(paiseToInput(minOrderPaise));

  async function save() {
    // A blank box means zero, not "leave it alone". An owner clearing the
    // delivery charge is turning it off, and treating an empty field as
    // unchanged would leave them charging money they meant to stop charging.
    const numbers = {
      deliveryFeePaise: fee.trim() === '' ? 0 : parsePaise(fee),
      freeDeliveryAbovePaise: free.trim() === '' ? 0 : parsePaise(free),
      minOrderPaise: min.trim() === '' ? 0 : parsePaise(min),
    };

    if (Object.values(numbers).some((value) => value === null)) {
      setError(`${t.deliveryFee} — 20, 25.50…`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/owner/${slug}/delivery`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(numbers),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
      };
      if (!response.ok) {
        setError(payload.errors?.freeDeliveryAbovePaise ?? payload.error ?? t.networkError);
        return;
      }

      push(t.deliverySaved, 'success');
      setEditing(false);
      router.refresh();
    } catch {
      setError(t.networkError);
    } finally {
      setSaving(false);
    }
  }

  /** The terms in one line, as a customer would meet them. */
  const summary = !deliveryEnabled
    ? t.deliveryOff
    : [
        deliveryFeePaise > 0 ? formatPaise(deliveryFeePaise) : t.deliveryFeeHint,
        freeDeliveryAbovePaise > 0 ? `${t.deliveryFree} ${formatPaise(freeDeliveryAbovePaise)}` : '',
        minOrderPaise > 0 ? `${t.deliveryMin} ${formatPaise(minOrderPaise)}` : '',
      ]
        .filter(Boolean)
        .join(' · ');

  return (
    <section className="rounded-2xl bg-white px-4 py-3 shadow-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-slate-900">{t.deliveryTitle}</span>
        {!editing && deliveryEnabled && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto text-sm font-semibold text-brand-700 underline"
          >
            {t.noticeChange}
          </button>
        )}
      </div>

      {!editing && <p className="mt-1 text-sm text-slate-500">{summary}</p>}

      {editing && (
        <div className="mt-3 space-y-3">
          <Field label={t.deliveryFee} hint={t.deliveryFeeHint} value={fee} onChange={setFee} />
          <Field label={t.deliveryFree} hint={t.deliveryFreeHint} value={free} onChange={setFree} />
          <Field label={t.deliveryMin} hint={t.deliveryMinHint} value={min} onChange={setMin} />

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={save}>
              {t.save}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setFee(paiseToInput(deliveryFeePaise));
                setFree(paiseToInput(freeDeliveryAbovePaise));
                setMin(paiseToInput(minOrderPaise));
                setEditing(false);
                setError('');
              }}
            >
              {t.no}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * One money field with its explanation under it.
 *
 * `inputMode="decimal"` rather than `type="number"`: prices here can carry
 * paise, and a number spinner offers a keypad with no decimal point on some
 * Android keyboards — the same reason the item price field is text.
 */
function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-base tabular-nums"
      />
      <span className="mt-1 block text-xs text-slate-500">{hint}</span>
    </label>
  );
}
