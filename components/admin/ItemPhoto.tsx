'use client';

/**
 * The photo cell on an item row.
 *
 * Small, and the first thing in the row, because a picture is how a list of a
 * hundred names becomes scannable — and because the shopper on the other end of
 * the QR may not read any of the three languages the item is named in.
 *
 * Saving happens the moment a photo is chosen: there is no form around a row,
 * and asking someone to take a picture and then find a save button is a step
 * that gets forgotten with the photo still unsaved.
 */

import { useRef, useState } from 'react';
import clsx from 'clsx';

const MAX_EDGE = 320;
const QUALITY = 0.7;

/** Resized in the browser, so a 4 MB phone photo never reaches the network. */
async function toThumbnail(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas unavailable');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', QUALITY);
}

export function ItemPhoto({
  value,
  label,
  disabled = false,
  onChange,
  onError,
}: {
  value: string;
  /** The item's name, so the control says which item it belongs to. */
  label: string;
  disabled?: boolean;
  onChange: (dataUrl: string) => void;
  onError?: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);

  async function pick(file: File) {
    setWorking(true);
    try {
      onChange(await toThumbnail(file));
    } catch {
      onError?.('That image could not be read');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="shrink-0">
      <input
        ref={input}
        type="file"
        accept="image/*"
        // On a phone this opens the camera directly, which is the whole point:
        // the owner is standing in front of the thing they are listing.
        capture="environment"
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
        disabled={disabled || working}
        aria-label={value ? `Replace photo of ${label}` : `Add a photo of ${label}`}
        title={value ? 'Replace photo' : 'Add photo'}
        className={clsx(
          'relative h-12 w-12 overflow-hidden rounded-xl border transition',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          value
            ? 'border-slate-200'
            : 'border-dashed border-slate-300 bg-slate-50 hover:border-brand-400',
          (disabled || working) && 'opacity-60',
        )}
      >
        {value ? (
          // A data URL of unknown dimensions — next/image would need a custom
          // loader and buys nothing here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg text-slate-400">
            {working ? '…' : '+'}
          </span>
        )}
      </button>

      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="mt-0.5 block w-full text-center text-[11px] text-slate-400 underline hover:text-red-600"
        >
          Remove
        </button>
      )}
    </div>
  );
}
