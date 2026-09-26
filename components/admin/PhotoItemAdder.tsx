'use client';

/**
 * List an item by photographing the packet.
 *
 * The third way in, beside the mic and the keyboard, and the one that covers
 * what the other two are worst at: a branded packet whose name the owner does
 * not say the way it is spelled, and anything they would otherwise spell out
 * letter by letter.
 *
 * THE PHOTO IS READ BY A VISION MODEL ON THE SERVER (`lib/photo-identify.ts`),
 * which reads a packet the way a person does — brand, product, pack size. The
 * in-browser OCR this used to rely on returned whatever ink it could see on a
 * shiny, curved wrapper, which was rarely the product. The photo is sent,
 * read and discarded; nothing is stored.
 *
 * The OCR stays as the fallback, for a deployment with no model key or a
 * moment when the server cannot be reached. It is loaded only then: a few
 * megabytes of engine and language data nobody should pay for on page load.
 */

import { useRef, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { matchCatalogue, extractUnit, pickLikelyName, type ScannedLine } from '@/lib/ocr-match';
import { categoryForNames, type StarterItem } from '@/lib/starter-catalogue';

/** Text needs resolution; this is the smallest that reads a label reliably. */
const MAX_EDGE = 1400;
const QUALITY = 0.9;
/** What the model is sent: colour, and small enough to upload quickly on one bar of signal. */
const MODEL_EDGE = 1280;
const MODEL_QUALITY = 0.85;

/** Resized, colour kept — a vision model reads colour and branding, unlike OCR. */
async function prepareForModel(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MODEL_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas unavailable');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', MODEL_QUALITY);
}

type ModelProduct = {
  name: string;
  nameBn: string;
  nameHi: string;
  unit: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
};

export type Identified = {
  name: string;
  nameBn: string;
  nameHi: string;
  unit: string;
  /**
   * The catalogue's suggested price in PAISE, or 0 where the packet matched
   * nothing and there is nothing to suggest. Either way the row lands unpriced
   * and stays off the shop page until the owner confirms the number.
   */
  pricePaise: number;
  category: string;
};

/**
 * Resized and turned greyscale with more contrast. OCR reads flat, high-
 * contrast text far better than a colour photo of a shiny wrapper, and doing it
 * here costs nothing.
 */
async function prepare(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas unavailable');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const frame = context.getImageData(0, 0, width, height);
  const pixels = frame.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const grey = 0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2];
    // Pushed away from the midpoint: ink darker, packet lighter.
    const contrasted = Math.max(0, Math.min(255, (grey - 128) * 1.4 + 128));
    pixels[index] = contrasted;
    pixels[index + 1] = contrasted;
    pixels[index + 2] = contrasted;
  }
  context.putImageData(frame, 0, 0);

  return canvas.toDataURL('image/jpeg', QUALITY);
}

