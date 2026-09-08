import { BRAND_NAME } from './brand';
import { formatPaise } from './money';
import type { Locale } from './i18n';

/**
 * The WhatsApp message the operator sends when a payment clears.
 *
 * IN THE SHOPKEEPER'S OWN LANGUAGE. Everything else this product says to an
 * owner is — their app, their roadblock, their receipts — and then the one
 * message that carries money, a date and a code they must type correctly
 * arrived in English. A Bengali shopkeeper forwarding that to a nephew to read
 * is exactly the moment a four-digit code gets mistyped.
 *
 * It is built on the server, not in the console's browser, for two reasons: the
 * renewal date has to be formatted in one fixed timezone (an operator abroad
 * would otherwise quote a date a day out), and it is assembled from the same
 * `periodFor` arithmetic that will actually grant the time.
 *
 * WHAT IT HAS TO CONTAIN, and why each part earns its line:
 *  - the shop's name, and the owner's, because an operator handles many shops
 *    from one phone and a message with no name on it is one sent to the wrong
 *    number without anybody noticing;
 *  - the plan and what it holds, so "Basic" means something;
 *  - what was paid and for how long, which is the shopkeeper's receipt — there
 *    is no invoice anywhere else in this product;
 *  - the date it runs until, which is the question they will ask next;
 *  - and only then the code.
 */

export type ActivationMessage = {
  locale: Locale;
  shopName: string;
  /** Blank is normal — many shops are onboarded without one. */
  ownerName: string;
  planName: string;
  planItemLimit: number;
  months: number;
  amountPaise: number;
  /**
   * When the plan runs to. A Date, not a string, so it can be written out in
   * the reader's own script — a Bengali message carrying "14 September 2027" is
   * the one line in it a shopkeeper cannot read, and it is the line about their
   * money running out.
   */
  renewsOn: Date;
  code: string;
};

/** The date, in the reader's language and always in Indian time. */
const DATE_LOCALE: Record<Locale, string> = { en: 'en-IN', bn: 'bn-IN', hi: 'hi-IN' };

function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(DATE_LOCALE[locale] ?? 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    // Fixed, so an operator on a laptop set to another timezone cannot quote a
    // date a day out from the one the server will actually grant.
    timeZone: 'Asia/Kolkata',
  });
}

type Template = {
  greeting: (owner: string) => string;
  received: string;
  planLine: (plan: string, limit: string) => string;
  paidLine: (period: string, amount: string) => string;
  untilLine: (date: string) => string;
  codeLine: (code: string) => string;
  howTo: string;
  month: string;
  year: string;
  months: (n: number) => string;
};

const TEMPLATES: Record<Locale, Template> = {
  en: {
    greeting: (owner) => (owner ? `Namaste ${owner},` : 'Namaste,'),
    received: 'Payment received — thank you.',
    planLine: (plan, limit) => `Plan: ${plan} (up to ${limit} items)`,
    paidLine: (period, amount) => `Paid: ${period} — ${amount}`,
    untilLine: (date) => `Runs until: ${date}`,
    codeLine: (code) => `Your activation code is ${code}`,
    howTo: 'Open your app, tap Plan, and type the code in. Your plan turns on at once.',
    month: '1 month',
    year: '1 year',
    months: (n) => `${n} months`,
  },
  bn: {
    greeting: (owner) => (owner ? `নমস্কার ${owner},` : 'নমস্কার,'),
    received: 'আপনার টাকা পেয়েছি — ধন্যবাদ।',
    planLine: (plan, limit) => `প্ল্যান: ${plan} (${limit}টি জিনিস পর্যন্ত)`,
    paidLine: (period, amount) => `দিলেন: ${period} — ${amount}`,
    untilLine: (date) => `চলবে: ${date} পর্যন্ত`,
    codeLine: (code) => `আপনার কোড ${code}`,
    howTo: 'অ্যাপ খুলে "প্ল্যান"-এ চাপ দিন, কোডটা লিখুন। সঙ্গে সঙ্গে চালু হয়ে যাবে।',
    month: '১ মাস',
    year: '১ বছর',
    months: (n) => `${n} মাস`,
  },
  hi: {
    greeting: (owner) => (owner ? `नमस्ते ${owner},` : 'नमस्ते,'),
    received: 'आपका भुगतान मिल गया — धन्यवाद।',
    planLine: (plan, limit) => `प्लान: ${plan} (${limit} सामान तक)`,
    paidLine: (period, amount) => `दिया: ${period} — ${amount}`,
    untilLine: (date) => `चलेगा: ${date} तक`,
    codeLine: (code) => `आपका कोड ${code} है`,
    howTo: 'ऐप खोलिए, "प्लान" दबाइए और कोड लिख दीजिए। प्लान तुरंत चालू हो जाएगा।',
    month: '१ महीना',
    year: '१ साल',
    months: (n) => `${n} महीने`,
  },
};

function periodLabel(template: Template, months: number): string {
  if (months === 1) return template.month;
  if (months === 12) return template.year;
  return template.months(months);
}

export function activationMessage(input: ActivationMessage): string {
  const t = TEMPLATES[input.locale] ?? TEMPLATES.en;

  // Blank lines between the blocks, because WhatsApp renders one long
  // paragraph as a wall and the code has to be findable at a glance by
  // somebody holding the phone in one hand.
  return [
    `${BRAND_NAME} — ${input.shopName}`,
    t.greeting(input.ownerName.trim()),
    '',
    t.received,
    t.planLine(input.planName, input.planItemLimit.toLocaleString('en-IN')),
    t.paidLine(periodLabel(t, input.months), formatPaise(input.amountPaise)),
    t.untilLine(formatDate(input.renewsOn, input.locale)),
    '',
    t.codeLine(input.code),
    t.howTo,
  ].join('\n');
}
