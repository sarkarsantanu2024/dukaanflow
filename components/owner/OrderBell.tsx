'use client';

/**
 * The bell in the owner's header: how many orders are waiting, on every screen.
 *
 * The count used to exist only on the Orders page, which is the one place an
 * owner is not looking when an order arrives — they are on Sell with a customer
 * in front of them, or on Items pricing something. WhatsApp used to carry that
 * news; it no longer does, so this has to.
 *
 * It polls rather than holding a socket open. A shop's phone is on mobile data
 * and the answer is one small number, so a poll every twenty seconds costs
 * almost nothing and cannot fail in the ways a dropped connection does. It
 * stops entirely while the tab is hidden, because a backgrounded phone in a
 * pocket has nobody to tell.
 *
 * The chime is the same deliberate opt-in as before: browsers refuse sound
 * nobody asked for, so the first tap arms it and is remembered per device.
 */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { BellIcon } from '@/components/ui/Icon';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

const SOUND_KEY = 'dukaanflow:order-chime';
const POLL_MS = 20_000;

export function OrderBell({ slug, locale }: { slug: string; locale: Locale }) {
  const t = ownerDict(locale);
  const [waiting, setWaiting] = useState<number | null>(null);
  const [sound, setSound] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  // `null` until the first answer: the orders already waiting when the app
  // opened are not new arrivals, and ringing for them would cry wolf on every
  // reload.
  const seenRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      setSound(window.localStorage.getItem(SOUND_KEY) === '1');
    } catch {
      /* Private browsing can throw on read. Silence is the safe default. */
    }
  }, []);

  const chime = useCallback(() => {
    const context = audioRef.current;
    if (!context) return;
    const now = context.currentTime;
    // Two notes a fifth apart — a doorbell, not an alarm. A single tone reads
    // as an error on most phones.
    for (const [index, frequency] of [880, 1320].entries()) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const start = now + index * 0.18;
      // Ramped, never switched: a square-edged start clicks on cheap speakers.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    }
  }, []);

  const check = useCallback(async () => {
    try {
      const response = await fetch(`/api/owner/${slug}/waiting`, { cache: 'no-store' });
      if (!response.ok) return;
      const payload = (await response.json()) as { waiting?: number };
      if (typeof payload.waiting !== 'number') return;

      const previous = seenRef.current;
      seenRef.current = payload.waiting;
      setWaiting(payload.waiting);
      if (previous !== null && payload.waiting > previous && sound) chime();
    } catch {
      /* A shop with no signal simply keeps the last number it had. */
    }
  }, [slug, sound, chime]);

  useEffect(() => {
    check();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') check();
    }, POLL_MS);
    // Coming back to the app should be instant, not up to twenty seconds late.
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check]);

  async function toggleSound(event: React.MouseEvent) {
    // The bell is a link to the orders; the speaker inside it is not.
    event.preventDefault();
    event.stopPropagation();

    if (sound) {
      setSound(false);
      try {
        window.localStorage.setItem(SOUND_KEY, '0');
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      type WithLegacy = typeof window & { webkitAudioContext?: typeof AudioContext };
      const Ctor = window.AudioContext ?? (window as WithLegacy).webkitAudioContext;
      if (!Ctor) return;
      // This click is the gesture the browser wants; resuming inside it is what
      // buys the right to make a sound later.
      audioRef.current ??= new Ctor();
      await audioRef.current.resume();
      setSound(true);
      window.localStorage.setItem(SOUND_KEY, '1');
      chime();
    } catch {
      /* An unavailable AudioContext simply means no sound. */
    }
  }

  const count = waiting ?? 0;

  return (
    <span className="flex items-center">
      <Link
        href={`/owner/${slug}/orders`}
        aria-label={`${t.tabOrders} — ${count}`}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
      >
        <BellIcon className="h-[22px] w-[22px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold leading-[18px] text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>

      <button
        type="button"
        role="switch"
        aria-checked={sound}
        aria-label={sound ? t.soundOn : t.soundOff}
        title={sound ? t.soundOn : t.soundOff}
        onClick={toggleSound}
        className={clsx(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg text-base transition',
          sound ? 'text-brand-700' : 'text-slate-400 hover:text-slate-600',
        )}
      >
        <span aria-hidden="true">{sound ? '🔔' : '🔕'}</span>
      </button>
    </span>
  );
}
