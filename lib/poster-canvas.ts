'use client';

/**
 * The "Scan to Order" poster, drawn onto a canvas — shared by the console's
 * poster page and the owner's own "Download QR" on the home screen, so the two
 * hand out the same sheet.
 *
 * THE PDF IS A PICTURE OF THE POSTER, NOT TEXT LAID OUT AGAIN.
 *
 * It used to be jsPDF text calls, and jsPDF's built-in fonts have no Bengali or
 * Devanagari glyphs — so the download was English-only while the printed
 * version carried all three languages. Embedding a Unicode font would add about
 * a megabyte to the bundle. Drawing onto a `<canvas>` costs nothing: the browser
 * shapes Bengali conjuncts and Devanagari matras with the same system fonts the
 * screen uses, and the result goes into the PDF as one image. The text is not
 * selectable in the PDF — which for something destined for a printer and a wall
 * is no trade at all.
 */

import { BRAND_GREEN, BRAND_LOGO } from '@/lib/brand';
import { supportDetails } from '@/lib/support';

/**
 * Loads one image for the canvas copy of the poster.
 *
 * Resolves to null rather than rejecting. A missing owner photo or a logo that
 * failed to fetch must not cost the whole PDF — the poster's job is the QR
 * code, and everything else on the sheet is decoration around it.
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
 * The same credit line the shop's own page carries at its foot, so the poster
 * on the wall and the page behind the QR name the same company.
 */
export function posterCreditLine(): string {
  const support = supportDetails();
  return support.phone
    ? `Powered by ${support.name} · For support ${support.phone}`
    : `Powered by ${support.name}`;
}

export type PosterInput = {
  shopName: string;
  address: string;
  /** The shop's number, to CALL it — not an order channel. Optional. */
  phone?: string;
  /** The owner's photograph as a data URL, or ''. */
  ownerImage?: string;
  /** The shop's page, printed under the code. */
  link: string;
  /** A rendered QR of `link`, drawn into the frame. */
  qr: HTMLCanvasElement;
};

/** A4 at 150dpi: sharp on paper, small enough to travel on WhatsApp. */
export async function drawPoster({ shopName, address, phone = '', ownerImage = '', link, qr }: PosterInput): Promise<HTMLCanvasElement> {
  const width = 1240;
  const height = 1754;
  const sheet = document.createElement('canvas');
  sheet.width = width;
  sheet.height = height;
  const ctx = sheet.getContext('2d');
  if (!ctx) throw new Error('no canvas');

  const centre = width / 2;
  const body = '"Noto Sans", "Noto Sans Bengali", "Noto Sans Devanagari", system-ui, sans-serif';

  // Both optional, fetched together so a slow logo does not wait on a slow photo.
  const [logo, owner] = await Promise.all([loadImage(BRAND_LOGO.master), loadImage(ownerImage)]);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  /**
   * THE WATERMARK GOES DOWN FIRST, AND THE QR'S CARD GOES OVER IT.
   *
   * A watermark behind a QR code is a scan failure, not a style question: a
   * phone camera in the low light of a shop doorway needs every bit of
   * contrast. Drawing it first and painting an opaque white card under the
   * code keeps it everywhere except the one place it would cost the poster its
   * job. 5% is the ceiling, or a cheap mono laser prints it as grey mush.
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

  // The owner's face above the shop's name, cropped to a disc by clipping so a
  // portrait or a landscape snap both fill it.
  let top = 150;
  if (owner) {
    const d = 168;
    const cy = 128;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centre, cy, d / 2, 0, Math.PI * 2);
    ctx.clip();
    const scale = Math.max(d / owner.width, d / owner.height);
    const w = owner.width * scale;
    const h = owner.height * scale;
    ctx.drawImage(owner, centre - w / 2, cy - h / 2, w, h);
    ctx.restore();
    ctx.strokeStyle = BRAND_GREEN;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centre, cy, d / 2, 0, Math.PI * 2);
    ctx.stroke();
    top = 288;
  }

  line(shopName, top, 74, '#0f172a', '800');
  line(address, top + 56, 30, '#475569');
  if (phone) line(`Phone · ফোন · फ़ोन:  +91 ${phone}`, top + 100, 30, '#0f172a', '700');

  // All three languages: the poster goes on a wall in Bengal.
  const drop = top - 150;
  line('Scan to Order', 300 + drop, 50, BRAND_GREEN, '700');
  line('স্ক্যান করে অর্ডার করুন', 362 + drop, 50, BRAND_GREEN, '700');
  line('स्कैन करके ऑर्डर करें', 424 + drop, 50, BRAND_GREEN, '700');

  // Smaller when a face is on the sheet. 560 is still 94mm on A4 — far past
  // the ~30mm a phone needs at arm's length.
  const box = owner ? 560 : 620;
  const frameTop = 470 + drop;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(centre - box / 2 - 20, frameTop, box + 40, box + 40);
  ctx.strokeStyle = BRAND_GREEN;
  ctx.lineWidth = 8;
  ctx.strokeRect(centre - box / 2 - 20, frameTop, box + 40, box + 40);
  ctx.drawImage(qr, centre - box / 2, frameTop + 20, box, box);

  const afterQr = owner ? 1190 + drop - 60 : 1190;
  line('Just open your phone camera — no app needed', afterQr, 28, '#334155', '600');
  line('ফোনের ক্যামেরা খুলুন · আলাদা অ্যাপ লাগবে না', afterQr + 42, 28, '#334155', '600');
  line('फोन का कैमरा खोलिए · अलग ऐप की ज़रूरत नहीं', afterQr + 84, 28, '#334155', '600');
  line(link, afterQr + 140, 24, '#64748b');

  // No "order on WhatsApp" panel: orders come in through the QR, into the
  // owner's app. A poster with two order paths had one that nobody watched.

  if (logo) {
    const m = 52;
    ctx.drawImage(logo, centre - m / 2, 1592, m, m);
  }
  line(posterCreditLine(), 1676, 20, '#94a3b8');

  return sheet;
}

/** The poster as an A4 PDF, saved to the phone's downloads. */
export async function savePosterPdf(sheet: HTMLCanvasElement, slug: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.addImage(sheet.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
  doc.save(`halkhata-${slug}-poster.pdf`);
}

/** The poster as a JPEG file, for the phone's share sheet. */
export function posterFile(sheet: HTMLCanvasElement, slug: string): Promise<File | null> {
  return new Promise((resolve) => {
    sheet.toBlob(
      (blob) => resolve(blob ? new File([blob], `halkhata-${slug}-qr.jpg`, { type: 'image/jpeg' }) : null),
      'image/jpeg',
      0.92,
    );
  });
}
