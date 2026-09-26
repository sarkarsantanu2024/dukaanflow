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

  if (BENGALI.test(trimmed)) return { bn: trimmed, hi: safe(bengaliToDevanagari(trimmed)) };
  if (DEVANAGARI.test(trimmed)) return { bn: safe(devanagariToBengali(trimmed)), hi: trimmed };

  return phraseByPhrase(trimmed);
}

/**
 * PHRASE BY PHRASE. "Dettol Handwash Original" has one brand and two ordinary
 * words the vocabulary knows; spelling the whole name letter by letter because
 * it is not one entry gave "ডেটোল হাংড্ভাশ ওরিগিনাল". So the longest run of
 * words the vocabulary knows is taken first — three words, then two, then one,
 * which keeps "Surf Excel" and "Mother Dairy" whole — and only what is left is
 * spelt. `unknown` says which words had to be spelt, for a caller holding a
 * better spelling of them (the photo reader's).
 */
function phraseByPhrase(name: string): { bn: string; hi: string; unknown: boolean } {
  const words = name.split(/\s+/);
  const bn: string[] = [];
  const hi: string[] = [];
  let unknown = false;
  for (let index = 0; index < words.length; ) {
    let taken = 0;
    for (let size = Math.min(3, words.length - index); size >= 1 && !taken; size--) {
      const hit = suggestNames(words.slice(index, index + size).join(' '));
      if (hit) {
        bn.push(hit.bn);
        hi.push(hit.hi);
        taken = size;
      }
    }
    if (!taken) {
      // A number and its word ("2-Minute") keep the number and spell the word.
      const word = words[index]!;
      const spelt = /^\d+$/.test(word) ? word : romanToDevanagari(word);
      bn.push(/^\d+$/.test(word) ? word : devanagariToBengali(spelt));
      hi.push(spelt);
      unknown ||= !/^\d+$/.test(word);
      taken = 1;
    }
    index += taken;
  }
  return { bn: safe(bn.join(' ')), hi: safe(hi.join(' ')), unknown };
}

/**
 * Local names for a name a vision model read off a packet, with the model's own
 * spellings as a candidate.
 *
 * The vocabulary still decides wherever it knows the whole name. Where it had
 * to spell something letter by letter, the model's spelling — a model writes
 * "Harpic Power Plus" as হারপিক পাওয়ার প্লাস, the letter-by-letter speller as
 * হারপিক পোভের প্লুস — is used instead, but only in the right script and only
 * after the same word-by-word check (`NEVER_SPELL`) every guess goes through.
 */
export function localNamesWithHint(name: string, hint: { bn: string; hi: string }): { bn: string; hi: string } {
  const trimmed = name.trim();
  if (!trimmed || BENGALI.test(trimmed) || DEVANAGARI.test(trimmed)) return localNames(trimmed);
  const known = suggestNames(trimmed);
  if (known) return { bn: known.bn, hi: known.hi };
  const ours = phraseByPhrase(trimmed);
  if (!ours.unknown) return { bn: ours.bn, hi: ours.hi };
  const bn = hint.bn.trim().slice(0, 80);
  const hi = hint.hi.trim().slice(0, 80);
  return {
    bn: bn && BENGALI.test(bn) && !/[A-Za-z\u0900-\u097F]/.test(bn) ? safe(bn) || ours.bn : ours.bn,
    hi: hi && DEVANAGARI.test(hi) && !/[A-Za-z\u0980-\u09FF]/.test(hi) ? safe(hi) || ours.hi : ours.hi,
  };
}

/**
 * WORDS A LETTER-BY-LETTER SPELLING MUST NEVER PRODUCE.
 *
 * "Maggi" came out as মাগী — a slur — and sat on a live shop page in front of
 * every Bengali customer. The brand now has its real spelling in the
 * vocabulary, but the next unknown brand can land on the same word by the same
 * accident, and nobody can list every brand in advance. So a guessed spelling
 * is checked word by word against this list, and one that hits is dropped:
 * the item then shows its own name in roman letters until the owner types a
 * spelling, which is the honest fallback — an odd-looking brand name is a
 * shrug, an insult on the shop's own page is not.
 *
 * WHOLE WORDS ONLY. Several of these are also the first letters of ordinary
 * words (বালতি is a bucket), so a substring match would refuse half a shop.
 * Only ever applied to GUESSED spellings — a name the owner typed in their own
 * script is theirs and is never second-guessed.
 */
const NEVER_SPELL = new Set([
  // Bengali
  'মাগী', 'মাগি', 'খানকি', 'খানকী', 'চোদ', 'চুদি', 'বাঁড়া', 'বাড়া', 'গুদ', 'বাল', 'শালা', 'শালী', 'হারামি', 'হারামী', 'কুত্তা', 'কুত্তী', 'রেন্ডি', 'রেন্ডী', 'রেংডী', 'রেংডি', 'খাংকী', 'খাংকি', 'বেশ্যা',
  // Hindi
  'मागी', 'रंडी', 'रण्डी', 'रेंडी', 'रेण्डी', 'खांकी', 'खानकी', 'चूत', 'चुत', 'लौड़ा', 'लौडा', 'लंड', 'गांड', 'गाँड', 'भोसड़ी', 'भोसडी', 'चोद', 'चूतिया', 'हरामी', 'कुत्ती', 'कमीना', 'साला', 'साली', 'बेहेनचोद', 'मादरचोद', 'वेश्या',
]);

/** The guessed spelling, or '' when any of its words is on `NEVER_SPELL`. */
function safe(spelt: string): string {
  const words = spelt.split(/[\s\-–—.,/()]+/).filter(Boolean);
  return words.some((word) => NEVER_SPELL.has(word)) ? '' : spelt;
}
