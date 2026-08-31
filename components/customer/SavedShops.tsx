'use client';

/**
 * "Shops you have ordered from" — the way back for a customer with no QR in
 * front of them.
 *
 * THE PROBLEM. The counter's QR is scanned once. Everything after that — the
 * order from home on Sunday, the order from the bus — needs a route back that
 * is not the sticker in the shop. Without one, a customer who used Halkhata
 * on Monday walks to the shop on Sunday, and the product has changed nothing.
 *
 * WHY NOT AN ACCOUNT. Because asking somebody to register before a kirana can
 * sell them a kilo of rice loses more orders than re-scanning ever did. The
 * list is in the phone's own storage, where a list of "shops I use" belongs: no
 * sign-up, no server, nothing Halkhata can see or lose. See
 * `lib/saved-shops.ts`.
 *
 * It is the second of two answers, not the only one. The stronger one is the
 * shop's own icon on the home screen, which the storefront offers straight
 * after an order (`SaveShopCard`). This catches everyone who said "not now",
 * and everyone whose browser never offered.
 *
 * It renders nothing at all on a phone that has not ordered — which is every
 * shopkeeper and every visitor, so the landing page is unchanged for them.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { forgetShop, readSavedShops, type SavedShop } from '@/lib/saved-shops';
import { dict, LOCALES, type Locale } from '@/lib/i18n';

const LOCALE_STORAGE_KEY = 'halkhata:locale';

export function SavedShops() {
  const [shops, setShops] = useState<SavedShop[]>([]);
  const [locale, setLocale] = useState<Locale>('bn');
  const t = dict(locale);

  // In an effect, never during render: local storage does not exist on the
  // server, and reading it while rendering would make the markup the server
  // sent disagree with the browser's.
  useEffect(() => {
    setShops(readSavedShops());
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && (LOCALES as readonly string[]).includes(saved)) setLocale(saved as Locale);
  }, []);

  if (shops.length === 0) return null;

  return (
    <section className="mt-10 w-full max-w-md text-left">
      <h2 className="text-sm font-semibold text-slate-900">{t.savedShopsTitle}</h2>
      <ul className="mt-2 space-y-2">
        {shops.map((shop) => (
          <li key={shop.slug} className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-card">
            <Link
              href={`/shop/${shop.slug}`}
              className="min-w-0 flex-1 truncate px-2 py-1.5 font-semibold text-slate-900"
            >
              {shop.name}
            </Link>
            <button
              type="button"
              onClick={() => {
                forgetShop(shop.slug);
                setShops(readSavedShops());
              }}
              aria-label={`${t.savedShopsForget} — ${shop.name}`}
              className="h-9 shrink-0 rounded-lg px-2 text-xs font-medium text-slate-400 transition hover:text-red-600"
            >
              {t.savedShopsForget}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-500">{t.savedShopsHint}</p>
    </section>
  );
}
