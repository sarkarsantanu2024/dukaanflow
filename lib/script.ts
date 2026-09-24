/**
 * Moving a word between Bengali, Devanagari and roman letters.
 *
 * Split out of `lib/transliterate.ts` so the search in `lib/speech.ts` can use
 * it too without the two files importing each other: `transliterate` needs
 * `speech` for the vocabulary, and `speech` needs this to compare a spoken
 * "soya bori" with an item written "সয়া বড়ি". This file imports nothing.
 */

export const BENGALI = /[ঀ-৿]/;
export const DEVANAGARI = /[ऀ-ॿ]/;

/* ------------------------------------------------------------------ */
/* Bengali <-> Devanagari: the blocks are parallel, 0x80 apart          */
/* ------------------------------------------------------------------ */

const DEVA_TO_BN_SPECIAL: Record<string, string> = {
  'व': 'ভ', // Bengali writes an English v as ভ: Vim is ভিম
  'ऑ': 'অ',
  'ॉ': 'ো',
  'ऩ': 'ন',
  'ऱ': 'র',
  'ऴ': 'ল',
};

const BN_TO_DEVA_SPECIAL: Record<string, string> = {
  'য়': 'य',
  'ৎ': 'त्',
};

export function devanagariToBengali(text: string): string {
  let out = '';
  for (const char of text) {
    const special = DEVA_TO_BN_SPECIAL[char];
    if (special) {
      out += special;
      continue;
    }
    const code = char.codePointAt(0)!;
    out += code >= 0x0900 && code <= 0x097f ? String.fromCodePoint(code + 0x80) : char;
  }
  return out;
}

