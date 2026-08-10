'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

type BulkResult = { updated: number; created: number; failed: number; failedRows: string[] };

const PLACEHOLDERS = {
  price: 'Rice 1 kg = 68\nDal 500 g = 82\nOil 1 L = 165',
  stock: 'Rice 1 kg = out\nDal 500 g = in',
};

export function BulkPanel({ slug }: { slug: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [mode, setMode] = useState<'price' | 'stock'>('price');
  const [text, setText] = useState('');
  const [result, setResult] = useState<BulkResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/shop/${slug}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, text }),
      });
      const payload = (await response.json()) as BulkResult & { error?: string };

      if (!response.ok) {
        push(payload.error ?? 'Bulk update failed', 'error');
        return;
      }

      setResult(payload);
      push(`${payload.updated} updated · ${payload.created} created · ${payload.failed} failed`,
        payload.failed > 0 ? 'info' : 'success');
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="font-semibold text-slate-900">Bulk update</h2>
      <p className="mt-1 text-sm text-slate-500">
        One line per item: <span className="font-mono">Name Unit = value</span>. Invalid lines are
        skipped and listed back to you.
      </p>

      <div className="mt-3 inline-flex rounded-xl bg-slate-100 p-1">
        {(['price', 'stock'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              setResult(null);
            }}
            aria-pressed={mode === option}
            className={clsx(
              'rounded-lg px-4 py-1.5 text-sm font-semibold transition',
              mode === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
            )}
          >
            {option === 'price' ? 'Prices' : 'Stock'}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <Textarea
          label={mode === 'price' ? 'Price list' : 'Stock list'}
          hint={mode === 'stock' ? 'in / out / true / false' : 'whole rupees'}
          rows={7}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={PLACEHOLDERS[mode]}
          className="font-mono text-sm"
        />
      </div>

      {mode === 'price' && (
        <p className="mt-2 text-xs text-slate-500">
          Items that do not exist yet will be created. Stock mode only updates existing items.
        </p>
      )}

      <Button type="submit" className="mt-3" loading={submitting} disabled={!text.trim()}>
        Apply bulk update
      </Button>

      {result && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-800">
            ✅ {result.updated} updated · ➕ {result.created} created · ⚠️ {result.failed} failed
          </p>
          {result.failedRows.length > 0 && (
            <>
              <p className="mt-2 font-medium text-slate-700">Lines that were skipped:</p>
              <ul className="mt-1 space-y-0.5 font-mono text-xs text-red-600">
                {result.failedRows.map((row, index) => (
                  <li key={`${row}-${index}`}>{row}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </form>
  );
}
