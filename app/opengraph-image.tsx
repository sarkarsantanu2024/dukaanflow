import { ogCard, OG_SIZE } from '@/lib/og-card';
import { PLAN_ORDER, PLAN_SPECS, SETUP_FEE_PAISE, TRIAL_DAYS } from '@/lib/plans';
import { screenPath } from '@/lib/landing-media';

/**
 * The home page's link preview. Built at build time — see `lib/og-card.tsx`.
 * Also what any page without its own card falls back to.
 */
export const dynamic = 'force-static';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Halkhata — take daily orders ahead by QR and bill the counter crowd fast';

export default function Image() {
  return ogCard({
    eyebrow: 'Shop app for every local business',
    headline: 'Take the daily orders ahead. Clear the counter crowd fast.',
    footer: `₹${PLAN_SPECS[PLAN_ORDER[0]!].price}/month · ₹${SETUP_FEE_PAISE / 100} setup · ${TRIAL_DAYS}-day free trial · 0% commission`,
    screenshot: screenPath('en', 'storefront'),
  });
}
