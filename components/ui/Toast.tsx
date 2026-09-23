'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import clsx from 'clsx';
import { BellIcon, CheckIcon, CloseIcon } from './Icon';

type ToastTone = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; tone: ToastTone; leaving?: boolean };

/**
 * The icon each tone carries, and the reason there is one at all.
 *
 * A bar of coloured text says "something happened" and leaves which thing to
 * the reading. For an owner who reads slowly — and who is being handed this
 * message mid-sale, with a customer waiting — a tick and a cross are the whole
 * message, and the words underneath are the detail. Colour alone would not do
 * it either: red and green are the one pair a colour-blind reader cannot
 * separate, so the shape carries the meaning and the colour agrees with it.
 */
const TONE: Record<ToastTone, { chip: string; Icon: typeof CheckIcon }> = {
  success: { chip: 'bg-brand-500', Icon: CheckIcon },
  error: { chip: 'bg-red-500', Icon: CloseIcon },
  info: { chip: 'bg-slate-600', Icon: BellIcon },
};

/**
 * ONE GROUND FOR EVERY TOAST, AND IT IS BLACK.
 *
 * The pill used to take the colour of its tone — green for success, red for
 * error — which made it a different object each time and, worse, put a green
 * pill on top of a green header. On the owner's Items screen that is a dark
 * green bar landing on a dark green bar: the message stops looking like a
 * message and starts looking like part of the chrome, which is the one thing a
 * four-second notice cannot afford.
 *
 * Black belongs to nothing else in this app, so a black pill is always the
 * thing that just arrived, on any screen, over any header, in either app. The
 * tone still shows — in the icon and its chip, which is where a colour-blind
 * reader was already being asked to read it from.
 */
const TOAST_GROUND = 'bg-slate-900';

const ToastContext = createContext<{ push: (message: string, tone?: ToastTone) => void } | null>(
  null,
);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * A toast lives for the same four seconds it always did.
   *
   * The only change is that it now spends its last 220ms leaving rather than
   * vanishing between two frames: `leaving` flips at 3780ms and the row is
   * dropped at 4000ms exactly as before. Nothing that calls `push` can tell the
   * difference, and an owner watching the screen gets a message that goes
   * somewhere instead of one that was simply not there any more.
   */
  const push = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId++;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(
      () => setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t))),
      3780,
    );
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => {
          const { chip, Icon } = TONE[toast.tone];
          return (
            <div
              key={toast.id}
              className={clsx(
                // A floating pill, not a bar clamped to the top of the screen.
                // It lands over the header, so it has to look like it is ON the
                // app rather than part of it — the radius and the lift are what
                // say so, and without them it reads as a broken header.
                'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-3 py-2.5 shadow-float',
                TOAST_GROUND,
                toast.leaving ? 'animate-toast-out' : 'animate-toast-in',
              )}
            >
              <span
                aria-hidden
                className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', chip)}
              >
                <Icon className="h-[18px] w-[18px] text-white" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-white">
                {toast.message}
              </span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
