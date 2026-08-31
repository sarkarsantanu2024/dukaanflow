import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  // "Scan → Select → Order" described the product accurately and described
  // every competitor equally well. The voice line is the part nobody else
  // claims, so it is the part that goes in the tab and the link preview.
  title: `${BRAND_NAME} — বলুন, দোকান সাজান`,
  description:
    'Speak your shelf into a shop. Say "চাল ১ কেজি ১০০" and the item is listed, priced and live — in Bangla, Hindi or English. Customers order from a counter QR straight to your WhatsApp.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0b9057',
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
