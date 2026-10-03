import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import {
  BellIcon,
  BoxIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  InstallIcon,
  MicIcon,
  PhoneIcon,
  QrIcon,
  RupeeIcon,
  TruckIcon,
  UsersIcon,
  WhatsAppIcon,
} from '@/components/ui/Icon';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { BackToTop } from '@/components/marketing/BackToTop';
import { MobileMenu } from '@/components/marketing/MobileMenu';
import { BRAND_NAME } from '@/lib/brand';
import {
  FAQ,
  FEATURES,
  LANDING,
  MORE,
  PLAN_INCLUDES,
  SAFETY,
  planItemsLine,
  planTagline,
  yearLine,
  type FeatureId,
  type MoreId,
  type Words,
} from '@/lib/marketing-copy';
import { HERO_VIDEO, VIDEOS, screenPath, youtubeId, type ScreenId } from '@/lib/landing-media';
import { LANDING_DEFAULT_LANG, type Locale } from '@/lib/i18n';
import { firstExisting } from '@/lib/landing-media-files';
import { LandingLanguage } from '@/components/marketing/LangTabs';
import { Say } from '@/components/marketing/Say';
import { StepList } from '@/components/marketing/StoryLists';
import type { NavItem } from '@/components/marketing/SectionNav';
import { StickyCta } from '@/components/marketing/StickyCta';
import { MarketingAnalytics } from '@/components/marketing/MarketingAnalytics';
import { VideoPlayer } from '@/components/marketing/VideoPlayer';
import { BusinessGrid } from '@/components/marketing/BusinessGrid';
import { HERO_BOX, LandingHeader, PhoneShot, Section, SectionHead } from '@/components/marketing/LandingKit';
import { PLAN_ORDER, PLAN_SPECS, TRIAL_DAYS, yearPrice, yearSaving } from '@/lib/plans';
import { baseUrl } from '@/lib/qr';
import { supportDetails } from '@/lib/support';

/**
 * THE PUBLIC LANDING PAGE — rewritten 2026-09-27, by request.
 *
 * What changed, and why:
 * - The hero says what the product is in one plain sentence, with a video
 *   beside it (`lib/landing-media.ts`). The old headline was the Bengali voice
 *   command itself, which only made sense to somebody who already knew the app,
 *   and the animated phone beside it rendered small and blurry.
 * - The language tabs left the hero. The switch is in the top bar (and the
 *   phone menu), where it changes the whole page just the same.
 * - Every feature has its own band with a screenshot slot. Screenshots and
 *   videos are listed in `lib/landing-media.ts`; files go under
 *   `public/landing/`.
 * - The "every plan includes" box under the prices is gone; the features
 *   section says it once, and the listing offer became an FAQ answer.
 * - The copy is original, plain and professional (`lib/marketing-copy.ts`).
 *
 * The root layout marks everything `noindex`; this page opts back in.
 * Everything below is a server component, prerendered at build time, which is
 * also when the screenshot files are looked for.
 */

const TITLE = `${BRAND_NAME} — Shop Management App for Every Local Business | QR Orders, Khata & Billing`;
const DESCRIPTION = `Take daily and bulk orders ahead by QR code and bill the counter crowd fast — for grocery stores, sweet shops, meat and fish shops, stationery and more: digital khata, counter billing and bills on WhatsApp. One plan, ₹${PLAN_SPECS[PLAN_ORDER[0]!].price} a month. Zero commission. ${TRIAL_DAYS}-day free trial.`;


