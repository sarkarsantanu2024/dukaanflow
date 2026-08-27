'use client';

/**
 * List an item by photographing it.
 *
 * The third way in, beside the mic and the keyboard, and the one that covers
 * what the other two are worst at: a branded packet whose name the owner does
 * not say the way it is spelled, and anything they would otherwise have to
 * spell out letter by letter.
 *
 * The photo never leaves this component except as one request. It is resized,
 * sent, read, and the variable goes out of scope — nothing is written to the
 * database, nothing is kept in storage, and what comes back is text the owner
 * still has to agree to. The picture has done its job the moment the name
 * appears in the form.
 */

import { useRef, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';

/** Big enough to read a label, small enough to send over a counter's 4G. */
const MAX_EDGE = 768;
const QUALITY = 0.75;

export type Identified = {
  name: string;
  nameBn: string;
  nameHi: string;
  unit: string;
  category: string;
};

async function toDataUrl(file: File): Promise<string> {
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

  return canvas.toDataURL('image/jpeg', QUALITY);
}

export function PhotoItemAdder({
  slug,
  label,
  hint,
  onIdentified,
  onError,
}: {
  slug: string;
  label: string;
  hint: string;
  onIdentified: (item: Identified) => void;
  onError: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(file: File) {
    setBusy(true);
    try {
      // Scoped to this call. Once the request returns there is no reference to
      // the photo anywhere — no state, no storage, no column.
      const imageData = await toDataUrl(file);

      const response = await fetch(`/api/admin/shop/${slug}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        item?: Identified;
        error?: string;
      };

      if (!response.ok || !payload.item) {
        onError(payload.error ?? 'Could not read that photo.');
        return;
      }

      onIdentified(payload.item);
    } catch {
      onError('Could not read that photo.');
    } finally {
      setBusy(false);
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
          <span className="block font-semibold text-slate-900">{label}</span>
          <span className="block text-sm text-slate-500">{hint}</span>
        </span>
      </button>
    </div>
  );
}
