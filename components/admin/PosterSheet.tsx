'use client';

import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { PrinterIcon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { shopUrl } from '@/lib/qr';
import { BRAND_GREEN } from '@/lib/brand';
import { supportDetails } from '@/lib/support';

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
}: {
  shopName: string;
  slug: string;
  phone: string;
  address: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();
  const [exporting, setExporting] = useState(false);
  const link = shopUrl(slug);

  /**
   * The same credit line the shop's own page carries at its foot. It used to
   * read "Powered by DukaanFlow" here and something else on the web, so the
   * poster on the wall and the page behind the QR named two different
   * companies.
   */
  const support = supportDetails();
  const creditLine = support.phone
    ? `Powered by ${support.name} · For support ${support.phone}`
    : `Powered by ${support.name}`;

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

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      const line = (text: string, y: number, size: number, colour: string, weight = '400') => {
        if (!text) return;
        ctx.fillStyle = colour;
        ctx.font = `${weight} ${size}px ${body}`;
        ctx.fillText(text, centre, y, width - 120);
      };

      line(shopName, 150, 74, '#0f172a', '800');
      line(address, 206, 30, '#475569');

      // All three, because the poster goes on a wall in Bengal and the printed
      // version has always carried them.
      line('Scan to Order', 300, 50, BRAND_GREEN, '700');
      line('স্ক্যান করে অর্ডার করুন', 362, 50, BRAND_GREEN, '700');
      line('स्कैन करके ऑर्डर करें', 424, 50, BRAND_GREEN, '700');

      if (shopCanvas) {
        const box = 620;
        // The frame the printed poster has, so the two look like one poster.
        ctx.strokeStyle = BRAND_GREEN;
        ctx.lineWidth = 8;
        ctx.strokeRect(centre - box / 2 - 20, 470, box + 40, box + 40);
        ctx.drawImage(shopCanvas, centre - box / 2, 490, box, box);
      }

      line('Just open your phone camera — no app needed', 1190, 28, '#334155', '600');
      line('ফোনের ক্যামেরা খুলুন · আলাদা অ্যাপ লাগবে না', 1232, 28, '#334155', '600');
      line('फोन का कैमरा खोलिए · अलग ऐप की ज़रूरत नहीं', 1274, 28, '#334155', '600');

      line(link, 1330, 24, '#64748b');

      ctx.fillStyle = '#eafaf1';
      ctx.fillRect(centre - 380, 1370, 760, 130);
      line('Order on WhatsApp · হোয়াটসঅ্যাপে অর্ডার · व्हाट्सएप पर ऑर्डर', 1412, 24, '#475569');
      line(`+91 ${phone}`, 1470, 48, '#0f172a', '800');

      line(creditLine, 1660, 22, '#94a3b8');

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      doc.addImage(sheet.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
      doc.save(`dukaanflow-${slug}-poster.pdf`);
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
        className="print-sheet mx-auto w-full max-w-[210mm] rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-card"
      >
        <h1 className="text-4xl font-black leading-tight text-slate-900">{shopName}</h1>
        {address && <p className="mt-2 text-base text-slate-600">{address}</p>}

        <div className="mt-6 space-y-1">
          <p className="text-2xl font-bold text-brand-700">Scan to Order</p>
          <p className="text-2xl font-bold text-brand-700">স্ক্যান করে অর্ডার করুন</p>
          <p className="text-2xl font-bold text-brand-700">स्कैन करके ऑर्डर करें</p>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="w-full max-w-[17rem] rounded-2xl border-4 border-brand-600 p-4">
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

        <p className="mt-8 text-xs text-slate-400">{creditLine}</p>
      </div>
    </div>
  );
}
