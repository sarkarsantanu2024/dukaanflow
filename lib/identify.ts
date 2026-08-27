/**
 * Reading an item off a photograph.
 *
 * Voice already lets an owner list stock without typing. This is the same idea
 * for the things voice is worst at: a branded packet whose name the owner does
 * not say the way it is spelled, and anything they would have to spell out
 * letter by letter. Point the camera at the packet, get the name back.
 *
 * The photo is never stored. It is sent, read, and dropped — the item that
 * results is text, and the picture has done its job. That is the whole design:
 * an input method, not a column.
 */

import Anthropic from '@anthropic-ai/sdk';

export type IdentifiedItem = {
  /** English name, title case, no brand unless the brand is the product. */
  name: string;
  nameBn: string;
  nameHi: string;
  /** A pack size if the photo shows one, otherwise empty for the owner to set. */
  unit: string;
  category: string;
};

export type IdentifyResult =
  | { ok: true; item: IdentifiedItem }
  | { ok: false; reason: 'unreadable' | 'not-an-item' | 'unconfigured' | 'failed' };

const SCHEMA = {
  type: 'object' as const,
  properties: {
    recognised: {
      type: 'boolean',
      description: 'False if the photo does not show a single retail product.',
    },
    name: { type: 'string', description: 'English name, title case.' },
    nameBn: { type: 'string', description: 'Bengali name, or empty if unsure.' },
    nameHi: { type: 'string', description: 'Hindi name, or empty if unsure.' },
    unit: { type: 'string', description: 'Pack size visible on the packet, else empty.' },
    category: { type: 'string', description: 'One of the given categories, else empty.' },
  },
  required: ['recognised', 'name', 'nameBn', 'nameHi', 'unit', 'category'],
  additionalProperties: false,
};

/**
 * The prompt carries the shop's own categories so the answer slots into the
 * list the owner already has, rather than inventing a fourteenth name for
 * "Staples". Naming rules matter as much as recognition here: a shopkeeper
 * wants "Mustard Oil", not "Fortune Kachi Ghani Pure Mustard Oil 1L Bottle".
 */
function systemPrompt(categories: string[]): string {
  return [
    'You identify a single retail product from a photograph taken by a small',
    'Indian shopkeeper listing their stock.',
    '',
    'Rules:',
    '- Give the common shop name, not the marketing name on the packet.',
    '  "Mustard Oil", not "Fortune Kachi Ghani Pure Mustard Oil 1 Litre".',
    '- Keep a brand only where the brand *is* how it is asked for at a counter,',
    '  such as Maggi or Horlicks.',
    '- Bengali and Hindi names should be what a customer would actually say.',
    '  Leave either empty rather than guessing a transliteration.',
    '- unit: only if a pack size is legible on the packet, e.g. "1 kg", "500 ml".',
    '  Empty otherwise — the shopkeeper sets it, and a wrong size is worse than none.',
    '- Never invent a price. You are not asked for one.',
    '- recognised: false if the photo is blurred, empty, shows several unrelated',
    '  products, or is not a retail product at all.',
    categories.length
      ? `- category: prefer one of these the shop already uses: ${categories.join(', ')}.`
      : '- category: a short retail category, or empty.',
  ].join('\n');
}

/** Data URL in, media type and payload out. */
function splitDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

export async function identifyItem(
  dataUrl: string,
  categories: string[],
): Promise<IdentifyResult> {
  const image = splitDataUrl(dataUrl);
  if (!image) return { ok: false, reason: 'unreadable' };

  try {
    // Constructed inside the try, and no key is checked by hand: the SDK
    // resolves credentials from several places, so testing one environment
    // variable would refuse setups that are perfectly well configured. A
    // genuinely missing credential surfaces below as an auth failure.
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 2000,
      // Naming one packet is not a reasoning problem, and the owner is standing
      // at a counter waiting for it.
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: systemPrompt(categories),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: image.mediaType as 'image/jpeg', data: image.data },
            },
            { type: 'text', text: 'What is this item?' },
          ],
        },
      ],
    });

    // A safety decline is not an error here — it is simply not an item.
    if (response.stop_reason === 'refusal') return { ok: false, reason: 'not-an-item' };

    const text = response.content.find((block) => block.type === 'text');
    if (!text || text.type !== 'text') return { ok: false, reason: 'failed' };

    const parsed = JSON.parse(text.text) as IdentifiedItem & { recognised: boolean };
    if (!parsed.recognised || !parsed.name?.trim()) return { ok: false, reason: 'not-an-item' };

    return {
      ok: true,
      item: {
        name: parsed.name.trim().slice(0, 80),
        nameBn: (parsed.nameBn ?? '').trim().slice(0, 80),
        nameHi: (parsed.nameHi ?? '').trim().slice(0, 80),
        unit: (parsed.unit ?? '').trim().slice(0, 24),
        category: (parsed.category ?? '').trim().slice(0, 40),
      },
    };
  } catch (error) {
    // No credential, or a rejected one, is a setup problem rather than a bad
    // photo — and the two want different words in front of the shopkeeper.
    if (
      error instanceof Anthropic.AuthenticationError ||
      (error instanceof Error && /api[_ ]?key/i.test(error.message))
    ) {
      return { ok: false, reason: 'unconfigured' };
    }

    // The owner gets "try again, or type it" — never a stack trace, and never a
    // half-filled form built from a failed read.
    return { ok: false, reason: 'failed' };
  }
}
