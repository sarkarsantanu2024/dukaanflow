/**
 * THE BARCODE ON THE PACKET, READ ON THE PHONE AND LOOKED UP FOR FREE.
 *
 * Almost every packet in a kirana carries an EAN-13 barcode, and a barcode is
 * an exact answer where reading the artwork is a guess. Android Chrome can read
 * one on its own (`BarcodeDetector`, no library, no cost), and Open Food Facts
 * — a free, open product database with a large Indian catalogue — turns the
 * number into a brand, a product name and a pack size. No key, no bill.
 *
 * Only a first step: a browser without `BarcodeDetector` (iPhone Safari,
 * desktop Firefox), a photo that misses the barcode, or a product the database
 * does not know all return null, and the photo goes on to the vision model.
 */

import { extractUnit, tidyName } from './ocr-match';

type Detector = { detect(source: ImageBitmapSource): Promise<{ rawValue: string }[]> };

/** The barcode's digits, or null when this browser cannot read barcodes or the photo shows none. */
export async function readBarcode(file: File): Promise<string | null> {
  const Ctor = (globalThis as { BarcodeDetector?: new (options: { formats: string[] }) => Detector }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    const bitmap = await createImageBitmap(file);
    try {
      const codes = await detector.detect(bitmap);
      const code = codes.map((found) => found.rawValue).find((value) => /^\d{8,14}$/.test(value));
      return code ?? null;
    } finally {
      bitmap.close();
    }
  } catch {
    return null;
  }
}

export type BarcodeProduct = { name: string; unit: string; code: string };

/** The product behind a barcode, from Open Food Facts, or null when unknown or unreachable. */
export async function lookupBarcode(code: string): Promise<BarcodeProduct | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_en,brands,quantity`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      status?: number;
      product?: { product_name?: string; product_name_en?: string; brands?: string; quantity?: string };
    };
    const product = payload.product;
    if (payload.status !== 1 || !product) return null;

    // English first: the item list keeps English names and writes the local ones itself.
    const title = (product.product_name_en || product.product_name || '').trim();
    const brand = (product.brands ?? '').split(',')[0]!.trim();
    if (!title && !brand) return null;
    // "Tata" + "Salt" → "Tata Salt"; a title that already says the brand keeps it once.
    const name = tidyName(title.toLowerCase().includes(brand.toLowerCase()) ? title : `${brand} ${title}`);
    if (name.length < 2) return null;
    return { name, unit: extractUnit(product.quantity ?? ''), code };
  } catch {
    return null;
  }
}
