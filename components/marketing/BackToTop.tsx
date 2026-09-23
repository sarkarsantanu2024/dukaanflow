'use client';

/**
 * The way back up a long page.
 *
 * The landing page is now nine sections deep, and a reader who has gone all
 * the way down to the FAQ is a reader who is interested — the worst moment to
 * make somebody flick a thumb twenty times to reach the button they finally
 * want. On a phone there is no Home key to press.
 *
 * WHY IT IS NOT ALWAYS THERE. A button pinned over the corner of every screen
 * is a button covering content on the one screen where it is useless: the top.
 * It appears only once the page has actually been scrolled a long way — one
 * viewport and a half, so it never flickers in and out while somebody reads
 * the hero — and it leaves again on the way back up.
 *
 * WHY IT SITS ON THE RIGHT. It is where a right thumb rests and where every
 * page that has one of these puts it, so nobody has to look for it. On a
 * phone it lifts above the sticky WhatsApp bar rather than sitting on it.
 *
 * Reduced motion gets an instant jump rather than a smooth one — a page that
 * flies a thousand pixels under somebody who asked for less movement is the
 * exact thing that setting is for.
 */

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeftIcon } from '@/components/ui/Icon';

export function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShown(window.scrollY > window.innerHeight * 1.5);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toTop() {
    const gentle = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: gentle ? 'smooth' : 'auto' });
    // Send the keyboard back where the eye went. Without this, tabbing after
    // pressing it resumes from the footer, which is the page's worst trick.
    document.getElementById('top')?.focus?.();
  }

  return (
    <button
      type="button"
      onClick={toTop}
      // `hidden` rather than unmounted: the element keeps its place in the tab
      // order's shape, and the fade has something to fade.
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      className={clsx(
        // BOTTOM RIGHT, where a thumb already is and where every page that
        // has one of these puts it. Above the sticky WhatsApp bar on a phone,
        // which owns the bottom edge.
        'fixed bottom-24 right-4 z-40 sm:bottom-6 sm:right-6 inline-flex items-center gap-2 rounded-full border border-glass-edge',
        'bg-glass px-4 py-3 text-sm font-semibold text-slate-700 shadow-float backdrop-blur',
        'transition duration-200 hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        // Clear of a phone's home bar.
        'mb-[env(safe-area-inset-bottom)]',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      {/* The arrow icon set has no "up", so the left one is turned. Rotating a
          shape the product already ships beats a second nearly-identical SVG. */}
      <ArrowLeftIcon className="h-4 w-4 rotate-90" />
      Top
    </button>
  );
}
