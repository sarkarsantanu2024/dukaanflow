'use client';

/**
 * "Keep this shop on your phone", as a download icon in the shop's header,
 * just before the bell.
 *
 * It was a black bar pinned across the top of the shop page; by request
 * (2026-10-01) it is now one icon in the bar every customer page already has.
 * It is there until the shop is installed. A tap takes the browser's offer
 * when there is one and shows the steps for the phone when there is not —
 * customers could not find how to install, because iPhones and WhatsApp's
 * own browser never make the offer. See `useInstall`.
 */

import { InstallIcon } from '@/components/ui/Icon';
import { InstallHelpModal, useInstall } from '@/components/ui/InstallHelp';
import { dict, type Locale } from '@/lib/i18n';

export function InstallButton({ locale }: { locale: Locale }) {
  const { installed, install, helpOpen, closeHelp } = useInstall();
  const label = dict(locale).installApp;

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => void install()}
        aria-label={label}
        title={label}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/10 hover:text-white"
      >
        <InstallIcon className="h-5 w-5" />
      </button>
      <InstallHelpModal open={helpOpen} onClose={closeHelp} locale={locale} />
    </>
  );
}
