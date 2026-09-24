/**
 * The foot of the page.
 *
 * ONE ROW THAT WRAPS: the credit, the support number and the four policy
 * links, separated by hairlines. It started as a centred block with a heading,
 * a name, a number and four icon buttons — four ways of saying one thing, at
 * the bottom of a page whose job is selling groceries — and most recently was
 * three stacked centred blocks, which on a phone was a band of footer taller
 * than an item card. A shopper needs all of this to exist and be findable once;
 * none of it needs announcing.
 *
 * A server component: the details come from the environment and cannot change
 * while somebody is looking at the page, so there is nothing to run in the
 * browser.
 */

import type { ReactNode } from "react";
import { supportDetails } from "@/lib/support";

type Slug = "privacy" | "terms" | "refund" | "contact";

/** The four policy pages, by their route. English only, as they always were. */
const LINK_LABEL: Record<Slug, string> = {
  privacy: "Privacy",
  terms: "Terms",
  refund: "Refunds",
  contact: "Contact",
};

/**
 * `labels` is for the landing page, which is read in three languages and
 * hands its own words in (see `LANDING.footer` in `lib/marketing-copy.ts`).
 * Every other page passes nothing and gets the English it always had — the
 * shop and the tracking page have their own language switch, and this footer
 * does not know about it.
 */
export function SiteFooter({
  labels,
}: {
  labels?: Partial<Record<Slug | "poweredBy", ReactNode>>;
} = {}) {
  const support = supportDetails();

  return (
    <footer className="mt-4 border-t border-slate-200 bg-card">
      {/* Centred, which is also what keeps it clear of the floating mic:
          the middle of a phone's width is where the mic — bottom right — is
          not. */}
      {/* ONE WRAPPING ROW, NOT THREE STACKED ONES.
          The credit, the support number and four policy links were three
          centred blocks — and with the 44px tap target on the number, a band of
          footer taller than an item card, on every page, under a shop a
          customer came to buy rice from. They are all the same rank: read once,
          by somebody deciding whether to trust this with money.

          So they flow as one row and wrap where they must, and the separators
          are the only thing that has to be understood. The tap target on the
          number is unchanged at 44px — it is the one thing here anybody
          actually presses — but it no longer sets the height of the whole
          block, because the row is centred around it rather than stacked under
          it. */}
      {/* TWO LINES, AND THE SECOND IS THE LINKS.
          One wrapping row put "Privacy" at the end of the first line and the
          other three on the second — a list broken across a line break for no
          reason, which reads as a mistake. The credit and the number are one
          thought; the four policies are another; so each gets a line and
          neither can split the other. */}
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center text-[12px] py-2 leading-tight text-slate-500">
        <p className="flex flex-wrap items-center justify-center gap-x-2.5">
          <span>
            {labels?.poweredBy ?? "Powered by"}{" "}
            <span className="font-medium text-slate-700">{support.name}</span>
          </span>
          {support.phone && (
            <a
              href={`tel:+91${support.phone}`}
              // Readable, and hittable: 44px is the touch-target floor.
              className="inline-flex items-center font-medium tabular-nums text-slate-700 hover:text-brand-700"
            >
              {support.phone}
            </a>
          )}
        </p>

        {/* `whitespace-nowrap` on each link so a name never breaks inside
            itself; the row wraps between them if it ever has to. */}
        <p className="flex flex-wrap items-center justify-center gap-x-2.5">
          {(["privacy", "terms", "refund", "contact"] as const).map(
            (slug, index) => (
              <span key={slug} className="inline-flex items-center gap-2.5">
                {index > 0 && (
                  <span aria-hidden className="text-slate-300">
                    ·
                  </span>
                )}
                <a
                  href={`/${slug}`}
                  className="whitespace-nowrap hover:text-slate-700"
                >
                  {labels?.[slug] ?? LINK_LABEL[slug]}
                </a>
              </span>
            ),
          )}
        </p>
      </div>
    </footer>
  );
}
