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
  action,
  footer,
  onClose,
  modal = true,
  children,
}: {
  open: boolean;
  title: string;
  /**
   * Does this drawer take the screen, or sit beside it?
   *
   * Modal (the default) is right for the console's tools: a bulk price paste is
   * one job, done and dismissed, and a backdrop keeps the list underneath still
   * while you do it.
   *
   * Non-modal exists for the shopper's basket, where the opposite is true. The
   * basket is meant to stay open WHILE they carry on picking things off the
   * menu, and a backdrop makes that impossible — the tap that was meant to add
   * an item lands on the backdrop and closes the panel instead. So there is no
   * backdrop, the page keeps scrolling, and only the close button, Escape or
   * checkout shuts it.
   */
  modal?: boolean;
  /**
   * The panel's own primary action, in the header rather than at the foot of
   * the content. A Save button below a form is reached by scrolling past the
   * form; in the header it is in the same place every time the drawer opens.
   */
  action?: React.ReactNode;
  /**
   * A bar pinned to the foot of the panel — a total and the button that acts
   * on it, typically.
   *
   * A REGION OF THE PANEL, NOT A STICKY CHILD OF THE SCROLL AREA. Sticking a
   * block to the bottom of a padded scroll container needs negative margins to
   * span that padding, and those same margins push the stuck position below
   * the scrollport, so rows appear underneath it and the panel ends in a strip
   * of half-visible list. As a sibling of the scroll area it simply is the
   * bottom of the panel, and the list scrolls in what is left.
   */
  footer?: React.ReactNode;
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

  // Escape closes either way. A modal drawer also stops the page behind it
  // scrolling — otherwise a flick inside the drawer scrolls the list
  // underneath. A non-modal one must NOT: the page behind it is still the
  // thing being used.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    if (!modal) return () => document.removeEventListener('keydown', onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, modal]);

  if (!mounted) return null;

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex justify-end',
        // Without a backdrop the container still covers the whole screen, so
        // it has to let clicks through or it becomes an invisible backdrop
        // that swallows every tap on the page instead of closing on them.
        !modal && 'pointer-events-none',
      )}
    >
      {modal && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={clsx(
            'absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]',
            leaving ? 'animate-fade-out' : 'animate-fade-in',
          )}
        />
      )}

      <div
        role="dialog"
        aria-modal={modal}
        aria-label={title}
        onAnimationEnd={() => {
          if (leaving) {
            setMounted(false);
            setLeaving(false);
          }
        }}
        className={clsx(
          'relative flex h-full w-full max-w-md flex-col bg-slate-100 shadow-sheet',
          // The panel itself is always interactive, even when its container is
          // letting clicks through to the page behind.
          !modal && 'pointer-events-auto',
          leaving ? 'animate-drawer-out' : 'animate-drawer-in',
          // Someone who has asked their system for less movement gets the panel
          // without the travel, not a slower version of it.
          'motion-reduce:animate-none',
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="mr-auto truncate font-bold text-slate-900">{title}</h2>
          {action}
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

        {footer && (
          // The phone's home indicator sits over the last few millimetres of
          // the screen, and this is where the primary button lives.
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
