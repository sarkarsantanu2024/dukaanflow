'use client';

/**
 * THE ORDERS SCREEN KEEPS THE PHONE AWAKE WHILE THE SHOP IS OPEN.
 *
 * A phone that locks itself stops the page: no more asking for orders, no
 * ring, no voice. Push still arrives, but only on phones and browsers where it
 * works at all. So while the Orders screen is open, the shutter is up and it is
 * within the shop's hours (or the shop has not given any), the page holds a
 * screen wake lock and the phone stays on beside the scales, listening.
 *
 * Only on Orders, and only then: the other screens are used and put down, and a
 * screen held on all night is a flat battery by morning. The power button
 * still turns the screen off; the lock is released the moment the page is
 * hidden, and taken again when it comes back. Browsers without the Wake Lock
 * API simply sleep as before.
 */

import { useEffect, useState } from 'react';
import { withinHours } from '@/lib/hours';

export function KeepScreenAwake({
  openTime,
  closeTime,
  ownerClosed,
}: {
  openTime: string;
  closeTime: string;
  ownerClosed: boolean;
}) {
  const [inHours, setInHours] = useState(false);

  // Checked every minute, so closing time lets the phone sleep on its own.
  useEffect(() => {
    const check = () => setInHours(withinHours(openTime, closeTime, new Date()));
    check();
    const timer = setInterval(check, 60_000);
    return () => clearInterval(timer);
  }, [openTime, closeTime]);

  const wanted = inHours && !ownerClosed;

  useEffect(() => {
    if (!wanted || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let alive = true;

    // The browser drops the lock whenever the page is hidden; take it again
    // each time the owner comes back.
    const acquire = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (alive) lock = next;
        else void next.release();
      } catch {
        // Refused (battery saver, or no permission): the phone sleeps as before.
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', acquire);
      lock?.release().catch(() => {});
    };
  }, [wanted]);

  return null;
}
