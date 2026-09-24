'use client';

import { useEffect } from 'react';
import type { Locale } from '@/lib/i18n';

/**
 * Tells the browser which language the page is actually in.
 *
 * `<html lang>` is set once, server-side, to "en" — and the storefront defaults
 * to Bengali, so nearly every page a customer sees was Bengali text declared as
 * English. A screen reader takes that declaration literally and pronounces
 * Bengali with an English voice, which is unintelligible; it is also what
 * decides hyphenation, the quote glyphs a browser draws, and what a translation
 * offer does.
 *
 * The language lives in this browser's storage on the customer side and on the
 * shop row on the owner's, so neither is known at render time on the server.
 * One effect, on the element that carries the attribute, is the honest fix.
 */
export function useHtmlLang(locale: Locale): void {
  useEffect(() => {
    const root = document.documentElement;
    const before = root.lang;
    root.lang = locale;
    // Put it back on unmount, so a page that does not set a language is not
    // left claiming the last one somebody looked at.
    return () => {
      root.lang = before;
    };
  }, [locale]);
}

const CLOSE: Record<string, string> = { en: 'Close', bn: 'বন্ধ করুন', hi: 'बंद करें' };

/**
 * "Close" in the language the page is in, for the shared Drawer and Modal,
 * which are used by every screen and told no language. They render through a
 * portal after mount, so the page's `<html lang>` (set above) is already there
 * to read. A screen reader used to hear "Close" in English on Bengali screens.
 */
export function closeLabel(): string {
  if (typeof document === 'undefined') return CLOSE.en!;
  return CLOSE[document.documentElement.lang] ?? CLOSE.en!;
}
