'use client';

import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { qrFileName, shopUrl, upiPayUrl } from '@/lib/qr';

/** Renders a canvas QR at print resolution and offers a PNG download. */
function QrBlock({
  value,
  fileName,
  caption,
}: {
  value: string;
  fileName: string;
  caption: string;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();

  function download() {
    const canvas = holderRef.current?.querySelector('canvas');
    if (!canvas) {
      push('QR is not ready yet', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = fileName;
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={holderRef} className="w-full max-w-[12rem] rounded-2xl bg-white p-3 ring-1 ring-slate-200">
        {/*
          `size` is the canvas resolution — 512px keeps the downloaded PNG crisp
          on an A4 poster. Display size must go through `style`, not className:
          qrcode.react builds `{height: size, width: size, ...style}` as an
          inline style, and an inline rule beats any Tailwind class.
        */}
        <QRCodeCanvas
          value={value}
          size={512}
          level="M"
          marginSize={2}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>
      <p className="break-all text-center text-xs text-slate-500">{caption}</p>
      <Button variant="secondary" size="sm" onClick={download}>
        Download PNG
      </Button>
    </div>
  );
}

export function QrPanel({
  slug,
  shopName,
  upiId,
}: {
  slug: string;
  shopName: string;
  upiId: string;
}) {
  const { push } = useToast();
  const [upiValue, setUpiValue] = useState(upiId);
  const [nameValue, setNameValue] = useState(shopName);
  const link = shopUrl(slug);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      push('Shop link copied', 'success');
    } catch {
      push('Could not copy — select the link manually', 'error');
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="mb-3 font-semibold text-slate-900">Shop QR</h2>
        <QrBlock value={link} fileName={qrFileName(slug, 'shop')} caption={link} />
        <Button variant="ghost" size="sm" fullWidth className="mt-3" onClick={copyLink}>
          Copy link
        </Button>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="mb-3 font-semibold text-slate-900">Payment QR (UPI)</h2>

        <div className="mb-4 space-y-2">
          <input
            value={nameValue}
            onChange={(event) => setNameValue(event.target.value)}
            placeholder="Shop name shown in the UPI app"
            aria-label="Payee name"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={upiValue}
            onChange={(event) => setUpiValue(event.target.value)}
            placeholder="ramu@okaxis"
            aria-label="UPI ID"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {upiValue.includes('@') && nameValue ? (
          <QrBlock
            value={upiPayUrl(upiValue, nameValue)}
            fileName={qrFileName(slug, 'upi')}
            caption="Customer scans, types the amount, pays the shop directly."
          />
        ) : (
          <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
            Enter a UPI ID like <span className="font-mono">ramu@okaxis</span> to generate the
            payment QR.
          </p>
        )}
      </section>
    </div>
  );
}
