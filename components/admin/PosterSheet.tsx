'use client';

import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { PrinterIcon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { shopUrl } from '@/lib/qr';
import { BRAND_GREEN, BRAND_LOGO, BRAND_LOGO_ALT } from '@/lib/brand';
import { supportDetails } from '@/lib/support';

/**
 * Loads one image for the canvas copy of the poster.
 *
 * Resolves to null rather than rejecting. A missing owner photo or a logo that
 * failed to fetch must not cost the operator the whole PDF — the poster's job
 * is the QR code, and everything else on the sheet is decoration around it.
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * A4 "Scan to Order" poster the admin prints and hands to the shop.
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
  phone,
  address,
  ownerImage = '',
}: {
  shopName: string;
  slug: string;
  phone: string;
  address: string;
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

  /**
   * The same credit line the shop's own page carries at its foot. It used to
   * read "Powered by Halkhata" here and something else on the web, so the
   * poster on the wall and the page behind the QR named two different
   * companies.
   */
  const support = supportDetails();
  const creditLine = support.phone
    ? `Powered by ${support.name} · For support ${support.phone}`
    : `Powered by ${support.name}`;

  /**
   * NO RECRUITMENT LINE HERE, BY DECISION.
   *
   * This sheet used to close with a question aimed past the customer at the
   * shop next door — "আপনার দোকানও? বলুন…" — on the reasoning that a poster
   * already hanging in a market is the cheapest acquisition channel there is.
   * Removed on request: the poster now talks to one reader only, the customer
   * standing at this counter, and everything on it serves the scan.
   */

  async function downloadPdf() {
    setExporting(true);
    try {
      const shopCanvas = sheetRef.current?.querySelector<HTMLCanvasElement>('canvas[data-qr="shop"]');

      // A4 at 150dpi. Enough to print sharply, small enough to send on
      // WhatsApp without the poster arriving as a 12MB file.
      const width = 1240;
      const height = 1754;
      const sheet = document.createElement('canvas');
      sheet.width = width;
      sheet.height = height;
      const ctx = sheet.getContext('2d');
      if (!ctx) throw new Error('no canvas');

      const centre = width / 2;
      const body = '"Noto Sans", "Noto Sans Bengali", "Noto Sans Devanagari", system-ui, sans-serif';

      // Both optional. Fetched together so a slow logo does not serialise
      // behind a slow photograph while the operator waits.
      const [logo, owner] = await Promise.all([
        loadImage(BRAND_LOGO.master),
        loadImage(ownerImage),
      ]);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      /**
       * THE WATERMARK GOES DOWN FIRST, AND THE QR'S CARD GOES OVER IT.
       *
       * A watermark behind a QR code is not a style question, it is a scan
       * failure: the code needs high contrast between its modules and their
       * ground, and a phone camera in the low light of a shop doorway has very
       * little to spare. Drawing it first and painting an opaque white card
       * under the code means the mark shows everywhere on the sheet except the
       * one place it would cost the poster its only job.
       *
       * 5% is the ceiling. Above that it survives a cheap mono laser printer as
       * grey mush behind the Bengali text rather than as a tint.
       */
      if (logo) {
        const mark = 760;
        ctx.globalAlpha = 0.05;
        ctx.drawImage(logo, centre - mark / 2, height / 2 - mark / 2, mark, mark);
        ctx.globalAlpha = 1;
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      const line = (text: string, y: number, size: number, colour: string, weight = '400') => {
        if (!text) return;
        ctx.fillStyle = colour;
        ctx.font = `${weight} ${size}px ${body}`;
        ctx.fillText(text, centre, y, width - 120);
      };

      /**
       * THE OWNER'S FACE, ABOVE HIS OWN NAME.
       *
       * A stranger at the counter is being asked to scan a code and hand over
       * an order to a name they have to trust. The face behind the counter is
       * the thing that makes the sheet belong to *this* shop rather than being
       * a generic notice somebody taped up, and it is the same face they are
       * looking at while they read it.
       *
       * Cropped to a circle by clipping rather than by resizing, so a portrait
       * or a landscape snap both fill the disc instead of arriving letterboxed.
       */
      let top = 150;
      if (owner) {
        const d = 168;
        const cx = centre;
        const cy = 128;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
        ctx.clip();
        const scale = Math.max(d / owner.width, d / owner.height);
        const w = owner.width * scale;
        const h = owner.height * scale;
        ctx.drawImage(owner, cx - w / 2, cy - h / 2, w, h);
        ctx.restore();
        ctx.strokeStyle = BRAND_GREEN;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
        ctx.stroke();
        top = 288;
      }

      line(shopName, top, 74, '#0f172a', '800');
      line(address, top + 56, 30, '#475569');

      // All three, because the poster goes on a wall in Bengal and the printed
      // version has always carried them. Everything below the name shifts by
      // the same amount so a shop with no photograph loses the gap, not the
      // spacing.
      const drop = top - 150;
      line('Scan to Order', 300 + drop, 50, BRAND_GREEN, '700');
      line('স্ক্যান করে অর্ডার করুন', 362 + drop, 50, BRAND_GREEN, '700');
      line('स्कैन करके ऑर्डर करें', 424 + drop, 50, BRAND_GREEN, '700');

      if (shopCanvas) {
        // Smaller when a face is on the sheet, so the two together still clear
        // the WhatsApp panel. 560 is still 94mm on A4 — far past the ~30mm a
        // phone needs at arm's length.
        const box = owner ? 560 : 620;
        const frameTop = 470 + drop;
        // An opaque card under the code, so the watermark laid down earlier
        // cannot eat into the quiet zone the scanner reads.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centre - box / 2 - 20, frameTop, box + 40, box + 40);
        // The frame the printed poster has, so the two look like one poster.
        ctx.strokeStyle = BRAND_GREEN;
        ctx.lineWidth = 8;
        ctx.strokeRect(centre - box / 2 - 20, frameTop, box + 40, box + 40);
        ctx.drawImage(shopCanvas, centre - box / 2, frameTop + 20, box, box);
      }

      const afterQr = owner ? 1190 + drop - 60 : 1190;
      line('Just open your phone camera — no app needed', afterQr, 28, '#334155', '600');
      line('ফোনের ক্যামেরা খুলুন · আলাদা অ্যাপ লাগবে না', afterQr + 42, 28, '#334155', '600');
      line('फोन का कैमरा खोलिए · अलग ऐप की ज़रूरत नहीं', afterQr + 84, 28, '#334155', '600');

      line(link, afterQr + 140, 24, '#64748b');

      ctx.fillStyle = '#f2f9f5';
      ctx.fillRect(centre - 380, 1370, 760, 130);
      line('Order on WhatsApp · হোয়াটসঅ্যাপে অর্ডার · व्हाट्सएप पर ऑर्डर', 1412, 24, '#475569');
      line(`+91 ${phone}`, 1470, 48, '#0f172a', '800');

      // The mark above the credit, small and solid — the watermark behind the
      // sheet is a texture and reads as nothing in particular at a glance.
      if (logo) {
        const m = 52;
        ctx.drawImage(logo, centre - m / 2, 1592, m, m);
      }
      line(creditLine, 1676, 20, '#94a3b8');

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      doc.addImage(sheet.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
      doc.save(`halkhata-${slug}-poster.pdf`);
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
        className="print-sheet relative isolate mx-auto w-full max-w-[210mm] overflow-hidden rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-card"
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

        <div className="mt-6 space-y-1">
          <p className="text-2xl font-bold text-brand-700">Scan to Order</p>
          <p className="text-2xl font-bold text-brand-700">স্ক্যান করে অর্ডার করুন</p>
          <p className="text-2xl font-bold text-brand-700">स्कैन करके ऑर्डर करें</p>
        </div>

        <div className="mt-6 flex justify-center">
          {/* `bg-white` is load-bearing, not tidiness: it is the opaque card
              that keeps the watermark out of the code's quiet zone. */}
          <div className="w-full max-w-[17rem] rounded-2xl border-4 border-brand-600 bg-white p-4">
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

        <div className="mt-6 inline-block rounded-xl bg-[#25D366]/10 px-6 py-3">
          <p className="text-sm text-slate-600">Order on WhatsApp · হোয়াটসঅ্যাপে অর্ডার · व्हाट्सएप पर ऑर्डर</p>
          <p className="text-2xl font-bold text-slate-900">+91 {phone}</p>
        </div>

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
