'use client';

/**
 * The bell, and the list that drops from it — one design for the owner and the
 * customer alike. What goes in it is the caller's business (`OwnerBell`,
 * `CustomerBell`); this draws it.
 *
 * - A badge counts what is unread.
 * - Opening the list marks everything in it read.
 * - Each entry opens what it is about, and has its own ✕ to remove it.
 * - "Clear all" removes the lot.
 * - Escape, or a tap outside, closes it, as every other dropdown does.
 */

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { BellIcon, CloseIcon } from './Icon';

export type BellEntry = {
  key: string;
  title: string;
  detail: string;
  /** Already formatted: "8:31 am", "24/09". */
  when: string;
  unread: boolean;
  onOpen: () => void;
};

export function BellMenu({
  entries,
  labels,
  onOpened,
  onRemove,
  onClearAll,
  tone = 'dark',
}: {
  entries: BellEntry[];
  labels: { title: string; empty: string; clearAll: string; remove: string };
  /** The list was opened: mark what is in it read. */
  onOpened: () => void;
  onRemove: (key: string) => void;
  onClearAll: () => void;
  /** `dark` for a coloured header (white bell), `light` for a pale one. */
  tone?: 'dark' | 'light';
}) {
  const [open, setOpen] = useState(false);
  /**
   * Where the list sits, worked out from the bell's place on screen when it
   * opens. Hung from the bell's right edge it ran off the left of a phone
   * whenever something (the language switch) sat to the bell's right. Fixed
   * and clamped, it always fits: 12px from either edge at the least.
   */
  const [place, setPlace] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  function measure() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(352, window.innerWidth - 24);
    const left = Math.min(Math.max(rect.right - width, 12), window.innerWidth - width - 12);
    setPlace({ top: rect.bottom + 8, left, width });
  }
  const ref = useRef<HTMLDivElement>(null);
  const unread = entries.filter((entry) => entry.unread).length;

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent | TouchEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          const next = !open;
          if (next) measure();
          setOpen(next);
          if (next) onOpened();
        }}
        aria-label={unread > 0 ? `${labels.title} (${unread})` : labels.title}
        aria-expanded={open}
        className={clsx(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-lg transition',
          tone === 'dark'
            ? 'text-white/85 hover:bg-white/10 hover:text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )}
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold tabular-nums text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && place && (
        <div
          style={{ top: place.top, left: place.left, width: place.width }}
          className="fixed z-50 overflow-hidden rounded-2xl bg-card text-slate-900 shadow-float ring-1 ring-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <p className="mr-auto font-semibold">{labels.title}</p>
            {entries.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                {labels.clearAll}
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">{labels.empty}</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
              {entries.map((entry) => (
                <li key={entry.key} className={clsx('flex items-start gap-2 px-3 py-2.5', entry.unread && 'bg-brand-50/60')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      entry.onOpen();
                    }}
                    className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg p-1 text-left hover:bg-slate-50"
                  >
                    <span
                      aria-hidden
                      className={clsx(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        entry.unread ? 'bg-red-600' : 'bg-transparent',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-sm font-semibold leading-snug">{entry.title}</span>
                      <span className="block text-xs text-slate-500">{entry.detail}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-400">{entry.when}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(entry.key)}
                    aria-label={`${labels.remove} — ${entry.title}`}
                    className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** A small localStorage JSON store that never throws. */
export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage refused: the bell still works for this visit.
  }
}
