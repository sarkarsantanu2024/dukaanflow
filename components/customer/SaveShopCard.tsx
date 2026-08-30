'use client';

/**
 * "Keep this shop on your phone."
 *
 * THE QUESTION THIS ANSWERS: a customer scans the counter's QR once — how do
 * they order again next week, from home, without the sticker in front of them?
 *
 * Installing the shop page is the strongest answer available without an
 * account. Android's own install puts a real icon on the home screen with the
 * shop's name under it; from then on the shop is one tap from anywhere and the
 * QR has done its job forever. The manifest behind it
 * (`/shop.webmanifest?slug=…`) carries the shop's own name and start URL, so
 * two shops on one phone are two icons rather than one confused app.
 *
 * WHEN IT ASKS. After an order, never before. A shopper who has just scanned a
 * code and is looking at prices has no reason to install anything, and a card
 * asking them to stands between them and what they came for. Once they have
 * bought something, "keep this shop" is a sentence that means something.
 *
 * The event it needs is caught much earlier, by `lib/install-prompt.ts`, for
 * the reason explained there: `beforeinstallprompt` fires once, seconds after
 * the page loads, and a listener inside this card would always miss it.
 *
 * It renders nothing when the browser has made no offer — which is also what
 * happens once the shop is installed, so it never nags anybody who said yes.
 */

import { useEffect, useState } from 'react';
import {
  clearInstallPrompt,
  getInstallPrompt,
  isStandalone,
  subscribeInstallPrompt,
} from '@/lib/install-prompt';
import { dict, type Locale } from '@/lib/i18n';

export function SaveShopCard({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const sync = () => setAvailable(Boolean(getInstallPrompt()) && !isStandalone());
    sync();
    return subscribeInstallPrompt(sync);
  }, []);

  if (!available || dismissed) return null;

  return (
    <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-3 text-left">
      <p className="font-semibold text-brand-900">{t.saveShopTitle}</p>
      <p className="mt-0.5 text-sm text-brand-800">{t.saveShopBody}</p>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={async () => {
            const prompt = getInstallPrompt();
            if (!prompt) return;
            await prompt.prompt();
            await prompt.userChoice;
            clearInstallPrompt();
          }}
          className="h-10 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white"
        >
          {t.saveShopNow}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="h-10 rounded-lg px-3 text-sm font-semibold text-brand-800"
        >
          {t.saveShopLater}
        </button>
      </div>
    </div>
  );
}
