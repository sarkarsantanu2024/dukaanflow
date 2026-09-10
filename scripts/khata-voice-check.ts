/**
 * What the khata microphone must get right, as a runnable list.
 *
 *   npm run khata:check
 *
 * WHY THIS FILE EXISTS. Every other mistake in this app costs a tap. This one
 * posts money against the wrong person's name in a book whose entire purpose is
 * to settle arguments about exactly that — and the failure is silent, because
 * the entry looks perfectly ordinary once it is written.
 *
 * The rest of the repo has no test runner and this does not add one: it is a
 * script that prints a table and exits non-zero, which is enough to catch the
 * two ways this breaks. The first is a change to `wordsToDigits` or the filler
 * lists that stops a sentence parsing. The second, and the dangerous one, is a
 * change to the matcher that lets a name nobody said win anyway — which is why
 * the last case here is a customer who is NOT in the book and whose only
 * correct answer is silence.
 *
 * Run it after touching `lib/khata-speech.ts` or `lib/speech.ts`.
 */
import { resolveSpokenKhata, type KhataKind } from '../lib/khata-speech';

const BOOK = [
  { id: '1', name: 'Rekha Das', phone: '9800000011' },
  { id: '2', name: 'Sujit Mondal', phone: '9800000022' },
  { id: '3', name: 'Anjali Ghosh', phone: '9800000033' },
  { id: '4', name: 'Bikash Pal', phone: '9800000044' },
];

type Expectation = {
  said: string;
  /** The customer's name, or null where the book holds nobody who was meant. */
  who: string | null;
  rupees?: number;
  /** `null` where the sentence never said which way — the card has to ask. */
  kind?: KhataKind | null;
};

const CASES: Expectation[] = [
  // Bengali, both directions, with and without an honorific.
  { said: 'রেখা দি একশো টাকা বাকি', who: 'Rekha Das', rupees: 100, kind: 'DEBIT' },
  { said: 'রেখা একশো টাকা বাকি', who: 'Rekha Das', rupees: 100, kind: 'DEBIT' },
  { said: 'সুজিত দুশো টাকা দিয়েছে', who: 'Sujit Mondal', rupees: 200, kind: 'CREDIT' },
  { said: 'বিকাশ দা তিনশো টাকা জমা', who: 'Bikash Pal', rupees: 300, kind: 'CREDIT' },
  { said: 'রেখা দি ৫০ টাকা দিয়েছে', who: 'Rekha Das', rupees: 50, kind: 'CREDIT' },

  // The inherent vowel: "অঞ্জলি" romanises to "anjli", the book says "Anjali".
  { said: 'অঞ্জলি পাঁচশো টাকা বাকি', who: 'Anjali Ghosh', rupees: 500, kind: 'DEBIT' },

  // No direction word — the screen must ask rather than assume udhaar.
  { said: 'বিকাশ আড়াইশো টাকা', who: 'Bikash Pal', rupees: 250, kind: null },

  // Hindi.
  { said: 'रेखा जी सौ रुपये बाकी', who: 'Rekha Das', rupees: 100, kind: 'DEBIT' },
  { said: 'सुजीत ने दो सौ रुपये दिए', who: 'Sujit Mondal', rupees: 200, kind: 'CREDIT' },

  // English and romanised, as spoken in a Kolkata shop.
  { said: 'Rekha one hundred rupees due', who: 'Rekha Das', rupees: 100, kind: 'DEBIT' },
  { said: 'Sujit paid two hundred', who: 'Sujit Mondal', rupees: 200, kind: 'CREDIT' },
  { said: 'Bikash Pal 250 taka baki', who: 'Bikash Pal', rupees: 250, kind: 'DEBIT' },

  // THE ONES THAT MUST COME BACK EMPTY.
  // A name that is not in the book. There is always a closest match; it must
  // not be offered.
  { said: 'রঞ্জন একশো টাকা বাকি', who: null },
  // A name and no money.
  { said: 'রেখা দি বাকি', who: null },
  // The shop, overheard.
  { said: 'আজ বৃষ্টি হবে মনে হচ্ছে', who: null },
];

let failed = 0;

for (const expected of CASES) {
  const resolved = resolveSpokenKhata([expected.said], BOOK);

  const actualWho = resolved?.match.customer.name ?? null;
  const actualRupees = resolved ? resolved.entry.amountPaise / 100 : undefined;
  const actualKind = resolved ? resolved.entry.kind : undefined;

  const ok =
    actualWho === expected.who &&
    (expected.who === null ||
      (actualRupees === expected.rupees && actualKind === expected.kind));

  if (!ok) failed += 1;

  const summary =
    actualWho === null
      ? 'nobody'
      : `${actualWho} · ₹${actualRupees} · ${actualKind ?? 'ask'}`;

  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${expected.said}\n          ${summary}`);
}

console.log(
  failed === 0
    ? `\n${CASES.length} spoken entries, all as expected.\n`
    : `\n${failed} of ${CASES.length} WRONG — do not ship the khata microphone like this.\n`,
);

process.exit(failed === 0 ? 0 : 1);
