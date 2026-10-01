'use client';

import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { PrinterIcon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { shopUrl } from '@/lib/qr';
import { BRAND_LOGO, BRAND_LOGO_ALT } from '@/lib/brand';
import { drawPoster, posterCreditLine, savePosterPdf } from '@/lib/poster-canvas';

/**
 * A4 "Scan to Order" poster the admin prints and hands to the shop. The PDF
 * download is drawn by `lib/poster-canvas.ts`, which the owner's own "Download
 * QR" on the home screen shares, so both hand out the same sheet.
 *
 * THE PDF IS A PICTURE OF THE POSTER, NOT TEXT LAID OUT AGAIN.
 *
 * It used to be jsPDF text calls, and jsPDF's built-in fonts have no Bengali or
 * Devanagari glyphs — so the download was English-only while the printed
 * version carried all three languages. A poster for a Kolkata counter that says
 * only "Scan to Order" is the wrong half of the poster, and the download is
 * what an operator actually sends the shop on WhatsApp.
 *
 * Embedding a Unicode font would add about a megabyte to the bundle. Drawing
 * the poster onto a `<canvas>` instead costs nothing: the browser shapes
 * Bengali conjuncts and Devanagari matras with the same system fonts the screen
 * uses, and the result goes into the PDF as one image. The trade is that the
 * text is not selectable in the PDF — which for something destined for a
 * printer and a wall is no trade at all.
 */
export function PosterSheet({
  shopName,
  slug,
  address,
  phone = '',
  ownerImage = '',
}: {
  shopName: string;
  slug: string;
  address: string;
  /**
   * The shop's number, under its name (back by request, 2026-09-28: the QR PDF
   * sent at setup carries the shop's name, number and the owner's photo). A
   * number to CALL the shop — not an order channel; orders go through the QR.
   */
  phone?: string;
  /**
   * The owner's photograph, as the data URL the shop record holds. Optional,
   * and most shops have none — the sheet closes the gap it leaves rather than
   * printing a hole.
   */
  ownerImage?: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();
  const [exporting, setExporting] = useState(false);
  const link = shopUrl(slug);

  const creditLine = posterCreditLine();

  async function downloadPdf() {
    setExporting(true);
    try {
      const qr = sheetRef.current?.querySelector<HTMLCanvasElement>('canvas[data-qr="shop"]');
      if (!qr) throw new Error('no qr');
      const sheet = await drawPoster({ shopName, address, phone, ownerImage, link, qr });
      await savePosterPdf(sheet, slug);
    } catch {
      push('Could not build the PDF. Use Print instead.', 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap gap-2">
        <Button onClick={() => window.print()}>
          <PrinterIcon className="h-4 w-4" />
          Print A4 poster
        </Button>
        <Button variant="secondary" onClick={downloadPdf} loading={exporting}>
          Download PDF
        </Button>
      </div>
      <p className="no-print text-xs text-slate-500">
        Both carry all three languages. Print uses the browser; the PDF is the same sheet as an
        image, so it travels on WhatsApp.
      </p>

      <div
        ref={sheetRef}
        className="print-sheet relative isolate mx-auto w-full max-w-[210mm] overflow-hidden rounded-2xl border border-slate-200 bg-glass px-8 py-10 text-center shadow-raised"
      >
        {/* The watermark. Behind everything, and the QR's own white card sits
            over it — see the canvas copy for why that matters. `print-exact`
            asks the browser not to drop the tint when printing. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_LOGO.master}
          alt=""
          aria-hidden
          className="print-exact pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[62%] -translate-x-1/2 -translate-y-1/2 opacity-[0.05]"
        />

        {ownerImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={ownerImage}
            alt={`${shopName} — the owner`}
            className="print-exact mx-auto mb-4 h-28 w-28 rounded-full border-4 border-brand-600 object-cover"
          />
        )}

        <h1 className="text-4xl font-black leading-tight text-slate-900">{shopName}</h1>
        {address && <p className="mt-2 text-base text-slate-600">{address}</p>}
        {phone && (
          <p className="mt-1 text-lg font-bold text-slate-900">
            Phone · ফোন · फ़ोन: +91 {phone}
          </p>
        )}

        <div className="mt-6 space-y-1">
          <p className="text-2xl font-bold text-brand-700">Scan to Order</p>
          <p className="text-2xl font-bold text-brand-700">স্ক্যান করে অর্ডার করুন</p>
          <p className="text-2xl font-bold text-brand-700">स्कैन करके ऑर्डर करें</p>
        </div>

        <div className="mt-6 flex justify-center">
          {/* `bg-white` is load-bearing, not tidiness: it is the opaque card
              that keeps the watermark out of the code's quiet zone. */}
          <div className="w-full max-w-[17rem] rounded-2xl border-4 border-brand-600 bg-card p-4">
            {/* Display size via `style` — qrcode.react's inline width/height
                would otherwise override any className. */}
            <QRCodeCanvas
              value={link}
              size={640}
              level="M"
              marginSize={2}
              data-qr="shop"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>

        {/* WHICH SCANNER: the one already in their hand.
            Every phone sold in years opens a QR from its own camera, and the
            free "QR scanner" apps a customer would otherwise install are a
            screen of adverts wrapped around a link. Saying so on the poster is
            the difference between a scan and a trip to the Play Store. */}
        <p className="mt-4 text-sm font-medium text-slate-600">
          Just open your phone camera — no app needed
        </p>
        <p className="text-sm font-medium text-slate-600">
          ফোনের ক্যামেরা খুলুন · আলাদা অ্যাপ লাগবে না
        </p>
        <p className="text-sm font-medium text-slate-600">
          फोन का कैमरा खोलिए · अलग ऐप की ज़रूरत नहीं
        </p>

        <p className="mt-3 break-all font-mono text-sm text-slate-500">{link}</p>

        {/* No payment QR here.
            This poster has one job: get a stranger at the counter to scan and
            open the shop's menu. A second QR beside the first asks them to
            choose which one they want, and the wrong choice — the payment code
            — opens a payment app asking for an amount before they have ordered
            anything. The shop's UPI is still on the order and in the khata
            reminder, where there is something to pay FOR. */}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_LOGO.small}
          alt={BRAND_LOGO_ALT}
          className="print-exact mx-auto mt-8 h-10 w-10"
        />
        <p className="mt-1 text-xs text-slate-400">{creditLine}</p>
      </div>
    </div>
  );
}
