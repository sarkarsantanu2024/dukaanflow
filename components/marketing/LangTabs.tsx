'use client';

/**
 * The landing page's language — English, বাংলা or हिन्दी — for the whole page.
 *
 * The audience for this page is split in a way a single language cannot serve.
 * The person who decides is often a son or a nephew who reads English; the
 * person who will stand behind the counter using it reads Bengali or Hindi, and
 * is the one who has to believe the claims. So the reader chooses, and the page
 * does not guess from the browser's language — on a shared phone, that guess is
 * wrong for one of the two people holding it.
 *
 * THIS WAS TWO TABS OVER TWO LISTS, and that was the bug. Pressing বাংলা
 * changed the steps and the complaints and left everything else — the menu,
 * the headings, the prices, the button that says what to do next — in English,
 * with no Hindi at all. A reader who asked for Bengali got a page that mostly
 * was not. The tabs are the same control, with Hindi added, and what they
 * switch is the page.
 *
 * HOW THE SWITCH WORKS. Every piece of copy is rendered in all three languages
 * by `Say`, and CSS shows the one named by `data-lang` on the page's root (see
 * `app/globals.css`). Choosing a language sets that one attribute, the page's
 * `<html lang>`, and a remembered choice for the next visit. Nothing
 * re-renders; there is nothing to fetch.
 *
 * A LINK CAN CARRY THE LANGUAGE: `/?lang=bn` or `/?lang=hi`. A field agent
 * sending the page to a shopkeeper on WhatsApp sends it in the language they
 * have just been speaking to them in.
 */

import { useEffect, useId, useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { LangToggle } from '@/components/customer/LangToggle';
import { LOCALES, type Locale } from '@/lib/i18n';

/** Each language named in itself, in full: this is the control for choosing one. */
const LABELS: Record<Locale, string> = { en: 'English', bn: 'বাংলা', hi: 'हिन्दी' };

const STORAGE_KEY = 'halkhata:landing-lang';

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Before the page is painted, the language a link or a previous visit asked
 * for — so a returning Bengali reader does not watch the page arrive in English
 * and then change under them.
 *
 * Inline and tiny because it has to run while the HTML is still being parsed,
 * before any bundle has loaded. It only sets an attribute; everything else is
 * done by `LandingLanguage` once React is running.
 */
const PRE_PAINT = `(function(){try{var r=document.currentScript&&document.currentScript.parentElement;if(!r)return;var q=new URLSearchParams(location.search).get('lang');var s=q||localStorage.getItem('${STORAGE_KEY}');if(s==='bn'||s==='hi'||s==='en')r.setAttribute('data-lang',s)}catch(e){}})()`;

/* --------------------------------------------------------------------------
 * The chosen language, shared by every control that shows or changes it.
 *
 * Module state rather than a React context, because the page is a server
 * component and the controls are islands in it — the header's select, the
 * tabs in the hero, the menu — with no client parent to hold a provider.
 * ------------------------------------------------------------------------ */

let current: Locale | null = null;
const listeners = new Set<() => void>();

function root(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-landing]');
}

/** What the reader asked for: the link, then the attribute, then last time. */
function initial(): Locale {
  try {
    const fromLink = new URLSearchParams(window.location.search).get('lang');
    if (isLocale(fromLink)) {
      // Kept, as a choice made on the tabs is: somebody sent the page in
      // Hindi, and the next time they open it from their home screen it
      // should still be in Hindi.
      window.localStorage.setItem(STORAGE_KEY, fromLink);
      return fromLink;
    }
  } catch {
    // An unparseable address is not a reason to fail the page.
  }
  const fromPage = root()?.getAttribute('data-lang');
  if (isLocale(fromPage)) return fromPage;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Storage can be switched off; the page simply starts in English.
  }
  return 'en';
}

function snapshot(): Locale {
  if (current === null) current = initial();
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Show the page in `lang`, and remember it for the next visit. */
export function setLandingLang(lang: Locale) {
  current = lang;
  root()?.setAttribute('data-lang', lang);
  document.documentElement.lang = lang;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Remembering is a convenience; the switch itself has already happened.
  }
  listeners.forEach((listener) => listener());
}

/** The page's language, for the few things CSS cannot switch — an aria-label. */
export function useLandingLang(): Locale {
  // English on the server and through hydration, which is what the HTML says
  // until the attribute is read; the real value follows on the next render.
  return useSyncExternalStore(subscribe, snapshot, () => 'en');
}

/**
 * Once per page, first thing inside the root: the pre-paint script, and the
 * work that needs React — applying the language when the page was reached by a
 * client-side navigation (where an inline script does not run), and keeping
 * `<html lang>` honest.
 */
export function LandingLanguage() {
  const lang = useLandingLang();

  useEffect(() => {
    root()?.setAttribute('data-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Leaving for /admin or a policy page must not leave the document claiming
  // to be Bengali: the rest of the product sets `lang="en"` in the layout and
  // never touches it again.
  useEffect(() => () => void (document.documentElement.lang = 'en'), []);

  return <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />;
}

/**
 * The header's switch: the app's own language select, the one the shop page
 * and the owner's bar carry — same control, same EN · বাং · हिं — so somebody
 * who has used either finds it where they expect it. Bound here to the page's
 * language rather than to a shop's.
 */
export function LangSelect() {
  const lang = useLandingLang();
  return <LangToggle value={lang} onChange={setLandingLang} />;
}

/**
 * The switch itself: three tabs, each language written in its own script, so
 * a reader who cannot read the other two still finds theirs.
 *
 * `tone="dark"` for the black menu panel.
 */
export function LangTabs({
  className,
  tone = 'light',
}: {
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const lang = useLandingLang();
  const base = useId();
  const dark = tone === 'dark';

  return (
    <div
      role="radiogroup"
      aria-labelledby={`${base}-label`}
      className={clsx(
        'inline-flex rounded-xl p-1',
        dark ? 'bg-white/10' : 'bg-slate-200/70',
        className,
      )}
    >
      {/* Named in all three, because the reader has not chosen yet. */}
      <span id={`${base}-label`} className="sr-only">
        Language · ভাষা · भाषा
      </span>
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={lang === option}
          lang={option}
          onClick={() => setLandingLang(option)}
          className={clsx(
            // 40px tall: the floor this product holds every tap target to.
            // Narrower in the menu, whose panel is 16rem across.
            'min-h-10 rounded-lg py-1.5 text-sm font-semibold transition',
            dark ? 'px-2' : 'px-4',
            lang === option
              ? dark
                ? 'bg-white text-slate-900'
                : 'bg-card text-slate-900 shadow-sm'
              : dark
                ? 'text-slate-200 hover:text-white'
                : 'text-slate-600 hover:text-slate-900',
          )}
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
}
