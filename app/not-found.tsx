import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">🔍</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">
        This shop link may be wrong or the shop is no longer listed.
      </p>
      <Link href="/" className="mt-6 font-semibold text-brand-700 underline">
        Go to DukaanFlow
      </Link>
    </main>
  );
}
