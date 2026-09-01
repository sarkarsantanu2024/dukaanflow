/**
 * Turns a spoken sentence into structured data.
 *
 * Two callers, two shapes:
 *   shopkeeper — "rice one kg sixty eight rupees"  → { name, unit, price }
 *   customer   — "two kg rice and one packet salt" → [{ item, quantity }]
 *
 * Everything here is pure string work so it can run on either side and stay
 * testable; the browser Speech APIs live in `components/voice/useVoice.ts`.
 */

import { splitNameAndUnit } from '@/lib/bulk';
import {
  MIN_LOOSE_BASE,
  amountLabel,
  comparableMeasures,
  formatMeasure,
  isLooseUnit,
  parseMeasure,
  quantityFromBase,
  roundQuantity,
  type Measure,
} from '@/lib/units';

/** Recognition locales offered in the mic UI. Value is a BCP-47 tag. */
export const VOICE_LANGS = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'हिंदी' },
  { value: 'bn-IN', label: 'বাংলা' },
] as const;

export type VoiceLang = (typeof VOICE_LANGS)[number]['value'];

/**
 * Words the recogniser may return instead of digits. Indian-language number
 * words above twenty are irregular (68 = अड़सठ, not "sixty eight"), so only the
 * small ones are listed — beyond that the recogniser itself usually emits
 * digits, and the mic hint tells the speaker to say the price as digits.
 */
const WORD_UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
  // Hindi / Bengali, Devanagari and Bangla script plus common romanisations.
  एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5, छह: 6, सात: 7, आठ: 8,
  नौ: 9, दस: 10,
  এক: 1, দুই: 2, তিন: 3, চার: 4, পাঁচ: 5, ছয়: 6, সাত: 7, আট: 8, নয়: 9, দশ: 10,
  ek: 1, do: 2, dui: 2, teen: 3, tin: 3, char: 4, paanch: 5, panch: 5,
  chhe: 6, choy: 6, chhoy: 6, saat: 7, aath: 8, aat: 8, nau: 9, noy: 9,
  das: 10, dosh: 10,

  // HOW PEOPLE ACTUALLY COUNT OUT LOUD.
  //
  // The formal numerals above are what a textbook lists and not what anybody
  // says at a counter. A Bengali speaker asks for "দু কেজি চাল", almost never
  // "দুই কেজি চাল" — so `দুই` alone matched nothing, the quantity fell through
  // to the default of 1, and two kilos of rice went into the cart as one.
  //
  // Counting things rather than measuring them takes a classifier suffix —
  // -টা, -টি, -টে, -খানা — and each of those is a separate spoken word the
  // recogniser hands back whole, so each needs its own entry.
  //
  // Matching is per whitespace-separated token (see `wordsToDigits`), so these
  // cannot corrupt a longer word that merely starts the same way: `দু` never
  // matches inside `দুধ` (milk) or `দুপুর` (afternoon).
  দু: 2, দুটো: 2, দুটি: 2, দুটা: 2, দুখানা: 2,
  একটা: 1, একটি: 1, একখানা: 1,
  তিনটে: 3, তিনটি: 3, তিনটা: 3,
  চারটে: 4, চারটি: 4, চারটা: 4,
  পাঁচটা: 5, পাঁচটি: 5, পাঁচটে: 5,
  ছটা: 6, ছয়টা: 6, সাতটা: 7, আটটা: 8, নয়টা: 9, দশটা: 10,
  // Hindi counts the same way with -ठो/-ठा in the east, and these are the
  // spellings the recogniser returns most often.
  दोनों: 2, एकटा: 1,
  // Roman, for when the recogniser transliterates rather than scripts it.
  du: 2, duto: 2, duti: 2, duta: 2, dute: 2,
  ekta: 1, ekti: 1, ekkhana: 1,
  tinte: 3, tinti: 3, tinta: 3,
  charte: 4, charti: 4, charta: 4,
  panchta: 5, panchti: 5,
};

const WORD_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

const WORD_SCALES: Record<string, number> = {
  hundred: 100, thousand: 1000,
  // "দেড়শো গ্রাম" is a hundred and fifty grams, and a shopper says it far more
  // often than "একশো পঞ্চাশ". The fraction words below carry the 1.5; this is
  // the "শো" they attach to.
  শো: 100, শ: 100, শত: 100, sho: 100,
  सौ: 100, hazar: 1000, হাজার: 1000, हज़ार: 1000, हजार: 1000,
};

/**
 * The "শো" suffix, for the tokens that arrive with it already glued on.
 *
 * A recogniser hands back দেড়শো as one word, not as দেড় followed by শো, so a
 * per-token lookup misses it entirely. Split before looking up.
 */
const HUNDRED_SUFFIX = /^(.+?)(শো|শত|শ|sho|सौ)$/;

/**
 * HOW HALF A KILO IS ACTUALLY ASKED FOR.
 *
 * Nothing in this file could read a fraction, and fractions are how everybody
 * in this market buys: দেড় কেজি চিনি, আধা লিটার তেল, আড়াইশো গ্রাম ডাল, सवा
 * किलो आटा. Every one of those fell through to the default quantity of one, so
 * a shopper asking for half a kilo got a whole one and a shopper asking for
 * two and a half kilos got one.
 *
 * Two kinds of word:
 *
 *   standalone — দেড় (1.5), আড়াই (2.5), আধা (0.5), পোয়া (0.25). A number in
 *   their own right, and the commonest of the lot.
 *
 *   modifier — সাড়ে X (X + 0.5), সোয়া X (X + 0.25), পৌনে X (X − 0.25). These
 *   sit BEFORE the number they change, which is why they are handled as a
 *   pending offset rather than as a value.
 */
const WORD_FRACTIONS: Record<string, number> = {
  half: 0.5, quarter: 0.25,
  aadha: 0.5, adha: 0.5, adhaa: 0.5,
  আধা: 0.5, আধ: 0.5, হাফ: 0.5, আধেক: 0.5,
  आधा: 0.5, आधी: 0.5, आध: 0.5,
  // 1.5 and 2.5 have single words in both languages, and no compound form.
  দেড়: 1.5, দেড়টা: 1.5, der: 1.5, derh: 1.5,
  डेढ़: 1.5, डेढ: 1.5, dedh: 1.5,
  আড়াই: 2.5, arai: 2.5, aarai: 2.5,
  ঢাই: 2.5, ढाई: 2.5,
  // A "poya" is a quarter — a quarter kilo at a kirana counter.
  পোয়া: 0.25, poya: 0.25, পৌয়া: 0.25,
};

/** Modifiers that adjust the number that FOLLOWS them. */
const WORD_FRACTION_PREFIX: Record<string, number> = {
  সাড়ে: 0.5, sare: 0.5, saare: 0.5, সারে: 0.5,
  साढ़े: 0.5, साढे: 0.5, sadhe: 0.5,
  // NOT "soya": that is the soyabean this shop sells, and reading it as a
  // quarter would turn an order for সয়াবিন into a quarter of a bean.
  সোয়া: 0.25, सवा: 0.25, sawa: 0.25, sava: 0.25,
  পৌনে: -0.25, poune: -0.25, পোনে: -0.25, पौने: -0.25, paune: -0.25,
};

/** Digits in Devanagari (०-९) and Bengali (০-৯) become ASCII. */
function normaliseDigits(text: string): string {
  return text.replace(/[०-९০-৯]/g, (char) => {
    const code = char.codePointAt(0)!;
    const base = code >= 0x09e6 ? 0x09e6 : 0x0966;
    return String(code - base);
  });
}

/**
 * What one token is worth as a number, or null when it is an ordinary word.
 *
 * Handles the glued-together forms a recogniser produces: দেড়শো is 150, not a
 * word it has never seen.
 */
function tokenValue(word: string): number | null {
  if (word in WORD_UNITS) return WORD_UNITS[word]!;
  if (word in WORD_TENS) return WORD_TENS[word]!;
  if (word in WORD_FRACTIONS) return WORD_FRACTIONS[word]!;

  const hundred = word.match(HUNDRED_SUFFIX);
  if (hundred) {
    const stem = hundred[1]!;
    const value =
      stem in WORD_FRACTIONS ? WORD_FRACTIONS[stem]! :
      stem in WORD_UNITS ? WORD_UNITS[stem]! :
      stem in WORD_TENS ? WORD_TENS[stem]! : null;
    if (value !== null) return value * 100;
  }

  return null;
}

/** Kills the floating-point tail: 0.30000000000000004 is not a quantity. */
function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Collapses runs of number words into digits: "sixty eight" → "68",
 * "two hundred fifty" → "250", "সাড়ে তিন" → "3.5", "আড়াইশো" → "250".
 * Non-number words pass through untouched.
 */
