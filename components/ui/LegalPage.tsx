/**
 * The shell every legal page shares.
 *
 * Four pages that must look like one document, because a refund policy that
 * looks like a different site from the terms it is referenced by is a refund
 * policy nobody believes. One heading, one date, one way back, and prose set
 * wide enough to read on a phone.
 *
 * A server component: nothing here changes while somebody is reading it.
 */

import Link from 'next/link';
import { BrandMark } from '@/components/ui/BrandMark';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { COMPANY } from '@/lib/company';

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  /** One sentence saying what this page is for, before any clause. */
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <BrandMark href="/" className="text-base" />
          <Link href="/pricing" className="text-sm font-semibold text-brand-700 hover:underline">
            Pricing
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-600">{intro}</p>
        <p className="mt-1 text-sm text-slate-500">
          {COMPANY.name} · Last updated {COMPANY.policiesUpdated}
        </p>

        {/* `prose`-like spacing by hand: this project has no typography plugin,
            and one class of margins is cheaper than adding one. */}
        <div className="mt-8 space-y-6 text-slate-700 [&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_li]:leading-relaxed [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
          {children}
        </div>

        {/* No row of policy links here. The footer below already carries all
            four on every page of the site, and two identical rows stacked one
            above the other read as a mistake rather than as navigation. The
            cross-references that matter are made in the prose, where somebody
            is actually reading. */}
      </main>

      <SiteFooter />
    </div>
  );
}
