'use client';

/**
 * The shop owner's whole sign-in: six digits, on a phone, at the counter.
 * No email, no password to forget — a lost PIN is reissued by the Super Admin.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function OwnerLoginForm({ slug, shopName }: { slug: string; shopName: string }) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await fetch(`/api/owner/${slug}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? 'Incorrect PIN');
        setPin('');
        return;
      }

      router.replace(`/owner/${slug}`);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-700">DukaanFlow</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">{shopName}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the 6-digit PIN from your DukaanFlow contact to manage your prices.
      </p>

      <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="owner-pin">
        PIN
      </label>
      <input
        id="owner-pin"
        // A numeric keypad, digits only, and no autofill history on a shared
        // counter phone.
        inputMode="numeric"
        autoComplete="off"
        type="password"
        maxLength={6}
        required
        value={pin}
        onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
        aria-invalid={error ? true : undefined}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-center text-2xl tracking-[0.5em] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <Button type="submit" fullWidth size="lg" className="mt-4" loading={busy}>
        Sign in
      </Button>
    </form>
  );
}
