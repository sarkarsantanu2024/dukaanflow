'use client';

/**
 * The Super Admin changing their own sign-in.
 *
 * There is exactly one of these accounts and it can see every shop, every
 * order and every ledger in the product, so until now rotating its password
 * meant hashing a string on a laptop, editing a Vercel environment variable and
 * redeploying. That is a fine procedure for a secret nobody ever changes and a
 * useless one for the moment you actually need it — somebody left, a laptop
 * went missing, the password got read out over a phone call. A screen behind
 * the sign-in that already protects everything else is the right home for it.
 *
 * The current password is asked for even though the person is already signed
 * in. See `adminAccountSchema`.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

type Errors = Record<string, string>;

export function AccountForm() {
  const { push } = useToast();
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Prefilled rather than asked for: somebody changing their password should
  // not have to retype a username they are not changing, and a typo there would
  // lock them out of the one account that can undo it.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/account')
      .then((response) => (response.ok ? response.json() : { username: '' }))
      .then((payload: { username?: string }) => {
        if (!cancelled) setUsername(payload.username ?? '');
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const response = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword, confirmPassword }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        errors?: Errors;
      };

      if (!response.ok) {
        setErrors(payload.errors ?? {});
        push(Object.values(payload.errors ?? {})[0] ?? payload.error ?? 'Could not save', 'error');
        return;
      }

      // The passwords go, the username stays — it is what the account is now
      // called, and leaving it on screen is the confirmation that it changed.
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      push('Sign-in updated. Use it next time you sign in.', 'success');
    } catch {
      push('Network error', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-card">
      <Input
        label="Username"
        required
        autoComplete="username"
        value={username}
        disabled={loading}
        onChange={(event) => setUsername(event.target.value)}
        error={errors.username}
      />

      <Input
        label="Current password"
        required
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        error={errors.currentPassword}
      />

      <Input
        label="New password"
        hint="12 characters or more"
        required
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        error={errors.newPassword}
      />

      <Input
        label="New password again"
        required
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        error={errors.confirmPassword}
      />

      <Button type="submit" loading={saving} disabled={loading}>
        Save sign-in
      </Button>
    </form>
  );
}
