'use client';

/**
 * List an item by photographing the packet.
 *
 * The third way in, beside the mic and the keyboard, and the one that covers
 * what the other two are worst at: a branded packet whose name the owner does
 * not say the way it is spelled, and anything they would otherwise spell out
 * letter by letter.
 *
 * The reading happens **in the browser**. No key, no per-photo cost, and the
 * photograph never leaves the phone — which also means it cannot be stored,
 * because there is nowhere for it to go. What the owner gets back is a filled
 * form they still have to agree to.
 *
 * OCR is loaded only when someone actually takes a picture. It is a few
 * megabytes of engine and language data, and a shopkeeper who never uses this
 * should not pay for it on every page load.
 */

import { useRef, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { matchCatalogue, extractUnit, pickLikelyName, type ScannedLine } from '@/lib/ocr-match';
import type { StarterItem } from '@/lib/starter-catalogue';

/** Text needs resolution; this is the smallest that reads a label reliably. */
const MAX_EDGE = 1400;
const QUALITY = 0.9;

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
  catalogue,
  onBatch,
  onError,
  onBusyChange,
  openRef,
}: {
  /** The shop-type catalogue, matched against so a hit is a real item. */
  catalogue: StarterItem[];
  /**
   * What was read, listed straight away and unpriced — the way voice and the
   * starter catalogue both list things.
   */
  onBatch: (items: Identified[], unreadable: number) => void;
  onError: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
  /** Lets the floating button open the picker without rendering one. */
  openRef?: { current: (() => void) | null };
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

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
          found.push({ name: guess, nameBn: '', nameHi: '', unit, pricePaise: 0, category: '' });
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
      const { found, unreadable } = await readAll(files);

      if (found.length === 0) {
        onError('Could not read that packet. Try a closer, straighter photo — or type the name.');
        return;
      }

      // Straight onto the list, one packet or ten. Opening a form for a single
      // photo meant the name never reached the list until the owner filled the
      // rest in — which is the opposite of the point: the camera is for getting
      // the name down, and the price is set afterwards on the row, the same way
      // voice and the starter list already work.
      onBatch(found, unreadable);
    } catch {
      onError('Could not read that photo. Try again, or type the name.');
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
