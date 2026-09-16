/**
 * A probe for the stock box and the duplicate flag, run by hand after touching
 * either.
 *
 *   npx tsx scripts/stock-input-check.ts
 *
 * The cases are what a shopkeeper actually types into a stock field and what a
 * real shop's item list actually looks like. Nothing here talks to a database.
 */

import { parseStockAmount, stockAmountLabel } from '../lib/units';
import { duplicateNameIds } from '../lib/starter-catalogue';

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(38)} → ${JSON.stringify(actual)}${ok ? '' : `  expected ${JSON.stringify(expected)}`}`);
}

console.log('\n  Typing into the stock box\n');

// A plain number is already in multiples of the row's own pack.
check('"12" on a 1 packet row', parseStockAmount('12', '1 packet'), 12);
check('"9" on a 500 g row', parseStockAmount('9', '500 g'), 9);

// An amount with its unit, converted against the row's pack.
check('"4.5 kg" on a 1 kg row', parseStockAmount('4.5 kg', '1 kg'), 4.5);
check('"4.5 kg" on a 500 g row', parseStockAmount('4.5 kg', '500 g'), 9);
check('"700 g" on a 1 kg row', parseStockAmount('700 g', '1 kg'), 0.7);
check('"2 litre" on a 500 ml row', parseStockAmount('2 litre', '500 ml'), 4);
check('"1 kg" on a 1 kg row', parseStockAmount('1 kg', '1 kg'), 1);
check('"500gm" on a 1 kg row', parseStockAmount('500gm', '1 kg'), 0.5);

// Empty means nobody is counting — NOT zero, which would hide the item.
check('empty box', parseStockAmount('', '1 kg'), null);
check('spaces only', parseStockAmount('   ', '1 kg'), null);

// Zero is a real answer: the shelf is empty.
check('"0" on a 1 kg row', parseStockAmount('0', '1 kg'), 0);

// A unit that cannot be converted into the row's own is refused, not guessed.
check('"5 kg" on a 1 plate row', parseStockAmount('5 kg', '1 plate'), 'bad');
check('"3 litre" on a 1 kg row', parseStockAmount('3 litre', '1 kg'), 'bad');
check('gibberish', parseStockAmount('abcd', '1 kg'), 'bad');
check('negative', parseStockAmount('-4', '1 kg'), 'bad');

console.log('\n  Writing it back into the box\n');

check('4.5 of a 1 kg row', stockAmountLabel('1 kg', 4.5), '4.5 kg');
check('0.7 of a 1 kg row', stockAmountLabel('1 kg', 0.7), '700 g');
check('9 of a 500 g row', stockAmountLabel('500 g', 9), '4.5 kg');
check('12 of a 1 packet row', stockAmountLabel('1 packet', 12), '12');

console.log('\n  Duplicates already on a shop\'s list\n');

// The real pair from Sarkar Stores: different English, identical Bengali.
const flagged = duplicateNameIds([
  { id: 'a', name: 'Matar Dal', nameBn: 'মটর ডাল', nameHi: 'मटर दाल' },
  { id: 'b', name: 'Motor dal', nameBn: 'মটর ডাল', nameHi: 'मटर दाल' },
  { id: 'c', name: 'Masoor Dal', nameBn: 'মুসুর ডাল', nameHi: 'मसूर दाल' },
  { id: 'd', name: 'Rice', nameBn: 'চাল', nameHi: 'चावल' },
]);
check('the মটর ডাল pair is flagged', [...flagged].sort(), ['a', 'b']);

// A row whose own names loosen alike must not be a duplicate of itself.
const selfOnly = duplicateNameIds([{ id: 'x', name: 'Cha', nameBn: 'cha', nameHi: '' }]);
check('a row is never its own duplicate', [...selfOnly], []);

console.log('\n  What the supplier list shows as "left"\n');

// The badge on the restock card. `stockQty` is a multiple of the item's own
// pack, so two of a 500 g bag is a kilo — printing the raw 2 says nothing.
check('2 of a 500 g pack', stockAmountLabel('500 g', 2), '1 kg');
check('1 of a 1 kg pack', stockAmountLabel('1 kg', 1), '1 kg');
check('1 of a 1 packet pack', stockAmountLabel('1 packet', 1), '1');
check('0.5 of a 1 kg pack', stockAmountLabel('1 kg', 0.5), '500 g');

console.log(`\n  ${failures === 0 ? 'all passed' : `${failures} FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
