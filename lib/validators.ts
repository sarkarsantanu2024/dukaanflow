import { z } from 'zod';
import { isStateCode } from './states';

export const SHOP_TYPES = [
  'GROCERY',
  'RESTAURANT',
  'TEA_STALL',
  'ROLL_MOMO',
  'HOME_KITCHEN',
  'BAKERY',
  'OTHER',
] as const;

export const SHOP_TYPE_LABELS: Record<(typeof SHOP_TYPES)[number], string> = {
  GROCERY: 'Grocery / Kirana',
  RESTAURANT: 'Restaurant',
  TEA_STALL: 'Tea Stall',
  ROLL_MOMO: 'Roll & Momo',
  HOME_KITCHEN: 'Home Kitchen',
  BAKERY: 'Bakery',
  OTHER: 'Other',
};

/** Indian mobile: exactly 10 digits starting 6-9. Accepts +91 / 0 prefixes and strips them. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .transform((value) => value.replace(/^(\+?91|0)/, ''))
  .pipe(
    z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  );

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Slug is too short')
  .max(60, 'Slug is too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');

/**
 * A price in PAISE, 50 paise to ₹1,00,000.
 *
 * Integer paise, not rupees: the client parses what the shopkeeper typed with
 * `parsePaise` and sends the paise figure, so "12.50" arrives here as 1250. The
 * floor is 50 paise rather than a rupee because a kirana really does sell a
 * toffee at fifty paise, and the old whole-rupee rule made that unlistable.
 */
export const priceSchema = z
  .number({ invalid_type_error: 'Price must be a number' })
  .int('Price must be a whole number of paise')
  .min(50, 'Price must be at least 50 paise')
  .max(10_000_000, 'Price looks too large');

export const quantitySchema = z.number().int().min(1, 'Minimum 1').max(99, 'Maximum 99 per item');

export const itemNameSchema = z
  .string()
  .trim()
  .min(1, 'Item name is required')
  .max(80, 'Item name is too long');

/** VPA format: handle@bank. Empty string allowed — UPI is optional. */
export const upiSchema = z
  .string()
  .trim()
  .max(80)
  .refine(
    (value) => value === '' || /^[\w.\-]{2,64}@[a-zA-Z]{2,32}$/.test(value),
    'Enter a valid UPI ID like ramu@okaxis',
  );

/** "HH:MM" on a 24-hour clock, or blank for "not said". */
export const clockTimeSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    'Use a time like 09:30',
  )
  .default('');

/**
 * What the shopkeeper themselves controls about their shop being open.
 *
 * Deliberately separate from `shopUpdateSchema`, which is the operator's:
 * hours, whether the shutter is up today and why not are the shopkeeper's own
 * business and change with a festival or a family illness.
 */
export const shopHoursSchema = z
  .object({
    openTime: clockTimeSchema,
    closeTime: clockTimeSchema,
    active: z.boolean().optional(),
    closedNote: z.string().trim().max(120).default(''),
  })
  .refine((value) => (value.openTime === '') === (value.closeTime === ''), {
    message: 'Give both times, or neither',
    path: ['closeTime'],
  });

export const shopCreateSchema = z.object({
  name: z.string().trim().min(2, 'Shop name is required').max(80),
  ownerName: z.string().trim().max(60).default(''),
  // Bengali by default: that is where the shops are, and an owner handed an
  // English app has to find the switch before they can read the screen that
  // holds it.
  locale: z.enum(['en', 'bn', 'hi']).default('bn'),
  slug: slugSchema.optional().or(z.literal('')),
  type: z.enum(SHOP_TYPES),
  phone: phoneSchema,
  address: z.string().trim().max(200).default(''),
  /// Collection-only shops turn this off; the storefront then never offers
  /// delivery and the order route refuses it.
  openTime: clockTimeSchema,
  closeTime: clockTimeSchema,
  deliveryEnabled: z.boolean().default(true),
  /// A demonstration shop. Hidden from the console behind a toggle.
  isDemo: z.boolean().default(false),
  /// A code from `lib/states.ts`; blank means nobody has said yet. Occasion
  /// reporting is scoped by state, so a blank shop sees only all-India ones.
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => value === '' || isStateCode(value), 'Pick a state')
    .default(''),
  upiId: upiSchema.default(''),
  active: z.boolean().default(true),
});
export type ShopCreateInput = z.input<typeof shopCreateSchema>;

export const shopUpdateSchema = shopCreateSchema.partial().extend({
  slug: slugSchema.optional(),
});

