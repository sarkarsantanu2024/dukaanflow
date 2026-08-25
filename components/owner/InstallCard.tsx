'use client';

/**
 * The install step, given the room it deserves.
 *
 * The owner is told on WhatsApp to "install the app", so this has to look like
 * installing an app — not a small button tucked into a header. It appears only
 * while there is something to do: once the shop is running in its own window,
 * or the browser has nothing to offer, it disappears for good.
 *
 * The real payoff is the microphone. An installed app keeps that permission
 * between visits; a browser tab asks again, and an owner who has to grant it
 * every morning stops using voice by the third day.
 */

import { useEffect, useState } from 'react';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'dukaanflow:install-dismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari predates the display-mode media query.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function InstallCard({ slug, locale }: { slug: string; locale: Locale }) {
  const t = ownerDict(locale);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;

    // Chrome wants a registered worker before it will offer a real install.
    // Scoped to this shop, so an owner's installed app opens on their own till.
    navigator.serviceWorker?.register('/admin-sw.js', { scope: `/owner/${slug}/` }).catch(() => {
      // Without it they can still use the site; they just lose the prompt.
    });

    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }

    const onPrompt = (event: Event) => {
      event.preventDefault(); // Held until the owner taps our button.
      setPrompt(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    const ua = window.navigator.userAgent;
    // iOS never fires beforeinstallprompt — installing there is a manual trip
    // through the Share sheet, so all we can do is say which taps to make.
    if (/iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) {
      setIosHint(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [slug]);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // A private window forgets by itself; nothing to do.
    }
  }

  if (dismissed || (!prompt && !iosHint)) return null;

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white"
        >
          DF
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-900">{t.installTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.installBody}</p>

          {prompt ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  await prompt.prompt();
                  const choice = await prompt.userChoice;
                  // The event is single-use whichever way they answered.
                  setPrompt(null);
                  if (choice.outcome === 'accepted') dismiss();
                }}
                className="h-11 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700"
              >
                {t.installNow}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="h-11 rounded-xl px-4 font-medium text-slate-500 hover:bg-slate-100"
              >
                {t.installLater}
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-slate-800">{t.installIos}</p>
              <button
                type="button"
                onClick={dismiss}
                className="text-sm text-slate-500 underline"
              >
                {t.installLater}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
