'use client';

/**
 * Issues and revokes one shop's owner PIN.
 *
 * The PIN is shown exactly once, right after it is generated — only its bcrypt
 * hash is stored, so there is no way to display it again later. That is the
 * same trade every API key dashboard makes, and for the same reason.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/useConfirm';
import { BRAND_NAME } from '@/lib/brand';

export function OwnerAccessPanel({
  slug,
  baseUrl,
  hasPin,
  setAt,
}: {
  slug: string;
  baseUrl: string;
  hasPin: boolean;
  setAt: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [pin, setPin] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ url: string; whatsappUrl: string; pin: string | null } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const link = `${baseUrl}/owner/${slug}`;

  async function issue() {
    if (
      hasPin &&
      !(await confirm({
        title: 'Issue a new PIN?',
        message:
          'The old PIN stops working immediately, and the owner is signed out on every phone they used it on.',
        confirmLabel: 'Issue new PIN',
      }))
    ) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/pin`, { method: 'POST' });
      const payload = (await response.json().catch(() => ({}))) as { pin?: string; error?: string };

      if (!response.ok || !payload.pin) {
        push(payload.error ?? 'Could not issue a PIN', 'error');
        return;
      }

      setPin(payload.pin);
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Mints a fresh one-time link and hands back a WhatsApp message addressed to
   * the shop's own number — the whole of step 2, in one tap. There is no app
   * file to send: what the owner needs is a link that signs them in.
   */
  async function sendInvite() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/invite`, { method: 'POST' });
      const payload = (await response.json().catch(() => ({}))) as {
        url?: string;
        whatsappUrl?: string;
        pin?: string | null;
        error?: string;
      };

      if (!response.ok || !payload.url || !payload.whatsappUrl) {
        push(payload.error ?? 'Could not create the invite', 'error');
        return;
      }

      setInvite({ url: payload.url, whatsappUrl: payload.whatsappUrl, pin: payload.pin ?? null });
      if (payload.pin) setPin(payload.pin);
      window.open(payload.whatsappUrl, '_blank', 'noopener');
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (
      !(await confirm({
        title: 'Revoke owner access?',
        message: 'The owner is signed out everywhere and cannot open their app again until a new PIN is issued.',
        confirmLabel: 'Revoke access',
        danger: true,
      }))
    ) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/pin`, { method: 'DELETE' });
      if (!response.ok) {
        push('Could not revoke access', 'error');
        return;
      }
      setPin(null);
      push('Owner access revoked', 'success');
      router.refresh();
    } catch {
      push('Network error. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      push(`${what} copied`, 'success');
    } catch {
      push('Could not copy — select and copy by hand', 'error');
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="font-semibold text-slate-900">Owner access</h2>
      <p className="mt-1 text-sm text-slate-600">
        Lets this shop&apos;s owner update their own prices, stock and voice listings from their
        phone. They can never see another shop, change the WhatsApp number, or delete anything but
        their own items.
      </p>

      <p className="mt-3 text-sm">
        {hasPin ? (
          <span className="font-medium text-green-700">
            PIN active{setAt ? ` · issued ${setAt}` : ''}
          </span>
        ) : (
          <span className="text-slate-500">No PIN issued — the owner cannot sign in.</span>
        )}
      </p>

      {pin && (
        <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-3">
          <p className="text-sm font-semibold text-brand-900">
            New PIN — write this down now, it cannot be shown again
          </p>
          <p className="mt-1 font-mono text-3xl tracking-[0.3em] text-brand-900">{pin}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => copy(pin, 'PIN')}>
              Copy PIN
            </Button>
            <Button
              size="sm"
              variant="whatsapp"
              onClick={() =>
                copy(
                  `Your ${BRAND_NAME} shop link: ${link}\nPIN: ${pin}\nOpen the link on your phone and enter the PIN to update your prices.`,
                  'Message',
                )
              }
            >
              Copy message for WhatsApp
            </Button>
          </div>
        </div>
      )}

      {invite && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">
            Invite link created — valid once, for 7 days
          </p>
          <p className="mt-1 break-all font-mono text-xs text-slate-500">{invite.url}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={invite.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-white"
            >
              Open WhatsApp again
            </a>
            <Button size="sm" variant="secondary" onClick={() => copy(invite.url, 'Link')}>
              Copy link
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="whatsapp" onClick={sendInvite} loading={busy}>
          Send app link on WhatsApp
        </Button>
        <Button size="sm" variant="secondary" onClick={issue} disabled={busy}>
          {hasPin ? 'Issue new PIN' : 'Create owner PIN'}
        </Button>
        {hasPin && (
          <Button size="sm" variant="ghost" onClick={revoke} disabled={busy} className="text-red-600 hover:bg-red-50">
            Revoke access
          </Button>
        )}
        <button
          type="button"
          onClick={() => copy(link, 'Link')}
          className="text-sm text-slate-500 underline hover:text-slate-800"
        >
          Copy owner link
        </button>
      </div>

      <p className="mt-2 break-all text-xs text-slate-400">{link}</p>
      <p className="mt-1 text-xs text-slate-500">
        The link signs the owner in and opens their shop — no PIN to type on the first run. It works
        once, then the PIN is how they come back.
      </p>

      {confirmDialog}
    </section>
  );
}
