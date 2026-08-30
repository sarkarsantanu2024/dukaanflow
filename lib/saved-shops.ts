'use client';

/**
 * The shops this phone has ordered from.
 *
 * THE PROBLEM THIS SOLVES. A customer scans the code on the counter once. Two
 * days later they are at home and want the same shop — and the only route back
 * is the QR sticker, which is in the shop. So they walk, or they ring, and the
 * one thing DukaanFlow was supposed to change has not changed.
 *
 * A login would fix it and cost far more than it fixes: asking somebody to
 * register before a kirana can sell them a kilo of rice loses more orders than
 * re-scanning ever did. So the list lives in the phone's own storage, which is
 * exactly where a list of "shops I use" belongs — it is nobody's business but
 * theirs, it needs no account, and it survives every visit to the site.
 *
 * Alongside it, the storefront offers to put the shop on the home screen (see
 * `SaveShopCard`), which is the same answer for people who think in icons
 * rather than in browser tabs. The two are deliberately both offered: an
 * installed shop is one tap from anywhere, and this list catches everyone who
 * said "not now".
 *
 * Nothing here ever reaches the server. It cannot: it is a browser's local
 * storage, and DukaanFlow has no idea which phone is which.
 */

const KEY = 'dukaanflow:shops';

/** How many to keep. Long enough for a household's regulars, short enough to read. */
const LIMIT = 12;

export type SavedShop = {
  slug: string;
  name: string;
  /** Epoch ms of the last order, so the list reads newest first. */
  lastOrderedAt: number;
};

export function readSavedShops(): SavedShop[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry): entry is SavedShop =>
          Boolean(entry) &&
          typeof entry === 'object' &&
          typeof (entry as SavedShop).slug === 'string' &&
          typeof (entry as SavedShop).name === 'string',
      )
      .map((entry) => ({ ...entry, lastOrderedAt: Number(entry.lastOrderedAt) || 0 }))
      .sort((a, b) => b.lastOrderedAt - a.lastOrderedAt)
      .slice(0, LIMIT);
  } catch {
    // Private browsing, cleared storage, or something an older version wrote.
    // An empty list is always safe: the worst case is a customer scanning the
    // code again, which is what they did before this existed.
    return [];
  }
}

/** Called after an order goes through. Ordering again moves the shop to the top. */
export function rememberShop(shop: { slug: string; name: string }): void {
  try {
    const kept = readSavedShops().filter((entry) => entry.slug !== shop.slug);
    const next: SavedShop[] = [
      { slug: shop.slug, name: shop.name, lastOrderedAt: Date.now() },
      ...kept,
    ].slice(0, LIMIT);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage refused. The order still went through, which is what matters.
  }
}

export function forgetShop(slug: string): void {
  try {
    const next = readSavedShops().filter((entry) => entry.slug !== slug);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Nothing to do. The list is a convenience, not a record.
  }
}