export function bengaliToDevanagari(text: string): string {
  let out = '';
  for (const char of text.normalize('NFC')) {
    const special = BN_TO_DEVA_SPECIAL[char];
    if (special) {
      out += special;
      continue;
    }
    const code = char.codePointAt(0)!;
    out += code >= 0x0980 && code <= 0x09ff ? String.fromCodePoint(code - 0x80) : char;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Roman -> Devanagari                                                  */
/* ------------------------------------------------------------------ */

const HALANT = '्';
const ANUSVARA = 'ं';

/** Consonant spellings, longest first so "chh" wins over "ch" over "c". */
const CONSONANTS: [string, string][] = [
  ['chh', 'छ'],
  ['kh', 'ख'],
  ['gh', 'घ'],
  ['ch', 'च'],
  ['jh', 'झ'],
  ['th', 'थ'],
  ['dh', 'ध'],
  ['ph', 'फ'],
  ['bh', 'भ'],
  ['sh', 'श'],
  ['ck', 'क'],
  ['k', 'क'],
  ['g', 'ग'],
  ['j', 'ज'],
  ['t', 'ट'],
  ['d', 'ड'],
  ['n', 'न'],
  ['p', 'प'],
  ['b', 'ब'],
  ['m', 'म'],
  ['y', 'य'],
  ['r', 'र'],
  ['l', 'ल'],
  ['v', 'व'],
  ['w', 'व'],
  ['s', 'स'],
  ['h', 'ह'],
  ['f', 'फ'],
  ['z', 'ज'],
  ['q', 'क'],
];

/** Vowel spellings: [independent letter, sign after a consonant]. */
const VOWELS: [string, string, string][] = [
  // Only ever written by dropSilentE: the i of Rice, Sprite, Lime.
  ['aii', 'आइ', 'ाइ'],
  ['aa', 'आ', 'ा'],
  ['ee', 'ई', 'ी'],
  ['oo', 'ऊ', 'ू'],
  ['ai', 'ऐ', 'ै'],
  ['ay', 'ए', 'े'],
  ['au', 'औ', 'ौ'],
  ['ou', 'औ', 'ौ'],
  ['a', 'आ', 'ा'],
  ['e', 'ए', 'े'],
  ['i', 'इ', 'ि'],
  ['o', 'ओ', 'ो'],
  ['u', 'उ', 'ु'],
];

const VOWEL_LETTERS = 'aeiou';

/**
 * English's silent final e: "Colgate", "Rice", "Dove". Only in the
 * vowel-consonant-e shape, so "Kurkure" keeps the e it says out loud.
 */
function dropSilentE(word: string): string {
  const match = word.match(/^(.*[^aeiou])?([aio])([bcdfgklmnprstvz])e$/);
  if (!match || word.length < 4) return word;
  const [, head = '', vowel, consonant] = match;
  // The vowel before a silent e says its name: a as in gate, i as in rice.
  const long = vowel === 'a' ? 'ay' : vowel === 'i' ? 'aii' : 'o';
  // The e was what made the c soft: Rice is rais, not raik.
  return `${head}${long}${consonant === 'c' ? 's' : consonant}`;
}

/** A letter said on its own, as in "Parle G": its name, not its sound. */
const LETTER_NAMES: Record<string, string> = {
  a: 'ए', b: 'बी', c: 'सी', d: 'डी', e: 'ई', f: 'एफ', g: 'जी', h: 'एच', i: 'आई',
  j: 'जे', k: 'के', l: 'एल', m: 'एम', n: 'एन', o: 'ओ', p: 'पी', q: 'क्यू', r: 'आर',
  s: 'एस', t: 'टी', u: 'यू', v: 'वी', w: 'डब्ल्यू', x: 'एक्स', y: 'वाई', z: 'ज़ेड',
};

/**
 * Whether two consonants are said together at the start of a syllable (so
 * they are written joined, as a conjunct) rather than one closing a syllable
 * and the other opening the next.
 *
 * "Frooti" joins f+r; "Kurkure" does not join r+k. Joining the second kind is
 * correct but not how anybody writes it: কুরকুরে, not কুর্কুরে.
 */
function joinsAsOnset(first: string, second: string): boolean {
  // r, l and the nasals close a syllable: Hor-licks, not Ho-rlicks.
  if (['r', 'l', 'n', 'm'].includes(first)) return false;
  if (['r', 'l', 'y', 'w', 'v'].includes(second)) return true;
  return first === 's' && ['t', 'p', 'k', 'm', 'n', 'c'].includes(second);
}

function romanWordToDevanagari(raw: string): string {
  if (raw.length === 1) return LETTER_NAMES[raw.toLowerCase()] ?? raw;
  const word = dropSilentE(raw.toLowerCase());
  let out = '';
  let i = 0;
  // Whether the last thing written was a bare consonant (no vowel sign yet).
  let pendingConsonant = false;
  // Its roman spelling, to decide whether the next consonant joins it.
  let lastConsonant = '';

  /**
   * Writes a consonant after another one, joined when the two are said
   * together at a syllable's start or close the word ("Salt", "Milk").
   */
  function joinIfCluster(spelling: string, nextIndex: number) {
    if (!pendingConsonant) return;
    const wordFinal = nextIndex >= word.length;
    if (wordFinal || joinsAsOnset(lastConsonant, spelling)) out += HALANT;
  }

  while (i < word.length) {
    const rest = word.slice(i);

    // "ng" is a nasal before the g: Bingo → बिंगो.
    if (rest.startsWith('ng')) {
      out += ANUSVARA;
      pendingConsonant = false;
      i += 1; // the g is read next as an ordinary consonant
      continue;
    }
    // n or m before another consonant is a nasal too: Candy → कांडी.
    if ((rest[0] === 'n' || rest[0] === 'm') && rest[1] && !VOWEL_LETTERS.includes(rest[1]) && rest[1] !== 'y' && i > 0) {
      out += ANUSVARA;
      pendingConsonant = false;
      i += 1;
      continue;
    }

    const vowel = VOWELS.find(([spelling]) => rest.startsWith(spelling));
    if (vowel) {
      const [spelling, letter, sign] = vowel;
      const atEnd = i + spelling.length === word.length;
      // A final i or u is long, as Indian brand names say it: Maggi → मैगी.
      let chosen = pendingConsonant ? sign : letter;
      if (atEnd && pendingConsonant && spelling === 'i') chosen = 'ी';
      if (atEnd && pendingConsonant && spelling === 'u') chosen = 'ू';
      out += chosen;
      pendingConsonant = false;
      i += spelling.length;
      continue;
    }

    // A y after a consonant and not before a vowel is a vowel: Candy.
    const nextIsVowel = rest[1] !== undefined && VOWEL_LETTERS.includes(rest[1]);
    if (rest[0] === 'y' && pendingConsonant && !nextIsVowel) {
      out += i === word.length - 1 ? 'ी' : 'ि';
      pendingConsonant = false;
      i += 1;
      continue;
    }

    if (rest[0] === 'x') {
      if (pendingConsonant) out += HALANT;
      out += `क${HALANT}स`;
      pendingConsonant = true;
      lastConsonant = 's';
      i += 1;
      // The c of "Excel" is already in the x.
      if (word[i] === 'c' && 'eiy'.includes(word[i + 1] ?? '_')) i += 1;
      continue;
    }

    // c is s before e, i or y, and k everywhere else.
    if (rest[0] === 'c' && !rest.startsWith('ch') && !rest.startsWith('ck')) {
      const soft = 'eiy'.includes(rest[1] ?? '_');
      joinIfCluster(soft ? 's' : 'k', i + 1);
      out += soft ? 'स' : 'क';
      pendingConsonant = true;
      lastConsonant = soft ? 's' : 'k';
      i += 1;
      continue;
    }

    const consonant = CONSONANTS.find(([spelling]) => rest.startsWith(spelling));
    if (consonant) {
      const [spelling, letter] = consonant;
      // A doubled letter is said once: Maggi, Pepsi's pp.
      if (out.endsWith(letter) && pendingConsonant) {
        i += spelling.length;
        continue;
      }
      joinIfCluster(spelling, i + spelling.length);
      out += letter;
      pendingConsonant = true;
      lastConsonant = spelling;
      i += spelling.length;
      continue;
    }

    // Anything else (a digit, an apostrophe) is kept as it is.
    out += rest[0];
    pendingConsonant = false;
    i += 1;
  }
  return out;
}

export function romanToDevanagari(text: string): string {
  return text.replace(/[A-Za-z]+/g, (word) => romanWordToDevanagari(word));
}

