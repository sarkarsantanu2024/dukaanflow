/**
 * One spoken line of the credit book.
 *
 *   "রেখা দি একশো টাকা বাকি"      → Rekha, ₹100, DEBIT
 *   "সুজিত দুশো টাকা দিয়েছে"       → Sujit, ₹200, CREDIT
 *   "बिकाश ने पांच सौ रुपये दिए"    → Bikash, ₹500, CREDIT
 *
 * WHY THE KHATA AND NOT THE ITEM LIST. The item list is the screen an operator
 * can fill in from the console on the shopkeeper's behalf, once. The khata is
 * the one they must write themselves, several times a day, for the life of the
 * shop — and until now it was the most typing-heavy screen in the app with no
 * microphone anywhere on it. A shopkeeper who cannot read words can still say
 * a name and a number.
 *
 * THIS NEVER WRITES ANYTHING ON ITS OWN. It returns a reading; the screen shows
 * it, says it out loud, and waits for a tap. Money posted to the wrong person's
 * account on a mishearing is exactly the argument the khata exists to end.
 *
 * Only customers already in the book can be named. A new customer needs a phone
 * number, and a phone number dictated over a counter is not something to trust
 * to a speech recogniser — that stays on the typed form.
 */

import { wordsToDigits } from './speech';

export type KhataKind = 'DEBIT' | 'CREDIT';

export type SpokenKhataEntry = {
  /** The name as spoken, with honorifics and verbs stripped. */
  name: string;
  amountPaise: number;
  /**
   * Null when nothing in the sentence said which way the money went.
   *
   * Deliberately not guessed. Udhaar is the commoner entry, so a guess would be
   * right most of the time and silently wrong the rest — and "wrong" here means
   * a repayment recorded as a fresh debt, which is the single worst thing this
   * screen can do to a shopkeeper's relationship with a regular. The caller
   * asks instead; it is one more tap and it is never wrong.
   */
  kind: KhataKind | null;
};

/* ------------------------------------------------------------------ */
/* Which way the money went                                            */
/* ------------------------------------------------------------------ */

/** Goods left the shop unpaid — the customer now owes more. */
const DEBIT_WORDS = [
  // Bengali
  'বাকি', 'বাকী', 'ধার', 'ধারে', 'উধার', 'নিয়েছে', 'নিয়েছেন', 'নিলো', 'নিল',
  // Hindi
  'बाकी', 'उधार', 'लिया', 'लिये', 'लिए', 'चढ़ा', 'चढ़ाओ',
  // English and romanised
  'owes', 'owe', 'owed', 'due', 'took', 'taken', 'udhaar', 'udhar', 'baki', 'dhar',
];

/** Money came back — the balance goes down. */
const CREDIT_WORDS = [
  // Bengali
  'দিয়েছে', 'দিয়েছেন', 'দিলো', 'দিল', 'জমা', 'শোধ', 'পরিশোধ', 'ফেরত',
  'পেয়েছি', 'পেলাম', 'মিটিয়ে',
  // Hindi
  'दिया', 'दिये', 'दिए', 'जमा', 'चुकाया', 'चुका', 'वापस', 'मिला', 'मिले', 'भुगतान',
  // English and romanised
  'paid', 'pay', 'gave', 'given', 'settled', 'settle', 'received', 'repaid',
  'jama', 'sodh', 'shodh',
];

/**
 * Words that are neither name nor number and must not survive into the name.
 *
 * "টাকা"/"रुपये"/"rupees" are here as well as in the amount handling, because a
 * sentence can carry the currency without a matched number pattern.
 */
const FILLER_WORDS = [
  'টাকা', 'টাকার', 'রুপি', 'রুপিয়া',
  'रुपये', 'रुपए', 'रूपये', 'टाका', 'रुपया',
  'rupees', 'rupee', 'rupaye', 'rupaiya', 'taka', 'rs', 'rs.', '₹',
  'ke', 'ka', 'ki', 'ne', 'ko', 'का', 'के', 'की', 'ने', 'को',
  'er', 'r', 'এর', 'কে', 'রা',
  'khatay', 'khate', 'খাতায়', 'खाते', 'account',
  'and', 'aar', 'আর', 'और',
];

/**
 * Honorifics and address terms that attach to a name in speech and never
 * appear in the book.
 *
 * "রেখা দি" is how a shopkeeper says the name of the woman written down as
 * "Rekha Das". Left in place, the trailing "দি" drags the match away from her
 * and towards anybody whose name happens to end similarly.
 */
const HONORIFICS = [
  'দি', 'দিদি', 'দা', 'দাদা', 'বাবু', 'ভাই', 'বৌদি', 'কাকু', 'কাকিমা', 'মাসি', 'মেসো',
  'जी', 'भाई', 'दीदी', 'दादा', 'बाबू', 'काका', 'चाचा', 'मौसी',
  'ji', 'bhai', 'didi', 'dada', 'babu', 'da', 'di', 'kaku', 'masi',
];