export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'kirana store app',
    'grocery shop billing app',
    'daily order app for shops',
    'counter billing app',
    'sweet shop billing app',
    'small business app India',
    'local shop online store',
    'digital khata',
    'udhaar khata app',
    'QR code ordering',
    'online store for local shops',
    'WhatsApp bill',
    'shop management app India',
    'inventory app for small shops',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    title: `${BRAND_NAME} — Orders, khata and billing for your shop`,
    description: DESCRIPTION,
    type: 'website',
    url: '/',
    siteName: BRAND_NAME,
    locale: 'bn_IN',
    alternateLocale: ['en_IN', 'hi_IN'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_NAME} — Orders, khata and billing for your shop`,
    description: DESCRIPTION,
  },
};

/** The icon a screenshot slot shows until its picture exists. */
const SCREEN_ICONS: Record<ScreenId, (props: { className?: string }) => React.ReactElement> = {
  products: BoxIcon,
  storefront: QrIcon,
  orders: BellIcon,
  khata: UsersIcon,
  billing: RupeeIcon,
  stock: TruckIcon,
  reports: ChartIcon,
  setup: QrIcon,
};

/**
 * A phone screenshot in a phone frame — the file from `SCREENS` if it has been
 * added, else a branded tile of the same shape, so the layout never changes
 * when a picture arrives. See `PhoneShot`.
 */
function ScreenShot({ id, alt, label }: { id: ScreenId; alt: string; label: Words }) {
  return <PhoneShot pathFor={(lang) => screenPath(lang as Locale, id)} alt={alt} label={label} Icon={SCREEN_ICONS[id]} />;
}

/** The icon on each of the smaller features. */
const MORE_ICONS: Record<MoreId, (props: { className?: string }) => React.ReactElement> = {
  today: CalendarIcon,
  simple: PhoneIcon,
  install: InstallIcon,
  languages: UsersIcon,
  readback: MicIcon,
  delivery: TruckIcon,
  broadcast: WhatsAppIcon,
  payments: RupeeIcon,
};

/** What each feature's screenshot shows, for screen readers and search. */
const SCREEN_ALT: Record<FeatureId, string> = {
  products: `${BRAND_NAME} product list, with items added by voice and photo`,
  storefront: `A customer's view of the shop's online store, opened from its QR code`,
  orders: `${BRAND_NAME} orders screen with a new order alert`,
  khata: `${BRAND_NAME} digital khata with each customer's credit balance`,
  billing: `${BRAND_NAME} counter billing screen`,
  stock: `${BRAND_NAME} stock and restock list`,
  reports: `${BRAND_NAME} daily takings, split into cash, UPI and credit`,
};

