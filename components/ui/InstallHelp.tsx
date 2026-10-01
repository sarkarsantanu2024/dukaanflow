'use client';

/**
 * Installing the app, for owners and customers alike.
 *
 * WHY THIS IS NOT ONLY THE BROWSER'S PROMPT ANY MORE (2026-10-01). The install
 * button used to appear only once Chrome had offered an install. Owners and
 * customers then could not find where to download the app: an iPhone never
 * offers it, a page opened from a WhatsApp link is inside WhatsApp's browser
 * and cannot install at all, and Chrome holds the offer back until the site
 * has been visited enough. So the button is now always there until the app is
 * installed. Where the browser has an offer waiting, a tap takes it. Where it
 * does not, a tap opens the steps for that phone.
 */

import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  clearInstallPrompt,
  getInstallPrompt,
  installPlatform,
  isStandalone,
  subscribeInstallPrompt,
  watchInstallPrompt,
} from '@/lib/install-prompt';
import { dict, type Locale } from '@/lib/i18n';

export function useInstall(scope?: string) {
  // True until mounted, so the server render and the first paint agree and an
  // installed app never flashes the button.
  const [installed, setInstalled] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    watchInstallPrompt(scope);
    const sync = () => setInstalled(isStandalone());
    sync();
    return subscribeInstallPrompt(sync);
  }, [scope]);

  async function install() {
    const prompt = getInstallPrompt();
    if (!prompt) {
      setHelpOpen(true);
      return;
    }
    await prompt.prompt();
    await prompt.userChoice;
    // Single-use, whatever the answer was.
    clearInstallPrompt();
  }

  return { installed, install, helpOpen, closeHelp: () => setHelpOpen(false) };
}

/** The steps for this phone, for when the browser has no offer to make. */
export function InstallHelpModal({ open, onClose, locale }: { open: boolean; onClose: () => void; locale: Locale }) {
  const t = dict(locale);
  const platform = installPlatform();
  const steps =
    platform === 'inApp' ? t.installHowInApp : platform === 'ios' ? t.installHowIos : t.installHowAndroid;

  return (
    <Modal
      open={open}
      title={t.installHowTitle}
      onClose={onClose}
      closeOnBack
      footer={
        <Button onClick={onClose} data-autofocus>
          {t.installHowOk}
        </Button>
      }
    >
      <p className="text-base leading-relaxed text-slate-700">{steps}</p>
    </Modal>
  );
}
