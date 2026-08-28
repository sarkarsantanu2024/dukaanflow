'use client';

/**
 * The hours the shop keeps, editable by the shopkeeper themselves.
 *
 * It sits on the items screen rather than behind a settings tab, because a
 * fifth tab for two fields would cost every owner a permanent slice of a small
 * screen so that a few of them could change something twice a year. Folded
 * away until tapped, it costs one line.
 *
 * Times are stored as "HH:MM" on a 24-hour clock — the format `<input
 * type="time">` speaks natively, so the phone renders its own picker and
 * nothing has to parse "half past nine" or "9.30pm".
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { handledExpiredSession } from './sessionGuard';
import { ownerDict } from '@/lib/owner-i18n';
import { formatClockRange } from '@/lib/hours';
import type { Locale } from '@/lib/i18n';

export function ShopHoursCard({
  slug,
  locale,
  openTime,
  closeTime,
  active,
  closedNote,
}: {
  slug: string;
  locale: Locale;
  openTime: string;
  closeTime: string;
  /** Whether the shutter is up today, and why not when it is down. */
  active: boolean;
  closedNote: string;
}) {
  const t = ownerDict(locale);
  const router = useRouter();
  const { push } = useToast();

  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(openTime);
  const [close, setClose] = useState(closeTime);
  const [note, setNote] = useState(closedNote);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const current = formatClockRange(openTime, closeTime);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/owner/${slug}/hours`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openTime: open, closeTime: close, closedNote: note }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
      };
      if (!response.ok) {
        setError(payload.errors?.closeTime ?? payload.error ?? t.networkError);
        return;
      }

      push(t.hoursSaved, 'success');
      setEditing(false);
      router.refresh();
    } catch {
      setError(t.networkError);
    } finally {
      setSaving(false);
    }
  }

  async function setOpenToday(next: boolean) {
    setSaving(true);
    try {
      const response = await fetch(`/api/owner/${slug}/hours`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openTime,
          closeTime,
          active: next,
          // Reopening clears the reason: a note explaining a closure that has
          // ended is worse than none, because customers believe it.
          closedNote: next ? '' : note,
        }),
      });
      if (handledExpiredSession({ response, slug, t, push })) return;
      if (!response.ok) {
        push(t.networkError, 'error');
        return;
      }
      if (next) setNote('');
      push(next ? t.shopOpenNow : t.shopClosedNow, 'success');
      router.refresh();
    } catch {
      push(t.networkError, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className={
        active
          ? 'rounded-2xl bg-white px-4 py-3 shadow-card'
          : 'rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3'
      }
    >
      {/* The switch is not inside the editor: shutting the shop for the
          afternoon is something an owner does in a hurry, with one hand. */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={active ? 'text-sm font-semibold text-brand-700' : 'text-sm font-semibold text-amber-800'}>
          {active ? t.shopIsOpen : t.shopIsClosed}
        </span>
        <Button
          size="sm"
          variant={active ? 'secondary' : 'primary'}
          disabled={saving}
          onClick={() => setOpenToday(!active)}
          className="ml-auto"
        >
          {active ? t.shopCloseNow : t.shopOpenAgain}
        </Button>
      </div>

      {!active && (
        <div className="mb-3">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={() => void save()}
            placeholder={t.closedNotePlaceholder}
            aria-label={t.closedNoteLabel}
            maxLength={120}
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-base"
          />
          <p className="mt-1 text-xs text-amber-800">{t.closedNoteHint}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-slate-900">{t.hoursTitle}</span>
        <span className="text-sm text-slate-600">{current || t.hoursNotSet}</span>

        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto text-sm font-semibold text-brand-700 underline"
          >
            {current ? t.hoursChange : t.hoursSet}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              {t.hoursOpen}
              <input
                type="time"
                value={open}
                onChange={(event) => setOpen(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-2 text-base"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              {t.hoursClose}
              <input
                type="time"
                value={close}
                onChange={(event) => setClose(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-2 text-base"
              />
            </label>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">{t.hoursHint}</p>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" onClick={save} loading={saving}>
              {t.saveItem}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setOpen(openTime);
                setClose(closeTime);
                setEditing(false);
                setError('');
              }}
            >
              {t.no}
            </Button>
            {(open || close) && (
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setOpen('');
                  setClose('');
                }}
                className="text-sm font-medium text-slate-500 underline"
              >
                {t.hoursClear}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
