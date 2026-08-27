/**
 * The units a shop of each kind actually sells in.
 *
 * Offered as suggestions, never as a closed list. A kirana sells rice by the
 * kilo, mustard oil by the litre and spinach by the bundle; a tea stall sells
 * by the cup; a restaurant by the plate. Showing a tea stall "500 g" is noise,
 * and the moment a list is exhaustive in a developer's head it has stopped
 * being exhaustive in a shop.
 *
 * So every unit field is a text input with a datalist behind it: the shop's own
 * common units are one tap away, and anything else can still be typed. Ordered
 * by how often that kind of shop reaches for them, not alphabetically, because
 * these render as a list someone scans rather than searches.
 */

import type { ShopType } from '@prisma/client';

const WEIGHT = ['1 kg', '500 g', '250 g', '100 g', '50 g', '5 kg'];
const VOLUME = ['1 l', '500 ml', '250 ml', '200 ml'];
const COUNT = ['1 pc', '6 pc', '12 pc', '1 dozen'];
const PACK = ['1 packet', '1 bottle', '1 bundle'];
const SERVING = ['1 plate', 'half plate', '1 bowl', '1 cup', '1 glass'];

const BY_TYPE: Record<ShopType, string[]> = {
  // A kirana weighs and measures nearly everything, and sells greens by the
  // bundle — the one unit no supermarket taxonomy ever has.
  GROCERY: [...WEIGHT, ...VOLUME, ...COUNT, ...PACK],
  RESTAURANT: [...SERVING, ...COUNT, '1 bottle'],
  ROLL_MOMO: ['1 pc', '6 pc', '8 pc', ...SERVING, '1 bottle'],
  TEA_STALL: ['1 cup', '1 glass', '1 pc', '1 plate', '1 bottle', '1 packet'],
  BAKERY: ['1 pc', '1 packet', '1 box', '500 g', '1 kg', '250 g', '6 pc'],
  HOME_KITCHEN: [...SERVING, '1 pc', '1 packet'],
  OTHER: [...WEIGHT, ...VOLUME, ...COUNT, ...PACK, ...SERVING],
};

export function unitsFor(type: ShopType): string[] {
  return BY_TYPE[type] ?? BY_TYPE.OTHER;
}

/** Shared id so one datalist can serve every unit field on a page. */
export const UNIT_LIST_ID = 'dukaanflow-units';
