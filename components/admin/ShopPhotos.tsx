'use client';

/**
 * Storefront and owner photos.
 *
 * Resized in the browser before they are ever sent: a modern phone camera
 * produces a 4 MB JPEG, and what a shop page needs is about 90 KB. Doing it
 * here means DukaanFlow needs no image service, no signed uploads and no
 * second bill — the resized data URL goes in the same database as everything
 * else.
 *
 * A storefront photo is not decoration. A shopper who scans a code taped to a
 * counter should see the shop they are standing in front of, and know at once
 * that they scanned the right thing.
 */

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

const MAX_EDGE = 900;
const QUALITY = 0.72;

/** Draws the image down to `MAX_EDGE` on its longest side and re-encodes it. */
async function resize(file: File): Promise<string> {
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

function Photo({
  label,
  hint,
  value,
  round,
  onPick,
  onClear,
  busy,
}: {
  label: string;
  hint: string;
  value: string;
  round?: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
  busy: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-slate-700">{label}</p>
      <div className="flex items-center gap-3">
        {value ? (
          // A data URL of unknown dimensions — next/image would need a loader
          // and buys nothing here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className={
              round
                ? 'h-20 w-20 rounded-full object-cover ring-1 ring-slate-200'
                : 'h-20 w-32 rounded-xl object-cover ring-1 ring-slate-200'
            }
          />
        ) : (
          <div
            className={
              round
                ? 'flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-slate-300 text-xs text-slate-400'
                : 'flex h-20 w-32 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400'
            }
          >
            None
          </div>
        )}

        <div className="flex flex-col gap-1">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onPick(file);
              event.target.value = '';
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {value ? 'Replace' : 'Choose photo'}
          </Button>
          {value && (
            <button
              type="button"
              onClick={onClear}
              disabled={busy}
              className="text-xs text-slate-500 underline disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function ShopPhotos({
  slug,
  imageData,
  ownerImageData,
}: {
  slug: string;
  imageData: string;
  ownerImageData: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [shopPhoto, setShopPhoto] = useState(imageData);
  const [ownerPhoto, setOwnerPhoto] = useState(ownerImageData);
  const [busy, setBusy] = useState(false);

  async function save(patch: { imageData?: string; ownerImageData?: string }) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/shop/${slug}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        push(payload.error ?? 'Could not save the photo', 'error');
        return false;
      }
      router.refresh();
      return true;
    } catch {
      push('Network error. Please try again.', 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function pick(file: File, which: 'shop' | 'owner') {
    try {
      const data = await resize(file);
      if (which === 'shop') setShopPhoto(data);
      else setOwnerPhoto(data);
      const ok = await save(which === 'shop' ? { imageData: data } : { ownerImageData: data });
      if (ok) push('Photo saved', 'success');
    } catch {
      push('That image could not be read', 'error');
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="font-semibold text-slate-900">Photos</h2>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        <Photo
          label="Storefront"
          hint="Shown at the top of the shop page. Photograph the shopfront as a customer sees it."
          value={shopPhoto}
          busy={busy}
          onPick={(file) => pick(file, 'shop')}
          onClear={async () => {
            setShopPhoto('');
            if (await save({ imageData: '' })) push('Photo removed', 'success');
          }}
        />
        <Photo
          label="Owner"
          hint="Optional. A face makes a small shop feel like a real one."
          value={ownerPhoto}
          round
          busy={busy}
          onPick={(file) => pick(file, 'owner')}
          onClear={async () => {
            setOwnerPhoto('');
            if (await save({ ownerImageData: '' })) push('Photo removed', 'success');
          }}
        />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Photos are resized to 900px in your browser before upload, so a 4 MB camera picture becomes
        about 90 KB.
      </p>
    </section>
  );
}
