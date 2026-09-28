import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import { NavMemory } from '@/components/ui/BackButton';
import './globals.css';
import { BRAND_GREEN, BRAND_NAME } from '@/lib/brand';
import { baseUrl } from '@/lib/qr';

export const metadata: Metadata = {
  // Absolute links for every page's share image (`opengraph-image`). Without
  // it a page that does not set its own resolves them against localhost.
  metadataBase: new URL(baseUrl()),
  // The fallback for any page without its own title — the product's line as
  // the owner put it on 2026-09-28: daily orders ahead, the counter crowd fast.
  title: `${BRAND_NAME} — রোজের অর্ডার আগে, কাউন্টারের ভিড় দ্রুত`,
  description:
    'Take daily and bulk orders ahead by QR and bill the counter crowd fast. Digital khata, stock and bills on WhatsApp — in Bengali, Hindi or English.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // The Android address bar. Typed out here it stayed on the old green after
  // the scale moved, so the browser chrome and the app's own rail were two
  // different greens stacked on top of each other.
  themeColor: BRAND_GREEN,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Remembers in-app moves, so a back button knows where "back" is. */}
        <NavMemory />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
