/**
 * Who is behind Halkhata, in law.
 *
 * The legal pages, the footer and any future invoice all have to name the same
 * entity, and a company detail typed into four files is a company detail that
 * will be right in three of them after the first change of address.
 *
 * DELIBERATELY NOT FROM THE ENVIRONMENT, unlike `lib/support.ts`. The support
 * name and number are branding — a deployment can be handed to somebody else
 * and rebranded — but the party a shopkeeper is contracting with is a fact
 * about this business, and a legal page whose publisher changes with a
 * deployment variable is not a legal page.
 */

export const COMPANY = {
  /** The legal entity a shopkeeper is contracting with. */
  name: 'Nexvora Technologies',
  city: 'Kolkata',
  state: 'West Bengal',
  country: 'India',

  /**
   * The last time any legal page here was changed.
   *
   * Shown on every one of them, because "which version did I agree to" is the
   * first question in any dispute. UPDATE IT when the wording changes — not
   * when a price or a plan does, which those pages point at rather than quote.
   */
  policiesUpdated: '9 September 2026',
} as const;

/** "Kolkata, West Bengal, India" — the address line, assembled once. */
export function companyLocation(): string {
  return `${COMPANY.city}, ${COMPANY.state}, ${COMPANY.country}`;
}
