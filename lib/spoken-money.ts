/**
 * What the phone says out loud after money has been written down.
 *
 * WHY THIS IS A SEPARATE FILE FROM THE LABELS. A written label and a spoken
 * sentence are not the same string with different punctuation. "টাকা (₹)" is a
 * perfectly good field label and a ridiculous thing to say to somebody; a
 * spoken line needs a verb, an order that matches how the language is actually
 * spoken, and no symbols at all — a synthesiser reads "₹" as nothing, or as the
 * word "rupee" in the wrong place, depending on the phone.
 *
 * WHO THIS IS FOR. A shopkeeper who cannot read the screen can still hear the
 * amount and the new balance, and that is the only thing they need to check.
 * It is the difference between trusting the app with the udhaar book and not.
 *
 * Amounts go out as bare digits with the currency word after them, because the
 * synthesiser reads digits in the utterance's own language — so "1410" is
 * spoken "চোদ্দোশো দশ" under `bn-IN` without this file knowing any Bengali
 * numbers. Grouping separators are deliberately absent: a comma inside a number
 * makes several Android voices read it as two numbers.
 */

import type { Locale } from './i18n';
import type { KhataKind } from './khata-speech';

/** Whole rupees, as digits, with no separators. */
function rupees(paise: number): string {
  return String(Math.round(paise / 100));
}

const CURRENCY: Record<Locale, string> = {
  en: 'rupees',
  bn: 'টাকা',
  hi: 'रुपये',
};

/** "১০০ টাকা" — a number and its currency, ready to be spoken. */
export function spokenAmount(locale: Locale, paise: number): string {
  return `${rupees(paise)} ${CURRENCY[locale]}`;
}

/**
 * The line said after a khata entry is written.
 *
 * The NAME COMES FIRST in all three, because that is the one word that tells
 * the shopkeeper whether the app understood the right person — and if it got
 * that wrong, nothing after it matters and they want to know immediately
 * rather than at the end of a sentence about money.
 *
 * The balance is always included, even when it is zero. "Nothing owing" is the
 * single most useful thing this book can tell somebody, and it is the moment a
 * customer is standing there waiting to hear it.
 */
export function spokenKhataEntry(
  locale: Locale,
  name: string,
  amountPaise: number,
  kind: KhataKind,
  balancePaise: number,
): string {
  const amount = spokenAmount(locale, amountPaise);
  const balance = spokenAmount(locale, Math.abs(balancePaise));
  const settled = balancePaise === 0;

  if (locale === 'bn') {
    const action = kind === 'DEBIT' ? `${amount} বাকি লেখা হল` : `${amount} জমা হল`;
    const total = settled
      ? 'আর কিছু বাকি নেই'
      : balancePaise > 0
        ? `মোট বাকি ${balance}`
        : `${balance} বেশি জমা আছে`;
    return `${name}, ${action}। ${total}।`;
  }

  if (locale === 'hi') {
    const action = kind === 'DEBIT' ? `${amount} उधार लिखा गया` : `${amount} जमा हुआ`;
    const total = settled
      ? 'अब कुछ बाकी नहीं'
      : balancePaise > 0
        ? `कुल बाकी ${balance}`
        : `${balance} ज़्यादा जमा है`;
    return `${name}, ${action}। ${total}।`;
  }

  const action = kind === 'DEBIT' ? `${amount} written as due` : `${amount} received`;
  const total = settled
    ? 'nothing owing now'
    : balancePaise > 0
      ? `total due ${balance}`
      : `${balance} in credit`;
  return `${name}, ${action}. ${total}.`;
}

/**
 * The line said back when the microphone has understood a khata entry but has
 * not written it yet.
 *
 * Phrased as a question on purpose. The screen shows a tick and a cross, and a
 * shopkeeper who cannot read them needs the sentence itself to say that
 * something is being asked rather than reported — otherwise the natural
 * assumption is that the money is already in the book and they walk away.
 */
export function spokenKhataAsk(
  locale: Locale,
  name: string,
  amountPaise: number,
  kind: KhataKind | null,
): string {
  const amount = spokenAmount(locale, amountPaise);

  if (locale === 'bn') {
    if (kind === null) return `${name}, ${amount}। বাকি না জমা?`;
    return kind === 'DEBIT' ? `${name}, ${amount} বাকি? ঠিক আছে?` : `${name}, ${amount} জমা? ঠিক আছে?`;
  }

  if (locale === 'hi') {
    if (kind === null) return `${name}, ${amount}। उधार या जमा?`;
    return kind === 'DEBIT' ? `${name}, ${amount} उधार? सही है?` : `${name}, ${amount} जमा? सही है?`;
  }

  if (kind === null) return `${name}, ${amount}. Due, or paid?`;
  return kind === 'DEBIT' ? `${name}, ${amount} due. Is that right?` : `${name}, ${amount} paid. Is that right?`;
}

/** Said when the mic understood an amount but nobody in the book by that name. */
export function spokenKhataNoMatch(locale: Locale, name: string): string {
  if (locale === 'bn') return `${name} — খাতায় এই নামে কাউকে পেলাম না।`;
  if (locale === 'hi') return `${name} — खाते में इस नाम से कोई नहीं मिला।`;
  return `${name} — nobody in the book by that name.`;
}

/**
 * The line said after a counter sale is rung up.
 *
 * Just the total. A shopkeeper at the till is holding goods in one hand and a
 * customer is waiting; the one number that matters is what to ask for, and
 * anything after it is talked over.
 */
export function spokenSaleTotal(locale: Locale, totalPaise: number): string {
  const amount = spokenAmount(locale, totalPaise);
  if (locale === 'bn') return `মোট ${amount}।`;
  if (locale === 'hi') return `कुल ${amount}।`;
  return `Total ${amount}.`;
}
