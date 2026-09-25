'use client';

/**
 * The landing page's section links, with the one you are reading marked.
 *
 * WITHOUT IT THE BAR IS FOUR WORDS THAT NEVER CHANGE. A long page with a
 * sticky nav that never responds gives a reader no idea where they are in it —
 * they have scrolled through six screens and the header still looks exactly as
 * it did at the top, so the bar reads as decoration rather than as a map. The
 * mark alone tells you which page you are on; this tells you which part.
 *
 * HOW THE ACTIVE ONE IS CHOSEN. The section whose top has most recently passed
 * under the header — not the one taking up the most screen, which flickers
 * between two headings every time a tall card crosses the middle. Above the
 * first section nothing is marked, because "What you get" is not where the
 * reader is when they are looking at the hero.
 *
 * `aria-current="true"` carries the same fact to a screen reader, which
 * otherwise gets four identical links and no sense of position. Colour is not
 * the only signal either: the active link is also the only one with a
 * weight change and an underline, so it survives a monochrome screen.
 *
 * A scroll listener rather than an IntersectionObserver: four thresholds that
 * all have to agree about a sticky header's height is more machinery than one
 * arithmetic comparison, and this runs on cheap phones.
 */

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { LANDING, type Words } from '@/lib/marketing-copy';
import { useLandingLang } from './LangTabs';
import { Say } from './Say';

/** A section link, named in every language the page can be read in. */
export type NavItem = { href: string; label: Words };

/** How far below the viewport top a section counts as "reached". */
const HEADER_OFFSET = 96;

export function SectionNav({ items, className }: { items: NavItem[]; className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const lang = useLandingLang();

  useEffect(() => {
    let frame = 0;

    function measure() {
      frame = 0;
      let current: string | null = null;
      for (const item of items) {
        const section = document.querySelector(item.href);
        if (!section) continue;
        if (section.getBoundingClientRect().top <= HEADER_OFFSET) current = item.href;
      }
      // The foot of the page can be short enough that the last section never
      // reaches the header. Anyone who has hit the bottom is reading the last
      // one, whatever the arithmetic says.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive(atBottom ? (items[items.length - 1]?.href ?? current) : current);
    }

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items]);

  return (
    <nav className={className} aria-label={LANDING.nav.label[lang]}>
      {items.map((item) => {
        const on = active === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={on ? true : undefined}
            className={clsx(
              'inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold transition-colors',
              // Light on the black header bar. The section you are in is a
              // filled pill: a green underline all but vanished on black.
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              on
                ? 'bg-white text-slate-900'
                : 'text-slate-300 hover:bg-white/10 hover:text-white',
            )}
          >
            <Say t={item.label} />
          </a>
        );
      })}
    </nav>
  );
}
