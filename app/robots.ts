import type { MetadataRoute } from 'next';
import { baseUrl } from '@/lib/qr';

/**
 * What a crawler may look at.
 *
 * DEFAULT DENY, LIKE THE REST OF THE SITE. The root layout marks every page
 * `noindex` and each public page opts itself back in; this file says the same
 * thing at the other level, because the two mechanisms answer different
 * questions — the meta tag stops a page being INDEXED once fetched, this stops
 * it being FETCHED at all. Neither alone is enough: a page nobody crawls can
 * still be indexed from an inbound link, and a page nobody indexes is still
 * being read by every bot on the internet.
 *
 * The disallowed paths are the ones that are somebody's private business:
 *
 *  - `/owner` and `/admin` are consoles. Nothing there is public.
 *  - `/track` is one household's order, reachable only by a link handed to one
 *    person. A crawler finding one would be a leak with no upside.
 *  - `/join` is a single-use sign-in link. A crawler following one would SPEND
 *    it, and the shopkeeper it was sent to would find a dead link.
 *  - `/shop` is a live storefront and a genuine judgement call, not an
 *    oversight: it carries a named shopkeeper's phone number and street
 *    address, and it is reached by scanning a QR code at the counter rather
 *    than by searching. Opening it to search is a decision to take deliberately
 *    and per shop, not a default.
 */
export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/privacy', '/terms', '/refund', '/contact'],
        disallow: ['/owner/', '/admin/', '/track/', '/join/', '/shop/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