/** Search-engine structured data: the product, its prices and the FAQ. */
function StructuredData() {
  const site = baseUrl();
  const prices = PLAN_ORDER.map((id) => PLAN_SPECS[id].price);
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: BRAND_NAME,
        url: site,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Android, iOS, Web browser',
        description: DESCRIPTION,
        inLanguage: ['en', 'bn', 'hi'],
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: Math.min(...prices),
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((entry) => ({
          '@type': 'Question',
          name: entry.q.en,
          acceptedAnswer: { '@type': 'Answer', text: entry.a.en },
        })),
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // Built from our own constants, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

/** Where the top bar jumps to, in page order. */
const NAV: NavItem[] = [
  { href: '#businesses', label: LANDING.nav.businesses },
  { href: '#features', label: LANDING.nav.features },
  { href: '#videos', label: LANDING.nav.videos },
  { href: '#how', label: LANDING.nav.how },
  { href: '#plans', label: LANDING.nav.plans },
  { href: '#faq', label: LANDING.nav.faq },
];

export default function LandingPage() {
  const support = supportDetails();
  const plans = PLAN_ORDER.map((id) => PLAN_SPECS[id]);
  const whatsapp = support.phone
    ? `https://wa.me/91${support.phone}?text=${encodeURIComponent(
        `Hello, I would like to start a ${BRAND_NAME} free trial for my shop. Shop name: `,
      )}`
    : null;
  const heroVideo = youtubeId(HERO_VIDEO.youtube);

  return (
    // THE ROOT CARRIES THE LANGUAGE: `data-lang` is set on it by the script
    // `LandingLanguage` renders, before paint — see `app/globals.css`.
    <div data-landing="" data-lang={LANDING_DEFAULT_LANG} suppressHydrationWarning className="flex min-h-dvh flex-col bg-card">
      <LandingLanguage />
      <MarketingAnalytics />
      <StructuredData />
      <span id="top" tabIndex={-1} className="sr-only" />

      {/* The logo's shop-front green. (A red-and-white awning stripe along
          its bottom edge was tried and removed on 27 Sep: it looked busy.) */}
      <LandingHeader nav={NAV} whatsapp={whatsapp} />

      <main className="flex-1">
        {/* ==================================================================
            HERO — what it is, in one sentence, and a video that shows it.
            ================================================================== */}
        <section className="relative overflow-hidden bg-cream">
          {/* The logo's two colours as soft light behind the banner. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-200/45 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full bg-accent-100/50 blur-3xl"
          />
          <div className={clsx('relative grid items-center gap-12 pb-28 pt-12 sm:pt-16 lg:grid-cols-[1fr_1.15fr] lg:gap-20 lg:pb-32', HERO_BOX)}>
            <div className="text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-base font-semibold text-accent-700 shadow-raised ring-1 ring-accent-100">
                <span aria-hidden className="h-2 w-2 rounded-full bg-accent-500" />
                <Say t={LANDING.hero.eyebrow} />
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.22] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
                <Say t={LANDING.hero.headline} />
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-700 lg:mx-0">
                <Say t={LANDING.hero.lead} />
              </p>

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
                <a
                  href="#videos"
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-card px-6 py-3.5 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
                    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.01-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
                  </svg>
                  <Say t={LANDING.hero.watch} />
                </a>
              </div>

              <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-2 text-left text-base text-slate-700 sm:flex sm:flex-wrap sm:justify-center lg:justify-start">
                {LANDING.hero.checks.map((line) => (
                  <li key={line.en} className="inline-flex items-center gap-1.5">
                    <CheckIcon className="h-4 w-4 shrink-0 text-brand-600" />
                    <Say t={line} />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <VideoPlayer
                videoId={heroVideo}
                thumb={firstExisting(HERO_VIDEO.thumb)}
                title={HERO_VIDEO.title}
                size="hero"
                priority
                autoplay
              />
            </div>
          </div>
        </section>

        {/* The four numbers, on a card that straddles the fold. */}
        <div className={clsx('relative z-10 -mt-16', HERO_BOX)}>
          <dl className="grid grid-cols-2 gap-4 rounded-3xl border border-brand-100 bg-card p-5 shadow-float lg:grid-cols-4 lg:p-7">
            {LANDING.stats.map((stat) => (
              <div key={stat.label.en} className="px-1">
                <dd
                  className={clsx(
                    'text-3xl font-bold tabular-nums lg:text-4xl',
                    stat.accent ? 'text-accent-600' : 'text-brand-700',
                  )}
                >
                  <Say t={stat.value} />
                </dd>
                <dt className="mt-1 text-base leading-snug text-slate-600 sm:text-base">
                  <Say t={stat.label} />
                </dt>
              </div>
            ))}
          </dl>
        </div>

        {/* ==================================================================
            FOR EVERY KIND OF SHOP — each card opens that business's own page.
            Halkhata is not a grocery app; this is where the page says so.
            ================================================================== */}
        <Section id="businesses">
          <SectionHead
            eyebrow={LANDING.businesses.eyebrow}
            title={LANDING.businesses.title}
            lead={LANDING.businesses.lead}
          />
          <BusinessGrid className="mt-12" />
        </Section>

        {/* ==================================================================
            FEATURES — one band each: the words on one side, the screen on the
            other, alternating so the page reads as a walk through the app.
            ================================================================== */}
        <Section id="features" tone="card">
          <SectionHead
            eyebrow={LANDING.features.eyebrow}
            title={LANDING.features.title}
            lead={LANDING.features.lead}
          />
          <div className="mt-14 space-y-20 sm:space-y-24">
            {FEATURES.map((feature, index) => (
              <article
                key={feature.id}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <div className={clsx(index % 2 === 1 && 'lg:order-2')}>
                  <span className="text-base font-bold uppercase tracking-[0.12em] text-accent-600">
                    <Say t={feature.eyebrow} />
                  </span>
                  <h3 className="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                    <Say t={feature.title} />
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-slate-600">
                    <Say t={feature.lead} />
                  </p>
                  <ul className="mt-6 space-y-3">
                    {feature.points.map((point) => (
                      <li key={point.en} className="flex gap-3 text-base leading-relaxed text-slate-700">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                          <CheckIcon className="h-4 w-4" />
                        </span>
                        <Say t={point} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={clsx('relative', index % 2 === 1 && 'lg:order-1')}>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-100/70 blur-3xl"
                  />
                  <div className="relative">
                    <ScreenShot id={feature.id} alt={SCREEN_ALT[feature.id]} label={feature.eyebrow} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>

        {/* The smaller things, as a compact grid. */}
        <Section tone="tint">
          <SectionHead eyebrow={LANDING.more.eyebrow} title={LANDING.more.title} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MORE.map((item) => {
              const Icon = MORE_ICONS[item.id];
              return (
                <div key={item.id} className="rounded-2xl border border-brand-100 bg-card p-5 shadow-raised">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-bold text-slate-900">
                    <Say t={item.title} />
                  </h3>
                  <p className="mt-1 text-base leading-relaxed text-slate-600">
                    <Say t={item.body} />
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ==================================================================
            VIDEOS — landscape cards, each a thumbnail that plays in place.
            ================================================================== */}
        <Section id="videos" tone="dark">
          <SectionHead
            tone="dark"
            eyebrow={LANDING.videos.eyebrow}
            title={LANDING.videos.title}
            lead={LANDING.videos.lead}
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VIDEOS.map((video) => (
              <article key={video.id}>
                <VideoPlayer videoId={youtubeId(video.youtube)} thumb={firstExisting(video.thumb)} title={video.title} />
                <h3 className="mt-3 font-semibold text-white">
                  <Say t={video.title} />
                </h3>
                <p className="mt-0.5 text-base text-white/70">
                  <Say t={video.blurb} />
                </p>
              </article>
            ))}
          </div>
        </Section>

        {/* ==================================================================
            HOW IT WORKS — four steps, and the QR poster the shop ends up with.
            ================================================================== */}
        {/* HOW IT WORKS — the four steps as an infographic, the section's
            own picture (27 Sep, by request). */}
        <Section id="how">
          <SectionHead eyebrow={LANDING.how.eyebrow} title={LANDING.how.title} lead={LANDING.how.lead} />
          <div className="mx-auto mt-14 max-w-7xl rounded-3xl border border-brand-100 bg-card px-6 py-10 shadow-raised sm:px-10 lg:py-14">
            <StepList />
            {whatsapp && (
              <div className="mt-12 flex justify-center">
                <a
                  href={whatsapp}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-bold text-white shadow-float transition hover:bg-brand-700"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  <Say t={LANDING.getYourShop} />
                </a>
              </div>
            )}
          </div>
        </Section>

        {/* The promises that decide trust, in plain words. */}
        <Section tone="tint">
          <SectionHead eyebrow={LANDING.trust.eyebrow} title={LANDING.trust.title} />
          <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2">
            {SAFETY.map((line) => (
              <div key={line.en} className="flex gap-3 rounded-2xl border border-brand-100 bg-card p-5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <p className="text-base leading-relaxed text-slate-700">
                  <Say t={line} />
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ==================================================================
            PRICING — read off `PLAN_SPECS`, never retyped.
            ================================================================== */}
        <Section id="plans">
          <SectionHead eyebrow={LANDING.plans.eyebrow} title={LANDING.plans.title} lead={LANDING.plans.lead} />
          {/* ONE PLAN (2026-09-27). The card, and beside it the one other
              answer there is: a small counter can ask for a custom price. */}
          <div className="mx-auto mt-12 grid max-w-6xl items-stretch gap-5 lg:grid-cols-[1.35fr_1fr]">
            {plans.map((plan) => {
              const year = yearLine(
                yearPrice(plan.id).toLocaleString('en-IN'),
                yearSaving(plan.id).toLocaleString('en-IN'),
              );
              return (
                <div
                  key={plan.id}
                  className="relative flex flex-col rounded-3xl bg-brand-600 p-6 text-white shadow-float sm:p-8"
                >
                  <span className="absolute -top-3 left-6 whitespace-nowrap rounded-full bg-accent-600 px-3 py-1 text-base font-bold uppercase tracking-wide text-white shadow-raised">
                    <Say t={LANDING.plans.popular} />
                  </span>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="mt-2 text-5xl font-bold tabular-nums text-white">
                    &#8377;{plan.price}
                    <span className="text-base font-normal text-white/75">
                      <Say t={LANDING.plans.perMonth} />
                    </span>
                  </p>
                  <p className="mt-2 text-base font-bold tabular-nums text-brand-100">
                    <Say t={year.price} />
                    <span className="font-normal text-white/75">
                      <Say t={year.save} />
                    </span>
                  </p>
                  <p className="mt-1.5 text-base text-white/85">
                    <Say t={LANDING.plans.setupLine} />
                  </p>
                  <p className="mt-4 border-t border-white/20 pt-4 text-base font-bold text-white">
                    <Say t={planItemsLine(plan.id)} />
                    <span className="font-normal text-white/80">
                      {' · '}
                      <Say t={planTagline(plan.id)} />
                    </span>
                  </p>
                  <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {PLAN_INCLUDES.map((line) => (
                      <li key={line.en} className="flex gap-2 text-base leading-snug text-white/90">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-100" />
                        <Say t={line} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <div className="flex flex-col rounded-3xl border border-brand-100 bg-card p-6 shadow-raised sm:p-8">
              <h3 className="text-lg font-bold text-slate-900">
                <Say t={LANDING.plans.customTitle} />
              </h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                <Say t={LANDING.plans.customBody} />
              </p>
              {whatsapp && (
                <a
                  href={whatsapp}
                  className="mt-6 inline-flex items-center justify-center gap-2 self-start rounded-xl border border-brand-200 bg-card px-5 py-3 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <Say t={LANDING.plans.customCta} />
                </a>
              )}
            </div>
          </div>
        </Section>

        {/* FAQ — a native accordion: no JavaScript, keyboard-friendly. */}
        <Section id="faq" tone="tint">
          <SectionHead eyebrow={LANDING.faq.eyebrow} title={LANDING.faq.title} />
          <div className="mx-auto mt-10 max-w-5xl space-y-3">
            {FAQ.map((entry) => (
              <details key={entry.q.en} className="group rounded-2xl border border-brand-100 bg-card px-5 py-4">
                <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                  <span>
                    <Say t={entry.q} />
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-xl leading-none text-brand-600 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  <Say t={entry.a} />
                </p>
              </details>
            ))}
          </div>
        </Section>

        {/* The last call to action. */}
        <section className="px-5 py-16 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-800 px-6 pb-12 pt-14 text-center text-white shadow-float">
            <h2 className="text-3xl font-bold sm:text-4xl">
              <Say t={LANDING.cta.title} />
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              <Say t={LANDING.cta.body} />
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {whatsapp && (
                <a
                  href={whatsapp}
                  className="inline-flex items-center gap-2 rounded-xl bg-card px-6 py-3 font-semibold text-brand-700 shadow-raised transition hover:bg-white"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  <Say t={LANDING.cta.whatsapp} />
                </a>
              )}
              {support.phone && (
                <a
                  href={`tel:+91${support.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
                >
                  <PhoneIcon className="h-5 w-5" />
                  {support.phone}
                </a>
              )}
            </div>
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
