'use client';

/**
 * "Install", as a card on the home screen.
 *
 * It is there until the app is installed. It used to be a header icon drawn
 * only once the browser had offered an install, and owners could not find how
 * to install the app at all (2026-10-01). The header icon was then removed by
 * request; the card is the way in. A tap takes the browser's offer when it has one
 * and shows the steps for this phone when it does not — see `useInstall`.
 *
 * The worker is registered under `/owner/<slug>/`, because the browser will not
 * offer an install without one, and so the installed app opens on this shop.
 */

import { InstallIcon } from '@/components/ui/Icon';
import { InstallHelpModal, useInstall } from '@/components/ui/InstallHelp';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export function OwnerInstallCard({ slug, locale }: { slug: string; locale: Locale }) {
  const { installed, install, helpOpen, closeHelp } = useInstall(`/owner/${slug}/`);
  const t = ownerDict(locale);

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => void install()}
        className="flex w-full items-center gap-3 rounded-2xl border border-glass-edge bg-glass p-3 text-left shadow-raised transition hover:shadow-float active:scale-[0.99]"
      >
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 ring-1 ring-brand-200">
          <InstallIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-snug text-slate-900">{t.installCardTitle}</span>
          <span className="block text-xs leading-snug text-slate-600">{t.installCardHint}</span>
        </span>
        <span className="shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm">
          {t.installNow}
        </span>
      </button>
      <InstallHelpModal open={helpOpen} onClose={closeHelp} locale={locale} />
    </>
  );
}
