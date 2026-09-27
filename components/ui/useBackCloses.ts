'use client';

/**
 * THE PHONE'S BACK BUTTON CLOSES WHAT IS OPEN, NOT THE SHOP.
 *
 * A shopper with the basket or the checkout open presses Android's back button
 * — the way out of everything else on their phone — and the whole shop page
 * went away: basket view, search and scroll with it. That is the most common
 * "the app threw me out" there is.
 *
 * So while any overlay that asks for this is open, the page keeps ONE extra
 * history entry of its own. Back pops it, and the topmost overlay closes. If
 * others are still open (a confirm over the basket), the entry is put back for
 * the next press. When the last overlay is closed some other way — its X, its
 * button, Escape — the entry is taken back off, so back is not left needing
 * two presses.
 *
 * Deferred and re-checked before it takes the entry off, because two things
 * happen in one tap more often than not: the basket closes AS checkout opens
 * (so something is open again and the entry must stay), or an overlay closes
 * because a link is navigating away (so going back now would undo the tap).
 *
 * Next.js 14.1+ keeps its own state on native `history.pushState` calls, so the
 * router is not disturbed; the spread of `history.state` is belt and braces.
 */

import { useEffect, useRef } from 'react';

const MARK = '__halkhataOverlay';

type Entry = { close: () => void };
const stack: Entry[] = [];
/** Is our extra entry the one history is on? */
let marked = false;
let installed = false;

function onMark(): boolean {
  return Boolean((window.history.state as Record<string, unknown> | null)?.[MARK]);
}

function pushMark() {
  if (marked) return;
  window.history.pushState({ ...(window.history.state ?? {}), [MARK]: true }, '');
  marked = true;
}

function install() {
  if (installed) return;
  installed = true;
  window.addEventListener('popstate', () => {
    if (!marked || onMark()) return;
    // Back was pressed off our entry: close the topmost overlay.
    marked = false;
    const top = stack.pop();
    top?.close();
    if (stack.length > 0) pushMark();
  });
}

export function useBackCloses(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    install();
    const entry: Entry = { close: () => closeRef.current() };
    stack.push(entry);
    pushMark();

    return () => {
      const at = stack.indexOf(entry);
      // Not in the stack: back already closed it and consumed the entry.
      if (at < 0) return;
      stack.splice(at, 1);
      if (stack.length > 0) return;
      const path = window.location.pathname;
      window.setTimeout(() => {
        if (stack.length > 0 || !marked || window.location.pathname !== path || !onMark()) return;
        marked = false;
        window.history.back();
      }, 0);
    };
  }, [open]);
}
