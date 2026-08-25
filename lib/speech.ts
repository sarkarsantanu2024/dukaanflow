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
};

const WORD_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

const WORD_SCALES: Record<string, number> = { hundred: 100, thousand: 1000 };

/** Digits in Devanagari (०-९) and Bengali (০-৯) become ASCII. */
function normaliseDigits(text: string): string {
  return text.replace(/[०-९০-৯]/g, (char) => {
    const code = char.codePointAt(0)!;
    const base = code >= 0x09e6 ? 0x09e6 : 0x0966;
    return String(code - base);
  });
}

/**
 * Collapses runs of number words into digits: "sixty eight" → "68",
 * "two hundred fifty" → "250". Non-number words pass through untouched.
 */
export function wordsToDigits(text: string): string {
  const tokens = normaliseDigits(text).split(/\s+/);
  const output: string[] = [];
  // A pending run: `total` holds completed scales, `current` the part being built.
  let total = 0;
  let current = 0;
  let open = false;

  function flush() {
    if (open) output.push(String(total + current));
    total = 0;
    current = 0;
    open = false;
  }

  for (const token of tokens) {
    const word = token.toLowerCase().replace(/[.,!?]/g, '');
    if (word === 'and' && open) continue; // "one hundred and five"

    if (word in WORD_UNITS) {
      current += WORD_UNITS[word]!;
      open = true;
    } else if (word in WORD_TENS) {
      current += WORD_TENS[word]!;
      open = true;
    } else if (word in WORD_SCALES) {
      const scale = WORD_SCALES[word]!;
      // "hundred" with nothing before it means one hundred.
      current = (current || 1) * scale;
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

const CURRENCY_BEFORE = /(?:₹|rs\.?|rupees?|rupaye|rupaiya|rupya|taka|टाका|रुपये|रुपए|টাকা)\s*(\d+(?:\.\d+)?)/i;
const CURRENCY_AFTER = /(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees?|rupaye|rupaiya|rupya|taka|टाका|रुपये|रुपए|টাকা|\/-)/i;

/** Unit words — a number followed by one of these is a size, never a price. */
const UNIT_WORD =
  /^(?:kg|kgs|kilo|kilos|kilogram|kilograms|g|gm|gms|gram|grams|l|ltr|litre|liter|litres|liters|ml|pc|pcs|piece|pieces|packet|packets|pack|packs|plate|plates|cup|cups|dozen|box|boxes|bottle|bottles|किलो|ग्राम|लीटर|पैकेट|কেজি|গ্রাম|লিটার|প্যাকেট)$/i;

/** Spoken unit words normalised to what the item list already uses. */
const UNIT_ALIASES: Record<string, string> = {
  kgs: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
  किलो: 'kg', কেজি: 'kg',
  gm: 'g', gms: 'g', gram: 'g', grams: 'g', ग्राम: 'g', গ্রাম: 'g',
  ltr: 'l', litre: 'l', liter: 'l', litres: 'l', liters: 'l',
  लीटर: 'l', লিটার: 'l',
  pcs: 'pc', piece: 'pc', pieces: 'pc',
  packets: 'packet', packs: 'pack', पैकेट: 'packet', প্যাকেট: 'packet',
};

function canonicaliseUnit(unit: string): string {
  return unit
    .split(/\s+/)
    .map((part) => UNIT_ALIASES[part.toLowerCase()] ?? part)
    .join(' ')
    .trim();
}

export type SpokenItem = { name: string; unit: string; price: number; category: string };

/**
 * Parses one shopkeeper utterance into an item.
 *
 * Returns null when no price could be found — an item without a price is not
 * something we should guess at, so the caller asks the speaker to repeat.
 */
export function parseSpokenItem(transcript: string): SpokenItem | null {
  let text = wordsToDigits(transcript.trim().replace(/\s+/g, ' '));
  text = text.replace(LEAD_FILLER, '').trim();
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

  let price: number | null = null;

  const explicit = text.match(CURRENCY_BEFORE) ?? text.match(CURRENCY_AFTER);
  if (explicit) {
    price = Number(explicit[1]);
    text = (text.slice(0, explicit.index) + ' ' + text.slice(explicit.index! + explicit[0].length)).trim();
  } else {
    // No currency word: the price is the last number that is not a size, i.e.
    // not followed by a unit word. "rice 1 kg 68" → 68, never 1.
    const numbers = [...text.matchAll(/\d+(?:\.\d+)?/g)];
    for (let i = numbers.length - 1; i >= 0; i -= 1) {
      const match = numbers[i]!;
      const after = text.slice(match.index! + match[0].length).trim().split(/\s+/)[0] ?? '';
      if (UNIT_WORD.test(after)) continue;
      price = Number(match[0]);
      text = (text.slice(0, match.index) + ' ' + text.slice(match.index! + match[0].length)).trim();
      break;
    }
  }

  if (price === null || !Number.isFinite(price)) return null;
  price = Math.round(price);
  if (price < 1 || price > 100000) return null;

  const label = text
    .replace(/\s+(?:at|for|ka|ki|ke|का|की|के|দাম|price)\s*$/i, '')
    .replace(/[.,]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!label) return null;

  // splitNameAndUnit only recognises canonical unit spellings, so normalise
  // "one kilo" → "1 kg" before handing the label over.
  const canonical = canonicaliseUnit(label);
  const { name, unit } = splitNameAndUnit(canonical);
  if (!name) return null;

  return { name: titleCase(name), unit, price, category: category ? titleCase(category) : '' };
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
  unit: string;
  price: number;
  category: string;
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
    const parsed = parseSpokenItem(transcript);
    if (!parsed) continue;

    const match = bestMatch(parsed.name, existing);
    const confidence = match?.confidence ?? 0;

    const draft: SpokenItemDraft = {
      ...namesFor(parsed.name, lang),
      unit: parsed.unit,
      price: parsed.price,
      category: parsed.category,
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
  'muche dao', 'mure dao', 'bad dao', 'sorao',
  'মুছে দাও', 'মুছুন', 'বাদ দাও', 'সরাও', 'সরিয়ে দাও',
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
  | { kind: 'delete'; item: MatchableItem; needsConfirm: true; label: string }
  | { kind: 'stock'; item: MatchableItem; inStock: boolean; needsConfirm: boolean; label: string };

/** Longest phrase first, so "out of stock" wins over the bare "out". */
function matchVerb(text: string, words: string[]): { rest: string } | null {
  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    const pattern = new RegExp(`(^|\\s)${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
    if (pattern.test(text)) return { rest: text.replace(pattern, ' ').replace(/\s+/g, ' ').trim() };
  }
  return null;
}

function labelFor(item: { name: string; unit: string }): string {
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
  for (const transcript of alternatives) {
    const text = wordsToDigits(transcript.trim().replace(/\s+/g, ' ')).toLowerCase();

    const removal = matchVerb(text, DELETE_WORDS);
    if (removal) {
      const match = bestMatch(removal.rest, existing);
      if (match && match.confidence >= UNSURE_MATCH) {
        return { kind: 'delete', item: match.item, needsConfirm: true, label: labelFor(match.item) };
      }
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

  const draft = resolveSpokenItem(alternatives, lang, existing);
  if (!draft) return null;

  return {
    kind: 'upsert',
    draft,
    needsConfirm: Boolean(draft.matched) && draft.confidence < CONFIDENT_MATCH,
    label: labelFor(draft.matched ?? draft),
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
};

export type SpokenOrderLine = { id: string; quantity: number; phrase: string; confidence: number };

export type SpokenOrderResult = {
  /** Confident enough to add straight to the cart. */
  lines: SpokenOrderLine[];
  /** Heard something close, but not close enough to act on — ask first. */
  unsure: SpokenOrderLine[];
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
  let best: SpokenOrderResult = { lines: [], unsure: [] };
  let bestQuality = -1;

  for (const transcript of alternatives) {
    const attempt = resolveOrder(transcript, items);
    // Prefer the reading that lands the most confident items; a reading that
    // only produces guesses never beats one that produces a certainty.
    const quality =
      attempt.lines.reduce((sum, line) => sum + line.confidence, 0) + attempt.unsure.length * 0.1;
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

  for (const clause of clauses) {
    const phrase = clause.trim();
    if (!phrase) continue;

    const match = bestMatch(phrase, items);
    if (!match || match.confidence < UNSURE_MATCH) continue;

    const quantity = spokenQuantity(phrase, match.item);
    if (quantity < 1) continue;

    const line = { id: match.item.id, quantity, phrase, confidence: match.confidence };
    const bucket = match.confidence >= CONFIDENT_MATCH ? lines : unsure;

    const existing = bucket.find((entry) => entry.id === line.id);
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, 99);
    else bucket.push(line);
  }

  return { lines, unsure };
}

/**
 * How many of `item` the clause asks for.
 *
 * A number that restates the item's own pack size is a description, not a
 * count: in "basmati rice 5 kg" the 5 belongs to the 5 kg pack, so the answer
 * is one pack — while in "2 kg rice" (a 1 kg item) the 2 really is the count.
 */
function spokenQuantity(phrase: string, item: MatchableItem): number {
  const itemUnit = canonicaliseUnit(item.unit.toLowerCase()).replace(/\s+/g, ' ').trim();

  for (const match of phrase.matchAll(/(\d+)\s*([\p{L}]+)?/gu)) {
    const value = Number(match[1]);
    if (!Number.isFinite(value) || value < 1) continue;

    const following = (match[2] ?? '').toLowerCase();
    if (following && UNIT_WORD.test(following)) {
      const spelled = canonicaliseUnit(`${value} ${following}`);
      if (spelled === itemUnit) continue; // the pack size, said back to us
    }
    return Math.min(value, 99);
  }

  return 1;
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
  { en: 'Mustard', hi: 'सरसों', bn: 'সরিষা', roman: ['sarso', 'sorisha', 'সরিষার'] },
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
  { en: 'Suji', hi: 'सूजी', bn: 'সুজি', roman: ['sooji', 'rava'] },
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
  // Street-food menus — the other half of DukaanFlow's shops.
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
 * The other two languages for a name the shopkeeper just typed or spoke.
 *
 * Only fires on an exact whole-name hit against the vocabulary. A partial or
 * fuzzy guess here would silently mislabel an item in a language the
 * shopkeeper cannot read back, which is worse than leaving the field empty.
 */
export function suggestNames(name: string): { en: string; hi: string; bn: string } | null {
  const cleaned = name.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!cleaned) return null;

  const exact = VOCAB_BY_FORM.get(cleaned);
  if (exact) return { en: exact.en, hi: exact.hi, bn: exact.bn };

  // A compound name translates only when every word is known: "Biscuit Pack"
  // becomes "বিস্কুট প্যাকেট", while "Basmati Rice" is left alone rather than
  // half-translated into something no shopper would recognise.
  const words = cleaned.split(' ');
  if (words.length < 2) return null;

  const entries = words.map((word) => VOCAB_BY_FORM.get(word));
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
  const spoken = tokens(phrase);
  if (spoken.length === 0) return null;

  let winner: MatchableItem | null = null;
  let winningScore = 0;

  for (const item of items) {
    let itemBest = 0;

    for (const name of [item.name, item.nameHi, item.nameBn]) {
      const words = tokens(name ?? '');
      if (words.length === 0) continue;

      let total = 0;
      for (const word of words) total += wordScore(word, spoken);
      if (total === 0) continue;

      let coverage = total / words.length;
      // The unit is a tiebreaker, never a match on its own.
      if (item.unit && spoken.join(' ').includes(item.unit.toLowerCase())) {
        coverage = Math.min(1, coverage + 0.05);
      }
      if (coverage > itemBest) itemBest = coverage;
    }

    if (itemBest > winningScore) {
      winningScore = itemBest;
      winner = item;
    }
  }

  return winner ? { item: winner, confidence: winningScore } : null;
}
