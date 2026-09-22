'use client';

/**
 * Whether the page has moved off the top.
 *
 * This file once also carried a hide-the-header-on-scroll hook. That was
 * removed: collapsing or sliding a sticky header while a list scrolls under it
 * never read as smooth on the phones this runs on, and the header earns its
 * place on every screen anyway. Only the small question survives.
 */

import { useEffect, useState } from 'react';

/**
 * Has the page moved at all?
 *
 * It exists for surfaces that CHANGE when they stop being part of the page and
 * start floating over it. A search field resting on the ground can be a soft
 * tint of it; the same field pinned over a moving list has to be an object, or
 * the cards sliding underneath read straight through it.
 *
 * The threshold is deliberately tiny. This is not about intent — any movement
 * at all means the strip is now over content rather than in it.
 */
export function useScrolled(after = 4): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > after);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [after]);

  return scrolled;
}
