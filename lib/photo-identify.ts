/**
 * READING A PACKET WITH A VISION MODEL, on the server.
 *
 * "Add by photo" used to read the packet with OCR in the browser. OCR returns
 * the ink it can see — on a shiny, curved kirana packet photographed under a
 * tube light that is the FSSAI number, half a slogan and the net weight, and
 * rarely the product. Owners asked for a result they can trust, and many of
 * them will use this, so the photo now goes to Claude, which reads a packet the
 * way a person does: brand, product and pack size.
 *
 * What comes back is deliberately small — an English name, the printed pack
 * size, a category from a fixed list. The Bengali and Hindi names are NOT taken
 * from the model: `localNames()` writes them, so the vocabulary and the slur
 * guard (`npm run names:check`) stay the only source of local spellings. The
 * price is never read off a packet (MRP is not the shop's price); the row lands
 * unpriced, as it always has.
 *
 * No key, no model: `identifyFromPhoto` returns null and the browser falls back
 * to its own OCR, so the feature still works on a deployment without the key.
 */

import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod/v4';

/** Overridable without a deploy of code, e.g. PHOTO_MODEL=claude-haiku-4-5 to cut cost. */
const MODEL = process.env.PHOTO_MODEL || 'claude-opus-5';

/** The headings the starter catalogue files items under. The model must choose one or leave it blank. */
export const PHOTO_CATEGORIES = [
  'Staples', 'Rice & Atta', 'Dal & Pulses', 'Oil & Ghee', 'Spices', 'Snacks', 'Beverages',
  'Tea & Coffee', 'Dairy', 'Bakery', 'Sweets', 'Packaged Food', 'Frozen Food', 'Dry Fruits',
  'Personal Care', 'Household', 'Baby Care', 'Puja Items', 'Stationery', 'Electricals',
  'Pet Care', 'Vegetables', 'Fruits', 'Non-veg',
] as const;

const ProductSchema = z.object({
  /** "Tata Salt", "Aashirvaad Atta", "Parle-G", "Surf Excel Easy Wash". English, title case. */
  name: z.string(),
  /** The pack size printed on the packet, "1 kg" / "500 g" / "200 ml" / "12 pc", or "" if none is legible. */
  unit: z.string(),
  category: z.string(),
  /** How sure the model is that this is the product in the photo. */
  confidence: z.enum(['high', 'medium', 'low']),
});

const ResultSchema = z.object({ products: z.array(ProductSchema) });

export type PhotoProduct = z.infer<typeof ProductSchema>;

const SYSTEM = `You read photos taken by shopkeepers of small grocery (kirana) shops in India, to add products to their shop's item list.

For each distinct retail product clearly visible in the photo, return:
- name: what a shopkeeper would list it as, in English: brand plus product, e.g. "Tata Salt", "Aashirvaad Atta", "Parle-G", "Fortune Mustard Oil", "Surf Excel Easy Wash". Put the product type in the name when the brand alone does not say it. Title case. No pack size, no marketing words ("New", "Rich", "Tasty") and no promotional text.
- unit: the net quantity printed on the pack, normalised to one of these forms: "500 g", "1 kg", "1.5 kg", "200 ml", "1 l", "12 pc". Use "" if no quantity is legible. Do not guess a quantity.
- category: exactly one of: ${PHOTO_CATEGORIES.join(', ')}. Use "" if none fits.
- confidence: "high" when brand and product are clearly readable, "medium" when partly readable, "low" when you are guessing.

List the same product once even if several identical packets are visible. Ignore shelves, hands, price stickers and background items you cannot identify. If there is no identifiable product, return an empty list. Text on packets may be in English, Bengali or Hindi; always answer in English.`;

let client: Anthropic | null = null;

/** Null when the server has no key, so the caller can say "use the phone's reader instead". */
export async function identifyFromPhoto(jpegBase64: string): Promise<PhotoProduct[] | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    // Reading a label is not a hard problem; low effort keeps each photo fast and cheap.
    output_config: { effort: 'low', format: betaZodOutputFormat(ResultSchema) },
    // If the model ever declines a photo, the request is retried on a fallback model in the same call.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpegBase64 } },
          { type: 'text', text: 'List the products in this photo.' },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal' || !response.parsed_output) return [];

  return response.parsed_output.products
    .map((product) => ({
      ...product,
      name: product.name.trim().replace(/\s+/g, ' ').slice(0, 80),
      unit: product.unit.trim().toLowerCase(),
      category: (PHOTO_CATEGORIES as readonly string[]).includes(product.category) ? product.category : '',
    }))
    .filter((product) => product.name.length >= 2);
}
