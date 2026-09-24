/**
 * The automatic Bengali / Hindi names an item is given when the owner types
 * only one — checked, because the day one of them was wrong it was a slur on a
 * live shop page ("Maggi" → মাগী).
 *
 *   npm run names:check
 *
 * Pure: imports only lib/, touches no database and no network.
 */
import { localNames } from '../lib/transliterate';

let failures = 0;
function expect(label: string, actual: string, wanted: string) {
  const ok = actual === wanted;
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(28)} ${actual}${ok ? '' : `   (wanted ${wanted})`}`);
}

console.log('\nBrands and staples get their real spelling, not a letter-by-letter guess\n');
const KNOWN: [string, string, string][] = [
  ['Maggi', 'ম্যাগি', 'मैगी'],
  ['Surf Excel', 'সার্ফ এক্সেল', 'सर्फ एक्सेल'],
  ['Lux Soap', 'লাক্স সাবান', 'लक्स साबुन'],
  ['Good Day', 'গুড ডে', 'गुड डे'],
  ['Parle-G', 'পার্লে-জি', 'पारले-जी'],
  ['Colgate', 'কোলগেট', 'कोलगेट'],
  ['Tata Salt', 'টাটা নুন', 'टाटा नमक'],
  ['Bingo', 'বিঙ্গো', 'बिंगो'],
  ['Kurkure', 'কুরকুরে', 'कुरकुरे'],
  ['Candles', 'মোমবাতি', 'मोमबत्ती'],
  ['Posto', 'পোস্ত', 'पोस्ता'],
  ['Soya Badi', 'সয়াবিন বড়ি', 'सोया बड़ी'],
  ['Agarbatti', 'ধূপকাঠি', 'अगरबत्ती'],
  ['Rice', 'চাল', 'चावल'],
];
for (const [name, bn, hi] of KNOWN) {
  const got = localNames(name);
  expect(`${name} → bn`, got.bn, bn);
  expect(`${name} → hi`, got.hi, hi);
}

console.log('\nA guessed spelling that lands on an offensive word is dropped\n');
// Unknown names spelt letter by letter; none may come back as a listed word.
const BLOCKED = /(^|[\s-])(মাগী|মাগি|मागी|चूत|चुत|रंडी|रेंडी|রেংডী|খানকি|খাংকী|खांकी)([\s-]|$)/;
for (const name of ['Magee', 'Maagi', 'Magii', 'Rendi', 'Khanki', 'Chut']) {
  const got = localNames(name);
  const clean = !BLOCKED.test(got.bn) && !BLOCKED.test(got.hi);
  if (!clean) failures += 1;
  console.log(`  ${clean ? 'ok  ' : 'FAIL'}  ${name.padEnd(28)} bn "${got.bn}" · hi "${got.hi}"`);
}

console.log('\nA name the owner typed in their own script is kept as typed\n');
expect('বালতি stays (not a substring match)', localNames('বালতি').bn, 'বালতি');
expect('Owner-typed Bengali kept', localNames('আমার দোকানের চা').bn, 'আমার দোকানের চা');

console.log(failures === 0 ? '\nAll names as expected.\n' : `\n${failures} failed.\n`);
process.exit(failures === 0 ? 0 : 1);
