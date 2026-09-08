'use client';

/**
 * Where shops send money, editable by the operator without a developer.
 *
 * This used to be `NEXT_PUBLIC_ADMIN_UPI_ID` in a Vercel dashboard, which meant
 * changing a bank account required an environment variable and a redeploy —
 * something nobody does at the moment they actually need to. It also could only
 * ever hold a UPI id, so the operator's real PhonePe QR, the one already
 * printed and stuck to a wall, had nowhere to live.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePicker } from './ImagePicker';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';

export type PaymentSettings = {
  upiId: string;
  payeeName: string;
  phone: string;
  qrImageData: string;
  note: string;
};

export function PaymentSettingsForm({ initial }: { initial: PaymentSettings }) {
  const router = useRouter();
  const { push } = useToast();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function set<K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok) {
        setErrors(body.errors ?? {});
        push(body.error ?? 'Could not save', 'error');
        return;
      }
      push('Payment details saved', 'success');
      router.refresh();
    } catch {
      push('Network problem — please try again', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-5 rounded-2xl bg-white p-5 shadow-card">
      <Field
        label="Your UPI id"
        hint="name@bank"
        value={form.upiId}
        error={errors.upiId}
        onChange={(value) => set('upiId', value)}
        placeholder="santanusarkar69@ibl"
      />

      <Field
        label="Name shops will see"
        value={form.payeeName}
        error={errors.payeeName}
        onChange={(value) => set('payeeName', value)}
        placeholder="Nexvora Technologies"
      />

      <Field
        label="Google Pay / PhonePe number"
        hint="10 digits"
        value={form.phone}
        error={errors.phone}
        onChange={(value) => set('phone', value.replace(/\D/g, '').slice(0, 10))}
        inputMode="numeric"
        placeholder="9876543210"
      />

      {/* Shape "square", which the picker treats as a QR: 700px, PNG, and a
          white ground. A JPEG would round the corners off every module and a
          transparent PNG flattened onto black would invert the pattern —
          either way the code stops scanning, silently, on a shopkeeper's
          phone. */}
      <ImagePicker
        label="Your payment QR"
        hint="the image from PhonePe or Google Pay"
        shape="square"
        value={form.qrImageData}
        busy={busy}
        onChange={(value) => set('qrImageData', value)}
        onError={(message) => push(message, 'error')}
      />

      <div>
        <label htmlFor="pay-note" className="mb-1.5 block text-sm font-medium text-slate-700">
          Note for shops <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="pay-note"
          value={form.note}
          onChange={(event) => set('note', event.target.value)}
          rows={2}
          maxLength={300}
          placeholder="After paying, send the screenshot on WhatsApp."
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy && <Spinner className="h-4 w-4" />}
        Save payment details
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  value,
  error,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  hint?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: 'numeric' | 'text';
}) {
  const id = `pay-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {hint && <span className="ml-1 font-normal text-slate-400">({hint})</span>}
      </label>
      <input
        id={id}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
