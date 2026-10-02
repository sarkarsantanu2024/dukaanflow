/**
 * The foot of the page.
 *
 * A BLACK BAND, TWO GROUPS: the credit beside a call button for support, then
 * the four policy links under a hairline. It started as a centred block with a heading,
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
import { PhoneIcon } from "@/components/ui/Icon";
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
    // BLACK, BY REQUEST (2 Oct): the old pale band of grey text read as
    // leftover page rather than a footer. Black closes the page off clearly.
    // Text stays at 16px with neutral-400 or lighter on neutral-950, well over
    // 4.5:1.
    <footer className="mt-4 bg-neutral-950 text-base text-neutral-400">
      {/* Centred, which also keeps it clear of the floating mic at the
          bottom right of a phone. The credit and the call button are one
          thought; the four policies are another, under a hairline. */}
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
          <p>
            {labels?.poweredBy ?? "Powered by"}{" "}
            <span className="font-semibold text-white">{support.name}</span>
          </p>
          {support.phone && (
            <a
              href={`tel:+91${support.phone}`}
              aria-label={`Call support, ${support.phone}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 font-medium tabular-nums text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <PhoneIcon className="h-4 w-4 text-brand-400" />
              {support.phone}
            </a>
          )}
        </div>

        {/* `whitespace-nowrap` on each link so a name never breaks inside
            itself; the row wraps between them if it ever has to. */}
        <nav
          aria-label="Policies"
          className="flex w-full max-w-md flex-wrap items-center justify-center gap-x-1 border-t border-white/10 pt-3"
        >
          {(["privacy", "terms", "refund", "contact"] as const).map((slug) => (
            <a
              key={slug}
              href={`/${slug}`}
              className="inline-flex min-h-10 min-w-10 items-center justify-center whitespace-nowrap rounded-lg px-3 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              {labels?.[slug] ?? LINK_LABEL[slug]}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
