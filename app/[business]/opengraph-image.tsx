import { ogCard, OG_SIZE } from '@/lib/og-card';
import { BUSINESSES, businessBySlug, businessScreenPath } from '@/lib/business-types';
import { screenPath } from '@/lib/landing-media';
import { firstExisting } from '@/lib/landing-media-files';
import { PLAN_ORDER, PLAN_SPECS, SETUP_FEE_PAISE, TRIAL_DAYS } from '@/lib/plans';

/**
 * Each business page's link preview: its own headline and its own demo
 * screenshot when one exists. Built at build time — see `lib/og-card.tsx`.
 *
 * The screenshot is the Bengali one, the site's default language. Its text
 * stays English: the card renderer cannot join Bengali letters correctly.
 */
export const dynamic = 'force-static';
export const dynamicParams = false;
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Halkhata — QR orders, khata and billing for local shops';

export function generateStaticParams() {
  return BUSINESSES.map((business) => ({ business: business.slug }));
}

export default async function Image({ params }: { params: Promise<{ business: string }> }) {
  const business = businessBySlug((await params).business) ?? BUSINESSES[0]!;
  const shot =
    business.slug === 'grocery'
      ? screenPath('bn', 'storefront')
      : (firstExisting(businessScreenPath(business.slug, 'bn', 'storefront')) ??
        firstExisting(businessScreenPath(business.slug, 'en', 'storefront')) ??
        screenPath('bn', 'storefront'));
  return ogCard({
    eyebrow: business.name.en,
    headline: business.headline.en,
    footer: `₹${PLAN_SPECS[PLAN_ORDER[0]!].price}/month · ₹${SETUP_FEE_PAISE / 100} setup · ${TRIAL_DAYS}-day free trial`,
    screenshot: shot,
  });
}
