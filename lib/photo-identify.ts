/**
 * READING A PACKET WITH A VISION MODEL, on the server.
 *
 * "Add by photo" used to read the packet with OCR in the browser. OCR returns
 * the ink it can see — on a shiny, curved kirana packet photographed under a
 * tube light that is the FSSAI number, half a slogan and the net weight, and
 * rarely the product. Owners asked for a result they can trust, and many of
 * them will use this, so the photo now goes to a vision model, which reads a
 * packet the way a person does: brand, product and pack size.
 *
 * TWO PROVIDERS, CHOSEN BY WHICH KEY IS SET. Google's Gemini free tier
 * (`GEMINI_API_KEY`) costs nothing, which is what a shop earning nothing from
 * this yet can afford — the trade is that Google may use free-tier photos to
 * improve its products, which for a photo of a biscuit packet is acceptable.
 * Claude (`ANTHROPIC_API_KEY`) is the paid upgrade for when sales justify it.
 * `PHOTO_PROVIDER=gemini|claude` forces one when both keys are set; otherwise
 * Claude wins when present, because it was added on purpose and costs money.
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

/**
 * Free-tier Gemini models, tried in order: the second when the first is over
 * its free-tier rate limit (429) or overloaded (503). GEMINI_MODEL overrides
 * the first, for when Google renames them.
 */
const GEMINI_MODELS = [process.env.GEMINI_MODEL || 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

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

/** Which model reads photos on this deployment, or null when there is no key for either. */
function provider(): 'gemini' | 'claude' | null {
  const forced = process.env.PHOTO_PROVIDER;
  if (forced === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (forced === 'claude' && process.env.ANTHROPIC_API_KEY) return 'claude';
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return null;
}

/** Null when the server has no key, so the caller can say "use the phone's reader instead". */
export async function identifyFromPhoto(jpegBase64: string): Promise<PhotoProduct[] | null> {
  const which = provider();
  if (!which) return null;
  const products = which === 'gemini' ? await readWithGemini(jpegBase64) : await readWithClaude(jpegBase64);
  return tidy(products);
}

/** Same checks for either provider: known categories only, tidy names and units. */
function tidy(products: PhotoProduct[]): PhotoProduct[] {
  return products
    .map((product) => ({
      ...product,
      name: product.name.trim().replace(/\s+/g, ' ').slice(0, 80),
      unit: product.unit.trim().toLowerCase(),
      category: (PHOTO_CATEGORIES as readonly string[]).includes(product.category) ? product.category : '',
    }))
    .filter((product) => product.name.length >= 2);
}

/** Gemini's JSON schema, the same shape `ResultSchema` checks afterwards. */
const GEMINI_SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          unit: { type: 'string' },
          category: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'unit', 'category', 'confidence'],
      },
    },
  },
  required: ['products'],
};

async function readWithGemini(jpegBase64: string): Promise<PhotoProduct[]> {
  let lastStatus = 0;
  for (const model of GEMINI_MODELS) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [
          {
            role: 'user',
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: jpegBase64 } },
              { text: 'List the products in this photo.' },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_SCHEMA, temperature: 0 },
      }),
      signal: AbortSignal.timeout(25_000),
    });
    lastStatus = response.status;
    // Over the free tier's limit, or busy: the lighter free model next.
    if (response.status === 429 || response.status === 503) continue;
    if (!response.ok) throw new Error(`gemini ${response.status}: ${(await response.text()).slice(0, 300)}`);

    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
    // A blocked or empty answer reads as "nothing recognised", not as a crash.
    const parsed = ResultSchema.safeParse(JSON.parse(text || '{"products":[]}'));
    return parsed.success ? parsed.data.products : [];
  }
  throw new Error(`gemini busy (${lastStatus})`);
}

async function readWithClaude(jpegBase64: string): Promise<PhotoProduct[]> {
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
  return response.parsed_output.products;
}
