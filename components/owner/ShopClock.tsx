'use client';

/**
 * The day and the time, on a tab hanging off the bottom of the shop's name.
 *
 * WHERE IT IS, AND WHY IT MOVED THREE TIMES. It began as a grey line above the
 * day's float, which was the first thing on the home screen — a lot of
 * prominence for something nobody opens the app to learn. It went into the
 * header row next, where on a 375px phone it was a fifth control beside the
 * shop name, the language, the shutter and the way out, and truncated the
 * shop's own name mid-word. It sat under the float after that, correct but
 * quiet, and only on the home screen.
 *
 * It now hangs off the bottom edge of the name band, centred, as a square-
 * shouldered tab. That band is inside the sticky header, so THE BADGE STAYS ON
 * SCREEN as the owner scrolls the till or the orders queue — a wall clock that
 * scrolls away is not a wall clock.
 *
 * ENGLISH, IN SHORT FORM, WHATEVER THE OWNER'S LANGUAGE. This is the one string
 * in the owner app that is deliberately not translated. "মঙ্গলবার ২২ সেপ্টেম্বর"
 * is 19 characters of Bengali script for a badge roughly 150px wide; the short
 * English form is half that and every shopkeeper here already reads a phone
 * lock screen, a bus timetable and a bank slip in it. Numerals are the content
 * and they are Latin either way.
 *
 * THE DEVICE'S CLOCK, NOT THE SERVER'S. Everything else is reckoned on the shop
 * clock in `lib/time.ts` — a fixed offset, so a day's takings mean the same
 * thing wherever the server runs. That is right for money and wrong for a wall
 * clock: an owner glancing up wants the time their own phone says.
 *
 * RENDERS NOTHING UNTIL MOUNTED. A server cannot know what the phone in the
 * shop thinks the time is, so any first paint would be a different string from
 * the one React wants a moment later — a hydration mismatch, which on an
 * otherwise server-rendered screen is a real error and not a cosmetic one.
 *
 * Ticks on the minute, not the second: a shopkeeper is not timing anything, and
 * a seconds counter is a moving thing on a screen somebody is trying to read.
 */

import type { Locale } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import { ClockIcon } from '@/components/ui/Icon';

/** The date is written in the owner's language: "Thu Sept" sat in a Bengali header. */
const DATE_LOCALE: Record<Locale, string> = { en: 'en-IN', bn: 'bn-IN', hi: 'hi-IN' };

export function ShopClock({ locale = 'en' }: { locale?: Locale }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    // Line up with the top of the next minute, then tick once a minute, so the
    // badge changes when the phone's clock does rather than up to 59 seconds
    // after it.
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(
      () => {
        setNow(new Date());
        interval = setInterval(() => setNow(new Date()), 60_000);
      },
      (60 - new Date().getSeconds()) * 1000,
    );

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!now) return null;

  const date = now.toLocaleDateString(DATE_LOCALE[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
  // The time stays in the digits and am/pm every clock in the shop shows.
  const time = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

  return (
    // `top-full` puts its top edge flush against the band's bottom border, so
    // the badge hangs off it as one attached tab rather than floating over it.
    // That flush edge is the whole reason THE TOP CORNERS ARE SQUARE and only
    // the bottom two are rounded: a pill straddling the line read as a loose
    // sticker, while a square-shouldered tab reads as part of the bar it hangs
    // from — the shape a physical tab actually has.
    //
    // `pointer-events-none` because it is a read-out, not a control, and it
    // sits over the top of the page content.
    <div className="pointer-events-none absolute inset-x-0 top-full z-10 flex justify-center">
      <span className="inline-flex items-center gap-2 rounded-b-xl bg-brand-600 px-4 py-1.5 shadow-lg shadow-brand-900/20">
        <ClockIcon aria-hidden className="h-4 w-4 shrink-0 text-brand-200" />
        <span className="text-xs font-semibold text-brand-50">{date}</span>
        <span className="text-sm font-semibold tabular-nums leading-none text-white">{time}</span>
      </span>
    </div>
  );
}
