'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Publishes a sticky header's real height as `--sticky-top` on <html>, so
 * anything that sticks under it can use `top-[var(--sticky-top,0px)]`.
 *
 * WHY MEASURED, NOT WRITTEN DOWN. The till's search strip stuck at a hard
 * `top-[3.25rem]`, the height the owner header had when that number was
 * typed. The header has since grown a second band (the shop's name and
 * photo), so the strip slid underneath it and the search box vanished the
 * moment the owner scrolled. A number can only ever be right until the next
 * change to the header; a measurement stays right.
 */
export function useStickyTop(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const publish = () =>
      root.style.setProperty('--sticky-top', `${Math.round(element.getBoundingClientRect().height)}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--sticky-top');
    };
  }, [ref]);
}
