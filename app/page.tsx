import Link from 'next/link';
import { BrandMark } from '@/components/ui/BrandMark';
import { SavedShops } from '@/components/customer/SavedShops';
import { MicIcon } from '@/components/ui/Icon';

/**
 * The landing page, and the one line of copy this business has to get right.
 *
 * It used to lead with "Scan → Select → Order", which is a true description of
 * the product and a sentence every competitor can write without changing a
 * word. KiranaOS ships a counter QR, a pre-loaded catalogue and WhatsApp order
 * alerts; Dukaan has a million storefronts. Leading on the QR is leading on the
 * half of the product that is table stakes.
 *
 * What none of them ask a shopkeeper to do is talk. Speaking a shelf into a
 * catalogue — in Bangla, in the shop, without typing — is the part of this
 * product that is hard to copy and the only part worth a headline.
 *
 * So the headline IS the demonstration: the exact sentence an owner says, in
 * the script they think in, big enough to read from across a room. Somebody who
 * reads it has already understood the product; there is nothing left to explain
 * except that the ordering works too.
 */
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <BrandMark href="/" className="text-lg" />

      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
        দোকান সাজান মুখে বলে
      </p>

      {/* The claim, made by showing it rather than describing it. Quoted and set
          in the shopkeeper's own script, because a sentence in Bangla on a
          landing page is itself the promise that the app will speak Bangla. */}
      <h1 className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white sm:h-12 sm:w-12">
          <MicIcon className="h-6 w-6 sm:h-7 sm:w-7" />
        </span>
        <span>&ldquo;চাল ১ কেজি ১০০&rdquo;</span>
      </h1>

      <p className="mt-5 max-w-md text-lg text-slate-700">
        বলুন — জিনিসটা দামসহ তালিকায় উঠে গেল, খদ্দের দেখতে পেল।
        <span className="mt-1 block text-base text-slate-500">
          বাংলা, হিন্দি বা ইংরেজিতে। টাইপ করতে হবে না।
        </span>
      </p>

      {/* The QR half stays, demoted to what it is: the second sentence.
          It said "lands in your WhatsApp", which stopped being true when the
          handoff was removed — orders land in the owner's own app now, and
          saying otherwise sold a shopkeeper a flow they would not find. */}
      <p className="mt-6 max-w-md text-slate-600">
        Customers scan the QR at your counter and the order lands in your app —
        with a bell that counts it from every screen. No login, no training.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/pricing"
          className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
        >
          দাম দেখুন · See pricing
        </Link>
        <Link
          href="/admin"
          className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Admin sign in
        </Link>
      </div>

      {/* The way back for somebody who scanned a QR once and is now at home.
          Renders nothing on a phone that has never ordered, which is every
          visitor to this page except the customers it is for. */}
      <SavedShops />
    </main>
  );
}
