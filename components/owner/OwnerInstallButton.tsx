'use client';

/**
 * "Install" as a header icon.
 *
 * The full card explains why installing is worth it and belongs on the first
 * run. This is for afterwards: an owner who tapped "Later", or who is on their
 * second phone, still needs a way in, and a card that reappears every visit is
 * nagging. It shows only when the browser has actually offered an install, so
 * it is absent once the app is installed.
 */

import { useEffect, useState } from 'react';
import { InstallIcon } from '@/components/ui/Icon';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function OwnerInstallButton({ slug, label }: { slug: string; label: string }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    // Registering the worker lives here because the browser will not offer an
    // install without one — and this button is now the only thing asking. It
    // used to sit in the install card; deleting that card without moving this
    // would have quietly removed the install option altogether.
    // Scoped to this shop, so an owner's installed app opens on their own till.
    navigator.serviceWorker?.register('/admin-sw.js', { scope: `/owner/${slug}/` }).catch(() => {
      // Without it they can still use the site; they just lose the prompt.
    });

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => setPrompt(null));

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [slug]);

  if (!prompt) return null;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        await prompt.prompt();
        await prompt.userChoice;
        // Single-use, whatever the owner chose.
        setPrompt(null);
      }}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
    >
      <InstallIcon className="h-5 w-5" />
    </button>
  );
}
