/**
 * The foot of the page: one line, two ends.
 *
 * Who built it on the left, who to ring on the right, and nothing else. This
 * started as a centred block with a heading, a name, a number and four icon
 * buttons — four ways of saying one thing, at the bottom of a page whose job
 * is selling groceries. A shopper needs the support number to exist, findable,
 * once; they do not need it announced.
 *
 * A server component: the details come from the environment and cannot change
 * while somebody is looking at the page, so there is nothing to run in the
 * browser.
 */

import { supportDetails } from '@/lib/support';

export function SiteFooter() {
  const support = supportDetails();

  return (
    <footer className="mt-4 border-t border-slate-200 bg-white">
      {/* Centred, and that is also what keeps it clear of the floating mic.
          Reserving height under the text worked but left a band of empty page;
          pushing the text left worked but read as two loose scraps in a
          corner. Two short centred lines sit in the middle of a phone's width,
          which is where the mic — bottom right — is not. */}
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-0.5 px-4 py-3 text-center text-xs text-slate-500">
        <p>
          Powered by <span className="font-semibold text-slate-700">{support.name}</span>.
        </p>
        {support.phone && (
          <p>
            For support{' '}
            <a
              href={`tel:+91${support.phone}`}
              // Same reason as the shop's own number: readable, and now hittable.
              className="inline-flex min-h-11 items-center font-semibold tabular-nums text-slate-700 hover:text-brand-700"
            >
              {support.phone}
            </a>
          </p>
        )}
      </div>
    </footer>
  );
}