function stripAll(tokens: string[], words: string[]): string[] {
  const set = new Set(words.map((word) => word.toLowerCase()));
  return tokens.filter((token) => !set.has(token.toLowerCase()));
}

/**
 * Where in the sentence a direction word last appears.
 *
 * The LAST one wins, not the first. "রেখা দি বাকি একশো টাকা দিয়েছে" carries
 * both — the noun for the account and the verb for what just happened — and it
 * is the verb, at the end, that says what to write. Bengali and Hindi both put
 * it there.
 */
function directionOf(tokens: string[]): KhataKind | null {
  const debit = new Set(DEBIT_WORDS.map((word) => word.toLowerCase()));
  const credit = new Set(CREDIT_WORDS.map((word) => word.toLowerCase()));

  let kind: KhataKind | null = null;
  for (const token of tokens) {
    const word = token.toLowerCase();
    if (debit.has(word)) kind = 'DEBIT';
    else if (credit.has(word)) kind = 'CREDIT';
  }
  return kind;
}

/* ------------------------------------------------------------------ */
/* The reading                                                         */
/* ------------------------------------------------------------------ */

/** Punctuation a recogniser sprinkles in, and nothing else. */
function tokenise(text: string): string[] {
  return text
    .replace(/[।,.!?;:'"()\[\]]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function parseSpokenKhata(transcript: string): SpokenKhataEntry | null {
  if (!transcript.trim()) return null;

  // Numbers first: "একশো" and "पांच सौ" have to be digits before anything can
  // look for an amount. `wordsToDigits` already handles Bengali and Devanagari
  // numerals, the শো/सौ hundred-suffix and the সাড়ে/সোয়া fractions.
  const spoken = tokenise(wordsToDigits(transcript));
  if (spoken.length === 0) return null;

  const kind = directionOf(spoken);

  /**
   * The amount is the LAST number in the sentence.
   *
   * A name can carry a number in front of it — a house number, a lane — and the
   * money is what the sentence ends on in all three languages. Taking the first
   * number read "বারো নম্বর রেখা দি একশো টাকা" as ₹12.
   */
  let amount: number | null = null;
  for (const token of spoken) {
    const value = Number(token);
    if (Number.isFinite(value) && value > 0 && /^\d/.test(token)) amount = value;
  }
  if (amount === null) return null;

  // Rupees, spoken. Nobody dictates paise to a credit book, and rounding here
  // rather than at the server keeps the number the owner hears the number that
  // is written.
  const amountPaise = Math.round(amount * 100);
  if (amountPaise < 1) return null;

  const withoutNumbers = spoken.filter((token) => !/^\d+(?:\.\d+)?$/.test(token));
  const name = stripAll(
    stripAll(stripAll(withoutNumbers, DEBIT_WORDS), CREDIT_WORDS),
    [...FILLER_WORDS, ...HONORIFICS],
  )
    .join(' ')
    .trim();

  if (!name) return null;

  return { name, amountPaise, kind };
}

/* ------------------------------------------------------------------ */
/* Finding who was meant                                               */
/* ------------------------------------------------------------------ */

export type MatchableCustomer = { id: string; name: string; phone: string };

export type CustomerMatch<T extends MatchableCustomer = MatchableCustomer> = {
  customer: T;
  confidence: number;
};

/**
 * Enough of a romanisation to compare across scripts.
 *
 * The book may hold "Rekha Das" while the shopkeeper says "রেখা দি" — the
 * operator typed the names in Latin and the owner speaks Bengali, which is the
 * normal case rather than an edge one. Comparing the two as written scores
 * zero on every character.
 *
 * This is NOT a transliteration scheme and is not meant to be readable. It only
 * has to map both scripts onto the same rough alphabet consistently enough for
 * the similarity below to see that রেখা and Rekha are the same word. Vowel
 * marks collapse to their vowel; aspirates keep their h.
 */
/**
 * Every key is quoted, including the ones that look like they need not be.
 *
 * The vowel signs — "া", "ি", "ा" — are Unicode combining marks, and a
 * combining mark cannot begin a JavaScript identifier, so as a bare key it is
 * a syntax error rather than a property. Quoting the whole table keeps the
 * columns aligned and stops the next letter added here from breaking the file.
 */
const ROMAN: Record<string, string> = {
  // Bengali vowels and marks
  'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', 'ৃ': 'ri',
  // Bengali consonants
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'r', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': '', 'ঁ': '', '্': '',
  // Devanagari vowels and marks
  'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri',
  // Devanagari consonants
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'ं': 'ng', 'ः': '', '़': '',
};

function romanise(text: string): string {
  let out = '';
  for (const character of text.toLowerCase()) {
    if (character in ROMAN) out += ROMAN[character];
    else if (/[a-z0-9]/.test(character)) out += character;
    // Everything else — spaces, punctuation, unmapped marks — is dropped, so
    // "রেখা দাস" and "rekhadas" reduce to the same run of letters.
  }
  return out;
}

/**
 * The consonants only, which is what actually survives a change of script.
 *
 * THE INHERENT VOWEL IS THE PROBLEM. In Bengali and Devanagari a bare
 * consonant already carries an "a" that is never written — "অঞ্জলি" is
 * *anjali*, but letter by letter it romanises to "anjli", because the a after
 * the জ exists only by convention. Against a book holding "Anjali Ghosh" that
 * scored 0.43 and the right customer was flagged as a doubtful guess.
 *
 * Reconstructing those vowels correctly means implementing a real
 * transliteration, schwa-deletion rules and all. Throwing ALL the vowels away
 * instead costs nothing and settles the question: "anjli" and "anjalighosh"
 * both reduce to skeletons that line up, and so do every other pair the
 * inherent vowel was breaking.
 */
function skeleton(roman: string): string {
  return roman.replace(/[aeiou]/g, '');
}

/** Character bigrams, for a similarity that tolerates a missing letter. */
function bigrams(text: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < text.length - 1; i += 1) set.add(text.slice(i, i + 2));
  return set;
}

/** Dice coefficient over bigrams: 1 is identical, 0 shares nothing. */
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  // A short name has too few bigrams to score fairly; fall back to a
  // containment test, which is what "Ram" inside "Rampada" needs anyway.
  if (a.length < 3 || b.length < 3) return a.includes(b) || b.includes(a) ? 0.9 : 0;

  const first = bigrams(a);
  const second = bigrams(b);
  let shared = 0;
  for (const gram of first) if (second.has(gram)) shared += 1;
  return (2 * shared) / (first.size + second.size);
}

