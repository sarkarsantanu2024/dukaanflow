'use client';

/**
 * Rings when a new order lands, and refreshes the queue so it is there to see.
 *
 * A shopkeeper is not watching a screen — they are serving somebody, or facing
 * the shelves. WhatsApp already buzzes, but the phone is often on the counter
 * across the shop, and the owner's own app going quiet while orders pile up is
 * the failure this exists to prevent.
 *
 * THE SOUND IS SYNTHESISED, not a file. Two short notes from an oscillator cost
 * no download, cannot 404, and stay audible on the tinny speaker of a ₹6,000
 * Android in a room with a ceiling fan — which an atmospheric notification .mp3
 * would not.
 *
 * BROWSERS REFUSE TO PLAY AUDIO A PERSON DID NOT ASK FOR. Every mobile browser
 * blocks sound until the page has been tapped, so this cannot simply start:
 * the owner turns it on with a tap, and that tap is what unlocks the audio.
 * The choice is remembered per device, and re-armed on the next tap after a
 * reload, because the permission does not survive one.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

const STORAGE_KEY = 'dukaanflow:order-chime';
/** How often to look for new orders. Gentle on a shop's mobile data. */
const POLL_MS = 20_000;

export function NewOrderChime({
  slug,
  newCount,
  locale,
}: {
  slug: string;
  /** How many orders are currently sitting unanswered. */
  newCount: number;
  locale: Locale;
}) {
  const t = ownerDict(locale);
  const router = useRouter();
  const [on, setOn] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  // What the count was last time we looked. `null` means "first render" — the
  // orders already on screen when the app opened are not new arrivals, and
  // chiming for them would cry wolf on every reload.
  const seenRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      setOn(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      // Private browsing can throw on read. Silence is the safe default.
    }
  }, []);

  const chime = useCallback(() => {
    const context = audioRef.current;
    if (!context) return;

    // Two notes a fifth apart — a doorbell, not an alarm. A single tone reads
    // as an error on most phones.
    const now = context.currentTime;
    for (const [index, frequency] of [880, 1320].entries()) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      const start = now + index * 0.18;
      // Ramped, never switched: a square-edged start and stop produces an
      // audible click on cheap speakers.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    }
  }, []);

  async function toggle() {
    if (on) {
      setOn(false);
      try {
        window.localStorage.setItem(STORAGE_KEY, '0');
      } catch {
        /* ignore */
      }
      return;
    }

    // This click is the gesture the browser wants. Creating and resuming the
    // context inside it is what buys the right to make noise later.
    try {
      type WithLegacy = typeof window & { webkitAudioContext?: typeof AudioContext };
      const Ctor = window.AudioContext ?? (window as WithLegacy).webkitAudioContext;
      if (!Ctor) return;

      audioRef.current ??= new Ctor();
      await audioRef.current.resume();
      setOn(true);
      window.localStorage.setItem(STORAGE_KEY, '1');
      // Ring once now, so the owner knows what they have just turned on and
      // that this phone can actually make the sound.
      chime();
    } catch {
      /* An unavailable AudioContext simply means no sound. */
    }
  }

  // Look for new orders on a timer. `router.refresh()` re-runs the server
  // component and hands down a new `newCount` — the count is the signal, so
  // there is no second source of truth about what has arrived.
  useEffect(() => {
    if (!on) return;
    const timer = window.setInterval(() => router.refresh(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [on, router]);

  useEffect(() => {
    const previous = seenRef.current;
    seenRef.current = newCount;
    if (!on || previous === null) return;
    if (newCount > previous) chime();
  }, [newCount, on, chime]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition',
        on ? 'bg-brand-50 text-brand-800' : 'bg-white text-slate-500 ring-1 ring-slate-200',
      )}
    >
      <span aria-hidden="true">{on ? '🔔' : '🔕'}</span>
      {on ? t.soundOn : t.soundOff}
    </button>
  );
}
