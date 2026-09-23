'use client';

/**
 * The call to action that follows a phone down the page.
 *
 * ON A PHONE THE HEADER'S BUTTON IS GONE THE MOMENT ANYONE SCROLLS. The bar at
 * the top keeps the mark and drops everything else at that width, so a reader
 * eight screens into the page — the one who has read the whole argument and is
 * closest to acting — has to scroll back up or all the way down to find a way
 * of getting in touch. Every Indian consumer app this shopkeeper already uses
 * puts the action on a bar at the bottom of the screen, where a thumb is.
 *
 * PHONES ONLY. On a desktop the header is visible the whole time and a pinned
 * bar would be covering content for no reason.
 *
 * It arrives after the fold, because on the first screen the hero's own button
 * is right there and two of the same button at once is a page shouting.
 */

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/ui/Icon';

export function StickyCta({ whatsapp }: { whatsapp: string | null }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShown(window.scrollY > window.innerHeight * 0.9);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden={!shown}
      className={clsx(
        'fixed inset-x-0 bottom-0 z-40 border-t border-glass-edge bg-glass px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden',
        'transition-transform duration-200',
        shown ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="flex items-center gap-2">
        {whatsapp && (
          <a
            href={whatsapp}
            tabIndex={shown ? 0 : -1}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-raised"
          >
            <WhatsAppIcon className="h-5 w-5" />
            <span lang="bn">দোকান খুলুন</span>
          </a>
        )}
        <Link
          href="/#plans"
          tabIndex={shown ? 0 : -1}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-card px-4 py-3 font-semibold text-slate-700"
        >
          <span lang="bn">দাম</span>
        </Link>
      </div>
    </div>
  );
}
