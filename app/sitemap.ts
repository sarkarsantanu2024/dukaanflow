import type { MetadataRoute } from 'next';
import { baseUrl } from '@/lib/qr';

/**
 * The pages that are meant to be found.
 *
 * A HAND-WRITTEN LIST, NOT A QUERY. It would be easy to walk the shops table
 * and emit every storefront, and that is exactly the mistake: a sitemap is a
 * publication, and publishing every shop would put a named shopkeeper's phone
 * number and street address into search results because a build ran. The five
 * pages below are the marketing site, and they are the whole of what this
 * business is asking search engines to carry. It matches `app/robots.ts`, and
 * the two must be changed together.
 *
 * Priorities are relative, not absolute — pricing is what somebody deciding
 * whether to buy actually reads, so it sits with the landing page rather than
 * below it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
