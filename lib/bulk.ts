import { parsePaise } from './money';

/**
 * Parser for the admin bulk-update textarea.
 *
 *   Price mode:  "Rice 1 kg = 68" or "Rice 1 kg = 68.50"
 *   Stock mode:  "Rice 1 kg = out"
 *
 * One line per item. The left side is matched against `name + " " + unit` as
 * shown to the admin; invalid lines are reported back rather than silently
 * dropped, so a typo never quietly leaves a price stale.
 */

export type ParsedLine =
  | { kind: 'price'; raw: string; label: string; pricePaise: number }
  | { kind: 'stock'; raw: string; label: string; inStock: boolean };

export type ParseResult = { parsed: ParsedLine[]; failed: string[] };

const STOCK_IN = new Set(['in', 'true', 'yes', 'y', '1', 'instock', 'in stock']);
const STOCK_OUT = new Set(['out', 'false', 'no', 'n', '0', 'outofstock', 'out of stock']);

export function parseBulk(text: string, mode: 'price' | 'stock'): ParseResult {
  const parsed: ParsedLine[] = [];
  const failed: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.lastIndexOf('=');
    if (separator < 1) {
      failed.push(line);
      continue;
    }

    const label = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!label || !value) {
      failed.push(line);
      continue;
    }

    if (mode === 'price') {
      // Tolerate "₹68", "68/-", "68.50" — shopkeepers paste from anywhere.
      // `parsePaise` handles the rupees-and-paise arithmetic; this only has to
      // strip the decoration a pasted price list arrives wrapped in.
      const cleaned = value.replace(/\/-$/, '').trim();
      const pricePaise = parsePaise(cleaned);
      if (pricePaise === null || pricePaise < 50 || pricePaise > 10_000_000) {
        failed.push(line);
        continue;
      }
      parsed.push({ kind: 'price', raw: line, label, pricePaise });
    } else {
      const token = value.toLowerCase();
      if (STOCK_IN.has(token)) parsed.push({ kind: 'stock', raw: line, label, inStock: true });
      else if (STOCK_OUT.has(token)) parsed.push({ kind: 'stock', raw: line, label, inStock: false });
      else failed.push(line);
    }
  }

  return { parsed, failed };
}

/** Normalised key used to match a pasted label against an existing item. */
export function matchKey(name: string, unit: string): string {
  return `${name} ${unit}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Splits "Rice 1 kg" into name "Rice" and unit "1 kg" for rows that have to be
 * created. Recognises the common Indian retail unit suffixes; anything else
 * becomes the whole name with an empty unit.
 */
const UNIT_SUFFIX = /\s+(\d+(?:\.\d+)?\s*(?:kg|g|gm|gram|l|ltr|litre|liter|ml|pc|pcs|piece|pieces|packet|pack|plate|cup|dozen)|\(\d+\s*pcs?\))$/i;

export function splitNameAndUnit(label: string): { name: string; unit: string } {
  const cleaned = label.replace(/\s+/g, ' ').trim();
  const match = cleaned.match(UNIT_SUFFIX);
  if (!match) return { name: cleaned, unit: '' };
  return {
    name: cleaned.slice(0, match.index).trim(),
    // "Momo (8 pcs)" and "Momo 8 pcs" must resolve to the same unit, or the
    // bulk paste would create a twin of an item that already exists.
    unit: match[1]!.trim().replace(/^\(|\)$/g, '').trim(),
  };
}
