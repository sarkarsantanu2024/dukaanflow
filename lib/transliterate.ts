/**
 * An item's name in the other two scripts, for names the vocabulary does not
 * know.
 *
 * `suggestNames` translates the things a kirana sells ("Flour" → আটা / आटा),
 * but a brand is not in any vocabulary and never will be. An owner who said
 * "Bingo" into the mic got a row that read "Bingo" in roman letters to a
 * Bengali customer, on every screen, because its Bengali and Hindi names were
 * left blank.
 *
 * A brand is not translated, it is SPELT: a Bengali shopkeeper writes Bingo as
 * বিংগো and Kurkure as কুরকুরে. So this spells the name phonetically in the
 * other scripts. It is a best guess, and the owner can read it back and correct
 * it on the items page, which a guessed translation would not allow.
 *
 * Bengali and Devanagari share one layout (the Unicode blocks are parallel), so
 * between those two it is a near-exact letter swap. From roman letters it is a
 * heuristic built for the names kiranas actually stock.
 */

import { suggestNames } from './speech';

import {
  BENGALI,
  DEVANAGARI,
  bengaliToDevanagari,
  devanagariToBengali,
  romanToDevanagari,
} from './script';

export { bengaliToDevanagari, devanagariToBengali, romanToDevanagari };

/* ------------------------------------------------------------------ */
/* The one call the item routes make                                    */
/* ------------------------------------------------------------------ */

/**
 * The Bengali and Hindi names for an item called `name`.
 *
 * The vocabulary first, because a real translation beats a spelling: "Flour"
 * is আটা, not ফ্লাউর. Otherwise the name is spelt in whichever script it is not
 * already in. Empty strings only for an empty name.
 */
export function localNames(name: string): { bn: string; hi: string } {
  const trimmed = name.trim();
  if (!trimmed) return { bn: '', hi: '' };

  const known = suggestNames(trimmed);
  if (known) return { bn: known.bn, hi: known.hi };

  if (BENGALI.test(trimmed)) return { bn: trimmed, hi: bengaliToDevanagari(trimmed) };
  if (DEVANAGARI.test(trimmed)) return { bn: devanagariToBengali(trimmed), hi: trimmed };

  const hi = romanToDevanagari(trimmed);
  return { bn: devanagariToBengali(hi), hi };
}
