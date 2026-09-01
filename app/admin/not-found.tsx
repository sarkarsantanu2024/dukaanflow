import Link from 'next/link';

/**
 * A 404 inside the console, for whoever is signed in to it.
 *
 * The global one says "this shop link may be wrong or the shop is no longer
 * listed", which is the right thing to tell a customer holding a QR sticker and
 * the wrong thing to tell the operator — who reached this by typing a URL the
 * app's own navigation implies, like `/admin/shops`, and needs a way back to
 * the console rather than to the marketing page.
 */
export default function AdminNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">🗂️</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">No such console page</h1>
      <p className="mt-2 text-slate-600">
        That address does not exist. The shop list lives at the console&apos;s home.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Link href="/admin" className="font-semibold text-brand-700 underline">
          Shops
        </Link>
        <Link href="/admin/dashboard" className="font-semibold text-brand-700 underline">
          Dashboard
        </Link>
        <Link href="/admin/reports" className="font-semibold text-brand-700 underline">
          Reports
        </Link>
      </div>
    </main>
  );
}
