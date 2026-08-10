import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">DukaanFlow</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-900">Scan → Select → WhatsApp</h1>
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
    </main>
  );
}
