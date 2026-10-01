'use client';

/**
 * THE SHOP'S OWN QR, ON THE OWNER'S HOME SCREEN (2026-10-01, by request).
 *
 * Until now only the console could make the poster, so an owner who lost the
 * printout, or wanted to send the QR to a regular, had to ask for it. Here they
 * can download the same A4 poster the console makes (`lib/poster-canvas.ts`),
 * or send the shop to anybody's WhatsApp by typing the number.
 *
 * WHATSAPP TAKES TEXT, NOT FILES, FROM A LINK. A `wa.me` link can open a chat
 * with a number and a message, but it cannot attach a picture. So "Send" opens
 * that person's chat with the shop's link typed in, which opens the same page
 * the QR does. Where the phone can share files, a second button hands the
 * poster picture itself to the share sheet, and the owner picks the chat there.
 */

import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { InstallIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { drawPoster, posterFile, savePosterPdf } from '@/lib/poster-canvas';
import { shopUrl } from '@/lib/qr';
import { toWhatsAppNumber } from '@/lib/whatsapp';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export type PosterShop = { name: string; address: string; phone: string; ownerImageData: string };

/** An Indian mobile: ten digits starting 6–9, with or without the 91. */
function mobileFor(typed: string): string | null {
  const number = toWhatsAppNumber(typed);
  return /^91[6-9]\d{9}$/.test(number) ? number : null;
}

export function ShopQrCard({ slug, shop, locale }: { slug: string; shop: PosterShop; locale: Locale }) {
  const t = ownerDict(locale);
  const { push } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const link = shopUrl(slug);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [number, setNumber] = useState('');
  const [badNumber, setBadNumber] = useState(false);
  // Read after mounting, so the server render and the first paint agree.
  const [canShareFiles, setCanShareFiles] = useState(false);
  useEffect(() => {
    try {
      setCanShareFiles(
        typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [new File([''], 'qr.jpg', { type: 'image/jpeg' })] }),
      );
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  async function poster() {
    const qr = qrRef.current?.querySelector('canvas');
    if (!qr) throw new Error('no qr');
    return drawPoster({ shopName: shop.name, address: shop.address, phone: shop.phone, ownerImage: shop.ownerImageData, link, qr });
  }

  async function download() {
    setBusy(true);
    try {
      await savePosterPdf(await poster(), slug);
    } catch {
      push(t.shopQrFailed, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function sharePicture() {
    setBusy(true);
    try {
      const file = await posterFile(await poster(), slug);
      if (!file) throw new Error('no file');
      await navigator.share({ files: [file], text: link });
    } catch (error) {
      // Closing the share sheet is not a failure.
      if ((error as Error)?.name !== 'AbortError') push(t.shopQrFailed, 'error');
    } finally {
      setBusy(false);
    }
  }

  function send() {
    const to = mobileFor(number);
    if (!to) {
      setBadNumber(true);
      return;
    }
    const text = t.shopQrMessage.replace('{shop}', shop.name).replace('{link}', link);
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setSending(false);
    setNumber('');
  }

  return (
    <section className="rounded-2xl border border-glass-edge bg-glass p-3 shadow-raised">
      <div className="flex items-center gap-3">
        {/* Drawn at poster size and shown small: the download reads this canvas. */}
        <div ref={qrRef} className="h-16 w-16 shrink-0 rounded-lg bg-white p-1 ring-1 ring-slate-200">
          <QRCodeCanvas value={link} size={640} level="M" marginSize={2} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{t.shopQrTitle}</p>
          <p className="text-xs leading-snug text-slate-600">{t.shopQrHint}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void download()}
          disabled={busy}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-300 bg-card px-2 py-1.5 text-sm font-semibold leading-tight text-brand-800 disabled:opacity-60"
        >
          <InstallIcon className="h-[18px] w-[18px]" />
          {t.shopQrDownload}
        </button>
        <button
          type="button"
          onClick={() => {
            setSending(true);
            setBadNumber(false);
          }}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-2 py-1.5 text-sm font-semibold leading-tight text-white"
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          {t.shopQrSend}
        </button>
      </div>

      {/* The number is asked for in a pop-up (2026-10-01, by request), so
          the card stays two buttons and the keyboard opens over a sheet that
          is only about this. */}
      <Modal
        open={sending}
        title={t.shopQrSend}
        onClose={() => setSending(false)}
        closeOnBack
        footer={
          <button
            type="submit"
            form="shop-qr-send"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] font-semibold text-white"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t.shopQrSendGo}
          </button>
        }
      >
        <form
          id="shop-qr-send"
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label className="block text-sm font-medium text-slate-700" htmlFor="shop-qr-number">
            {t.shopQrNumber}
          </label>
          <input
            id="shop-qr-number"
            inputMode="tel"
            autoComplete="off"
            data-autofocus
            value={number}
            onChange={(event) => {
              setNumber(event.target.value);
              setBadNumber(false);
            }}
            aria-invalid={badNumber}
            placeholder="98XXXXXXXX"
            className={`h-12 w-full rounded-xl border bg-sunk px-3 text-base tabular-nums ${badNumber ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-300'}`}
          />
          {badNumber && <p className="text-sm font-medium text-red-700">{t.shopQrBadNumber}</p>}
          {canShareFiles && (
            <button
              type="button"
              onClick={() => void sharePicture()}
              disabled={busy}
              className="w-full py-2 text-sm font-medium text-brand-700 underline underline-offset-2 disabled:opacity-60"
            >
              {t.shopQrShare}
            </button>
          )}
        </form>
      </Modal>
    </section>
  );
}
