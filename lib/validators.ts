import { z } from 'zod';

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

/** Integer rupees, ₹1 – ₹100000. */
export const priceSchema = z
  .number({ invalid_type_error: 'Price must be a number' })
  .int('Price must be a whole number of rupees')
  .min(1, 'Price must be at least ₹1')
  .max(100000, 'Price looks too large');

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

export const shopCreateSchema = z.object({
  name: z.string().trim().min(2, 'Shop name is required').max(80),
  ownerName: z.string().trim().max(60).default(''),
  locale: z.enum(['en', 'bn', 'hi']).default('en'),
  slug: slugSchema.optional().or(z.literal('')),
  type: z.enum(SHOP_TYPES),
  phone: phoneSchema,
  address: z.string().trim().max(200).default(''),
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
  price: priceSchema,
  unit: z.string().trim().max(24).default(''),
  category: z.string().trim().max(40).default(''),
  inStock: z.boolean().default(true),
});

export const itemPatchSchema = z.object({
  id: z.string().uuid('Unknown item'),
  price: priceSchema.optional(),
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

export const orderSchema = z.object({
  shopSlug: slugSchema,
  customerName: z.string().trim().max(60).default(''),
  customerPhone: phoneSchema,
  customerAddress: z.string().trim().max(200).default(''),
  orderType: z.enum(['DELIVERY', 'PICKUP']),
  items: z
    .array(z.object({ itemId: z.string().uuid(), quantity: quantitySchema }))
    .min(1, 'Add at least one item')
    .max(60, 'Too many items in one order'),
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
});

/** One line of the credit book. */
export const ledgerSchema = z.object({
  customerPhone: phoneSchema,
  customerName: z.string().trim().max(60).default(''),
  kind: z.enum(['DEBIT', 'CREDIT']),
  amount: z
    .number({ invalid_type_error: 'Enter an amount' })
    .int('Whole rupees only')
    .min(1, 'Enter at least ₹1')
    .max(1000000, 'That looks too large'),
  note: z.string().trim().max(120).default(''),
});

export const ledgerDeleteSchema = z.object({ id: z.string().uuid('Unknown entry') });

export const orderStatusSchema = z.object({
  id: z.string().uuid('Unknown order'),
  status: z.enum(['NEW', 'CONFIRMED', 'CANCELLED']),
});

/** Names picked from the shop-type starter catalogue. */
export const starterSchema = z.object({
  names: z.array(z.string().trim().min(1).max(80)).min(1, 'Pick at least one').max(200),
});

export const subscriptionSchema = z.object({
  plan: z.enum(['FREE', 'STARTER', 'PRO']),
  months: z.number().int().min(1).max(24).default(1),
  /// Set to change plan/state without recording money — corrections and cancellations.
  status: z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED']).optional(),
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
