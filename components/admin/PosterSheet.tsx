'use client';

import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { PrinterIcon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { shopUrl } from '@/lib/qr';

/**
 * A4 "Scan to Order" poster the admin prints and hands to the shop.
 *
 * Printing goes through the browser (Ctrl+P / window.print) so Bengali and
 * Hindi render with real system fonts. The jsPDF export is a convenience
 * fallback and is intentionally English-only — jsPDF's built-in fonts have no
 * Devanagari or Bengali glyphs, and embedding a Unicode font would add ~1MB to
 * the bundle for a button most admins will not use.
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

  async function downloadPdf() {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const centre = pageWidth / 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(30);
      doc.text(shopName, centre, 30, { align: 'center' });

      if (address) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(address, centre, 38, { align: 'center', maxWidth: pageWidth - 40 });
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('SCAN TO ORDER', centre, 54, { align: 'center' });

      const shopCanvas = sheetRef.current?.querySelector<HTMLCanvasElement>('canvas[data-qr="shop"]');
      if (shopCanvas) {
        doc.addImage(shopCanvas.toDataURL('image/png'), 'PNG', centre - 45, 62, 90, 90);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(link, centre, 160, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`WhatsApp: +91 ${phone}`, centre, 172, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('Powered by DukaanFlow', centre, 285, { align: 'center' });

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
        Print gives the full Bengali and Hindi poster. The PDF export is English-only.
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

        <p className="mt-4 break-all font-mono text-sm text-slate-500">{link}</p>

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

        <p className="mt-8 text-xs text-slate-400">Powered by DukaanFlow</p>
      </div>
    </div>
  );
}
