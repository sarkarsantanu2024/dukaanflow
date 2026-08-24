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
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, panch: 5, chhe: 6, saat: 7,
  aath: 8, nau: 9, das: 10,
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

/* ------------------------------------------------------------------ */
/* Customer side                                                       */
/* ------------------------------------------------------------------ */

export type MatchableItem = { id: string; name: string; unit: string };
export type SpokenOrderLine = { id: string; quantity: number; phrase: string };

const ORDER_FILLER =
  /\b(?:i want|i need|give me|please|add|order|chahiye|chaiye|de do|dijiye|mujhe|lagbe|dao|चाहिए|दे दो|दीजिए|मुझे|লাগবে|দাও|দিন)\b/gi;

/**
 * Splits an order sentence on "and"/"aur"/"ar" and resolves each clause
 * against the shop's item list. Unmatched clauses are simply dropped — the
 * caller reads back what it did match so the shopper can see the difference.
 */
export function parseSpokenOrder(
  transcript: string,
  items: MatchableItem[],
): SpokenOrderLine[] {
  const cleaned = wordsToDigits(transcript.toLowerCase()).replace(ORDER_FILLER, ' ');
  const clauses = cleaned.split(/\s+(?:and|aur|ar|और|আর|এবং)\s+|,/);
  const lines: SpokenOrderLine[] = [];

  for (const clause of clauses) {
    const phrase = clause.trim();
    if (!phrase) continue;

    const match = bestMatch(phrase, items);
    if (!match) continue;

    const quantity = spokenQuantity(phrase, match);
    if (quantity < 1) continue;

    const existing = lines.find((line) => line.id === match.id);
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, 99);
    else lines.push({ id: match.id, quantity, phrase });
  }

  return lines;
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
const SYNONYM_GROUPS: string[][] = [
  ['rice', 'चावल', 'চাল', 'chawal', 'chaval', 'bhat'],
  ['salt', 'नमक', 'নুন', 'লবণ', 'namak', 'nun', 'lobon'],
  ['sugar', 'चीनी', 'চিনি', 'cheeni', 'chini'],
  ['oil', 'तेल', 'তেল', 'tel'],
  ['mustard', 'सरसों', 'সরিষা', 'সরিষার', 'sarso', 'sorisha'],
  ['milk', 'दूध', 'দুধ', 'doodh', 'dudh'],
  ['curd', 'दही', 'দই', 'dahi', 'doi'],
  ['ghee', 'घी', 'ঘি'],
  ['paneer', 'पनीर', 'পনির'],
  ['egg', 'eggs', 'अंडा', 'डिम', 'ডিম', 'anda', 'dim'],
  ['tomato', 'टमाटर', 'টমেটো', 'tamatar'],
  ['potato', 'आलू', 'আলু', 'aloo', 'alu'],
  ['onion', 'प्याज', 'পেঁয়াজ', 'pyaz', 'peyaj'],
  ['garlic', 'लहसुन', 'রসুন', 'lehsun', 'rosun'],
  ['ginger', 'अदरक', 'আদা', 'adrak', 'ada'],
  ['chilli', 'chili', 'मिर्च', 'লঙ্কা', 'মরিচ', 'mirch', 'lanka', 'morich'],
  ['turmeric', 'हल्दी', 'হলুদ', 'haldi', 'holud'],
  ['dal', 'daal', 'दाल', 'ডাল', 'lentil', 'pulses'],
  ['flour', 'आटा', 'আটা', 'atta', 'ata'],
  ['maida', 'मैदा', 'ময়দা'],
  ['suji', 'sooji', 'rava', 'सूजी', 'সুজি'],
  ['wheat', 'गेहूं', 'গম', 'gehu', 'gom'],
  ['tea', 'चाय', 'চা', 'chai', 'cha'],
  ['biscuit', 'biscuits', 'बिस्कुट', 'বিস্কুট'],
  ['bread', 'ब्रेड', 'পাউরুটি', 'pauruti'],
  ['soap', 'साबुन', 'সাবান', 'sabun', 'saban'],
  ['water', 'पानी', 'জল', 'pani', 'jol'],
  ['fish', 'मछली', 'মাছ', 'machli', 'mach'],
  ['chicken', 'मुर्गा', 'মুরগি', 'murga', 'murgi'],
  ['mutton', 'मटन', 'মাটন', 'khasi'],
  ['papad', 'पापड़', 'পাঁপড়'],
  ['honey', 'शहद', 'মধু', 'shahad', 'modhu'],
];

const SYNONYMS = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) SYNONYMS.set(word, group);
}

/**
 * Scores every item against the spoken clause by how many of its name words
 * appear, so "2 kg basmati rice" beats plain "Rice" when both exist.
 */
function bestMatch(phrase: string, items: MatchableItem[]): MatchableItem | null {
  // \p{M} matters: Indic vowel signs are combining marks, not letters, so
  // dropping them would shred "चावल" into "च व ल" and match nothing.
  const haystack = ` ${phrase.replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ').replace(/\s+/g, ' ')} `;
  let winner: MatchableItem | null = null;
  let winningScore = 0;

  for (const item of items) {
    const words = item.name
      .toLowerCase()
      .split(/[^\p{L}\p{N}\p{M}]+/u)
      // Two characters is a whole word in Bengali and Hindi (দই, घी).
      .filter((word) => word.length >= 2);
    if (words.length === 0) continue;

    let hits = 0;
    for (const word of words) if (heard(haystack, word)) hits += 1;
    if (hits === 0) continue;

    // Prefer the item whose whole name was heard; break ties on the unit.
    let score = hits / words.length + hits;
    if (item.unit && haystack.includes(item.unit.toLowerCase())) score += 0.5;

    if (score > winningScore) {
      winningScore = score;
      winner = item;
    }
  }

  return winner;
}

/** True when `word` — or any of its other-language equivalents — was spoken. */
function heard(haystack: string, word: string): boolean {
  for (const variant of SYNONYMS.get(word) ?? [word]) {
    if (haystack.includes(` ${variant} `)) return true;
  }
  return false;
}