/** Optional per-language name. Empty means "fall back to `name`". */
const altNameSchema = z.string().trim().max(80).default('');

export const itemUpsertSchema = z.object({
  name: itemNameSchema,
  nameBn: altNameSchema,
  nameHi: altNameSchema,
  pricePaise: priceSchema,
  /**
   * Did a human choose this price?
   *
   * True by default because the typed form and the bulk paste always carry a
   * deliberate one. The starter catalogue, voice and photo adders send `false`
   * explicitly: those land at a placeholder Re 1, and a placeholder must never
   * put an item on sale.
   */
  priced: z.boolean().default(true),
  unit: z.string().trim().max(24).default(''),
  category: z.string().trim().max(40).default(''),
  inStock: z.boolean().default(true),
});

export const itemPatchSchema = z.object({
  id: z.string().uuid('Unknown item'),
  pricePaise: priceSchema.optional(),
  priced: z.boolean().optional(),
  // Editable because the pack size is the shop's own decision: a starter item
  // arrives at "1 kg" and the shop that sells rice by the 5 kg bag must be able
  // to say so. Without this the only fix was deleting the item and re-adding it.
  unit: z.string().trim().max(24).optional(),
  inStock: z.boolean().optional(),
  category: z.string().trim().max(40).optional(),
  nameBn: altNameSchema.optional(),
  nameHi: altNameSchema.optional(),
});

export const itemDeleteSchema = z.object({ id: z.string().uuid('Unknown item') });

export const bulkSchema = z.object({
  mode: z.enum(['price', 'stock']),
  text: z.string().min(1, 'Paste at least one line').max(20000),
});

export const orderSchema = z
  .object({
    shopSlug: slugSchema,
    // Every field is now required. A shop that cannot name or find the person
    // who ordered has to ring them to ask, which is the phone call the order
    // was supposed to replace — and the details are typed once per phone, ever.
    customerName: z.string().trim().min(1, 'Please give your name').max(60),
    customerPhone: phoneSchema,
    customerAddress: z.string().trim().max(200).default(''),
    customerArea: z.string().trim().min(1, 'Which area are you in?').max(60),
    orderType: z.enum(['DELIVERY', 'PICKUP']),
    items: z
      .array(z.object({ itemId: z.string().uuid(), quantity: quantitySchema }))
      .min(1, 'Add at least one item')
      .max(60, 'Too many items in one order'),
  })
  // Only a delivery needs somewhere to be delivered to. Demanding an address
  // from somebody walking in to collect would be asking for nothing.
  .refine((value) => value.orderType !== 'DELIVERY' || value.customerAddress.length > 0, {
    message: 'Where should we deliver it?',
    path: ['customerAddress'],
  });

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(60),
  password: z.string().min(1, 'Password is required').max(200),
});

/** The owner's sign-in: one 6-digit PIN, nothing else to remember. */
export const ownerLoginSchema = z.object({
  pin: z
    .string()
    .trim()
    // Phone keyboards and copy-paste both like to add spaces and hyphens.
    .transform((value) => value.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'Enter the 6-digit PIN')),
});

/** A counter sale rung up by the owner. Prices are re-read server-side. */
export const saleSchema = z.object({
  items: z
    .array(z.object({ itemId: z.string().uuid(), quantity: quantitySchema }))
    .min(1, 'Add at least one item')
    .max(60, 'Too many items in one sale'),
  // KHATA means the goods left on credit: the sale is recorded and the amount
  // is added to that customer's udhaar in the same breath.
  paymentMode: z.enum(['CASH', 'UPI', 'KHATA']).default('CASH'),
  customerPhone: phoneSchema.optional(),
  customerName: z.string().trim().max(60).default(''),
  /** Which para or lane — the same field the khata page collects. */
  customerArea: z.string().trim().max(60).default(''),
});

/** One line of the credit book. */
export const ledgerSchema = z.object({
  customerPhone: phoneSchema,
  customerName: z.string().trim().max(60).default(''),
  /** Which para or lane — free text, to tell two Rekhas apart. */
  customerArea: z.string().trim().max(60).default(''),
  kind: z.enum(['DEBIT', 'CREDIT']),
  /** PAISE. The client parses what was typed with `parsePaise`. */
  amountPaise: z
    .number({ invalid_type_error: 'Enter an amount' })
    .int('Whole paise only')
    .min(1, 'Enter an amount')
    .max(100_000_000, 'That looks too large'),
  note: z.string().trim().max(120).default(''),
});