export function PhotoItemAdder({
  slug,
  catalogue,
  onBatch,
  onError,
  onBusyChange,
  openRef,
  words,
  onExpired,
}: {
  /** The shop whose photo route reads the packet. */
  slug: string;
  /** Handles a dead session (401); true when it did, and the scan should stop. */
  onExpired?: (response: Response) => boolean;
  /** The shop-type catalogue, matched against so a hit is a real item. */
  catalogue: StarterItem[];
  /**
   * What was read, listed straight away and unpriced — the way voice and the
   * starter catalogue both list things.
   */
  onBatch: (items: Identified[], unreadable: number) => void | Promise<void>;
  onError: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
  /** Lets the floating button open the picker without rendering one. */
  openRef?: { current: (() => void) | null };
  /** The failure messages in the owner's language. English when left out. */
  words?: { unreadPacket: string; unreadPhoto: string };
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  /**
   * The model's reading of each photo, or null when this deployment has no model
   * (the caller then falls back to OCR). A product the catalogue knows takes the
   * catalogue's names and suggested price, exactly as an OCR match did; one it
   * does not keeps the model's name with local spellings from the server.
   */
  async function readWithModel(
    files: File[],
  ): Promise<{ found: Identified[]; unreadable: number } | 'expired' | null> {
    const found: Identified[] = [];
    let unreadable = 0;
    for (const file of files) {
      const response = await fetch(`/api/admin/shop/${slug}/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: await prepareForModel(file) }),
      });
      if (onExpired?.(response)) return 'expired';
      if (!response.ok) throw new Error(`photo ${response.status}`);
      const payload = (await response.json()) as { available: boolean; products?: ModelProduct[] };
      if (!payload.available) return null;

      // A guess is only worth listing when it is all there is.
      const products = payload.products ?? [];
      const sure = products.filter((product) => product.confidence !== 'low');
      const kept = sure.length > 0 ? sure : products;
      if (kept.length === 0) unreadable += 1;

      for (const product of kept) {
        const match = matchCatalogue(product.name, catalogue);
        if (match) {
          found.push({
            name: match.name,
            nameBn: match.nameBn,
            nameHi: match.nameHi,
            unit: product.unit || match.unit,
            pricePaise: !product.unit || product.unit === match.unit ? match.pricePaise : 0,
            category: match.category || product.category,
          });
        } else {
          found.push({
            name: product.name,
            nameBn: product.nameBn,
            nameHi: product.nameHi,
            unit: product.unit,
            pricePaise: 0,
            category: product.category || categoryForNames([product.name], catalogue),
          });
        }
      }
    }
    // One packet photographed twice is one item.
    const seen = new Set<string>();
    return {
      found: found.filter((item) => {
        const key = `${item.name.toLowerCase()}|${item.unit}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
      unreadable,
    };
  }

  /** One shared worker for the whole batch — starting it is the slow part. */
  async function readAll(files: File[]): Promise<{ found: Identified[]; unreadable: number }> {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');

    try {
      const found: Identified[] = [];
      let unreadable = 0;

      for (const file of files) {
        const imageData = await prepare(file);
        const { data } = await worker.recognize(imageData, {}, { blocks: true, text: true });

        const lines: ScannedLine[] = (data.blocks ?? []).flatMap((block) =>
          block.paragraphs.flatMap((paragraph) =>
            paragraph.lines.map((line) => ({
              text: line.text,
              confidence: line.confidence,
              height: line.bbox.y1 - line.bbox.y0,
            })),
          ),
        );

        const text = data.text ?? '';
        const unit = extractUnit(text);
        const match = matchCatalogue(text, catalogue);

        if (match) {
          found.push({
            name: match.name,
            nameBn: match.nameBn,
            nameHi: match.nameHi,
            // What the packet says beats what the catalogue assumes: the
            // catalogue's unit is a sensible default, the printed one is a fact.
            unit: unit || match.unit,
            // Carried through only when the packet matched the catalogue at its
            // own pack size. A printed unit that differs from the catalogue's
            // makes the suggestion a different quantity's price, so it is
            // dropped rather than shown against the wrong size.
            pricePaise: !unit || unit === match.unit ? match.pricePaise : 0,
            category: match.category,
          });
          continue;
        }

        // Nothing in the catalogue, so fall back to the largest text on the
        // packet — usually the product name — and leave the translations empty
        // rather than inventing them.
        const guess = pickLikelyName(lines);
        if (guess) {
          found.push({
            name: guess,
            nameBn: '',
            nameHi: '',
            unit,
            pricePaise: 0,
            // Still worth asking. The catalogue did not recognise the packet as
            // a whole, but "Aashirvaad Select Atta" carries a word that names
            // what it is — and an item the owner has to file by hand is one
            // more reason to leave the category blank forever.
            category: categoryForNames([guess], catalogue),
          });
        }
        else unreadable += 1;
      }

      return { found, unreadable };
    } finally {
      // The engine holds a worker and its language data; leaving it running
      // keeps tens of megabytes alive on a phone that has moved on.
      await worker.terminate().catch(() => {});
    }
  }

  async function handle(files: File[]) {
    setBusy(true);
    onBusyChange?.(true);

    try {
      // The model first; the phone's own OCR only when there is no model to ask
      // or the server could not be reached.
      let read = await readWithModel(files).catch(() => null);
      if (read === 'expired') return;
      read ??= await readAll(files);
      const { found, unreadable } = read;

      if (found.length === 0) {
        onError(words?.unreadPacket ?? 'Could not read that packet. Try a closer, straighter photo — or type the name.');
        return;
      }

      // Straight onto the list, one packet or ten. Opening a form for a single
      // photo meant the name never reached the list until the owner filled the
      // rest in — which is the opposite of the point: the camera is for getting
      // the name down, and the price is set afterwards on the row, the same way
      // voice and the starter list already work.
      // Awaited, so a save that fails is reported rather than left unhandled.
      await onBatch(found, unreadable);
    } catch {
      onError(words?.unreadPhoto ?? 'Could not read that photo. Try again, or type the name.');
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  // The floating button owns the trigger; this component only owns the input.
  if (openRef) openRef.current = () => input.current?.click();

  return (
    <input
      ref={input}
      type="file"
      accept="image/*"
      /**
       * Straight to the back camera, not to the gallery.
       *
       * The button says "photograph the packet" and was opening a file picker
       * onto the phone's photo roll — an owner standing at the shelf with the
       * packet in their hand had to find the camera themselves, take the
       * picture, come back and hunt for it. `capture` tells the browser the
       * source is the camera, and `environment` picks the one facing the
       * shelf rather than the one facing the owner.
       *
       * It also costs the multi-select: a capture input takes one photo at a
       * time. That is the honest trade — the batch only ever worked for
       * pictures already on the phone, which is not what this button is for,
       * and the scanner still handles whatever arrives as a list.
       */
      capture="environment"
      className="hidden"
      disabled={busy}
      onChange={(event) => {
        const files = [...(event.target.files ?? [])];
        if (files.length) void handle(files);
        event.target.value = '';
      }}
    />
  );
}
