import Link from 'next/link';
import { BrandMark } from '@/components/ui/BrandMark';
import { SavedShops } from '@/components/customer/SavedShops';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
      <BrandMark href="/" className="text-lg" />
      <h1 className="mt-5 text-4xl font-bold text-slate-900">Scan → Select → Order</h1>
      <p className="mt-4 max-w-md text-slate-600">
        Customers scan a QR at the counter, pick what they want, and the order lands in the shop
        owner&apos;s WhatsApp. No app for the shop. No login. No training.
      </p>
      <Link
        href="/admin"
        className="mt-8 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
      >
        Admin sign in
      </Link>

      {/* The way back for somebody who scanned a QR once and is now at home.
          Renders nothing on a phone that has never ordered, which is every
          visitor to this page except the customers it is for. */}
      <SavedShops />
    </main>
  );
}
