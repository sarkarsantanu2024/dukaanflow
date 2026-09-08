import type { Metadata } from 'next';
import { loadOwnerShop } from '@/lib/owner-page';
import { OwnerShell } from '@/components/owner/OwnerShell';
import { RenewScreen } from '@/components/owner/RenewScreen';
import { BRAND_NAME } from '@/lib/brand';
import type { Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${BRAND_NAME} — Plan`,
    manifest: `/owner.webmanifest?slug=${encodeURIComponent(slug)}`,
    appleWebApp: { capable: true, statusBarStyle: 'default' },
  };
}

/**
 * Dates are formatted here, on the server, in the shop's own language.
 *
 * Doing it in the browser would mean the phone's locale decides, and a phone
 * set to US English would print a renewal date as month/day to a shopkeeper who
 * reads day/month — the one number on this screen that must not be misread.
 */
const DATE_LOCALE: Record<Locale, string> = { en: 'en-IN', bn: 'bn-IN', hi: 'hi-IN' };

function formatDate(date: Date | null, locale: Locale): string | null {
  if (!date) return null;
  return date.toLocaleDateString(DATE_LOCALE[locale] ?? 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * The plan screen: where the shop stands, and the same payment flow every other
 * entrance opens.
 *
 * Reachable at any time from "Plan" in the header — which is the point of it.
 * The dialog covers an owner who is prompted; this covers one who simply
 * decided to go and pay, on a day nothing was prompting them.
 */
export default async function RenewPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop, plan, locale } = await loadOwnerShop(slug);

  const expiry = shop.currentPeriodEnd ?? shop.trialEndsAt;

  return (
    // NO ROADBLOCK ON THIS SCREEN, deliberately — it is the only page where
    // that overlay would cover the very thing it exists to send people to. A
    // lapsed owner must be able to reach this page and pay; it carries the same
    // flow the roadblock does.
    <OwnerShell slug={shop.slug} roadblock={null} locale={locale} plan={plan}>
      <RenewScreen
        slug={shop.slug}
        locale={locale}
        plan={plan}
        expiresOn={formatDate(expiry, locale)}
      />
    </OwnerShell>
  );
}