export const ledgerDeleteSchema = z.object({ id: z.string().uuid('Unknown entry') });

export const orderStatusSchema = z.object({
  id: z.string().uuid('Unknown order'),
  status: z.enum(['NEW', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
  /**
   * Did the money arrive? Only read when completing an order.
   *
   * Defaults to false, and false is the consequential answer: completing an
   * order the customer has not paid for posts the total to their khata. The
   * default is deliberate — an owner who taps past this question has still
   * given goods away, and the debt should exist whether or not they told us.
   */
  paymentReceived: z.boolean().default(false),
  /** How it was paid. Blank while unpaid or not yet completed. */
  paymentMode: z.enum(['', 'CASH', 'UPI']).default(''),
});

/** A calendar day as `YYYY-MM-DD`, which is what a date input sends. */
const daySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date');

/**
 * One occasion: a name, and whether it moves.
 *
 * No dates. An occasion is entered once and left alone — "Durga Puja" is one
 * row forever. When it falls is a separate, yearly matter, and for the many
 * occasions that never move it is not a matter at all.
 */
export const occasionSchema = z.object({
  name: z.string().trim().min(2, 'Name the occasion').max(60),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => value === '' || isStateCode(value), 'Pick a state')
    .default(''),
  /** Both together, or neither: a half-set fixed date could not be resolved. */
  fixedMonth: z.number().int().min(1).max(12).nullable().default(null),
  fixedDay: z.number().int().min(1).max(31).nullable().default(null),
  // A festival is days, not seasons. Sixty days is already generous — Ramzan is
  // thirty — and a longer span would swallow ordinary trade into a festival.
  spanDays: z.number().int().min(1, 'At least one day').max(60, 'At most 60 days').default(1),
  note: z.string().trim().max(200).default(''),
}).refine((value) => (value.fixedMonth === null) === (value.fixedDay === null), {
  message: 'Give both the month and the day, or neither',
  path: ['fixedDay'],
});

export const occasionUpdateSchema = z.object({ id: z.string().uuid('Unknown occasion') });

/** The days one moving occasion fell on, in one year. */
export const occasionDateSchema = z
  .object({
    occasionId: z.string().uuid('Unknown occasion'),
    startsOn: daySchema,
    endsOn: daySchema,
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    message: 'The last day cannot be before the first',
    path: ['endsOn'],
  })
  .refine(
    (value) =>
      (Date.parse(`${value.endsOn}T00:00:00Z`) - Date.parse(`${value.startsOn}T00:00:00Z`)) /
        86_400_000 <=
      60,
    { message: 'An occasion cannot run longer than 60 days', path: ['endsOn'] },
  )
  .refine((value) => value.startsOn.slice(0, 4) === value.endsOn.slice(0, 4), {
    // The year is taken from the start date, so a span crossing new year would
    // be filed under one year and half-lived in another.
    message: 'An occasion cannot cross into the next year',
    path: ['endsOn'],
  });

/** Names picked from the shop-type starter catalogue. */
export const starterSchema = z.object({
  names: z.array(z.string().trim().min(1).max(80)).min(1, 'Pick at least one').max(200),
});

export const subscriptionSchema = z.object({
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'EX']),
  months: z.number().int().min(1).max(24).default(1),
  /// Set to change plan/state without recording money — corrections and cancellations.
  status: z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED']).optional(),
  /**
   * Set to bill the cataloguing service instead of subscription time: how many
   * items the operator listed for this shop. Priced at 50 paise each with a ₹99
   * floor (lib/plans.ts) and recorded as a one-off that buys no period.
   *
   * The server prices it from this count rather than taking an amount, so the
   * console can never record a figure the price list does not agree with.
   */
  listedItems: z.number().int().min(1).max(5000).optional(),
  method: z.string().trim().max(20).default('UPI'),
  reference: z.string().trim().max(60).default(''),
  note: z.string().trim().max(200).default(''),
});

/**
 * A resized photo as a data URL. Held in the database rather than a blob store
 * so DukaanFlow needs no second service; the client resizes before upload and
 * this is the backstop.
 */
const imageDataSchema = z
  .string()
  .trim()
  .max(400_000, 'Image is too large — please choose a smaller photo')
  .refine(
    (value) => value === '' || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value),
    'That does not look like an image',
  );

export const shopImagesSchema = z.object({
  imageData: imageDataSchema.optional(),
  ownerImageData: imageDataSchema.optional(),
  upiQrData: imageDataSchema.optional(),
});

/** Flattens a ZodError into `{ field: message }` for the client. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
