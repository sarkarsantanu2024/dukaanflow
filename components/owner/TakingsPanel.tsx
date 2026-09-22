'use client';

/**
 * WHAT CAME IN, AND IN WHAT FORM.
 *
 * The closing question, and until now the app could not answer it: an owner
 * could see that the day took ₹3,240 and had no way to know how much of that
 * was cash in the drawer, how much had gone to the phone, and how much had
 * walked out of the shop on credit.
 *
 * THREE FIGURES AND A TOTAL, and the three add up to the total exactly. That is
 * the whole design constraint. A closing figure that does not reconcile is
 * worse than no closing figure, because the shopkeeper spends the evening
 * hunting for the difference — so anything that is NOT settled money is held
 * out below the line and labelled, rather than quietly folded in.
 *
 * Today and this month, because those are the two questions actually asked —
 * one at closing, one when the rent is due. Anything finer belongs in the
 * spreadsheet the khata already exports.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { AlponaMotif } from '@/components/ui/Ornament';
import { formatPaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';
import type { Drawer, Takings } from '@/lib/takings';
// `DrawerPanel` is no longer rendered here — see the note at the reckoning
// below. Restoring it needs this import back as well as the line itself.

type Period = 'today' | 'month';

export function TakingsPanel({
  slug,
  today,
  month,
  drawer,
  locale,
}: {
  slug: string;
  today: Takings;
  month: Takings;
  /**
   * Today's cash drawer, or null before the owner has typed the opening float.
   *
   * Only ever shown under "today". A month has no drawer — it has thirty of
   * them — and a reconciliation offered against a month's cash sales would be
   * a number that can never balance.
   */
  drawer: Drawer | null;
  locale: Locale;
}) {
  const t = ownerDict(locale);
  const [period, setPeriod] = useState<Period>('today');
  const figures = period === 'today' ? today : month;

  /**
   * The three ways money is taken.
   *
   * Colour carries the meaning at a glance, and the meaning is not "good and
   * bad" — it is where the money IS. Cash and UPI are money the shop has;
   * credit is money it does not, which is why that row is amber wherever it
   * appears in this app.
   *
   * THESE ARE LIGHT TONES BECAUSE THE TILES NOW SIT ON THE DARK PANEL. They
   * were `text-slate-900` and `text-amber-700`, which were correct for the
   * white card this used to be and are all but invisible on deep green. The
   * amber still has to read as amber against the two white ones — that is the
   * entire point of the row — so it goes UP the ramp to 300 rather than down,
   * keeping the meaning and the contrast at once.
   */
  const rows: { label: string; paise: number; count: number; tone: string }[] = [
    { label: t.takingsCash, paise: figures.cashPaise, count: figures.cashCount, tone: 'text-white' },
    { label: t.takingsUpi, paise: figures.upiPaise, count: figures.upiCount, tone: 'text-white' },
    {
      label: t.takingsKhata,
      paise: figures.khataPaise,
      count: figures.khataCount,
      tone: 'text-amber-300',
    },
  ];

  return (
    <div className="space-y-3">
      {/* THE DRAWER RECONCILIATION IS GONE FROM HERE, BY REQUEST.
          It showed the float, the cash sales, the cash collected and what the
          till ought therefore to hold, with a box to type what was actually
          counted. The owner asked for it off the home screen: the opening
          float is still asked for at the top (`StartDayRow`), which is the
          part that cannot be reconstructed later, and the day's money is the
          table below.

          `DrawerPanel` itself is untouched and still used with `hideEntry`
          off elsewhere, so restoring this is putting the line back:

            {period === 'today' && <DrawerPanel slug={slug} drawer={drawer} locale={locale} hideEntry />}

          The counted-cash figure it wrote is the one thing that stops being
          recordable from this screen — nothing else read it, so nothing else
          breaks, but a shop that wants to reconcile at closing no longer can
          from here. */}

      {/* THE DAY'S MONEY, AS THE ONE COLOURED OBJECT ON THE SCREEN.
          It was a white card on a near-white ground with a grey caption over a
          dark figure — correct, and completely inert. On a screen of white
          cards nothing is the subject, so the eye has to read its way to the
          number that is the entire reason the owner opened the app.

          The deep brand panel with the alpona behind it makes it the thing you
          see first, from arm's length, without reading a word. That matters
          most for the owner who reads slowly: position and colour tell them
          where the money is before any label does.

          IT ALSO CARRIES THE PERIOD SWITCH now, along its top edge, so the
          control and the figure it governs are one object rather than two
          stacked ones with a gap between them.

          The panel is card-sized, which is the whole licence for a gradient
          here — see the note on `hero` in the Tailwind config. Across a full
          page this would band on the phones this runs on. */}
      <div className="relative overflow-hidden rounded-2xl bg-hero p-4 shadow-float">
        <AlponaMotif className="pointer-events-none absolute -right-6 -top-10 h-40 w-40 text-white/10" />

        <div className="relative">
          {/* THE SWITCH SITS INSIDE THE PANEL IT CHANGES.
              It was two pills floating above the box, which cost a row of gap
              and left the control and the figure it governs reading as two
              separate things. A segmented control along the top of the panel is
              the thing it has always been — "which of these two numbers am I
              looking at" — and it answers that where the number is.

              Recessed track, raised thumb: the group is a well in the panel and
              the selected half sits proud of it, so the choice reads without
              colour doing the work. */}
          <div className="mb-3 flex rounded-full bg-black/15 p-1 ring-1 ring-white/10">
            {(
              [
                { id: 'today' as const, label: t.takingsToday },
                { id: 'month' as const, label: t.takingsMonth },
              ]
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPeriod(option.id)}
                aria-pressed={period === option.id}
                className={clsx(
                  'h-9 flex-1 rounded-full text-sm font-medium transition',
                  period === option.id
                    ? 'bg-white text-brand-800 shadow-raised'
                    : 'text-white/70 hover:text-white',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="text-sm font-medium text-brand-100">{t.takingsTotal}</p>
          {/* AS BIG AS IT WILL GO. This is the number the owner opened the app
              for, and every reference of a money screen that works does the
              same thing: the figure is the screen, and the labels are small
              around it. `tracking-tight` because digits at this size drift
              apart, and `break-words` so a lakh-rupee day still fits a 375px
              phone rather than running off it. */}
          <p className="mt-0.5 break-words text-4xl font-light tabular-nums tracking-tight text-white">
            {formatPaise(figures.totalPaise)}
          </p>

          {figures.totalPaise === 0 && figures.pendingPaise === 0 ? (
            <p className="mt-3 text-sm text-brand-100">{t.takingsNothing}</p>
          ) : (
            // Three tiles rather than a list: the owner reads the split at a
            // glance, and the three sit level so no one of them reads as more
            // important than the others. Credit keeps the amber it wears
            // everywhere in this app — money the shop does not yet have.
            //
            // Translucent white over the panel rather than opaque tiles, so
            // they read as part of one object instead of three cards dropped
            // onto it.
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              {rows.map((row) => (
                <div key={row.label} className="rounded-xl bg-veil px-1 py-2 ring-1 ring-white/25 backdrop-blur-sm">
                  <div className="text-[11px] font-medium text-brand-100">{row.label}</div>
                  <div className={clsx('mt-0.5 text-sm font-normal tabular-nums', row.tone)}>
                    {formatPaise(row.paise)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
