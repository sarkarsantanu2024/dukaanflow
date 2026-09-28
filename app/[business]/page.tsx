import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon, BoxIcon, CheckIcon, QrIcon, RupeeIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { BackToTop } from '@/components/marketing/BackToTop';
import { MobileMenu } from '@/components/marketing/MobileMenu';
import { LandingLanguage } from '@/components/marketing/LangTabs';
import { Say } from '@/components/marketing/Say';
import type { NavItem } from '@/components/marketing/SectionNav';
import { StickyCta } from '@/components/marketing/StickyCta';
import { MarketingAnalytics } from '@/components/marketing/MarketingAnalytics';
import { BusinessGrid } from '@/components/marketing/BusinessGrid';
import { BUSINESS_ICON } from '@/components/marketing/BusinessIcon';
import { HERO_BOX, LandingHeader, PhoneShot, Section, SectionHead } from '@/components/marketing/LandingKit';
import { BRAND_NAME } from '@/lib/brand';
import {
  BUSINESSES,
  BUSINESS_SCREENS,
  businessBySlug,
  businessScreenPath,
  demoSlug,
  type Business,
  type BusinessScreen,
} from '@/lib/business-types';
import { LANDING, PLAN_INCLUDES, type Words } from '@/lib/marketing-copy';
import { screenPath } from '@/lib/landing-media';
import type { Locale } from '@/lib/i18n';
import { PLAN_ORDER, PLAN_SPECS, TRIAL_DAYS } from '@/lib/plans';
import { starterCatalogue, type StarterItem } from '@/lib/starter-catalogue';
import { translateCategory } from '@/lib/speech';
import { supportDetails } from '@/lib/support';

/**
 * THE PAGE FOR ONE KIND OF BUSINESS — `/grocery`, `/sweet-shop`, `/stationery`…
 *
 * Added 2026-09-27, by request, instead of one ever-longer landing page: each
 * kind of shop gets its own page with its own words, its own ready-made items
 * and screenshots from its own demo shop. Everything it says comes from
 * `lib/business-types.ts`, and every word is in all three languages.
 *
 * Static: one page per business, built ahead of time. `dynamicParams` is off,
 * so any other single-segment path is a plain 404 — and every real top-level
 * route (`/admin`, `/owner`, `/shop`, `/terms`…) is a static segment, which
 * Next.js always matches before this one.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return BUSINESSES.map((business) => ({ business: business.slug }));
}

type Props = { params: Promise<{ business: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const business = businessBySlug((await params).business);
  if (!business) return {};
  const title = `${BRAND_NAME} for ${business.name.en} — QR Orders, Khata & Billing App`;
  const description = `${business.lead.en} One plan, ₹${PLAN_SPECS[PLAN_ORDER[0]!].price} a month, ${TRIAL_DAYS}-day free trial.`;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/${business.slug}` },
    twitter: { card: 'summary_large_image', title, description },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/${business.slug}`,
      siteName: BRAND_NAME,
      locale: 'en_IN',
      alternateLocale: ['bn_IN', 'hi_IN'],
    },
  };
}

/** Where each screenshot slot says it is, and its placeholder picture. */
const SCREEN_ICON: Record<BusinessScreen, (props: { className?: string }) => React.ReactElement> = {
  storefront: QrIcon,
  products: BoxIcon,
  billing: RupeeIcon,
};

/**
 * The file for one screenshot. Grocery's are the landing page's own set —
 * the same demo shop, already captured — so they are not taken twice.
 */
function shotPath(business: Business, screen: BusinessScreen) {
  return (lang: string) =>
    business.slug === 'grocery' ? screenPath(lang as Locale, screen) : businessScreenPath(business.slug, lang, screen);
}

/** The first few of each group in a list, so the page shows breadth, not a wall. */
function sampleGroups(items: StarterItem[], perGroup = 8, groups = 6): [string, StarterItem[]][] {
  const byCategory = new Map<string, StarterItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    if (list.length < perGroup) list.push(item);
    byCategory.set(item.category, list);
  }
  return [...byCategory.entries()].slice(0, groups);
}

function categoryWords(category: string): Words {
  return {
    en: translateCategory(category, 'en'),
    bn: translateCategory(category, 'bn'),
    hi: translateCategory(category, 'hi'),
  };
}