/** Above this, act on the match without a second thought. */
export const KHATA_CONFIDENT = 0.72;

/**
 * Below this, the book does not contain who was meant, and saying so is the
 * only honest answer.
 *
 * There is ALWAYS a best match — with four names in a book, one of them scores
 * highest even when the owner said somebody else's name entirely. Offering it
 * is how "রঞ্জন একশো টাকা বাকি" came back proposing Anjali Ghosh at 0.15, and
 * a tired shopkeeper tapping the tick out of habit puts Ranjan's hundred rupees
 * on Anjali's account. A floor turns that into "nobody by that name", which is
 * true, and which sends them to the typed form where a new customer belongs.
 */
export const KHATA_PLAUSIBLE = 0.45;

/**
 * The person most likely to have been meant, or null.
 *
 * Honorifics are stripped from the stored name too — a book can perfectly well
 * hold "Rekha Di" — so the two sides are compared on the same footing.
 */
export function matchCustomer<T extends MatchableCustomer>(
  spokenName: string,
  customers: T[],
): CustomerMatch<T> | null {
  const said = romanise(stripAll(tokenise(spokenName), HONORIFICS).join(' '));
  if (!said) return null;

  let best: CustomerMatch<T> | null = null;

  for (const customer of customers) {
    if (!customer.name.trim()) continue;
    const stored = romanise(stripAll(tokenise(customer.name), HONORIFICS).join(' '));
    if (!stored) continue;

    // A first name on its own is how anybody is addressed across a counter, so
    // "Rekha" must reach "Rekha Das" at full strength rather than being
    // penalised for the surname it did not say. Tested on the skeletons too,
    // because that is the comparison the inherent vowel does not spoil.
    const saidBones = skeleton(said);
    const storedBones = skeleton(stored);

    const contained =
      stored.startsWith(said) ||
      said.startsWith(stored) ||
      (saidBones.length >= 2 &&
        (storedBones.startsWith(saidBones) || saidBones.startsWith(storedBones)));

    const confidence = contained
      ? Math.max(0.9, similarity(said, stored))
      : Math.max(similarity(said, stored), similarity(saidBones, storedBones));

    if (!best || confidence > best.confidence) best = { customer, confidence };
  }

  // A best guess that is not even plausible is not a match — see KHATA_PLAUSIBLE.
  return best && best.confidence >= KHATA_PLAUSIBLE ? best : null;
}

/**
 * The recogniser's guesses, best first, resolved against the book.
 *
 * Every alternative is tried rather than only the top one: on an unclear
 * speaker — which is most speakers, in a shop, with a road outside — the first
 * reading is often wrong where the third is exactly right. The first one that
 * both parses AND names somebody in the book wins.
 */
export function resolveSpokenKhata<T extends MatchableCustomer>(
  alternatives: string[],
  customers: T[],
): { entry: SpokenKhataEntry; match: CustomerMatch<T> } | null {
  let fallback: { entry: SpokenKhataEntry; match: CustomerMatch<T> } | null = null;

  for (const transcript of alternatives) {
    const entry = parseSpokenKhata(transcript);
    if (!entry) continue;

    const match = matchCustomer(entry.name, customers);
    if (!match) continue;

    if (match.confidence >= KHATA_CONFIDENT) return { entry, match };
    // Keep the best near-miss: the screen can still offer it for confirmation
    // rather than making the owner start the sentence again.
    if (!fallback || match.confidence > fallback.match.confidence) fallback = { entry, match };
  }

  return fallback;
}
