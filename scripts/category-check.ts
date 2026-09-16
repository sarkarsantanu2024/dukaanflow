/**
 * A probe for `categoryForNames`, run by hand after touching it.
 *
 *   npx tsx scripts/category-check.ts
 *
 * The cases are the ones a real shop actually produced — items that landed
 * under "Other" on a live storefront, and the one that landed under ডাল and
 * should not have. Nothing here talks to a database.
 */

import { categoryForNames, starterCatalogue } from '../lib/starter-catalogue';

const catalogue = starterCatalogue('GROCERY');

/** [English name, Bengali name, Hindi name, what it should come out as] */
const CASES: [string, string, string, string][] = [
  // The screenshots: every one of these was landing under "Other".
  ['Flour', 'আটা', 'आटा', 'Rice & Atta'],
  ['Matar Dal', 'মটর ডাল', 'मटर दाल', 'Dal & Pulses'],
  ['Minicate rice', '', '', 'Rice & Atta'],
  ['Motor dal', 'মটর ডাল', 'मटर दाल', 'Dal & Pulses'],
  ['Puffed rice', 'মুড়ি', 'मुरमुरे', 'Rice & Atta'],

  // Soyabean is a nugget, not a dal.
  ['Soyabean', 'সয়াবিন', 'सोयाबीन', 'Staples'],

  // The longest match must win, or cooking oil files under the bean.
  ['Soyabean Oil', 'সয়াবিন তেল', 'सोयाबीन तेल', 'Oil & Ghee'],
  ['Mustard Oil', '', '', 'Oil & Ghee'],

  // Straight catalogue hits, which must not have regressed.
  ['Rice', '', '', 'Rice & Atta'],
  ['Masoor Dal', '', '', 'Dal & Pulses'],
  ['Potato', '', '', 'Vegetables'],

  // Loose spelling, the thing roman Bengali does to every list.
  ['Basmoti Rice', '', '', 'Rice & Atta'],
  ['chana daal', '', '', 'Dal & Pulses'],

  // Head-words, for things no catalogue entry knows.
  ['Lifebuoy soap', '', '', 'Personal Care'],
  ['Red Label Tea', '', '', 'Tea & Coffee'],

  // Genuinely unknown stays blank rather than being guessed at.
  ['Zandu Balm', '', '', ''],
];

let failures = 0;

for (const [name, bn, hi, expected] of CASES) {
  const actual = categoryForNames([name, bn, hi], catalogue);
  const ok = actual === expected;
  if (!ok) failures += 1;
  const shown = actual || '(none)';
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(18)} → ${shown.padEnd(16)} ${
      ok ? '' : `expected ${expected || '(none)'}`
    }`,
  );
}

console.log(`\n  ${CASES.length - failures}/${CASES.length} passed\n`);
process.exit(failures === 0 ? 0 : 1);
