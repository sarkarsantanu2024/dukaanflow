'use client';

/**
 * PHONE ALERTS ARE ON BY DEFAULT, for owners and customers alike, and turned off
 * from the phone's own site settings. There is no in-app switch any more.
 *
 * A web page cannot switch notifications on by itself: the browser asks the
 * person once, and some browsers (Safari, and Chrome's quiet mode) only let
 * that prompt show after a tap. So:
 *
 * - Already allowed: subscribe at once, silently. This also re-registers a phone
 *   whose subscription was lost, and ties a customer's new order to it.
 * - Not asked yet: the first tap anywhere brings up the browser's prompt. There
 *   is no button to find.
 * - Refused before: nothing. Asking again from code is impossible anyway, and
 *   the choice was theirs.
 *
 * The subscription is stored exactly where it always was (the push routes); no
 * notification text is ever stored.
 */

import { useEffect } from 'react';
import { enablePush, pushSupported } from '@/lib/push-client';

export function useAutoPush(options: { endpoint: string; scope: string; active?: boolean }) {
  const { endpoint, scope, active = true } = options;

  useEffect(() => {
    if (!active) return;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
    if (!publicKey || !pushSupported()) return;

    const subscribe = () => void enablePush({ endpoint, scope, publicKey }).catch(() => undefined);

    if (Notification.permission === 'granted') {
      subscribe();
      return;
    }
    if (Notification.permission !== 'default') return;

    // One tap, once: the browser's prompt needs a tap behind it.
    const onFirstTap = () => {
      document.removeEventListener('pointerdown', onFirstTap, true);
      subscribe();
    };
    document.addEventListener('pointerdown', onFirstTap, true);
    return () => document.removeEventListener('pointerdown', onFirstTap, true);
  }, [endpoint, scope, active]);
}
