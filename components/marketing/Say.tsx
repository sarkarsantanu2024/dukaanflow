/**
 * One piece of the landing page, in all three of its languages at once.
 *
 * ALL THREE ARE IN THE HTML, and the page's chosen language hides the other
 * two — see the `[data-landing]` rules in `app/globals.css` and `LangTabs`,
 * which sets `data-lang` on the page. This is the same bargain `LangTabs` made
 * when it held two panels: swapping text on click would leave the Bengali and
 * the Hindi out of what a crawler reads and out of a browser's find-in-page,
 * and it would make the whole page a client component to switch a few hundred
 * words. Rendered and hidden, the page stays a server component, the switch is
 * one attribute, and `display: none` takes the hidden two out of what a screen
 * reader hears as well as what an eye sees.
 *
 * Each language is wrapped in its own `lang`, so a screen reader reads Bengali
 * with Bengali phonemes and the browser offers to translate the right thing.
 *
 * Deliberately not a client component: it has no state, and both the server
 * page and the small client pieces beside it (the menu, the carousel) use it.
 */

import type { ReactNode } from 'react';
import { LOCALES, type Locale } from '@/lib/i18n';
import type { Words } from '@/lib/marketing-copy';

type Props = {
  /** The copy, from `lib/marketing-copy.ts`. */
  t?: Words;
} & Partial<Record<Locale, ReactNode>>;

/**
 * `<Say t={LANDING.nav.how} />`, or `<Say en={…} bn={…} hi={…} />` when a
 * language needs markup of its own — a word in bold, a quote in another script.
 * A node passed by name wins over the same language in `t`.
 */
export function Say({ t, ...nodes }: Props) {
  const parts = LOCALES.map((lang) => ({ lang, node: nodes[lang] ?? t?.[lang] }));

  // THE SAME IN EVERY LANGUAGE — "0%", "500+" — is said once. Three copies of
  // one string would be three spans for nothing, and a find-in-page hit that
  // counts three times.
  const first = parts[0]!.node;
  if (typeof first === 'string' && parts.every((part) => part.node === first)) {
    return <>{first}</>;
  }

  return (
    <>
      {parts.map(({ lang, node }) => (
        <span key={lang} lang={lang} data-l={lang}>
          {node}
        </span>
      ))}
    </>
  );
}
