import { describe, expect, it } from 'vitest';
import {
  formatPaise,
  linePaise,
  paiseToInput,
  paiseToUpiAmount,
  parsePaise,
  plainPaise,
  rupeesToPaise,
} from '@/lib/money';

describe('parsePaise: typed amounts become exact paise', () => {
  it.each([
    ['12', 1200],
    ['12.5', 1250], // tenths of a rupee, not five paise
    ['12.50', 1250],
    ['12.05', 1205],
    ['0.5', 50],
    ['.5', 50],
    ['₹1,250', 125000],
    ['  8.165  ', null], // three decimals is not an amount
  ])('%s → %s', (typed, paise) => {
    expect(parsePaise(typed)).toBe(paise);
  });

  it('never drifts the way parseFloat(x) * 100 does', () => {
    // 12.10 * 100 in floating point is 1209.9999999999998.
    expect(parsePaise('12.10')).toBe(1210);
    expect(parsePaise('8.16')).toBe(816);
  });

  it('reads Bengali and Devanagari digits', () => {
    expect(parsePaise('১২.৫০')).toBe(1250);
    expect(parsePaise('१२')).toBe(1200);
  });

  it('rejects text that is not a plain amount', () => {
    for (const bad of ['', 'abc', '12.3.4', '-5', '12,5.0.0']) expect(parsePaise(bad)).toBeNull();
  });
});

describe('linePaise: the one place a quantity meets a price', () => {
  it('rounds once, so a line is always a whole number of paise', () => {
    expect(linePaise(6500, 1)).toBe(6500);
    expect(linePaise(12000, 0.05)).toBe(600); // 50 g of a ₹120/kg item
    expect(linePaise(9999, 0.333)).toBe(3330);
    expect(Number.isInteger(linePaise(1, 0.1 + 0.2))).toBe(true);
  });
});

describe('display helpers', () => {
  it('drops ".00" on whole rupees and groups Indian-style', () => {
    expect(formatPaise(125000)).toBe('₹1,250');
    expect(formatPaise(1250)).toBe('₹12.50');
    expect(formatPaise(10000000)).toBe('₹1,00,000');
  });

  it('keeps the sign on negative balances, including under one rupee', () => {
    expect(formatPaise(-1250)).toBe('₹-12.50');
    expect(formatPaise(-50)).toBe('₹-0.50');
    expect(plainPaise(-1250)).toBe('₹-12.50');
    expect(plainPaise(-50)).toBe('₹-0.50'); // printed "₹0.50" before the fix
    expect(plainPaise(-1200)).toBe('₹-12');
    expect(plainPaise(1250)).toBe('₹12.50');
  });

  it('round-trips through the input field', () => {
    for (const paise of [0, 50, 1200, 1250, 1205, 125000]) {
      expect(parsePaise(paiseToInput(paise))).toBe(paise);
    }
  });

  it('gives UPI exactly two decimals', () => {
    expect(paiseToUpiAmount(1200)).toBe('12.00');
    expect(paiseToUpiAmount(1205)).toBe('12.05');
    expect(rupeesToPaise(12.1)).toBe(1210);
  });
});
