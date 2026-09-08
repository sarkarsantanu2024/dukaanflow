'use client';

/**
 * Pick a photo, resized in the browser.
 *
 * A phone camera produces a 4 MB JPEG; a shop page needs about 90 KB. Doing
 * that here means Halkhata needs no image service, no signed uploads and no
 * second bill — the resized data URL goes into the same database as everything
 * else, and the column takes a real URL unchanged if that ever has to change.
 */

import { useRef, useState } from 'react';
import clsx from 'clsx';

const MAX_EDGE = 900;
const QUALITY = 0.72;
/** QR codes must stay crisp and lossless, or a scanner will struggle. */
const QR_MAX_EDGE = 700;
/**
 * Item photos are thumbnails, and deliberately far smaller than the shop's own
 * images. A shop banner is one row; an item photo is one per item per shop, so
 * this is the number that decides whether a 0.5 GB database holds two hundred
 * photographed shops or thirty.
 */
const THUMB_MAX_EDGE = 320;
const THUMB_QUALITY = 0.7;
/**
 * The ceiling `imageDataSchema` in lib/validators.ts enforces, minus a margin.
 *
 * Duplicated deliberately rather than imported: this file runs in the browser
 * and the validator is the server's word on the matter. The margin is so the
 * two can never disagree by a byte and produce a rejection nobody can explain.
 */
const MAX_DATA_URL = 380_000;

/**
 * `proof` is a photograph of a screen — a payment confirmation. It is upright
 * rather than wide, and crucially it is JPEG.
 *
 * It exists because it was briefly `square`, and `square` means QR: lossless
 * PNG. A PNG of a photograph is enormous — a 700px screenshot came out over a
 * megabyte, sailed past the 400 KB limit in the validator, and every shopkeeper
 * who attached one was told to "check the highlighted fields" with nothing on
 * the screen highlighted, because the field that failed was the picture. The
 * lesson is that the shape is not a frame size, it is an encoding decision.
 */
export type ImageShape = 'wide' | 'square' | 'circle' | 'thumb' | 'proof';

async function resize(file: File, shape: ImageShape): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const isQr = shape === 'square';
  const maxEdge = isQr ? QR_MAX_EDGE : shape === 'thumb' ? THUMB_MAX_EDGE : MAX_EDGE;

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas unavailable');
  // A white ground matters for QR codes: a transparent PNG flattened onto
  // black would invert the pattern and stop scanning entirely.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // JPEG artefacts round off the corners of QR modules, so those stay PNG.
  if (isQr) return canvas.toDataURL('image/png');

  let quality = shape === 'thumb' ? THUMB_QUALITY : QUALITY;
  let out = canvas.toDataURL('image/jpeg', quality);

  /**
   * ENCODE UNTIL IT FITS, rather than hoping.
   *
   * The server refuses anything over 400 KB, and one fixed quality setting
   * cannot promise to stay under that: a dense screenshot full of text
   * compresses far worse than a photograph of a shopfront. Hoping meant the
   * shopkeeper found out by being told to check fields that were all fine.
   *
   * Quality first, because dropping it is invisible on a screenshot long
   * before the size stops falling; only then the dimensions, which is what
   * actually costs legibility for the operator reading the amount off it.
   */
  while (out.length > MAX_DATA_URL && quality > 0.4) {
    quality -= 0.12;
    out = canvas.toDataURL('image/jpeg', quality);
  }

  if (out.length > MAX_DATA_URL) {
    const shrunk = document.createElement('canvas');
    shrunk.width = Math.round(width * 0.6);
    shrunk.height = Math.round(height * 0.6);
    const smaller = shrunk.getContext('2d');
    if (smaller) {
      smaller.fillStyle = '#ffffff';
      smaller.fillRect(0, 0, shrunk.width, shrunk.height);
      smaller.drawImage(canvas, 0, 0, shrunk.width, shrunk.height);
      out = shrunk.toDataURL('image/jpeg', 0.6);
    }
  }

  return out;
}

const FRAME: Record<ImageShape, string> = {
  wide: 'h-24 w-40',
  square: 'h-28 w-28',
  circle: 'h-24 w-24 rounded-full',
  thumb: 'h-16 w-16',
  // Upright, because a payment screenshot is a phone screen.
  proof: 'h-32 w-24',
};

export function ImagePicker({
  label,
  hint,
  value,
  shape = 'wide',
  busy = false,
  onChange,
  onError,
}: {
  label: string;
  hint?: string;
  value: string;
  shape?: ImageShape;
  busy?: boolean;
  onChange: (dataUrl: string) => void;
  onError?: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);

  async function pick(file: File) {
    setWorking(true);
    try {
      onChange(await resize(file, shape));
    } catch {
      onError?.('That image could not be read');
    } finally {
      setWorking(false);
    }
  }

  const disabled = busy || working;

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">
        {label}
        {hint && <span className="ml-1 font-normal text-slate-400">({hint})</span>}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={disabled}
          aria-label={value ? `Replace ${label}` : `Choose ${label}`}
          className={clsx(
            'group relative shrink-0 overflow-hidden border bg-slate-50 transition',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            shape === 'circle' ? 'rounded-full' : 'rounded-xl',
            value ? 'border-slate-200' : 'border-dashed border-slate-300 hover:border-brand-400',
            FRAME[shape],
            disabled && 'opacity-60',
          )}
        >
          {value ? (
            // A data URL of unknown dimensions — next/image would need a custom
            // loader and buys nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400 group-hover:text-brand-700">
              {working ? '…' : '+ Photo'}
            </span>
          )}
        </button>

        <div className="flex flex-col items-start gap-1">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void pick(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={disabled}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {value ? 'Replace' : 'Choose'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled}
              className="px-1 text-xs text-slate-500 underline hover:text-red-600 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
