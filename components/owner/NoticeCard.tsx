'use client';

/**
 * The notice a shopkeeper writes for their own customers.
 *
 * This replaced an open/close card. That card carried a shutter switch and the
 * shop's hours — but the hours are set once by the operator when the shop is
 * onboarded and then almost never change, and the switch duplicated the Pause
 * the console already has. Two controls for the operator's job, on the owner's
 * screen, doing nothing an owner needed.
 *
 * What an owner does need, weekly, is to tell their customers something: no
 * delivery this week, puja orders close Friday, back from the village on the
 * 5th. That is this card.
 *
 * THE DATES ARE THE POINT. A notice with no end is one nobody takes down, and a
 * stale notice is worse than none because customers believe it. The storefront
 * shows this only inside the range — see `lib/notice.ts`, which both sides read
 * so they can never disagree about whether it is running.
 *
 * Dates are "YYYY-MM-DD", the format `<input type="date">` speaks natively, so
 * the phone renders its own calendar and nothing has to parse "next Friday".
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { handledExpiredSession } from './sessionGuard';
import { BellIcon } from '@/components/ui/Icon';
import { ownerDict } from '@/lib/owner-i18n';
import { noticeState } from '@/lib/notice';
import { formatDay } from '@/lib/time';
import type { Locale } from '@/lib/i18n';

export function NoticeCard({
  slug,
  locale,
  noticeText,
  /** "YYYY-MM-DD" each, or blank when the owner gave no bound. */
  noticeFrom,
  noticeTo,
}: {
  slug: string;
  locale: Locale;
  noticeText: string;
  noticeFrom: string;
  noticeTo: string;
}) {
  const t = ownerDict(locale);
  const router = useRouter();
  const { push } = useToast();

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(noticeText);
  const [from, setFrom] = useState(noticeFrom);
  const [to, setTo] = useState(noticeTo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Read from the saved values, not from what is being typed: the card is
  // reporting what customers can see right now, which does not change until a
  // save goes through.
  const state = noticeState({
    noticeText,
    noticeFrom: noticeFrom ? new Date(`${noticeFrom}T00:00:00.000Z`) : null,
    noticeTo: noticeTo ? new Date(`${noticeTo}T00:00:00.000Z`) : null,
  });

  async function save(next: { text: string; from: string; to: string }) {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/owner/${slug}/notice`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noticeText: next.text,
          noticeFrom: next.from,
          noticeTo: next.to,
        }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
      };
      if (!response.ok) {
        setError(
          payload.errors?.noticeTo ?? payload.errors?.noticeText ?? payload.error ?? t.networkError,
        );
        return;
      }

      push(next.text ? t.noticeSaved : t.noticeRemoved, 'success');
      setEditing(false);
      router.refresh();
    } catch {
      setError(t.networkError);
    } finally {
      setSaving(false);
    }
  }

  /** "From 01/09/2026 until 05/09/2026", or whichever half was given. */
  const when = [
    noticeFrom ? `${t.noticeFrom} ${formatDay(`${noticeFrom}T00:00:00.000Z`)}` : '',
    noticeTo ? `${t.noticeTo} ${formatDay(`${noticeTo}T00:00:00.000Z`)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section
      className={
        state === 'live'
          ? 'border-l-4 border-amber-400 bg-amber-50 px-4 py-3'
          : 'px-4 py-3.5'
      }
    >
      {/* THE WHOLE ROW OPENS IT, not the one underlined word at its end.
          "লিখুন" was a 40px target at the far right of a settings list, which
          is the hardest thing on the panel to hit and the easiest to miss
          entirely — an owner who taps the row, the bell or the words "খদ্দেরদের
          জন্য নোটিশ" got nothing at all and concluded the row was a label.

          A plain `<div>` while editing, because a form inside a button is
          neither valid nor operable — the fields would swallow their own
          clicks. The word stays on the right as the affordance; it is just no
          longer the only part that works. */}
      {editing ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <BellIcon className="h-5 w-5 shrink-0 text-slate-400" />
          <span className="-ml-1 text-sm font-medium text-slate-800">{t.noticeTitle}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="-m-1 flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg p-1 text-left transition hover:bg-brand-50"
        >
          <BellIcon className="h-5 w-5 shrink-0 text-slate-400" />
          <span className="-ml-1 text-sm font-medium text-slate-800">{t.noticeTitle}</span>
          <span className="ml-auto text-sm font-medium text-brand-700 underline">
            {noticeText ? t.noticeChange : t.noticeWrite}
          </span>
        </button>
      )}

      {!editing &&
        (noticeText ? (
          <>
            <p className="mt-1.5 text-base font-medium text-slate-900">{noticeText}</p>
            {/* Said plainly, because a notice that is written but not yet
                showing looks exactly like one that is — and an owner who
                cannot tell will write it a second time. */}
            <p
              className={
                state === 'live'
                  ? 'mt-1 text-xs font-medium text-amber-800'
                  : 'mt-1 text-xs font-medium text-slate-500'
              }
            >
              {state === 'live'
                ? t.noticeLive
                : state === 'scheduled'
                  ? t.noticeScheduled
                  : t.noticeFinished}
              {when && ` · ${when}`}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-500">{t.noticeNone}</p>
        ))}

      {editing && (
        <div className="mt-3 space-y-2">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t.noticePlaceholder}
            aria-label={t.noticeLabel}
            maxLength={200}
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
          />
          <p className="text-xs text-slate-500">{t.noticeHint}</p>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              {t.noticeFrom}
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-2 text-base"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              {t.noticeTo}
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-2 text-base"
              />
            </label>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">{t.noticeDatesHint}</p>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" loading={saving} onClick={() => save({ text, from, to })}>
              {t.saveItem}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setText(noticeText);
                setFrom(noticeFrom);
                setTo(noticeTo);
                setEditing(false);
                setError('');
              }}
            >
              {t.no}
            </Button>

            {/* Taking a notice down is one tap, and clears the dates with it:
                dates left behind a removed notice would silently re-hang the
                next one somebody writes. */}
            {noticeText && (
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setText('');
                  setFrom('');
                  setTo('');
                  void save({ text: '', from: '', to: '' });
                }}
                className="ml-auto text-sm font-medium text-red-600 underline"
              >
                {t.noticeRemove}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
