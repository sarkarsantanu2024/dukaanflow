'use client';

/**
 * "Get a sound on this phone."
 *
 * WHERE IT ASKS, AND WHY THERE. On the orders screen, under the first real
 * order. Not on sign-in, not on the till, not on a settings page nobody opens.
 *
 * The browser's permission prompt is ONE-SHOT: a shopkeeper who taps Block can
 * never be asked again from code, and getting it back means finding site
 * settings in Chrome, which nobody does. So the ask has to land at the moment
 * the answer is obviously yes — which is the moment they are looking at an
 * order that arrived while they were not looking. Asking on arrival, before
 * they have seen the app do anything, buys a refusal that lasts forever.
 *
 * WHAT IT PROMISES, AND WHAT IT MUST NOT. It says "a sound on this phone too".
 * It does not say "you will be told when an order comes in", because on the
 * Xiaomis, Oppos, Vivos and Realmes this market runs on, background processes
 * are killed hard and a push can simply never arrive. Nothing in code fixes
 * that. The first missed order after a promise costs the shopkeeper's trust in
 * the whole product, so the promise is never made — and the line under the
 * button says so out loud.
 */

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { BellIcon } from '@/components/ui/Icon';
import { currentSubscription, disablePush, enablePush, pushSupported } from '@/lib/push-client';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export function PushToggle({ slug, locale }: { slug: string; locale: Locale }) {
  const t = ownerDict(locale);
  const { push: toast } = useToast();
  const endpoint = `/api/owner/${slug}/push`;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

  /** null while we are still asking the browser what it already knows. */
  const [on, setOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    currentSubscription().then((subscription) => {
      if (live) setOn(Boolean(subscription));
    });
    return () => {
      live = false;
    };
  }, []);

  // Nothing to offer: no push in this browser, or no keys on this deployment.
  // Silence rather than a disabled button explaining an absence — a shopkeeper
  // has no use for either fact.
  if (!publicKey || !pushSupported() || on === null) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (on) {
        await disablePush(endpoint);
        setOn(false);
        toast(t.pushDisabled, 'success');
        return;
      }

      const outcome = await enablePush({
        endpoint,
        // The worker controls this owner's own app and nothing else. An owner
        // signed into two shops on one phone gets one registration per shop.
        scope: `/owner/${slug}/`,
        publicKey,
      });

      if (outcome === 'subscribed') {
        setOn(true);
        toast(t.pushEnabled, 'success');
      } else if (outcome === 'denied') {
        // The one outcome worth a long message: it cannot be undone from here
        // and the way back is in the browser, not in this app.
        toast(t.pushDenied, 'error');
      } else if (outcome === 'unsupported') {
        toast(t.pushUnsupported, 'error');
      } else if (outcome === 'failed') {
        toast(t.pushFailed, 'error');
      }
      // 'dismissed' says nothing. They closed the prompt without deciding, and
      // a toast about it would be the app pressing them.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-card">
      <span
        className={
          on
            ? 'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700'
            : 'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400'
        }
      >
        <BellIcon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{on ? t.pushEnabled : t.pushTitle}</p>
        <p className="mt-0.5 text-sm text-slate-600">{on ? t.pushNotAPromise : t.pushHint}</p>
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={
          on
            ? 'h-10 shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 disabled:opacity-50'
            : 'h-10 shrink-0 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50'
        }
      >
        {on ? t.pushOff : t.pushOn}
      </button>
    </div>
  );
}
