/**
 * WHAT THE OWNER SEES WHILE THE NEXT TAB IS FETCHED.
 *
 * Every owner screen is `force-dynamic` — a till, a ledger and an order queue
 * are worthless cached — so switching from Items to Sell is a round trip to the
 * server before a single pixel changes. Without a `loading` file Next.js holds
 * the OLD screen on the tab the owner has already left, unchanged and still
 * apparently interactive, until the new one is ready. So the tap did nothing
 * visible, the owner tapped again, and the app that was actually working
 * normally read as frozen. That is the whole of "changing menu from items to
 * sell takes lots of time": most of it was the absence of an answer, not the
 * wait.
 *
 * Deliberately shaped like the screens rather than a spinner in the middle of
 * nowhere — the header and the tab bar are the frame every owner screen shares,
 * so keeping them makes this read as the page arriving rather than the app
 * going away.
 */

function Block({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`} />;
}

export default function OwnerLoading() {
  return (
    <div className="min-h-dvh pb-24" aria-busy="true" aria-live="polite">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2 sm:px-4">
          <Block className="h-7 w-28" />
          <div className="ml-auto flex gap-2">
            <Block className="h-9 w-16" />
            <Block className="h-9 w-9" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl space-y-3 px-4 py-4">
        <Block className="h-12 w-full" />
        <Block className="h-24 w-full" />
        <Block className="h-24 w-full" />
        <Block className="h-24 w-full" />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 h-16 bg-chrome" />
    </div>
  );
}
