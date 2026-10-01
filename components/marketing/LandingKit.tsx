/**
 * The public pages' building blocks: the landing page at `/` and the page for
 * each kind of business at `/<slug>` (see `lib/business-types.ts`).
 *
 * Moved out of `app/page.tsx` on 2026-09-27 when the business pages arrived,
 * unchanged, so every public page has the same bar, the same widths, the same
 * section rhythm and the same phone frames — a visitor clicking from the home
 * page to "Sweet shops" must not feel they have left the site.
 *
 * Server components throughout. Screenshot files are looked for at build time.
 */

import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { WhatsAppIcon } from '@/components/ui/Icon';
import { BRAND_LOGO, BRAND_NAME, BRAND_WORDMARK } from '@/lib/brand';
import { LANDING, type Words } from '@/lib/marketing-copy';
import { LOCALES } from '@/lib/i18n';
import { firstExisting, versionedSrc } from '@/lib/landing-media-files';
import { LangSelect } from './LangTabs';
import { Say } from './Say';
import { SectionNav, type NavItem } from './SectionNav';
import { PhoneFrame } from './PhoneFrame';

/**
 * THREE WIDTHS, ON PURPOSE (27 Sep, by request: "too narrow", and the bar,
 * the banner and the body should not share one box). The bar runs edge to
 * edge; the banner is the widest block; the body reads a little narrower so
 * lines of text stay comfortable on a big monitor.
 */
export const HEADER_BOX = 'flex w-full items-center gap-4 px-5 py-3 sm:px-8 lg:px-10';
export const HERO_BOX = 'mx-auto w-full max-w-[110rem] px-5 sm:px-8 lg:px-10';
export const BODY_BOX = 'mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-10';

export function Section({
  id,
  tone = 'plain',
  children,
}: {
  id?: string;
  /** Alternating grounds, so a long page has landmarks. */
  tone?: 'plain' | 'card' | 'tint' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={clsx(
        'scroll-mt-20 py-16 sm:py-24',
        tone === 'card' && 'bg-card',
        tone === 'tint' && 'border-y border-brand-100 bg-cream',
        tone === 'dark' && 'relative overflow-hidden bg-brand-800 text-white',
      )}
    >
      <div className={clsx('relative', BODY_BOX)}>{children}</div>
    </section>
  );
}

/** Eyebrow, title, lead — the same three parts at the same sizes, every time. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  align = 'center',
  tone = 'light',
}: {
  eyebrow: Words;
  title: Words;
  lead?: Words;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <div className={align === 'center' ? 'mx-auto max-w-4xl text-center' : 'max-w-3xl'}>
      <span
        className={clsx(
          'inline-flex rounded-full px-3 py-1 text-base font-bold uppercase tracking-[0.12em]',
          // The logo's red marks the label; the green carries the heading.
          dark ? 'bg-white/15 text-white' : 'bg-accent-50 text-accent-700',
        )}
      >
        <Say t={eyebrow} />
      </span>
      <h2 className={clsx('mt-3 text-3xl font-bold leading-tight sm:text-4xl', dark ? 'text-white' : 'text-slate-900')}>
        <Say t={title} />
      </h2>
      {lead && (
        <p className={clsx('mt-3 text-lg leading-relaxed', dark ? 'text-white/75' : 'text-slate-600')}>
          <Say t={lead} />
        </p>
      )}
    </div>
  );
}

/**
 * The top bar: the logo home, the section links, the language switch, sign in
 * and the trial button. The logo's shop-front green.
 */
export function LandingHeader({ nav, whatsapp }: { nav: NavItem[]; whatsapp: string | null }) {
  return (
    <header className="sticky top-0 z-30 bg-brand-900 shadow-raised">
      <div className={HEADER_BOX}>
        <Link href="/" aria-label={`${BRAND_NAME} — home`} className="inline-flex shrink-0 items-center gap-2.5">
          <span className="inline-flex rounded-xl bg-white p-1">
            <Image
              src={BRAND_LOGO.master}
              alt=""
              width={468}
              height={468}
              priority
              sizes="40px"
              className="h-9 w-9 sm:h-10 sm:w-10"
            />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            {BRAND_WORDMARK.head}
            <span className="text-accent-400">{BRAND_WORDMARK.tail}</span>
          </span>
        </Link>
        <SectionNav items={nav} className="ml-auto hidden items-center gap-1 lg:flex" />
        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          {/* The language switch lives here, not in the hero. On a phone it
              is inside the menu. */}
          <div className="hidden sm:block">
            <LangSelect />
          </div>
          <Link
            href="/admin"
            className="hidden min-h-10 items-center rounded-xl px-3 text-base font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            <Say t={LANDING.adminSignIn} />
          </Link>
          {whatsapp && (
            <a
              href={whatsapp}
              className="hidden min-h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-base font-semibold text-white transition hover:bg-brand-700 sm:inline-flex"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <Say t={LANDING.getYourShop} />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * A phone screenshot in a phone frame, per language.
 *
 * `pathFor(lang)` names the file for each language; the page shows the
 * reader's, falling back to the English one, and a branded tile of the same
 * shape when none exists yet — so the layout never changes when a picture
 * arrives.
 */
export function PhoneShot({
  pathFor,
  alt,
  label,
  Icon,
}: {
  pathFor: (lang: string) => string;
  alt: string;
  label: Words;
  Icon: (props: { className?: string }) => React.ReactElement;
}) {
  const english = firstExisting(pathFor('en'));
  const byLang = LOCALES.map((lang) => ({ lang, src: firstExisting(pathFor(lang)) ?? english }));
  const picture = (src: string) => (
    <Image
      src={versionedSrc(src)}
      alt={alt}
      fill
      quality={90}
      sizes="(max-width: 640px) 85vw, 27rem"
      className="object-cover object-top"
    />
  );
  return (
    <figure>
      <PhoneFrame>
        {english ? (
          byLang.every((entry) => entry.src === english) ? (
            picture(english)
          ) : (
            // All three in the HTML; the page's language shows one (see `Say`).
            // Hidden ones are `display: none`, so a lazy image is never fetched.
            byLang.map(({ lang, src }) => (
              <span key={lang} lang={lang} data-l={lang} className="absolute inset-0">
                {picture(src!)}
              </span>
            ))
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-brand-50 via-card to-accent-50/40 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-raised">
              <Icon className="h-8 w-8" />
            </span>
            <span className="text-base font-semibold text-brand-800">
              <Say t={label} />
            </span>
          </div>
        )}
      </PhoneFrame>
    </figure>
  );
}
