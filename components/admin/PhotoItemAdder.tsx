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
  label,
  hint,
  reading,
  onIdentified,
  onError,
}: {
  /** The shop-type catalogue, matched against so a hit is a real item. */
  catalogue: StarterItem[];
  label: string;
  hint: string;
  reading: string;
  onIdentified: (item: Identified) => void;
  onError: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handle(file: File) {
    setBusy(true);
    setProgress(0);

    let worker: Awaited<ReturnType<typeof import('tesseract.js').createWorker>> | null = null;

    try {
      const imageData = await prepare(file);

      // Imported here rather than at module scope: several megabytes that only
      // a shopkeeper who takes a photo should ever download.
      const { createWorker } = await import('tesseract.js');
      worker = await createWorker('eng', undefined, {
        logger: (message: { status: string; progress: number }) => {
          if (message.status === 'recognizing text') setProgress(message.progress);
        },
      });

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
        onIdentified({
          name: match.name,
          nameBn: match.nameBn,
          nameHi: match.nameHi,
          // What the packet says beats what the catalogue assumes: the
          // catalogue's unit is a sensible default, the printed one is a fact.
          unit: unit || match.unit,
          category: match.category,
        });
        return;
      }

      // Nothing in the catalogue, so fall back to the largest text on the
      // packet — usually the product name — and leave the translations empty
      // rather than inventing them.
      const guess = pickLikelyName(lines);
      if (guess) {
        onIdentified({ name: guess, nameBn: '', nameHi: '', unit, category: '' });
        return;
      }

      onError(
        unit
          ? 'Could not read the name. Try a closer photo of the label.'
          : 'Could not read that packet. Try a closer, straighter photo — or type the name.',
      );
    } catch {
      onError('Could not read that photo. Try again, or type the name.');
    } finally {
      // The engine holds a worker and its language data; leaving it running
      // keeps tens of megabytes alive on a phone that has moved on.
      await worker?.terminate().catch(() => {});
      setBusy(false);
      setProgress(0);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <input
        ref={input}
        type="file"
        accept="image/*"
        // Opens the camera on a phone: the owner is holding the packet.
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handle(file);
          event.target.value = '';
        }}
      />

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="flex w-full items-center gap-3 text-left disabled:opacity-60"
      >
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white"
        >
          {busy ? (
            <Spinner className="h-5 w-5" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          )}
        </span>

        <span className="min-w-0">
          <span className="block font-semibold text-slate-900">{busy ? reading : label}</span>
          <span className="block text-sm text-slate-500">
            {busy ? `${Math.round(progress * 100)}%` : hint}
          </span>
        </span>
      </button>
    </div>
  );
}
