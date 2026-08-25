'use client';

/**
 * The single highest-value warning in the owner app.
 *
 * The invite arrives on WhatsApp, so the owner opens the link inside WhatsApp's
 * own browser — which refuses the microphone outright. Without this, the very
 * first thing we ask a shopkeeper to do silently does nothing, and they
 * conclude the app is broken. Naming the problem and giving them the link to
 * paste is the difference between an onboarding that works and one that dies
 * on step one.
 */

import { useEffect, useState } from 'react';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

/** Facebook, Instagram and WhatsApp all ship the same restricted webview. */
function isInAppBrowser(ua: string): boolean {
  return /\bFBAN|\bFBAV|\bFB_IAB|Instagram|WhatsApp|Line\/|MicroMessenger/i.test(ua);
}

export function OpenInChromeNotice({ locale }: { locale: Locale }) {
  const t = ownerDict(locale);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isInAppBrowser(window.navigator.userAgent)) return;
    // If speech somehow works here, there is nothing to warn about.
    const hasSpeech =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setShow(!hasSpeech || !window.isSecureContext || !navigator.mediaDevices);
  }, []);

  if (!show) return null;

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <p className="font-semibold text-amber-900">{t.openInChrome}</p>
      <p className="mt-1 text-sm text-amber-800">{t.openInChromeBody}</p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
          } catch {
            // Clipboard is blocked in some webviews too; the URL bar still works.
            setCopied(false);
          }
        }}
        className="mt-3 inline-flex h-10 items-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white"
      >
        {copied ? t.linkCopied : t.copyLink}
      </button>
    </div>
  );
}
