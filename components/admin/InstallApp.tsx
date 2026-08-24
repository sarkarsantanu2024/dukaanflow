'use client';

/**
 * "Install app" for the shopkeeper.
 *
 * Registers the admin service worker and surfaces Chrome's install prompt when
 * the browser offers one. Installing is worth a button rather than leaving it
 * buried in the browser menu: the standalone window remembers the microphone
 * permission, so voice entry stops re-asking on every visit.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari predates the display-mode media query.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    navigator.serviceWorker?.register('/admin-sw.js', { scope: '/admin/' }).catch(() => {
      // An unregistered worker only costs the install prompt, not the app.
    });

    const onPrompt = (event: Event) => {
      event.preventDefault(); // Keep it until the shopkeeper taps our button.
      setPrompt(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => setPrompt(null));

    // iOS never fires beforeinstallprompt; installing there is a manual step
    // through the Share sheet, so all we can do is say so.
    const ua = window.navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) {
      setIosHint(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (prompt) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          await prompt.prompt();
          await prompt.userChoice;
          // The event is single-use whatever the shopkeeper chose.
          setPrompt(null);
        }}
      >
        Install app
      </Button>
    );
  }

  if (iosHint) {
    return (
      <span className="text-xs text-slate-500">
        Share → Add to Home Screen
      </span>
    );
  }

  return null;
}