export function wordsToDigits(text: string): string {
  const tokens = normaliseDigits(text).split(/\s+/);
  const output: string[] = [];
  // A pending run: `total` holds completed scales, `current` the part being built.
  let total = 0;
  let current = 0;
  let open = false;
  /**
   * A "সাড়ে"/"সোয়া"/"পৌনে" waiting for its number. Applied when the number
   * arrives, and — if none does — spent on its own, because "সাড়ে" alone in
   * front of a unit ("সাড়ে কেজি") is nobody's sentence but "আধা" is, and both
   * arrive here the same way.
   */
  let pending: number | null = null;

  function flush() {
    if (open) {
      let value = total + current;
      if (pending !== null) value += pending;
      output.push(String(round3(value)));
    } else if (pending !== null) {
      // A modifier with nothing to modify: "সাড়ে" on its own means one and a
      // half of whatever follows.
      output.push(String(round3(1 + pending)));
    }
    total = 0;
    current = 0;
    open = false;
    pending = null;
  }

  for (const token of tokens) {
    // Punctuation goes, EXCEPT a full stop between two digits — that is a
    // decimal point, and stripping it turned "1.5 kg" into fifteen kilos.
    const word = token
      .toLowerCase()
      .replace(/[,!?]/g, '')
      .replace(/(?<!\d)\.|\.(?!\d)/g, '');
    // "one hundred and five", "one and a half kg" — both join two numbers.
    if ((word === 'and' || word === 'a') && open) continue;

    // "সাড়ে তিন কেজি" — the modifier comes first and waits.
    if (word in WORD_FRACTION_PREFIX) {
      flush();
      pending = WORD_FRACTION_PREFIX[word]!;
      continue;
    }

    // A spoken decimal the recogniser already wrote as digits: "1.5 kg".
    if (/^\d+(?:\.\d+)?$/.test(word)) {
      current += Number(word);
      open = true;
      continue;
    }

    const value = tokenValue(word);
    if (value !== null) {
      current += value;
      open = true;
    } else if (word in WORD_SCALES) {
      const scale = WORD_SCALES[word]!;
      // "hundred" with nothing before it means one hundred; "দেড়" before it
      // means a hundred and fifty.
      current = (current || 1) * scale;
      if (pending !== null) {
        // "সাড়ে তিনশো" is 350, not 300.5 — the modifier scales with the number.
        current += pending * scale;
        pending = null;
      }
      if (scale === 1000) {
        total += current;
        current = 0;
      }
      open = true;
    } else {
      flush();
      output.push(token);
    }
  }
  flush();
  return output.join(' ');
}

/** Filler the speaker says before the actual item, in all three languages. */
const LEAD_FILLER =
  /^(?:ok(?:ay)?|hey|please|add|new|item|list|likho|likh do|jodo|jod do|daal do|dalo|ente?r|register|साथ|जोड़ो|जोड़ दो|लिखो|নতুন|যোগ করো|লেখো)\s+/i;

/**
 * The same words, said at the END of the sentence.
 *
 * "Mustard oil add" and "সরিষার তেল যোগ করো" put the verb last, which is the
 * natural order in Hindi and Bengali and common enough in Indian English. Only
 * the leading form was stripped, so the verb stayed in the name and the shop
 * ended up listing a product called "Mustard Oil Add".
 *
 * Removal and stock verbs are not here — those are commands with their own
 * handling, and they are matched anywhere in the sentence already.
 */
const TRAIL_FILLER =
  /\s+(?:add|save|please|kar do|kardo|karo|likho|likh do|jodo|jod do|daal do|dalo|जोड़ो|जोड़ दो|जोड़ दीजिए|लिखो|डालो|कर दो|ऐड|যোগ করো|যোগ কর|যোগ|লেখো|লিখুন|দাও)$/i;

const CURRENCY_BEFORE = /(?:₹|rs\.?|rupees?|rupaye|rupaiya|rupya|taka|टाका|रुपये|रुपए|টাকা)\s*(\d+(?:\.\d+)?)/i;
const CURRENCY_AFTER = /(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees?|rupaye|rupaiya|rupya|taka|टाका|रुपये|रुपए|টাকা|\/-)/i;

/** Unit words — a number followed by one of these is a size, never a price. */
const UNIT_WORD =
  /^(?:kg|kgs|kilo|kilos|kilogram|kilograms|g|gm|gms|gram|grams|l|ltr|litre|liter|litres|liters|ml|pc|pcs|piece|pieces|packet|packets|pack|packs|plate|plates|cup|cups|dozen|box|boxes|bottle|bottles|किलो|ग्राम|लीटर|पैकेट|কেজি|গ্রাম|লিটার|প্যাকেট|কিলো|কিলোগ্রাম|পিস|বোতল|কাপ|প্লেট|किलोग्राम|टुकड़ा|कप|बोतल|प्लेट)$/i;

/** Spoken unit words normalised to what the item list already uses. */
const UNIT_ALIASES: Record<string, string> = {
  kgs: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
  किलो: 'kg', কেজি: 'kg',
  gm: 'g', gms: 'g', gram: 'g', grams: 'g', ग्राम: 'g', গ্রাম: 'g',
  ltr: 'l', litre: 'l', liter: 'l', litres: 'l', liters: 'l',
  लीटर: 'l', লিটার: 'l',
  pcs: 'pc', piece: 'pc', pieces: 'pc',
  packets: 'packet', packs: 'pack', पैकेट: 'packet', প্যাকেট: 'packet',
  // What people actually say. "কিলো" is far commoner at a counter than the
  // formal "কেজি", and without it a spoken pack size matched nothing and ended
  // up glued onto the product's name.
  কিলো: 'kg', কিলোগ্রাম: 'kg', किलोग्राम: 'kg',
  পিস: 'pc', टुकड़ा: 'pc',
  বোতল: 'bottle', মোতল: 'bottle', बोतल: 'bottle',
  কাপ: 'cup', कप: 'cup', প্লেট: 'plate', प्लेट: 'plate',
};

function canonicaliseUnit(unit: string): string {
  return unit
    .split(/\s+/)
    .map((part) => UNIT_ALIASES[part.toLowerCase()] ?? part)
    .join(' ')
    .trim();
}

export type SpokenListing = {
  name: string;
  unit: string;
  /** PAISE, or null when the speaker did not say a price. */
  pricePaise: number | null;
  category: string;
};

/**
 * Everything one spoken sentence says about an item.
 *
 * THIS REPLACES A PARSER THAT DELIBERATELY THREW TWO THIRDS OF IT AWAY.
 *
 * Listing by voice used to keep the name and discard the rest, on the reasoning
 * that a price saved unseen is a price nobody checked. The reasoning was sound
 * and the conclusion was not: the sentence a shopkeeper actually says is
 * "বাসমতি চাল ১০০ টাকা কিলো", and answering it with the word "চাল" in a box and
 * two empty fields throws away work they already did out loud, then asks them
 * to do it again by hand. Nothing is saved unseen either way — the form is the
 * confirmation, and it is better filled in than blank.
 *
 * A missing price is now `null` rather than a reason to reject the sentence, so
 * "চাল" alone still lists rice and simply leaves the price for the owner.
 */
