import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';
import { BRAND_GREEN, BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  // "Scan → Select → Order" described the product accurately and described
  // every competitor equally well. The voice line is the part nobody else
  // claims, so it is the part that goes in the tab and the link preview.
  title: `${BRAND_NAME} — বলুন, দোকান সাজান`,
  description:
    'Speak your shelf into a shop. Say "চাল ১ কেজি ১০০" and the item is listed, priced and live — in Bangla, Hindi or English. Customers order from a counter QR, and the order lands in your app.',
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
