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

export const itemUpsertSchema = z.object({
  name: itemNameSchema,
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

/** Flattens a ZodError into `{ field: message }` for the client. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
