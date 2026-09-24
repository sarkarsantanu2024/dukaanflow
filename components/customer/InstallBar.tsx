'use client';

/**
 * "Keep this shop on your phone", as a thin black bar pinned to the top of the
 * shop page, with a download icon and a ✕.
 *
 * It used to be a card inside the order-placed popup, where it competed with
 * the one thing that popup is for (your order went through) and was gone the
 * moment the popup closed. A bar at the top is there whenever the phone can
 * install the shop, is one tap to act on, and one tap to dismiss for good on
 * this phone.
 *
 * Shown only when the browser has actually offered an install (see
 * `lib/install-prompt.ts`), which is also never once the shop is installed, so
 * it cannot nag somebody who said yes.
 */

import { useEffect, useRef, useState } from 'react';
import {
  clearInstallPrompt,
  getInstallPrompt,
  isStandalone,
  subscribeInstallPrompt,
} from '@/lib/install-prompt';
import { CloseIcon, InstallIcon } from '@/components/ui/Icon';
import { useStickyTop } from '@/components/ui/useStickyTop';
import { dict, type Locale } from '@/lib/i18n';

const DISMISSED_KEY = 'halkhata:install-bar:dismissed';

export function InstallBar({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISSED_KEY) === '1');
    } catch {
      setDismissed(false);
    }
    const sync = () => setAvailable(Boolean(getInstallPrompt()) && !isStandalone());
    sync();
    return subscribeInstallPrompt(sync);
  }, []);

  if (!available || dismissed) return null;

  return <Bar label={t.saveShopTitle} action={t.saveShopNow} close={t.saveShopLater} onDismiss={() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Storage refused: hidden for this visit only.
    }
  }} />;
}

/** Split out so the sticky-offset hook only runs while the bar is on screen. */
function Bar({
  label,
  action,
  close,
  onDismiss,
}: {
  label: string;
  action: string;
  close: string;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The search strip below sticks under this bar rather than behind it.
  useStickyTop(ref);

  return (
    <div ref={ref} className="sticky top-0 z-40 bg-black text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
        <button
          type="button"
          onClick={async () => {
            const prompt = getInstallPrompt();
            if (!prompt) return;
            await prompt.prompt();
            await prompt.userChoice;
            clearInstallPrompt();
          }}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <InstallIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</span>
          <span className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900">
            {action}
          </span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={close}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
