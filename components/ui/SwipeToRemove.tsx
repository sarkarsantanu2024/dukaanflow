'use client';

/**
 * Swipe a row away.
 *
 * Replaces a "clear everything" button, which could only do the blunt version
 * of what an owner usually wants — a customer changes their mind about one
 * thing, not the whole basket. Swiping is also the gesture a phone has already
 * taught them, so there is nothing new to learn and nothing extra on screen.
 *
 * Vertical movement wins ties: a list that steals the scroll because a thumb
 * drifted sideways is worse than one with no gesture at all. The direction is
 * decided once per touch and then held, so a swipe that starts horizontal
 * cannot turn into a fight with the page.
 */

import { useRef, useState } from 'react';
import { TrashIcon } from './Icon';

/** Past this, letting go removes the row. Roughly a thumb's travel. */
const THRESHOLD = 96;

export function SwipeToRemove({
  onRemove,
  label,
  children,
}: {
  onRemove: () => void;
  /** Announced to screen readers, which cannot swipe. */
  label: string;
  children: React.ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const [sliding, setSliding] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<'undecided' | 'horizontal' | 'vertical'>('undecided');

  function begin(x: number, y: number) {
    start.current = { x, y };
    axis.current = 'undecided';
    setSliding(true);
  }

  function move(x: number, y: number) {
    if (!start.current) return;
    const dx = x - start.current.x;
    const dy = y - start.current.y;

    if (axis.current === 'undecided') {
      // Wait for enough movement to be sure, then commit for this whole touch.
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }
    if (axis.current !== 'horizontal') return;

    // Leftwards only, and it stiffens past the threshold so the row feels like
    // it has caught rather than sliding off the screen.
    const pulled = Math.min(0, dx);
    setOffset(pulled < -THRESHOLD ? -THRESHOLD + (pulled + THRESHOLD) / 4 : pulled);
  }

  function end() {
    const removing = offset <= -THRESHOLD;
    start.current = null;
    axis.current = 'undecided';
    setSliding(false);
    setOffset(0);
    if (removing) onRemove();
  }

  const armed = offset <= -THRESHOLD;

  return (
    <div className="relative overflow-hidden">
      {/* Behind the row, revealed as it moves. */}
      <div
        aria-hidden
        className={
          'absolute inset-y-0 right-0 flex w-28 items-center justify-end pr-5 transition-colors ' +
          (armed ? 'bg-red-600 text-white' : 'bg-red-100 text-red-500')
        }
      >
        <TrashIcon className="h-5 w-5" />
      </div>

      <div
        style={{ transform: `translateX(${offset}px)` }}
        className={
          'relative bg-white ' + (sliding ? '' : 'transition-transform duration-200 ease-out')
        }
        onTouchStart={(event) => begin(event.touches[0]!.clientX, event.touches[0]!.clientY)}
        onTouchMove={(event) => move(event.touches[0]!.clientX, event.touches[0]!.clientY)}
        onTouchEnd={end}
        onTouchCancel={end}
      >
        {children}
      </div>

      {/* Always visible, not a pointer-only fallback. A gesture nobody can see
          is a gesture most people never find, and a keyboard and a screen
          reader cannot swipe at all. */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={label}
        title={label}
        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-600"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