export default async function BusinessPage({ params }: Props) {
  const business = businessBySlug((await params).business);
  if (!business) notFound();

  const support = supportDetails();
  const whatsapp = support.phone
    ? `https://wa.me/91${support.phone}?text=${encodeURIComponent(
        `Hello, I would like to start a ${BRAND_NAME} free trial for my shop (${business.name.en}). Shop name: `,
      )}`
    : null;
  const items = starterCatalogue(business.type);
  const groups = sampleGroups(items);
  const plan = PLAN_SPECS[PLAN_ORDER[0]!];
  // No link to a demo shop that has been removed. See `Business.hasDemo`.
  const hasDemo = business.hasDemo !== false;

  const NAV: NavItem[] = [
    { href: '#items', label: LANDING.business.navItems },
    { href: '#screens', label: LANDING.business.navScreens },
    { href: '#plan', label: LANDING.nav.plans },
    { href: '/#businesses', label: LANDING.nav.businesses },
  ];

  return (
    <div data-landing="" suppressHydrationWarning className="flex min-h-dvh flex-col bg-card">
      <LandingLanguage />
      <MarketingAnalytics />
      <span id="top" tabIndex={-1} className="sr-only" />
      <LandingHeader nav={NAV} whatsapp={whatsapp} />

      <main className="flex-1">
        {/* HERO — what this kind of shop gets, beside what its customers see. */}
        <section className="relative overflow-hidden bg-cream">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-200/45 blur-3xl"
          />
          <div className={`relative grid items-center gap-12 pb-16 pt-8 sm:pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:pb-24 ${HERO_BOX}`}>
            <div className="text-center lg:text-left">
              <div>
                <Link
                  href="/#businesses"
                  className="inline-flex min-h-10 items-center gap-1.5 text-base font-semibold text-brand-700 hover:text-brand-800"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <Say t={LANDING.business.back} />
                </Link>
              </div>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-base font-semibold text-accent-700 shadow-raised ring-1 ring-accent-100">
                {(() => {
                  const Icon = BUSINESS_ICON[business.slug];
                  return <Icon className="h-5 w-5 text-brand-700" />;
                })()}
                <Say t={business.name} />
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.22] tracking-tight text-slate-900 sm:text-5xl">
                <Say t={business.headline} />
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-700 lg:mx-0">
                <Say t={business.lead} />
              </p>

              <ul className="mx-auto mt-6 max-w-xl space-y-3 text-left lg:mx-0">
                {business.points.map((point) => (
                  <li key={point.en} className="flex gap-3 text-base leading-relaxed text-slate-700">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <Say t={point} />
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {whatsapp && (
                  <a
                    href={whatsapp}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-bold text-white shadow-float transition hover:bg-brand-700"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    <Say t={LANDING.getYourShop} />
                  </a>
                )}
                {hasDemo && (
                  <a
                    href={`/shop/${demoSlug(business)}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-card px-6 py-3.5 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
                  >
                    <QrIcon className="h-5 w-5" />
                    <Say t={LANDING.business.openDemo} />
                  </a>
                )}
              </div>
            </div>

            <div className="mx-auto w-full max-w-md">
              <PhoneShot
                pathFor={shotPath(business, 'storefront')}
                alt={`${business.demoName} — the shop page customers open from the QR code`}
                label={LANDING.business.screens.storefront}
                Icon={SCREEN_ICON.storefront}
              />
            </div>
          </div>
        </section>

        {/* READY-MADE ITEMS — this kind of shop's own list, in all three languages. */}
        <Section id="items">
          <SectionHead
            eyebrow={business.name}
            title={LANDING.business.readyTitle}
            lead={LANDING.business.readyLead}
          />
          <p className="mt-6 text-center text-lg font-semibold text-brand-700">
            <span className="tabular-nums">{items.length}</span> <Say t={LANDING.business.readyCount} />
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(([category, list]) => (
              <div key={category} className="rounded-2xl border border-brand-100 bg-card p-5 shadow-raised">
                <h3 className="font-bold text-slate-900">
                  <Say t={categoryWords(category)} />
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {list.map((item) => (
                    <li
                      key={`${item.name}-${item.unit}`}
                      className="rounded-full bg-brand-50 px-3 py-1 text-base text-brand-800"
                    >
                      <Say t={{ en: item.name, bn: item.nameBn || item.name, hi: item.nameHi || item.name }} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* SCREENS — from this kind of shop's own demo shop. */}
        <Section id="screens" tone="tint">
          <SectionHead
            eyebrow={business.name}
            title={LANDING.business.screensTitle}
            lead={hasDemo ? LANDING.business.screensLead : LANDING.business.screensLeadNoDemo}
          />
          <div className="mx-auto mt-12 grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {BUSINESS_SCREENS.map((screen) => (
              <div key={screen} className="mx-auto w-full max-w-sm">
                <PhoneShot
                  pathFor={shotPath(business, screen)}
                  alt={`${business.demoName} — ${LANDING.business.screens[screen].en}`}
                  label={LANDING.business.screens[screen]}
                  Icon={SCREEN_ICON[screen]}
                />
                <p className="mt-4 text-center font-semibold text-slate-800">
                  <Say t={LANDING.business.screens[screen]} />
                </p>
              </div>
            ))}
          </div>
          {hasDemo && (
            <div className="mt-10 flex justify-center">
              <a
                href={`/shop/${demoSlug(business)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-bold text-white shadow-float transition hover:bg-brand-700"
              >
                <QrIcon className="h-5 w-5" />
                <Say t={LANDING.business.openDemo} />
              </a>
            </div>
          )}
        </Section>

        {/* THE PLAN — the same one for every kind of shop. */}
        <Section id="plan">
          <SectionHead eyebrow={LANDING.plans.eyebrow} title={LANDING.business.alsoTitle} lead={LANDING.plans.lead} />
          <div className="mx-auto mt-10 max-w-5xl rounded-3xl bg-brand-600 p-6 text-white shadow-float sm:p-8">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-lg font-bold">{plan.name}</span>
              <span className="text-4xl font-bold tabular-nums">
                &#8377;{plan.price}
                <span className="text-base font-normal text-white/75">
                  <Say t={LANDING.plans.perMonth} />
                </span>
              </span>
            </p>
            <p className="mt-1.5 text-base text-white/85">
              <Say t={LANDING.plans.setupLine} />
            </p>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {PLAN_INCLUDES.map((line) => (
                <li key={line.en} className="flex gap-2 text-base leading-snug text-white/90">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-100" />
                  <Say t={line} />
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-white/20 pt-4 text-base text-white/85">
              <Say t={LANDING.plans.customBody} />
            </p>
          </div>
        </Section>

        {/* OTHER KINDS OF SHOP — sideways, without going back home. */}
        <Section tone="tint">
          <SectionHead
            eyebrow={LANDING.businesses.eyebrow}
            title={LANDING.businesses.title}
          />
          <BusinessGrid className="mt-10" exclude={business.slug} />
        </Section>

        {/* The last call to action, as on the home page. */}
        <section className="px-5 py-16 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-800 px-6 pb-12 pt-14 text-center text-white shadow-float">
            <h2 className="text-3xl font-bold sm:text-4xl">
              <Say t={LANDING.cta.title} />
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              <Say t={LANDING.cta.body} />
            </p>
            {whatsapp && (
              <div className="mt-7 flex justify-center">
                <a
                  href={whatsapp}
                  className="inline-flex items-center gap-2 rounded-xl bg-card px-6 py-3 font-semibold text-brand-700 shadow-raised transition hover:bg-white"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  <Say t={LANDING.cta.whatsapp} />
                </a>
              </div>
            )}
          </div>
        </section>
      </main>

      <StickyCta whatsapp={whatsapp} />
      <BackToTop />
      <MobileMenu items={NAV} whatsapp={whatsapp} />
      <SiteFooter
        labels={{
          poweredBy: <Say t={LANDING.footer.poweredBy} />,
          privacy: <Say t={LANDING.footer.privacy} />,
          terms: <Say t={LANDING.footer.terms} />,
          refund: <Say t={LANDING.footer.refund} />,
          contact: <Say t={LANDING.footer.contact} />,
        }}
      />
    </div>
  );
}