export function parseSpokenListing(transcript: string): SpokenListing | null {
  let text = wordsToDigits(transcript.trim().replace(/[।॥]+/g, ' ').replace(/\s+/g, ' '));
  // Both ends, and repeatedly: "add rice add" is one sentence a person says.
  text = text.replace(LEAD_FILLER, '').trim();
  let trimmed = text.replace(TRAIL_FILLER, '').trim();
  while (trimmed !== text && trimmed) {
    text = trimmed;
    trimmed = text.replace(TRAIL_FILLER, '').trim();
  }
  if (!text) return null;

  // "rice 1 kg 68 in staples" — an explicit category tail.
  let category = '';
  const categoryMatch = text.match(
    /\s+(?:in|under|category|categories|श्रेणी|विभाग|ক্যাটাগরি)\s+([^\d]+)$/i,
  );
  if (categoryMatch) {
    category = categoryMatch[1]!.trim();
    text = text.slice(0, categoryMatch.index).trim();
  }

  let rupees: number | null = null;

  const explicit = text.match(CURRENCY_BEFORE) ?? text.match(CURRENCY_AFTER);
  if (explicit) {
    rupees = Number(explicit[1]);
    text = (text.slice(0, explicit.index) + ' ' + text.slice(explicit.index! + explicit[0].length)).trim();
  } else {
    // No currency word: the price is the last number that is not a size, i.e.
    // not followed by a unit word. "rice 1 kg 68" → 68, never 1.
    const numbers = [...text.matchAll(/\d+(?:\.\d+)?/g)];
    for (let i = numbers.length - 1; i >= 0; i -= 1) {
      const match = numbers[i]!;
      const after = text.slice(match.index! + match[0].length).trim().split(/\s+/)[0] ?? '';
      if (UNIT_WORD.test(after)) continue;
      rupees = Number(match[0]);
      text = (text.slice(0, match.index) + ' ' + text.slice(match.index! + match[0].length)).trim();
      break;
    }
  }

  // Out of range is not a price. Better to hand the owner an empty box than a
  // number the recogniser invented out of a mishearing.
  let pricePaise: number | null = null;
  if (rupees !== null && Number.isFinite(rupees) && rupees >= 0.5 && rupees <= 100000) {
    pricePaise = Math.round(rupees * 100);
  }

  const label = text
    // "…per kilo", "…প্রতি কেজি", "…किलो के हिसाब से" — the words that join a
    // price to a pack size, left behind once the price itself is lifted out.
    .replace(/\s+(?:per|each|prati|প্রতি|प्रति|ke hisab se|के हिसाब से)\s+/gi, ' ')
    .replace(/\s+(?:at|for|ka|ki|ke|का|की|के|দাম|price)\s*$/i, '')
    .replace(/[.,]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!label) return null;

  // splitNameAndUnit only recognises canonical unit spellings, so normalise
  // "one kilo" → "1 kg" before handing the label over.
  const canonical = canonicaliseUnit(label);
  let { name, unit } = splitNameAndUnit(canonical);

  /**
   * A pack size said without a number.
   *
   * "১০০ টাকা কিলো" is a price per kilo, and once the price is lifted out what
   * remains is "চাল kg" — a unit with nothing in front of it, which
   * `splitNameAndUnit` does not recognise because it expects "1 kg". Saying
   * "kilo" and meaning "one kilo" is how everyone talks, so a bare trailing
   * unit becomes a quantity of one rather than part of the product's name.
   */
  if (!unit) {
    // `\p{M}` too: an Indic unit word ends in a vowel sign more often than not,
    // and a letters-only run stops before it.
    const bare = name.match(/\s+([\p{L}\p{M}]+)$/u);
    if (bare && UNIT_WORD.test(bare[1]!)) {
      unit = canonicaliseUnit(`1 ${bare[1]!}`);
      name = name.slice(0, bare.index).trim();
    }
  }

  if (!name) return null;

  // "1kg" and "1 kg" are one pack size. `normaliseUnit` does this on the way
  // into the database; the draft has to agree or the form offers a unit that
  // will not resolve onto the row the owner meant.
  unit = unit.replace(/(\d)\s*([a-z])/gi, '$1 $2').replace(/\s+/g, ' ').trim();

  // A serving is never written as a decimal. "Chowmein half plate 40" now
  // reads its "half" as a number, which is right everywhere except here: the
  // unit list a shopkeeper picks from says "half plate", not "0.5 plate", and
  // two spellings of one serving would list the dish twice.
  unit = unit.replace(/^0\.5\s+(plate|bowl|glass|cup)$/i, 'half $1');

  return { name: titleCase(name), unit, pricePaise, category: category ? titleCase(category) : '' };
}

