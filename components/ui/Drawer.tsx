'use client';

/**
 * A right-hand slide-over for the console's heavy tools.
 *
 * The items page put the voice card, the typed form, the common-items list and
 * the bulk editor in one sidebar column. Stacked, they ran to several thousand
 * pixels, so the *page* scrolled to show them — which stranded the item list at
 * the top beside a long empty gutter. The list is the page; the tools are
 * things you reach for while looking at it, and a thing you reach for should
 * not push the thing you are looking at off the screen.
 *
 * So the sidebar keeps only compact triggers, and each tool opens here: its own
 * scroll, over the page rather than inside it, dismissed by Escape, by the
 * backdrop, or by the close button.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import clsx from 'clsx';

/**
 * Lets content rendered inside a drawer close it without the drawer having to
 * thread a callback down. That matters because the content is often built in a
 * server component, where a function prop cannot cross the boundary — the
 * provider lives on this side, and only client components read it.
 */
const DrawerCloseContext = createContext<(() => void) | null>(null);

export function useDrawerClose(): (() => void) | null {
  return useContext(DrawerCloseContext);
}

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // The panel outlives `open` by one animation so it can slide out instead of
  // vanishing. `leaving` drives which keyframe runs; the animation's own end
  // event unmounts it, so the timing lives in CSS rather than a setTimeout that
  // would drift out of step with it.
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (!mounted) return;

    // With reduced motion there is no exit animation, so `onAnimationEnd` would
    // never fire and the panel would stay mounted for good. Unmount outright.
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (still) setMounted(false);
    else setLeaving(true);
  }, [open, mounted]);

  // Escape closes, and the page behind stops scrolling while it is open —
  // otherwise a flick inside the drawer scrolls the list underneath it.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={clsx(
          'absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]',
          leaving ? 'animate-fade-out' : 'animate-fade-in',
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onAnimationEnd={() => {
          if (leaving) {
            setMounted(false);
            setLeaving(false);
          }
        }}
        className={clsx(
          'relative flex h-full w-full max-w-md flex-col bg-slate-100 shadow-sheet',
          leaving ? 'animate-drawer-out' : 'animate-drawer-in',
          // Someone who has asked their system for less movement gets the panel
          // without the travel, not a slower version of it.
          'motion-reduce:animate-none',
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="mr-auto truncate font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* The drawer scrolls, not the page. */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <DrawerCloseContext.Provider value={onClose}>{children}</DrawerCloseContext.Provider>
        </div>
      </div>
    </div>
  );
}
