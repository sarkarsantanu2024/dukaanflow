/**
 * The console's answer to a click, before the server has one.
 *
 * Same reasoning as the owner app's — see `app/owner/[slug]/loading.tsx`. Every
 * admin screen queries the database on the way in, and without this Next.js
 * leaves the previous page standing until the next one is ready, so a click on
 * a shop looks ignored for as long as the round trip takes.
 */
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-3 p-4" aria-busy="true" aria-live="polite">
      <div className="h-9 w-48 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-200/70" />
    </div>
  );
}