function titleCase(text: string): string {
  return text.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

const YES_WORDS = new Set([
  'yes', 'yeah', 'yep', 'yup', 'ok', 'okay', 'right', 'correct', 'sure',
  'haan', 'han', 'ha', 'haa', 'theek', 'thik', 'sahi',
  'हाँ', 'हां', 'ठीक', 'सही',
  'হ্যাঁ', 'হ্যা', 'হা', 'ঠিক',
]);

const NO_WORDS = new Set([
  'no', 'nope', 'nah', 'wrong', 'cancel',
  'nahi', 'nahin', 'na', 'galat',
  'नहीं', 'ना', 'गलत',
  'না', 'ভুল', 'বাতিল',
]);

/**
 * Reads a yes/no answer out of a confirmation reply, in any of the three
 * languages. Returns null when the reply was neither, so the caller can keep
 * waiting rather than guessing at an answer it did not get.
 */
export function spokenYesNo(alternatives: string[]): 'yes' | 'no' | null {
  for (const alternative of alternatives) {
    for (const token of tokens(alternative)) {
      if (YES_WORDS.has(token)) return 'yes';
      if (NO_WORDS.has(token)) return 'no';
    }
    // Two-letter words are dropped by `tokens`; "na"/"ha" still mean something.
    const bare = alternative.trim().toLowerCase();
    if (YES_WORDS.has(bare)) return 'yes';
    if (NO_WORDS.has(bare)) return 'no';
  }
  return null;
}

export type SpokenItemDraft = {
  name: string;
  nameHi: string;
  nameBn: string;
  category: string;
  /** The pack size the speaker said, or '' when they did not say one. */
  unit: string;
  /** The price the speaker said, in PAISE, or null when they did not say one. */
  pricePaise: number | null;
  /** An item already on the list that this almost certainly refers to. */
  matched: MatchableItem | null;
  /** 1 when nothing similar exists; otherwise how sure the `matched` link is. */
  confidence: number;
};

/**
 * Turns what the shopkeeper said into a ready-to-save item.
 *
 * Three things happen here that plain parsing does not do, and together they
 * are what stop voice entry from quietly creating rubbish:
 *
 * 1. Every alternative the recogniser offered is tried, and the reading that
 *    resolves to an item already on the list wins. "Rise 1 kg 68" becomes a
 *    price update to Rice rather than a new product spelled wrong.
 * 2. Known names are filled in for all three languages, so a shop stocked by
 *    voice in Hindi still reads correctly to a Bengali customer.
 * 3. A near-but-not-certain match is returned with its confidence rather than
 *    acted on, so the caller can ask before saving.
 */
export function resolveSpokenItem(
  alternatives: string[],
  lang: VoiceLang,
  existing: MatchableItem[],
): SpokenItemDraft | null {
  let best: SpokenItemDraft | null = null;

  for (const transcript of alternatives) {
    const parsed = parseSpokenListing(transcript);
    if (!parsed) continue;

    const match = bestMatch(parsed.name, existing);
    const confidence = match?.confidence ?? 0;

    const draft: SpokenItemDraft = {
      ...namesFor(parsed.name, lang),
      category: parsed.category,
      unit: parsed.unit,
      pricePaise: parsed.pricePaise,
      matched: confidence >= UNSURE_MATCH ? match!.item : null,
      confidence: confidence >= UNSURE_MATCH ? confidence : 1,
    };

    // An alternative that lands on an existing item beats one that would
    // create a new one — that is usually the recogniser's mishearing.
    if (!best || confidence > (best.matched ? best.confidence : 0)) best = draft;
    if (confidence >= CONFIDENT_MATCH) break;
  }

  if (!best) return null;

  // A confident link to an existing item means this is that item: adopt its
  // exact names so the upsert updates the row instead of creating a twin.
  if (best.matched && best.confidence >= CONFIDENT_MATCH) {
    best.name = best.matched.name;
    best.nameHi = best.matched.nameHi ?? '';
    best.nameBn = best.matched.nameBn ?? '';
  }

  return best;
}

/* ------------------------------------------------------------------ */
/* Spoken commands: add / re-price, remove, stock                      */
/* ------------------------------------------------------------------ */

/**
 * Verbs the shopkeeper uses, in all three languages. Each is matched as a
 * whole word against the sentence, and stripped before the rest is resolved
 * against the item list.
 */
const DELETE_WORDS = [
  'remove', 'delete', 'drop',
  'hatao', 'hata do', 'hatado', 'nikalo', 'nikal do', 'mitao', 'mita do',
  'हटाओ', 'हटा दो', 'निकालो', 'निकाल दो', 'मिटाओ', 'हटाइए',
  'muche dao', 'mure dao', 'bad dao', 'sorao', 'delete karo',
  // Recognisers run words together at least as often as they separate them,
  // so the joined spellings are listed beside the spaced ones — and the bare
  // stem too, which is distinctive on its own and is what a shopkeeper in a
  // hurry actually says.
  'মুছে দাও', 'মুছেদাও', 'মুছে', 'মুছুন', 'মুছবেন',
  'বাদ দাও', 'বাদদাও', 'সরাও', 'সরিয়ে দাও', 'সরিয়েদাও', 'ডিলিট',
  'हटादो', 'डिलीट', 'मिटा दो', 'मिटादो',
];

const OUT_OF_STOCK_WORDS = [
  'out of stock', 'stock out', 'out', 'finished', 'over', 'sold out',
  'khatam', 'khatm', 'khtm', 'nahi hai', 'shesh', 'nei',
  'खत्म', 'ख़त्म', 'नहीं है', 'स्टॉक खत्म',
  'শেষ', 'নেই', 'ফুরিয়ে গেছে',
];

const IN_STOCK_WORDS = [
  'in stock', 'stock in', 'back in stock', 'available', 'restock',
  'aa gaya', 'aagaya', 'hai', 'stock aa gaya',
  'आ गया', 'स्टॉक आ गया', 'उपलब्ध',
  'এসে গেছে', 'আছে', 'স্টক আছে',
];

export type VoiceCommand =
  | { kind: 'upsert'; draft: SpokenItemDraft; needsConfirm: boolean; label: string }
  /**
   * Named something already on the list, and said nothing else about it.
   *
   * Reported rather than saved: a bare name is not an instruction to change
   * anything, and re-saving would reset a price the owner had already chosen.
   * Saying a price along with the name is a different sentence and re-prices
   * the row — see the `upsert` branch below.
   */
  | { kind: 'exists'; item: MatchableItem; needsConfirm: false; label: string }
  | { kind: 'delete'; item: MatchableItem; needsConfirm: true; label: string }
  | { kind: 'stock'; item: MatchableItem; inStock: boolean; needsConfirm: boolean; label: string }
  /**
   * A clear instruction about an item this shop does not have — "remove rice"
   * in a shop with no rice, "চিনি শেষ" where the sugar is spelled some other
   * way. Reported as its own outcome rather than as a failure to understand,
   * because the two need opposite fixes from the speaker: one is "say it again
   * more clearly", the other is "that is not on your list".
   */
  | { kind: 'missing'; needsConfirm: false; label: string };

/** Longest phrase first, so "out of stock" wins over the bare "out". */
function matchVerb(text: string, words: string[]): { rest: string } | null {
  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    const pattern = new RegExp(`(^|\\s)${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
    if (pattern.test(text)) return { rest: text.replace(pattern, ' ').replace(/\s+/g, ' ').trim() };
  }
  return null;
}

function labelFor(item: { name: string; unit?: string }): string {
  return item.unit ? `${item.name} · ${item.unit}` : item.name;
}

/**
 * Works out what the shopkeeper wants done, not just what item they named.
 *
 * "rice one kg 68" prices an item, "remove rice" takes one off the list,
 * "rice khatam" marks it out of stock. Removal always asks first — it is the
 * one action here that cannot be undone by saying the sentence again.
 */
export function resolveSpokenCommand(
  alternatives: string[],
  lang: VoiceLang,
  existing: MatchableItem[],
): VoiceCommand | null {
  // Set when a sentence clearly gave an instruction about an item we could not
  // find. Such a sentence must never reach the add path: "মুছে দাও" with no
  // match once created an item *named* "মুছে দাও", priced at whatever number
  // was nearby. A command that misses is a command that failed, not a product.
  let commandMissed = false;
  /** What the speaker seemed to be naming, for the "not on your list" reply. */
  let missedLabel = '';

  for (const transcript of alternatives) {
    // Two things have to happen before a verb can be recognised, and the order
    // matters more than it looks.
    //
    // Punctuation first: a Bengali danda or a full stop sitting against the
    // verb defeated a match that required whitespace on both sides.
    //
    // And *no* number conversion. "हटा दो" is Hindi for "remove it", but दो is
    // also the word for two — running digits first turned the sentence into
    // "हटा 2" and the verb stopped existing. Every Hindi removal phrase ends in
    // दो, so this silently broke removal in Hindi entirely. Nothing in a verb
    // or stock phrase is a number, and the item match that follows does not
    // need digits either.
    const text = transcript
      .trim()
      .replace(/[।॥.,!?;:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    const removal = matchVerb(text, DELETE_WORDS);
    if (removal) {
      const match = bestMatch(removal.rest, existing);
      if (match && match.confidence >= UNSURE_MATCH) {
        return { kind: 'delete', item: match.item, needsConfirm: true, label: labelFor(match.item) };
      }
      commandMissed = true;
      missedLabel ||= removal.rest;
      continue;
    }

    // Stock changes only make sense for something already listed, so a miss
    // falls through to the add path rather than inventing an item.
    for (const [words, inStock] of [
      [OUT_OF_STOCK_WORDS, false],
      [IN_STOCK_WORDS, true],
    ] as const) {
      const stock = matchVerb(text, words);
      if (!stock) continue;
      const match = bestMatch(stock.rest, existing);
      if (!match || match.confidence < UNSURE_MATCH) {
        commandMissed = true;
        missedLabel ||= stock.rest;
      }
      if (match && match.confidence >= UNSURE_MATCH) {
        return {
          kind: 'stock',
          item: match.item,
          inStock,
          needsConfirm: match.confidence < CONFIDENT_MATCH,
          label: labelFor(match.item),
        };
      }
    }
  }

  // Said "remove X" or "X is finished" about something not on the list. Adding
  // X would be the opposite of what was asked for.
  if (commandMissed) {
    return { kind: 'missing', needsConfirm: false, label: titleCase(missedLabel.trim()) };
  }

  const draft = resolveSpokenItem(alternatives, lang, existing);
  if (!draft) return null;

  /**
   * Already stocked, and the speaker said nothing but its name: say so and
   * change nothing. The price and pack size on that row are the owner's.
   *
   * A price in the sentence flips that. "Rice 1 kg 100" about rice the shop
   * already lists is the commonest thing a shopkeeper says to this — it is how
   * they re-price — and answering "already on your list" makes the mic look
   * broken to the one person using it correctly. With a price it falls through
   * to the upsert below, which the API resolves onto the existing row.
   */
  if (draft.matched && draft.confidence >= CONFIDENT_MATCH && draft.pricePaise === null) {
    return { kind: 'exists', item: draft.matched, needsConfirm: false, label: labelFor(draft.matched) };
  }

  /**
   * Every new item is read back before it is written, not only the ones that
   * looked like a near-miss for something already listed.
   *
   * This used to confirm only when the sentence half-matched an existing item,
   * which meant the one case with no safety net at all was the one that creates
   * something: a shop floor's worth of background talk, a customer's question,
   * a radio — any of it could land in the list as a product, and the owner
   * found out later by scrolling. A recogniser that is right nine times in ten
   * still writes rubbish once in ten if nothing asks first, and an owner who
   * has seen it do that once stops trusting the mic entirely.
   *
   * The cost is one spoken "yes" per item. That is cheap next to a catalogue
   * the owner cannot trust.
   */
  return {
    kind: 'upsert',
    draft,
    needsConfirm: true,
    /**
     * WHAT WILL BE SAVED, not what it nearly matched.
     *
     * This read `draft.matched ?? draft`, so a sentence that only half-matched
     * an existing row was read back under that row's name: "Chandramukhi aloo"
     * asked "Potato · 1 kg?" and then created an item called Chandramukhi Aloo
     * when the owner said yes. The confirmation has to name the thing it is
     * confirming, and the only time that is the existing row is when the match
     * was certain enough to be a re-pricing of it.
     */
    label:
      draft.matched && draft.confidence >= CONFIDENT_MATCH
        ? labelFor(draft.matched)
        : labelFor(draft),
  };
}

/**
 * Fills in the other two languages when the name is one we know, and otherwise
 * records what was said under the language it was said in.
 */
function namesFor(spoken: string, lang: VoiceLang): { name: string; nameHi: string; nameBn: string } {
  const known = suggestNames(spoken);
  if (known) return { name: known.en, nameHi: known.hi, nameBn: known.bn };

  return {
    // The primary name is what the customer sees when their language is blank,
    // so it always holds something.
    name: spoken,
    nameHi: lang === 'hi-IN' ? spoken : '',
    nameBn: lang === 'bn-IN' ? spoken : '',
  };
}

/* ------------------------------------------------------------------ */
/* Customer side                                                       */
/* ------------------------------------------------------------------ */

export type MatchableItem = {
  id: string;
  name: string;
  unit: string;
  /** The same item's name in the other two languages, when it has one. */
  nameHi?: string;
  nameBn?: string;
  /**
   * Whether the shop can sell any amount of this, or only whole units.
   *
   * The caller decides — it is the same test the storefront's amount picker and
   * the order route use (`sellsAnyAmount`), and speech must not reach a
   * different answer from either. Left out, only the unit is consulted.
   */
  loose?: boolean;
};

export type SpokenOrderLine = {
  id: string;
  quantity: number;
  phrase: string;
  confidence: number;
  /**
   * The amount the shopper actually asked for, when they said one — "250 g",
   * "1.5 kg" — as opposed to the number of packs that fits it. Null when they
   * named no amount at all, which is most orders.
   */
  requested: string | null;
  /**
   * Whether `quantity` packs come to exactly `requested`.
   *
   * False means the shop does not sell in a size that adds up to what was
   * asked — 250 g of sugar sold by the kilo — and the caller must ask before
   * putting it in the basket rather than quietly rounding somebody's order up
   * by four times.
   */
  exact: boolean;
};

export type SpokenOrderResult = {
  /** Confident enough to add straight to the cart. */
  lines: SpokenOrderLine[];
  /** Heard something close, but not close enough to act on — ask first. */
  unsure: SpokenOrderLine[];
  /**
   * More than one order line may hold.
   *
   * Kept apart from `unsure` because there is nothing to confirm: "300 chini"
   * was answered with "did you mean 99 × sugar 1 kg?", which is a hundred
   * kilos of sugar offered to somebody who almost certainly meant 300 grams or
   * three hundred rupees' worth. Clamping a number that large and asking about
   * the clamp is not a question anybody can answer usefully — the amount has to
   * be said again.
   */
  tooMany: SpokenOrderLine[];
};

const ORDER_FILLER =
  /\b(?:i want|i need|give me|please|add|order|chahiye|chaiye|de do|dijiye|mujhe|lagbe|dao|चाहिए|दे दो|दीजिए|मुझे|লাগবে|দাও|দিন)\b/gi;

/**
 * Splits an order sentence on "and"/"aur"/"ar" and resolves each clause
 * against the shop's item list.
 *
 * `alternatives` is the recogniser's ranked list of what it thought it heard.
 * Trying all of them and keeping whichever resolves best is the single biggest
 * accuracy win available: the top guess is frequently "rise" or "die" where the
 * second or third is the word the shopper actually said.
 */
export function parseSpokenOrder(
  alternatives: string[],
  items: MatchableItem[],
): SpokenOrderResult {
  let best: SpokenOrderResult = { lines: [], unsure: [], tooMany: [] };
  let bestQuality = -1;

  for (const transcript of alternatives) {
    const attempt = resolveOrder(transcript, items);
    // Prefer the reading that lands the most confident items; a reading that
    // only produces guesses never beats one that produces a certainty, and a
    // reading that only found an impossible amount beats nothing at all —
    // "say the amount again" is more use than "item not found".
    const quality =
      attempt.lines.reduce((sum, line) => sum + line.confidence, 0) +
      attempt.unsure.length * 0.1 +
      attempt.tooMany.length * 0.05;
    if (quality > bestQuality) {
      bestQuality = quality;
      best = attempt;
    }
  }

  return best;
}

function resolveOrder(transcript: string, items: MatchableItem[]): SpokenOrderResult {
  const cleaned = wordsToDigits(transcript.toLowerCase()).replace(ORDER_FILLER, ' ');
  const clauses = cleaned.split(/\s+(?:and|aur|ar|और|আর|এবং)\s+|,/);
  const lines: SpokenOrderLine[] = [];
  const unsure: SpokenOrderLine[] = [];
  const tooMany: SpokenOrderLine[] = [];

  for (const clause of clauses) {
    const phrase = clause.trim();
    if (!phrase) continue;

    /**
     * THE PACK SIZE IS PART OF WHAT WAS SAID, not decoration on the name.
     *
     * A shop that lists sugar in 1 kg and 500 g both matches "500 gram chini"
     * equally well by name, and picking whichever happened to score a
     * hundredth higher hands the shopper the wrong shelf. So every item the
     * clause nearly matches is priced out in packs, and the one whose pack the
     * spoken amount lands on exactly wins.
     */
    const ranked = rankMatches(phrase, items);
    const top = ranked[0];
    if (!top || top.confidence < UNSURE_MATCH) continue;

    const contenders = ranked.filter((entry) => top.confidence - entry.confidence <= 0.08);
    const priced = contenders.map((entry) => ({ entry, amount: spokenAmount(phrase, entry.item) }));
    const chosen = priced.find((option) => option.amount.exact && option.amount.requested) ?? priced[0]!;

    const { entry: match, amount } = chosen;
    // Zero is nothing to add; less than one is fifty grams of poppy seeds. This
    // read `< 1` and silently dropped every weighed amount under a full unit —
    // which, for anything priced by the kilo, is most of what a kirana sells.
    if (amount.quantity <= 0) continue;

    const line: SpokenOrderLine = {
      id: match.item.id,
      quantity: amount.quantity,
      phrase,
      confidence: match.confidence,
      requested: amount.requested,
      exact: amount.exact,
    };

    /**
     * An amount the shop cannot make up out of whole packs goes to the "did you
     * mean" bucket even when the item itself was heard perfectly. The name is
     * not what is in doubt — the quantity is, and it is the quantity that
     * decides what the shopper pays.
     */
    const bucket = amount.overMax
      ? tooMany
      : match.confidence >= CONFIDENT_MATCH && amount.exact
        ? lines
        : unsure;

    const existing = bucket.find((candidate) => candidate.id === line.id);
    if (existing) existing.quantity = Math.min(existing.quantity + line.quantity, MOST_PER_LINE);
    else bucket.push(line);
  }

  return { lines, unsure, tooMany };
}

/** The most any one line may ask for. Mirrors `quantitySchema` on the server. */
export const MOST_PER_LINE = 99;

type SpokenAmount = {
  /** Whole packs of the item's own unit. */
  quantity: number;
  /** What the shopper asked for, when they named an amount: "250 g". */
  requested: string | null;
  /** Whether `quantity` packs come to exactly that. */
  exact: boolean;
  /**
   * The amount asked for is past what one line may hold. `quantity` is clamped,
   * but the caller must not offer that clamp as a suggestion — see `tooMany`.
   */
  overMax: boolean;
};

/**
 * How much of `item` the clause asks for, as a multiple of its unit.
 *
 * This is arithmetic, and it used to be string comparison. A shopper says an
 * AMOUNT — two kilos, half a litre, দেড় কেজি, আড়াইশো গ্রাম — and the shop
 * quotes a RATE per pack, and the number that goes in the basket is one divided
 * by the other. Comparing them as text got every part of it wrong:
 *
 *   "2 kg musur dal" of a dal priced per 500 g  →  2, meaning 1 kg. Half.
 *   "250 gram chini"  of sugar priced per kilo  →  250 packs, capped at 99.
 *                                                  Four thousand rupees of
 *                                                  sugar.
 *
 * Both are now what was asked for: 4 × 500 g, and 0.25 of a kilo. A weighed
 * item takes the amount exactly — the pack size is the price basis, not a
 * minimum — while a counted one (a plate, a packet, a bottle) still rounds to
 * whole units, because there is no way to hand over 0.4 of a bottle.
 *
 * A number with no unit after it: for a weighed item, anything from twenty
 * upwards is the small unit — "300 চিনি" is three hundred grams, which is what
 * somebody at a counter means and never three hundred kilos — and below that it
 * is a count of the rate's own unit, so "2 চিনি" stays two kilos. A clause with
 * no number at all is one unit, exactly as tapping the card is.
 */
function spokenAmount(phrase: string, item: MatchableItem): SpokenAmount {
  const unit = canonicaliseUnit(item.unit.toLowerCase());
  const pack = parseMeasure(unit);
  const divisible = (item.loose ?? true) && isLooseUnit(unit);

  /** Amounts said in a unit this item can be measured in, added up. */
  let askedBase = 0;
  let askedUnit: Measure | null = null;
  /** A bare number, kept as a fallback: "2 chini" is two packs. */
  let bareCount: number | null = null;

  /**
   * `\p{M}` matters as much as `\p{L}` here, and leaving it out was the whole
   * 99-packet bug: গ্রাম is five characters of which three are combining marks,
   * so `[\p{L}]+` captured the single letter গ, no unit word was recognised,
   * and "250 গ্রাম চিনি" became a bare count of 250 packets of sugar.
   */
  for (const match of phrase.matchAll(/(\d+(?:\.\d+)?)\s*([\p{L}\p{M}]+)?/gu)) {
    const value = Number(match[1]);
    if (!Number.isFinite(value) || value <= 0) continue;

    const following = (match[2] ?? '').toLowerCase();
    if (following && UNIT_WORD.test(following)) {
      const said = parseMeasure(canonicaliseUnit(`${value} ${following}`));
      // Same dimension as the pack — grams against a kilo, millilitres against
      // a litre. "1 kg 500 g" adds up rather than the second number winning.
      if (said && pack && comparableMeasures(said, pack)) {
        askedBase += said.base;
        askedUnit = askedUnit && askedUnit.base >= said.base ? askedUnit : said;
        continue;
      }
      // A unit the pack cannot be converted into — "2 packet" of something
      // sold by the kilo. Their number is the count they mean.
      if (bareCount === null) bareCount = value;
      continue;
    }

    if (bareCount === null) bareCount = value;
  }

  /**
   * A bare number against a weighed item, and what it has to mean.
   *
   * "৩০০ চিনি" is three hundred grams of sugar. Read as a count of the rate's
   * unit it was three hundred kilos, which is how the mic came to offer
   * ninety-nine kilos of sugar — a number so far from the ask that no
   * confirmation dialog can rescue it. Below twenty the count reading is the
   * right one: "দুই চিনি" is two kilos, and nobody asks for nineteen grams.
   */
  const SMALL_UNIT_FROM = 20;
  if (divisible && pack && askedBase === 0 && bareCount !== null && bareCount >= SMALL_UNIT_FROM) {
    askedBase = bareCount;
    askedUnit = { amount: bareCount, unit: pack.dimension === 'volume' ? 'ml' : 'g', dimension: pack.dimension, base: bareCount };
    bareCount = null;
  }

  if (pack && askedBase > 0 && askedUnit) {
    const requested = formatMeasure(scaleMeasure(askedUnit, askedBase));
    const packs = askedBase / pack.base;

    /**
     * Weighed and poured goods take the amount as asked. THE RATE IS NOT A
     * MINIMUM: fifty grams of poppy seeds quoted at ₹1,500 the kilo is 0.05,
     * costs ₹75, and is an ordinary Sunday ask in every kirana in Kolkata.
     */
    if (divisible) {
      const floor = quantityFromBase(unit, MIN_LOOSE_BASE);
      const wanted = Math.max(roundQuantity(packs), floor);
      return {
        quantity: Math.min(wanted, MOST_PER_LINE),
        requested,
        exact: true,
        overMax: wanted > MOST_PER_LINE,
      };
    }

    // Counted: whole units only, and the shopper is asked when the amount does
    // not divide into them.
    const rounded = Math.max(1, Math.round(packs));
    const capped = Math.min(rounded, MOST_PER_LINE);
    return {
      quantity: capped,
      requested,
      exact: Math.abs(packs - capped) < 0.001,
      overMax: rounded > MOST_PER_LINE,
    };
  }

  if (bareCount !== null) {
    // A count of the item's own unit — "two kilos", "three plates". Fractions
    // survive for weighed goods ("দেড় চিনি" is a kilo and a half) and round for
    // counted ones.
    const wanted = divisible ? roundQuantity(bareCount) : Math.max(1, Math.round(bareCount));
    return {
      quantity: Math.min(Math.max(wanted, divisible ? wanted : 1), MOST_PER_LINE),
      requested: divisible ? amountLabel(unit, wanted) : null,
      exact: divisible || Math.abs(bareCount - wanted) < 0.001,
      overMax: wanted > MOST_PER_LINE,
    };
  }

  // No number at all. One unit of whatever the shop quotes it in, which is
  // exactly what tapping the card does.
  return { quantity: 1, requested: null, exact: true, overMax: false };
}

/** The same total, expressed in `like`'s unit — 1500 g against a kg is 1.5 kg. */
function scaleMeasure(like: Measure, base: number): Measure {
  const perUnit = like.base / like.amount;
  return { ...like, amount: round3(base / perUnit), base };
}

/**
 * Everyday kirana vocabulary in English, Hindi, Bengali and the roman spellings
 * the recogniser produces for each.
 *
 * The shopkeeper types item names in one language; the shopper speaks in
 * whichever the QR poster is read in. Without this, "দুই কেজি চাল" matches
 * nothing on a menu that says "Rice". Groups are bidirectional — any member
 * matches any other — and unlisted items still match on their own name, so a
 * missing word costs nothing beyond that item needing its own language.
 */
export type Vocab = { en: string; hi: string; bn: string; roman?: string[] };

const VOCAB: Vocab[] = [
  { en: 'Rice', hi: 'चावल', bn: 'চাল', roman: ['chawal', 'chaval', 'chal', 'bhat'] },
  { en: 'Salt', hi: 'नमक', bn: 'নুন', roman: ['namak', 'nun', 'lobon', 'লবণ'] },
  { en: 'Sugar', hi: 'चीनी', bn: 'চিনি', roman: ['cheeni', 'chini'] },
  { en: 'Oil', hi: 'तेल', bn: 'তেল', roman: ['tel'] },
  { en: 'Mustard', hi: 'सरसों', bn: 'সরিষা', roman: ['sarso', 'sorisha', 'sorisar', 'সরিষার'] },
  { en: 'Milk', hi: 'दूध', bn: 'দুধ', roman: ['doodh', 'dudh'] },
  { en: 'Curd', hi: 'दही', bn: 'দই', roman: ['dahi', 'doi', 'yogurt'] },
  { en: 'Ghee', hi: 'घी', bn: 'ঘি' },
  { en: 'Paneer', hi: 'पनीर', bn: 'পনির' },
  { en: 'Egg', hi: 'अंडा', bn: 'ডিম', roman: ['eggs', 'anda', 'dim'] },
  { en: 'Tomato', hi: 'टमाटर', bn: 'টমেটো', roman: ['tamatar', 'tomatoes'] },
  { en: 'Potato', hi: 'आलू', bn: 'আলু', roman: ['aloo', 'alu', 'potatoes'] },
  { en: 'Onion', hi: 'प्याज', bn: 'পেঁয়াজ', roman: ['pyaz', 'peyaj', 'onions'] },
  { en: 'Garlic', hi: 'लहसुन', bn: 'রসুন', roman: ['lehsun', 'rosun'] },
  { en: 'Ginger', hi: 'अदरक', bn: 'আদা', roman: ['adrak', 'ada'] },
  { en: 'Chilli', hi: 'मिर्च', bn: 'লঙ্কা', roman: ['chili', 'mirch', 'lanka', 'morich', 'মরিচ'] },
  { en: 'Turmeric', hi: 'हल्दी', bn: 'হলুদ', roman: ['haldi', 'holud'] },
  { en: 'Dal', hi: 'दाल', bn: 'ডাল', roman: ['daal', 'lentil', 'pulses'] },
  { en: 'Flour', hi: 'आटा', bn: 'আটা', roman: ['atta', 'ata'] },
  { en: 'Maida', hi: 'मैदा', bn: 'ময়দা' },
  { en: 'Suji', hi: 'सूजी', bn: 'সুজি', roman: ['sooji', 'rava', 'semolina'] },
  { en: 'Wheat', hi: 'गेहूं', bn: 'গম', roman: ['gehu', 'gom'] },
  { en: 'Tea', hi: 'चाय', bn: 'চা', roman: ['chai', 'cha'] },
  { en: 'Biscuit', hi: 'बिस्कुट', bn: 'বিস্কুট', roman: ['biscuits'] },
  { en: 'Bread', hi: 'ब्रेड', bn: 'পাউরুটি', roman: ['pauruti'] },
  { en: 'Soap', hi: 'साबुन', bn: 'সাবান', roman: ['sabun', 'saban'] },
  { en: 'Water', hi: 'पानी', bn: 'জল', roman: ['pani', 'jol'] },
  { en: 'Fish', hi: 'मछली', bn: 'মাছ', roman: ['machli', 'mach'] },
  { en: 'Chicken', hi: 'मुर्गा', bn: 'মুরগি', roman: ['murga', 'murgi'] },
  { en: 'Mutton', hi: 'मटन', bn: 'মাটন', roman: ['khasi'] },
  { en: 'Papad', hi: 'पापड़', bn: 'পাঁপড়' },
  { en: 'Honey', hi: 'शहद', bn: 'মধু', roman: ['shahad', 'modhu'] },
  { en: 'Butter', hi: 'मक्खन', bn: 'মাখন', roman: ['makhan'] },
  { en: 'Cumin', hi: 'जीरा', bn: 'জিরা', roman: ['jeera'] },
  { en: 'Coriander', hi: 'धनिया', bn: 'ধনে', roman: ['dhania', 'dhone'] },
  { en: 'Mustard oil', hi: 'सरसों का तेल', bn: 'সরিষার তেল' },
  { en: 'Banana', hi: 'केला', bn: 'কলা', roman: ['kela', 'kola'] },
  { en: 'Lemon', hi: 'नींबू', bn: 'লেবু', roman: ['nimbu', 'lebu'] },

  // THE WORDS THAT SIT NEXT TO THE ONES ABOVE.
  //
  // A kirana does not sell "dal", it sells musur dal and motor dal and chholar
  // dal; it does not sell "rice", it sells basmati and miniket and gobindobhog.
  // Those qualifiers were the whole missing half: "Musurir Dal" matched nothing
  // because only the second word was known, so the compound rule — every word
  // or nothing — left the entire name untranslated and a Bengali customer read
  // it in roman letters.
  { en: 'Basmati', hi: 'बासमती', bn: 'বাসমতী', roman: ['basmoti', 'basmati'] },
  { en: 'Miniket', hi: 'मिनिकेट', bn: 'মিনিকেট' },
  { en: 'Gobindobhog', hi: 'गोबिंदभोग', bn: 'গোবিন্দভোগ', roman: ['gobindo bhog'] },
  { en: 'Masoor', hi: 'मसूर', bn: 'মুসুর', roman: ['musur', 'musuri', 'musurir', 'mosur', 'masur'] },
  { en: 'Matar', hi: 'मटर', bn: 'মটর', roman: ['motor', 'moter', 'matar', 'motorer'] },
  { en: 'Chana', hi: 'चना', bn: 'ছোলা', roman: ['chola', 'chhola', 'cholar', 'chholar'] },
  { en: 'Moong', hi: 'मूंग', bn: 'মুগ', roman: ['mug', 'mung', 'muger'] },
  { en: 'Arhar', hi: 'अरहर', bn: 'অড়হর', roman: ['toor', 'tur'] },
  { en: 'Urad', hi: 'उड़द', bn: 'বিউলি', roman: ['biuli', 'urid'] },
  { en: 'Soyabean', hi: 'सोयाबीन', bn: 'সয়াবিন', roman: ['soya', 'soyabin'] },
  { en: 'Refined', hi: 'रिफाइंड', bn: 'রিফাইন্ড', roman: ['refine'] },
  { en: 'Puffed rice', hi: 'मुरमुरा', bn: 'মুড়ি', roman: ['muri', 'murmura'] },
  { en: 'Jaggery', hi: 'गुड़', bn: 'গুড়', roman: ['gur', 'gud'] },
  { en: 'Cardamom', hi: 'इलायची', bn: 'এলাচ', roman: ['elach', 'elaichi'] },
  { en: 'Clove', hi: 'लौंग', bn: 'লবঙ্গ', roman: ['laung', 'lobongo'] },
  { en: 'Cinnamon', hi: 'दालचीनी', bn: 'দারচিনি', roman: ['darchini', 'dalchini'] },
  { en: 'Bay leaf', hi: 'तेजपत्ता', bn: 'তেজপাতা', roman: ['tejpata', 'tejpatta'] },
  { en: 'Peanut', hi: 'मूंगफली', bn: 'চিনাবাদাম', roman: ['badam', 'mungfali', 'chinabadam'] },
  { en: 'Coconut', hi: 'नारियल', bn: 'নারকেল', roman: ['nariyal', 'narkel'] },
  { en: 'Detergent', hi: 'सर्फ', bn: 'সাবান গুঁড়ো', roman: ['surf', 'detergent powder'] },
  { en: 'Matchbox', hi: 'माचिस', bn: 'দেশলাই', roman: ['machis', 'deshlai'] },
  { en: 'Candle', hi: 'मोमबत्ती', bn: 'মোমবাতি', roman: ['mombatti', 'mombati'] },
  // Street-food menus — the other half of Halkhata's shops.
  { en: 'Roll', hi: 'रोल', bn: 'রোল' },
  { en: 'Momo', hi: 'मोमो', bn: 'মোমো' },
  { en: 'Chowmein', hi: 'चाउमिन', bn: 'চাউমিন', roman: ['chow', 'chowmin', 'noodles'] },
  { en: 'Veg', hi: 'वेज', bn: 'ভেজ', roman: ['vegetable'] },
  { en: 'Biryani', hi: 'बिरयानी', bn: 'বিরিয়ানি' },
  { en: 'Samosa', hi: 'समोसा', bn: 'সিঙাড়া', roman: ['singara'] },
  { en: 'Plate', hi: 'प्लेट', bn: 'প্লেট' },
  // Packaging words, so compound names like "Biscuit Pack" translate whole.
  { en: 'Pack', hi: 'पैकेट', bn: 'প্যাকেট', roman: ['packet'] },
  { en: 'Powder', hi: 'पाउडर', bn: 'গুঁড়ো', roman: ['gura'] },
  { en: 'Bottle', hi: 'बोतल', bn: 'বোতল' },
];

/**
 * Category names, which are free text on the item but in practice come from a
 * short, repeating list. Anything the shopkeeper invents falls through
 * untranslated rather than being mangled.
 */
const CATEGORY_VOCAB: Vocab[] = [
  { en: 'Staples', hi: 'रोज़ का सामान', bn: 'নিত্য প্রয়োজনীয়' },
  { en: 'Snacks', hi: 'नाश्ता', bn: 'জলখাবার' },
  { en: 'Oil & Ghee', hi: 'तेल और घी', bn: 'তেল ও ঘি' },
  { en: 'Dairy', hi: 'दूध-दही', bn: 'দুধ-দই' },
  { en: 'Vegetables', hi: 'सब्ज़ी', bn: 'সবজি' },
  { en: 'Fruits', hi: 'फल', bn: 'ফল' },
  { en: 'Spices', hi: 'मसाले', bn: 'মশলা' },
  { en: 'Beverages', hi: 'पेय', bn: 'পানীয়' },
  { en: 'Sweets', hi: 'मिठाई', bn: 'মিষ্টি' },
  { en: 'Bakery', hi: 'बेकरी', bn: 'বেকারি' },
  { en: 'Household', hi: 'घर का सामान', bn: 'ঘরের জিনিস' },
  { en: 'Rolls', hi: 'रोल', bn: 'রোল' },
  { en: 'Chinese', hi: 'चाइनीज़', bn: 'চাইনিজ' },
  { en: 'Rice & Atta', hi: 'चावल-आटा', bn: 'চাল-আটা' },
  { en: 'Tea & Coffee', hi: 'चाय-कॉफ़ी', bn: 'চা-কফি' },
  { en: 'Non-veg', hi: 'नॉन-वेज', bn: 'আমিষ' },
  { en: 'Dal & Pulses', hi: 'दाल', bn: 'ডাল' },
  { en: 'Dry Fruits', hi: 'ड्राई फ्रूट्स', bn: 'শুকনো ফল' },
  { en: 'Personal Care', hi: 'निजी सामान', bn: 'ব্যক্তিগত জিনিস' },
  // Prepared-food categories. These were already in use by the restaurant and
  // home-kitchen starter lists and fell through untranslated.
  { en: 'Momo', hi: 'मोमो', bn: 'মোমো' },
  { en: 'Biryani', hi: 'बिरयानी', bn: 'বিরিয়ানি' },
  { en: 'Meals', hi: 'भोजन', bn: 'খাবার' },
  { en: 'Extras', hi: 'अन्य', bn: 'অন্যান্য' },
];

const CATEGORY_BY_FORM = new Map<string, Vocab>();
for (const entry of CATEGORY_VOCAB) {
  for (const form of [entry.en, entry.hi, entry.bn]) {
    const key = form.toLowerCase();
    if (!CATEGORY_BY_FORM.has(key)) CATEGORY_BY_FORM.set(key, entry);
  }
}

/**
 * A category name in the shopper's language. Unknown categories are returned
 * as typed — a filter chip that reads in English is far better than one that
 * reads as nonsense.
 */
export function translateCategory(category: string, locale: 'en' | 'bn' | 'hi'): string {
  const entry = CATEGORY_BY_FORM.get(category.trim().toLowerCase());
  if (!entry) return category;
  return locale === 'bn' ? entry.bn : locale === 'hi' ? entry.hi : entry.en;
}

/** Every written form of one entry, lowercased — used for matching. */
function formsOf(entry: Vocab): string[] {
  return [entry.en, entry.hi, entry.bn, ...(entry.roman ?? [])].map((form) => form.toLowerCase());
}

const SYNONYMS = new Map<string, string[]>();
for (const entry of VOCAB) {
  const forms = formsOf(entry);
  for (const form of forms) {
    // Multi-word entries ("mustard oil") are matched as a phrase, and their
    // individual words already belong to their own entries.
    if (!form.includes(' ')) SYNONYMS.set(form, forms);
  }
}

const VOCAB_BY_FORM = new Map<string, Vocab>();
for (const entry of VOCAB) {
  for (const form of formsOf(entry)) if (!VOCAB_BY_FORM.has(form)) VOCAB_BY_FORM.set(form, entry);
}

/**
 * The same index, keyed on the spelling with everything that varies between
 * two roman spellings of one word stripped out — see `loosen`.
 *
 * Roman Bengali and Hindi have no correct spelling. An owner types "Basmoti"
 * where the list says "basmati", "Cheeni" where it says "chini", "Chhola" for
 * "chola" — and an exact lookup answers "unknown" to every one of them, so the
 * name goes onto the shop page in roman letters and the Bengali customer reads
 * a word their language does not use. Loosening both sides costs one extra map
 * and settles the whole class.
 */
const VOCAB_BY_LOOSE = new Map<string, Vocab>();
for (const entry of VOCAB) {
  for (const form of formsOf(entry)) {
    const key = loosen(form);
    if (key.length >= 3 && !VOCAB_BY_LOOSE.has(key)) VOCAB_BY_LOOSE.set(key, entry);
  }
}

/**
 * Bengali and Hindi glue a possessive onto the qualifier — "musur dal" is said
 * and written "musurir dal", "chholar dal", "sorisar tel". The suffix belongs
 * to the grammar, not to the product, so it is peeled off before the lookup.
 *
 * Only tried after the word has failed on its own, and only on words long
 * enough that the stem is still a word: "paneer" must never become "pane".
 */
const POSSESSIVE_TAIL = /(?:ir|er|ar|r|ki|ka|ke)$/;

/** One word of a name, matched against the vocabulary however it is spelled. */
function lookupWord(word: string): Vocab | undefined {
  const exact = VOCAB_BY_FORM.get(word);
  if (exact) return exact;

  const loose = loosen(word);
  if (loose.length >= 3) {
    const near = VOCAB_BY_LOOSE.get(loose);
    if (near) return near;

    if (loose.length >= 6) {
      const stem = loose.replace(POSSESSIVE_TAIL, '');
      if (stem.length >= 3 && stem !== loose) return VOCAB_BY_LOOSE.get(stem);
    }
  }

  return undefined;
}

/**
 * The other two languages for a name the shopkeeper just typed or spoke.
 *
 * Only fires on an exact whole-name hit against the vocabulary. A partial or
 * fuzzy guess here would silently mislabel an item in a language the
 * shopkeeper cannot read back, which is worse than leaving the field empty.
 */
export function suggestNames(name: string): { en: string; hi: string; bn: string } | null {
  const cleaned = name.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!cleaned) return null;

  const whole = lookupWord(cleaned);
  if (whole) return { en: whole.en, hi: whole.hi, bn: whole.bn };

  // A compound name translates only when every word is known: "Biscuit Pack"
  // becomes "বিস্কুট প্যাকেট", while a name with one word we do not have is
  // left alone rather than half-translated into something no shopper would
  // recognise.
  const words = cleaned.split(' ');
  if (words.length < 2) return null;

  const entries = words.map((word) => lookupWord(word));
  if (entries.some((entry) => !entry)) return null;

  return {
    en: entries.map((entry) => entry!.en).join(' '),
    hi: entries.map((entry) => entry!.hi).join(' '),
    bn: entries.map((entry) => entry!.bn).join(' '),
  };
}

/** Below this, a name word counts as not said at all. */
const WORD_SIMILARITY_FLOOR = 0.72;

/**
 * Confidence bands for a match. Speech recognition on a noisy shop floor is
 * not reliable enough to act on silently, so the callers treat these
 * differently: act on `confident`, ask before acting on `unsure`, and refuse
 * anything below.
 */
export const CONFIDENT_MATCH = 0.8;
export const UNSURE_MATCH = 0.45;

export type Match = { item: MatchableItem; confidence: number };

/** Splits into comparable tokens, keeping Indic combining marks intact. */
function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    // Two characters is a whole word in Bengali and Hindi (দই, घी).
    .filter((word) => word.length >= 2);
}

/**
 * Levenshtein distance, normalised to a 0–1 similarity.
 *
 * This is what carries an unclear speaker: "tomato" heard as "tomatto" or
 * "tamato" still resolves, where exact matching would report nothing found.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const longer = a.length >= b.length ? a : b;
  const shorter = a.length >= b.length ? b : a;
  // One word contained in the other — plurals, "atta"/"atta pack".
  if (longer.includes(shorter) && shorter.length >= 3) return 0.92;

  let previous = Array.from({ length: shorter.length + 1 }, (_, i) => i);
  for (let i = 1; i <= longer.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= shorter.length; j += 1) {
      const cost = longer[i - 1] === shorter[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1]! + 1, previous[j]! + 1, previous[j - 1]! + cost);
    }
    previous = current;
  }

  return 1 - previous[shorter.length]! / longer.length;
}

/** How strongly one name word was heard, allowing synonyms and misspeaking. */
function wordScore(word: string, spoken: string[]): number {
  const variants = SYNONYMS.get(word) ?? [word];
  let best = 0;

  for (const variant of variants) {
    if (variant.includes(' ')) {
      // Multi-word synonym: compare against the phrase as a whole.
      if (spoken.join(' ').includes(variant)) return 1;
      continue;
    }
    for (const token of spoken) {
      if (token === variant) return 1;
      const score = similarity(token, variant);
      if (score > best) best = score;
    }
  }

  return best >= WORD_SIMILARITY_FLOOR ? best : 0;
}

/**
 * Scores every item against the spoken clause and returns the best, with how
 * sure we are.
 *
 * An item is scored against all three of its names, best one wins, so a menu
 * typed in English still answers to Hindi and Bengali. Coverage — the share of
 * the name's words that were actually heard — is what the confidence reports,
 * so "rice" against "Basmati Rice" scores lower than against "Rice" and the
 * exact item wins.
 */
function bestMatch(phrase: string, items: MatchableItem[]): Match | null {
  return rankMatches(phrase, items)[0] ?? null;
}

/**
 * Every item the clause could mean, best first.
 *
 * The order side needs more than the winner: a shop listing sugar in 1 kg and
 * 500 g scores both identically on the name, and which one the shopper meant is
 * decided by the amount they asked for, not by the name at all. See
 * `resolveOrder`.
 */
function rankMatches(phrase: string, items: MatchableItem[]): Match[] {
  const spoken = tokens(phrase);
  if (spoken.length === 0) return [];

  /**
   * The spoken words that are trying to NAME something.
   *
   * Numbers and unit words are not part of a name — "2 kg" says how much, not
   * what — so they must not count against an item for going unmatched. Short
   * tokens are dropped too: a stray "ta", "ki" or "er" from a classifier or a
   * possessive is grammar the recogniser handed back whole, not a word the
   * shopper meant as an item.
   */
  const naming = spoken.filter(
    (word) => !/^\d/.test(word) && word.length >= 3 && !UNIT_WORD.test(word),
  );

  const scored: Match[] = [];

  for (const item of items) {
    let itemBest = 0;

    for (const name of [item.name, item.nameHi, item.nameBn]) {
      const words = tokens(name ?? '');
      if (words.length === 0) continue;

      let total = 0;
      for (const word of words) total += wordScore(word, spoken);
      if (total === 0) continue;

      let coverage = total / words.length;

      /**
       * AND HOW MUCH OF WHAT WAS SAID DID THIS ITEM ACCOUNT FOR?
       *
       * Coverage alone asks only whether the item's own words were heard, and
       * that made a shop's "Potato" a perfect match for "Chandramukhi aloo" —
       * every word of "Potato" was there, so the qualifier the shopkeeper spent
       * a breath saying was thrown away and they were told the item was already
       * on their list. Chandramukhi is a different potato at a different price,
       * and a kirana's list is mostly made of exactly this kind of distinction:
       * Miniket rice, Gobindobhog rice, musur dal, motor dal.
       *
       * So a word that was said and matched nothing pulls the score down. Half
       * the score stays with coverage, so one stray word in a longer sentence
       * cannot break a match that is otherwise right, while a name half of
       * which is unaccounted for lands in "did you mean" instead of being acted
       * on silently.
       */
      if (naming.length > 0) {
        let heard = 0;
        for (const token of naming) {
          if (words.some((word) => wordScore(word, [token]) > 0)) heard += 1;
        }
        coverage *= 0.5 + 0.5 * (heard / naming.length);
      }

      // The unit is a tiebreaker, never a match on its own.
      if (item.unit && spoken.join(' ').includes(item.unit.toLowerCase())) {
        coverage = Math.min(1, coverage + 0.05);
      }
      if (coverage > itemBest) itemBest = coverage;
    }

    if (itemBest > 0) scored.push({ item, confidence: itemBest });
  }

  // Stable, so an equal score keeps the shop's own order — the same item won
  // before this returned a list, and nothing should start choosing differently.
  return scored.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Does a typed search term match this item?
 *
 * Plain substring matching is what the storefront used, and it fails on the
 * commonest thing a shopper types: "ata" finds nothing on a shop selling
 * "Atta", because a-t-a is not a run of characters inside a-t-t-a. Indian
 * item names have no settled roman spelling — atta/ata, chawal/chaval/chal,
 * daal/dal, cheeni/chini are all the same thing written as somebody heard it —
 * so exact matching punishes a shopper for spelling a word that has no correct
 * spelling.
 *
 * Three passes, cheapest first:
 *
 *  1. Literal substring, which settles Bengali and Hindi typing outright.
 *  2. The same comparison with doubled letters collapsed and punctuation
 *     dropped, so "atta" and "ata" become the same string.
 *  3. The voice vocabulary, so "chawal" finds an item listed only as "Rice" —
 *     the shopper's language need not be the shopkeeper's.
 */
export function matchesSearch(fields: string[], query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  if (fields.some((field) => field.toLowerCase().includes(needle))) return true;

  const loose = loosen(needle);
  // A single letter after loosening matches nearly everything; below three the
  // gain in tolerance is outweighed by the noise.
  if (loose.length < 3) return false;
  if (fields.some((field) => loosen(field).includes(loose))) return true;

  for (const word of tokens(fields.join(' '))) {
    for (const variant of SYNONYMS.get(word) ?? []) {
      const form = loosen(variant);
      if (form.length >= 3 && (form.includes(loose) || loose.includes(form))) return true;
    }
  }

  return false;
}

/**
 * Strips everything that varies between two spellings of the same word:
 * punctuation, spacing, and repeated letters. "Atta" and "ata" both become
 * "ata"; "Mustard Oil" becomes "mustardoil".
 */
function loosen(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '')
    .replace(/(.)\1+/gu, '$1');
}
