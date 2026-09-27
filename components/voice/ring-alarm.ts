'use client';

/**
 * RING, SAY IT, REPEAT — UNTIL SOMEBODY LOOKS.
 *
 * The engine behind both alarms: the owner's "a new order has come in"
 * (`components/owner/order-alarm.ts`) and the customer's "the shop changed /
 * finished / could not take your order" (`components/customer/customer-alarm.ts`).
 *
 * Each pending thing rings — the ring (`cueOrder`), then a sentence — up to
 * `rings` times, `gapMs` apart. Something new arriving mid-way joins what is
 * pending and the count starts again, so there is only ever one voice. The
 * rings stop after the last one; what is pending stays (for the big bar) until
 * it is acknowledged.
 *
 * Kept at module level by its callers, not in a component: pages mount their
 * own headers, so a component's timer would die with the page somebody walked
 * away from, taking the remaining rings and the bar with it.
 */

import { speak } from '@/components/voice/useVoice';
import { ORDER_RING_MS, cueOrder } from '@/components/voice/cue';
import type { VoiceLang } from '@/lib/speech';

export type Spoken = { text: string; lang: VoiceLang };

export function createRingAlarm<T>(options: {
  rings: number;
  gapMs: number;
  /** Read at every ring, so switching sound off takes effect mid-way. */
  audible: () => boolean;
  /** What is said for everything pending, or null to ring without words. */
  say: (items: T[]) => Spoken | null;
}) {
  /** Pending, oldest first. */
  let items = new Map<string, T>();
  let left = 0;
  /** Replaced, never mutated, so React sees each change. Null when nothing is pending. */
  let snapshot: T[] | null = null;
  const listeners = new Set<() => void>();
  let ringTimer: ReturnType<typeof setTimeout> | null = null;
  let voiceTimer: ReturnType<typeof setTimeout> | null = null;

  function publish() {
    snapshot = items.size > 0 ? [...items.values()] : null;
    for (const listener of listeners) listener();
  }

  function clearTimers() {
    if (ringTimer) clearTimeout(ringTimer);
    if (voiceTimer) clearTimeout(voiceTimer);
    ringTimer = voiceTimer = null;
  }

  /** The ring, then the words once it has finished. */
  function sound(list: T[]) {
    cueOrder();
    const spoken = options.say(list);
    if (spoken) voiceTimer = setTimeout(() => speak(spoken.text, spoken.lang), ORDER_RING_MS);
  }

  function ring() {
    clearTimers();
    if (left <= 0 || items.size === 0) return;
    left -= 1;
    if (options.audible()) sound([...items.values()]);
    if (left > 0) ringTimer = setTimeout(ring, options.gapMs);
  }

  return {
    /** New things: ring now and again, and keep them pending until acknowledged. */
    raise(fresh: [string, T][]) {
      if (fresh.length === 0) return;
      for (const [key, item] of fresh) {
        items.delete(key); // re-inserted last, so "newest" stays the last one
        items.set(key, item);
      }
      left = options.rings;
      ring();
      publish();
    },
    /** New things somebody is already looking at: one ring, nothing pending. */
    ringOnce(list: T[]) {
      if (list.length === 0 || !options.audible()) return;
      clearTimers();
      sound(list);
    },
    /** Seen: no more rings, nothing pending. What is being said now finishes. */
    silence() {
      if (items.size === 0 && !ringTimer) return;
      clearTimers();
      items = new Map();
      left = 0;
      publish();
    },
    /** Keeps only what `keep` says is still news; silent once nothing is left. */
    keepOnly(keep: (key: string, item: T) => boolean) {
      let dropped = false;
      for (const [key, item] of [...items]) {
        if (!keep(key, item)) {
          items.delete(key);
          dropped = true;
        }
      }
      if (!dropped) return;
      if (items.size === 0) clearTimers();
      publish();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    pending(): T[] | null {
      return snapshot;
    },
  };
}
