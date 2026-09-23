import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { SavedShops } from '@/components/customer/SavedShops';
import {
  BellIcon,
  BoxIcon,
  CartIcon,
  ChartIcon,
  CheckIcon,
  MicIcon,
  PdfIcon,
  PhoneIcon,
  QrIcon,
  RupeeIcon,
  UsersIcon,
  WhatsAppIcon,
} from '@/components/ui/Icon';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { BackToTop } from '@/components/marketing/BackToTop';
import { MobileMenu } from '@/components/marketing/MobileMenu';
import { BRAND_LOGO, BRAND_NAME, BRAND_WORDMARK } from '@/lib/brand';
import { SAFETY } from '@/lib/marketing-copy';
import { LangTabs } from '@/components/marketing/LangTabs';
import { ProblemList, StepList } from '@/components/marketing/StoryLists';
import { HeroJourney } from '@/components/marketing/HeroJourney';
import { SectionNav } from '@/components/marketing/SectionNav';
import { StickyCta } from '@/components/marketing/StickyCta';
import {
  AUTO_PAUSE_DAYS,
  EVERY_PLAN_INCLUDES,
  LISTING_PAISE_PER_ITEM,
  PLAN_ORDER,
  PLAN_SPECS,
  TRIAL_DAYS,
  planItems,
  yearPrice,
  yearSaving,
} from '@/lib/plans';
import { formatPaise } from '@/lib/money';
import { supportDetails } from '@/lib/support';

/**
 * THE ONE PAGE THIS BUSINESS WANTS FOUND, and until now the only one it had
 * shut out.
 *
 * The root layout marks everything `noindex` so that shops, orders and the
 * console cannot leak into search — a sound default — and each public page opts
 * itself back in. `/pricing` already did. This one never did, so the landing
 * page, the headline the whole positioning rests on, could not appear on Google
 * at all while the page listing the prices could.
 */
export const metadata: Metadata = {
  title: `${BRAND_NAME} — speak your shop online, khata and all`,
  description:
    'A kirana runs on a voice, a QR and a notebook. Halkhata lists your items by speaking, takes orders from a QR at your counter, and keeps the udhaar khata — one price a month, no commission on any order.',
  robots: { index: true, follow: true },
  openGraph: {
    title: `${BRAND_NAME} — speak your shop online`,
    description:
      'Voice cataloguing in Bangla, Hindi and English. QR ordering. Udhaar khata. No commission.',
    type: 'website',
  },
};

/* ==========================================================================
 * THE PAGE'S OWN SMALL DESIGN SYSTEM.
 *
 * A landing page is one long column of sections, and the thing that makes it
 * read as designed rather than as a pile is that every section is built the
 * same way: the same rhythm down the page, the same three-part heading, the
 * same card. Before, each section invented its own spacing and its own heading
 * size, which is exactly what "not well organised" looks like from the outside.
 *
 * So the rhythm is stated once, here, and nothing below sets its own padding.
 * ======================================================================== */

/** One band of the page. `tone` alternates the ground so sections separate. */
function Section({
  id,
  tone = 'plain',
  children,
}: {
  id?: string;
  /**
   * The ground this band sits on.
   *
   * THREE GROUNDS, ALTERNATING, and that is what stops a long page reading as
   * one undifferentiated document. Every section used to be the same grey with
   * the same white cards on it, so eight screens of scrolling had no landmarks
   * in them at all — a reader could not tell they had moved. `card` is the
   * pale band, `plain` the page's own tint, and `dark` the brand panel that
   * the screenshots are shown against.
   */
  tone?: 'plain' | 'card' | 'tint' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={clsx(
        'scroll-mt-24 py-20 sm:py-24',
        tone === 'card' && 'bg-card',
        tone === 'tint' && 'border-y border-brand-100 bg-cream',
        tone === 'dark' && 'relative overflow-hidden bg-brand-600 text-white',
      )}
    >
      <div className="relative mx-auto max-w-[100rem] px-5 sm:px-8 lg:px-12">{children}</div>
    </section>
  );
}

/**
 * Eyebrow, title, lead — in that order, at that size, every time.
 *
 * `align` is the only variation, because a grid of cards wants a left-aligned
 * heading and a single column wants a centred one, and picking per section is
 * how a page ends up with five different heading treatments.
 */
function SectionHead({
  eyebrow,
  title,
  lead,
  align = 'left',
  tone = 'light',
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  align?: 'left' | 'center';
  /** `dark` for a heading sitting on the brand panel. */
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {/* THE EYEBROW IS A PILL, not four faint grey capitals. Small, low
          contrast, letter-spaced type is the single most skippable thing a
          page can put above a heading, and this page is read at arm's length
          on somebody else's phone. A filled chip is a shape the eye finds
          before it reads anything. */}
      <span
        className={clsx(
          'inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]',
          dark ? 'bg-white/15 text-brand-100' : 'bg-brand-50 text-brand-700',
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={clsx(
          'mt-3 text-3xl font-bold leading-tight sm:text-[2.5rem]',
          dark ? 'text-white' : 'text-slate-900',
        )}
      >
        {title}
      </h2>
      {lead && (
        <p className={clsx('mt-3 text-lg leading-relaxed', dark ? 'text-white/75' : 'text-slate-600')}>
          {lead}
        </p>
      )}
    </div>
  );
}

/**
 * A real screen from the product, in a phone.
 *
 * NO STOCK PHOTOGRAPHY OF SMILING SHOPKEEPERS. A stock photo says a designer
 * was here; a screenshot says the thing exists. These are the same images the
 * console's product tour uses — `public/tour/`, 780×1688 — so they are already
 * kept current, and the page gets better every time somebody retakes one.
 */
function PhoneShot({
  src,
  alt,
  caption,
  priority = false,
}: {
  src: string;
  alt: string;
  caption: string;
  priority?: boolean;
}) {
  return (
    <figure className="flex flex-col items-center">
      <div className="w-full max-w-[15rem] overflow-hidden rounded-[1.75rem] border-[6px] border-slate-800 bg-slate-800 shadow-raised">
        <Image
          src={src}
          alt={alt}
          width={780}
          height={1688}
          priority={priority}
          sizes="(max-width: 640px) 60vw, 240px"
          className="h-auto w-full rounded-[1.25rem]"
        />
      </div>
      {/* `currentColor`, so one component serves the pale band and the dark
          one — the caption takes the colour of whatever section it is in. */}
      <figcaption className="mt-3 text-center text-base font-medium opacity-80">
        {caption}
      </figcaption>
    </figure>
  );
}

/**
 * An illustration beside a heading, in a frame of a fixed shape.
 *
 * THE FRAME IS THE POINT. These drawings arrive square, about 1100px, with a
 * generous margin of empty cream around the subject — which is right for the
 * file and wrong for the page. Dropped into a column next to a three-line
 * heading, a square opens a hole half a screen tall: the heading sits at the
 * top of its column, the picture runs on past the bottom of it, and the reader
 * scrolls through a band of nothing to reach the cards underneath.
 *
 * So the picture is cropped to a landscape frame by `object-cover` instead of
 * being allowed to set the row's height. The subject stays; the empty margin —
 * the part that was costing the space — is what gets cut. The row is then as
 * tall as the heading, which is how tall it should have been.
 */
function SectionArt({
  src,
  alt,
  caption,
  className,
}: {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={clsx('w-full max-w-sm lg:justify-self-end', className)}>
      <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-brand-100 bg-cream shadow-raised">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 70vw, 24rem"
          /* COVER, AND THE FILES ARE CUT TO MATCH. Each drawing in
             `public/marketing/` is saved at exactly 5:4 with the faces inside
             the frame, so cover has nothing left to crop. Do not drop a square
             illustration in here without cutting it first: cover takes its
             crop off the top, and the top is where the faces are. */
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-base text-slate-600">{caption}</figcaption>
      )}
    </figure>
  );
}

/**
 * The illustrations, and what each one is for.
 *
 * GENERATED, NOT PHOTOGRAPHED, AND NOT STOCK. A stock photograph of a grocery
 * shop is overwhelmingly a Western supermarket aisle — bright ceilings, long
 * refrigerated runs, trolleys — and putting that on a product built for a
 * counter shop in Dum Dum tells a shopkeeper in one glance that it was not made
 * for them. These were drawn to the brand's own three colours instead: the
 * green, the awning red and the cream, with a red-and-white awning over the
 * shop exactly as the logo has.
 *
 * They live in `public/marketing/`, at 1200px and around 200–300KB each, which
 * is the size they are actually drawn at on a laptop and twice what a phone
 * needs. This page is read on rural 4G; an illustration that costs a second of
 * loading has spent more than it is worth.
 */
const ART = {
  shop: {
    src: '/marketing/shop.png',
    alt: 'A busy kirana shop under a red and white awning — shelves of jars and packets, sacks of pulses, the owner serving at the counter and a queue of customers waiting, one of them scanning the QR card',
  },
  owner: {
    src: '/marketing/owner.png',
    alt: 'A shop owner in a green apron speaking into his phone',
  },
  customer: {
    src: '/marketing/customer.png',
    alt: 'A customer at a kirana shop counter scanning the shop’s QR card with her phone while the owner serves her, shelves of packets, jars and oil behind him',
  },
} as const;

/** Where the top bar jumps to, in the order the page answers questions. */
const NAV = [
  { href: '#what', label: 'What you get' },
  { href: '#how', label: 'How it works' },
  { href: '#why', label: 'Why shops switch' },
  { href: '#plans', label: 'Pricing' },
];

/**
 * What the product actually does, written as the job rather than the feature.
 *
 * NOTHING ASPIRATIONAL IS ALLOWED IN HERE. This page is the promise a QR poster
 * goes up next to, and every line below is a thing a shop can do this
 * afternoon. When something is built, it earns a card; until then it does not
 * get a sentence, however good the sentence would be.
 *
 * The Bengali line is the same point as the English, said the way a shopkeeper
 * would say it — not a translation of the marketing.
 */
const FEATURES: {
  icon: (props: { className?: string }) => React.ReactElement;
  title: string;
  bn: string;
  body: string;
}[] = [
  {
    icon: MicIcon,
    title: 'List by speaking',
    bn: 'বলে বলে তালিকা',
    body:
      'Say “চাল ১ কেজি ১০০” and the item is on your shop page with its price. Bangla, Hindi or English, in the shop, with the fan on. Nothing to type.',
  },
  {
    icon: BoxIcon,
    title: 'Five hundred items, already written',
    bn: 'চেনা জিনিস এক ট্যাপে',
    body:
      'The usual things a kirana carries come ready — named in three languages, with pack sizes and a starting price. Tick what you sell and correct the prices as you trade.',
  },
  {
    icon: QrIcon,
    title: 'A QR at your counter',
    bn: 'কাউন্টারে একটা QR',
    body:
      'Customers scan and see your shelf, in their own language. No app to install, no account to make, no login for anybody.',
  },
  {
    icon: BellIcon,
    title: 'Orders land in your app',
    bn: 'অর্ডার সোজা আপনার অ্যাপে',
    body:
      'The phone buzzes and a bell counts the new ones from every screen. The order waits until you look at it — nothing is lost because you were serving someone.',
  },
  {
    icon: UsersIcon,
    title: 'The udhaar khata',
    bn: 'বাকির খাতা',
    body:
      'Every customer has a running balance the app keeps. One number says what the whole para owes you, and who has owed it longest.',
  },
  {
    icon: RupeeIcon,
    title: 'Counter sales and the day’s cash',
    bn: 'দোকানের বিক্রি আর দিনের হিসাব',
    body:
      'The walk-in who buys two things and pays cash belongs in the same day’s total. Ring it up at the till and close the drawer at night.',
  },
  {
    icon: CartIcon,
    /**
     * THIS CARD USED TO SAY "SELL BY WEIGHT, NOT BY PACKET", WHICH WAS WRONG
     * ABOUT THE PRODUCT AND ABOUT THE SHOP.
     *
     * A kirana sells biscuits by the packet, matches by the box, oil by the
     * litre, greens by the bundle and rice by the kilo, and no shopkeeper
     * reading "not by packet" would recognise their own counter in it. What
     * the product actually does is take the unit the shop already uses — and
     * then let the things that CAN be divided be divided: see `isLooseUnit`
     * and `sellsAnyAmount`, where mass and volume split and counted goods do
     * not, because nothing can keep the 700 g left over from a packet.
     */
    title: 'Sold the way you already sell it',
    bn: 'যেভাবে বেচেন, সেভাবেই',
    body:
      'Kilo, gram, litre, ml, piece, packet, bottle or bundle — the pack size is whatever you use, and you can type one we have not thought of. What you weigh or pour can be asked for in any amount: posto priced by the kilo, sold as 50 g. What you count — a packet, a bottle, a bundle — sells whole.',
  },
  {
    icon: CheckIcon,
    title: 'What is finished, comes off',
    bn: 'শেষ হলে পাতা থেকে উঠে যায়',
    body:
      'One tap marks an item out of stock and customers stop being offered it. Keep counts if you want them, or leave it alone.',
  },
  {
    icon: ChartIcon,
    title: 'Reports you can read',
    bn: 'বোঝার মতো হিসাব',
    body:
      'What sold, what it earned, which para it went to, and what the festival week did. Enough to order stock with, not a dashboard to study.',
  },
  {
    icon: PdfIcon,
    title: 'A bill on WhatsApp',
    bn: 'হোয়াটসঅ্যাপে বিল',
    body:
      'Send a customer their bill or their whole khata as a PDF, and the delivery round to whoever is carrying it — from the phone already in your hand.',
  },
  {
    icon: PhoneIcon,
    title: 'Simple mode',
    bn: 'সহজ মোড',
    body:
      'For an owner who wants the till, the khata and nothing else on the screen. Everything still works; it is just not in the way.',
  },
  {
    icon: WhatsAppIcon,
    title: 'Your customers stay yours',
    bn: 'খদ্দের আপনারই থাকে',
    body:
      'Every order leaves a name and a number on your list, not a platform’s. No commission is taken from any order, however many you take.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Do my customers need to install anything?',
    a: 'No. They scan the QR with the camera they already have and your shop opens in the browser. No account, no download, no password.',
  },
  {
    q: 'Do I need a new phone?',
    a: `No. ${BRAND_NAME} runs in the browser on the phone you have, and you can keep it on your home screen like any other app. There is nothing to get from the Play Store.`,
  },
  {
    q: 'What if I cannot read?',
    a: 'You can list items by speaking, and the phone reads each one back to you, amounts and all. The screens an owner uses every day are built to be workable that way.',
  },
  {
    q: 'Do you take a cut of my orders?',
    a: `Never. One price a month for the shop, and nothing from an order. ${BRAND_NAME} does not handle your money at all — the customer pays you, in cash or straight into your own UPI.`,
  },
  {
    q: 'What happens if I stop paying?',
    a: `Nothing sudden. You are told before the period ends, item editing pauses a week later, and the shop goes on trading for ${AUTO_PAUSE_DAYS} days. After that the page closes to customers — and reopens the moment a payment is recorded. Nothing is ever deleted.`,
  },
  {
    q: 'Is my shop’s data mine?',
    a: 'Yes. Your items, your customers, your khata and your day’s takings belong to your shop, and the khata and the reports come out as PDF or CSV whenever you want them.',
  },
];

export default function LandingPage() {
  const support = supportDetails();
  // Read off the ladder in its own order, never retyped here.
  const plans = PLAN_ORDER.map((id) => PLAN_SPECS[id]);
  const whatsapp = support.phone
    ? `https://wa.me/91${support.phone}?text=${encodeURIComponent(
        `I want a ${BRAND_NAME} shop. My shop's name is `,
      )}`
    : null;

  return (
    <div className="flex min-h-dvh flex-col bg-card">
      {/* Where the back-to-top button sends the keyboard, so tabbing after it
          resumes at the top of the page rather than in the footer. */}
      <span id="top" tabIndex={-1} className="sr-only" />
      {/* THE BAR THAT SAYS THIS IS A PRODUCT AND NOT A SPLASH SCREEN.
          A page with one headline and two buttons reads as an app that is
          still loading. */}
      <header className="sticky top-0 z-30 bg-black">
        <div className="mx-auto flex max-w-[100rem] items-center gap-4 px-5 py-3 sm:px-8 lg:px-12">
          {/* THE MARK ON A SMALL WHITE TILE, THE NAME IN TYPE. The supplied
              lockup is drawn for a light ground: its dark green "Halk" all but
              vanishes on black, and putting the whole lockup on a white plate
              made a slab. Only the illustration needs the tile, the way an app
              icon has one. The name is set in white with "khata" in the
              logo's red, which reads on black where it would not on green. */}
          <Link
            href="/"
            aria-label={`${BRAND_NAME} — home`}
            className="inline-flex shrink-0 items-center gap-2.5"
          >
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
          {/* The section you are reading is marked as you scroll — see
              `SectionNav`. Four words that never change are decoration; a bar
              that answers "where am I in this page" is a map. */}
          <SectionNav items={NAV} className="ml-auto hidden items-center gap-2 lg:flex" />
          <div className="ml-auto flex items-center gap-2 lg:ml-6">
            <Link
              href="/admin"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Admin sign in
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Get your shop
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ==================================================================
            HERO — two columns, because one centred column of text with two
            buttons under it is a splash screen. The claim on the left, the
            product itself on the right: a landing page for something visual
            has to show the thing within the first screen.

            The headline is unchanged and must stay unchanged. It used to lead
            with "Scan → Select → Order", which is a true description of the
            product and a sentence every competitor can write without changing
            a word. What none of them ask a shopkeeper to do is talk. So the
            headline IS the demonstration: the exact sentence an owner says, in
            the script they think in.
            ================================================================== */}
        {/* ==================================================================
            THE HERO IS CREAM, NOT DEEP GREEN AND NOT WHITE.

            A banner painted in the dark brand green made the page look like
            enterprise software wearing an Indian logo, and it put the loudest
            colour on the page in the one place a reader has not agreed to
            anything yet. White was the other failure: a document. The cream
            (#f9f3eb) is the third colour of the identity and the one that does
            the most work — paper, a paper bag, the page of a khata — so the
            fold is unmistakably this brand without shouting, and the green and
            the red are left free to mark the things that matter.

            It was a light column on the same grey the rest of the page sits
            on, and the whole fold read as a document. The shops this is sold
            to are shown it on a phone, in a bazaar, by somebody holding it up
            — it has half a second to look like something, and a wall of grey
            does not survive that. So the fold is the brand at full strength:
            the deep green, the alpona of a Bengali threshold, and the product
            itself glowing against it.

            The headline is unchanged and must stay unchanged. It used to lead
            with "Scan → Select → Order", which is a true description of the
            product and a sentence every competitor can write without changing
            a word. What none of them ask a shopkeeper to do is talk. So the
            headline IS the demonstration: the exact sentence an owner says, in
            the script they think in.
            ================================================================== */}
        <section className="relative overflow-hidden bg-cream text-slate-900">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-200/45 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-accent-100/50 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-[100rem] items-center gap-12 px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-12 lg:pb-28">
            <div className="text-center lg:text-left">
              {/* THE BENGALI IS MARKED AS BENGALI, here and on every line
                  below it. The document is `lang="en"`, and a screen reader
                  handed Bengali script under an English `lang` reads it out in
                  English phonemes, which is unintelligible. It is also what
                  tells a search engine, and a browser's own translate prompt,
                  that this page is not only English. */}
              <p
                lang="bn"
                className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-raised ring-1 ring-brand-100"
              >
                <MicIcon className="h-4 w-4" />
                দোকান সাজান মুখে বলে
              </p>

              {/* Bigger than it was, and bigger than a web headline usually
                  is. This is read at arm's length on a phone held up by
                  somebody else, and it is Bengali, which needs the size more
                  than Latin does. */}
              <h1
                lang="bn"
                className="mt-5 text-[2.75rem] font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl"
              >
                &ldquo;চাল ১ কেজি ১০০&rdquo;
              </h1>

              <p lang="bn" className="mx-auto mt-5 max-w-md text-xl text-slate-800 lg:mx-0">
                বলুন — জিনিসটা দামসহ তালিকায় উঠে গেল, খদ্দের দেখতে পেল।
                <span className="mt-1 block text-lg text-slate-600">
                  বাংলা, হিন্দি বা ইংরেজিতে। টাইপ করতে হবে না।
                </span>
              </p>

              {/* The QR half, demoted to what it is: the second sentence. It
                  said "lands in your WhatsApp", which stopped being true when
                  the handoff was removed — orders land in the owner's own app
                  now, and saying otherwise sold a shopkeeper a flow they would
                  not find. */}
              <p className="mx-auto mt-5 max-w-lg text-slate-600 lg:mx-0">
                Customers scan the QR at your counter and the order lands in your
                app — with a bell that counts it from every screen. The khata,
                the till and the day’s cash are in the same place. No login, no
                training.
              </p>

              {/* On the cream the buttons are the brand at full strength —
                  green for the action, and a plain bordered one beside it. */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {whatsapp && (
                  <a
                    href={whatsapp}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-bold text-white shadow-float transition hover:bg-brand-700"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    <span lang="bn">দোকান খুলুন</span> · Get your shop
                  </a>
                )}
                <a
                  href="#plans"
                  className="rounded-xl border border-brand-200 bg-card px-6 py-3.5 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  <span lang="bn">দাম দেখুন</span> · See pricing
                </a>
              </div>

              {/* The four objections that decide it, answered before they are
                  asked. Every one is a fact about the product, not a boast. */}
              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-base text-slate-600 lg:justify-start">
                {[
                  `${TRIAL_DAYS} days free, no advance`,
                  'No commission, ever',
                  'Nothing to install',
                  'বাংলা · हिन्दी · English',
                ].map((line) => (
                  <li key={line} className="inline-flex items-center gap-1.5">
                    <CheckIcon className="h-4 w-4 text-brand-600" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* THE PRODUCT, PLAYING ITSELF, ON THE FIRST SCREEN.
                This was two still screenshots side by side. A still says
                "there is an app"; it cannot say that the owner SPEAKS the
                item, the customer SCANS the QR, the order ARRIVES and the
                khata ADDS ITSELF UP — which is the argument, and is a
                sequence. Somebody who watches one loop has understood the
                product without reading a word of English. */}
            <div className="relative">
              {/* A halo behind the phone, so the bezel has something to be dark
                  against and the screen reads as lit rather than pasted on. */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-200/40 blur-3xl"
              />
              <div className="relative">
                <HeroJourney />
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            THE NUMBERS, ON CARDS THAT STRADDLE THE FOLD.

            Four facts, at a size that can be read across a room, lifted onto
            the boundary between the green panel and the page so the two bands
            are stitched together rather than stacked. This is the one place on
            the page where a figure is allowed to be enormous: "0%" is the
            whole commercial argument and it deserves to be the biggest thing
            after the headline.
            ================================================================== */}
        <div className="relative z-10 mx-auto -mt-16 max-w-[100rem] px-5 sm:px-8 lg:px-12">
          <dl className="grid gap-3 rounded-3xl border border-brand-100 bg-card p-5 shadow-float sm:grid-cols-2 lg:grid-cols-4 lg:gap-5 lg:p-7">
            {[
              { value: '0%', label: 'commission on every order, on every plan' },
              { value: '500+', label: 'kirana items already named and priced' },
              { value: '3', label: 'languages the shop speaks — বাংলা, हिन्दी, English' },
              { value: `${TRIAL_DAYS} days`, label: 'of the top plan free, nothing paid up front' },
            ].map((stat) => (
              <div key={stat.label} className="px-2 py-1">
                <dd
                  className={clsx(
                    'text-3xl font-bold tabular-nums lg:text-4xl',
                    // The commission figure is the commercial argument, so it
                    // takes the mark's other colour and the eye finds it first.
                    stat.value === '0%' ? 'text-accent-600' : 'text-brand-700',
                  )}
                >
                  {stat.value}
                </dd>
                <dt className="mt-1 text-base leading-snug text-slate-600">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* ==================================================================
            THE SAFETY PROMISE, HIGH UP AND IN PLAIN WORDS.

            A shopkeeper being offered a shop app by a company they have not
            heard of is right to be suspicious, and everything above this is
            asking them to trust a stranger. The honest answer is not softer
            marketing: it is a list of the things a fraud would ask for and we
            do not. See `SAFETY` in `lib/marketing-copy.ts` — and keep it true.
            ================================================================== */}
        <section className="border-y border-glass-edge bg-card py-10">
          <div className="mx-auto max-w-[100rem] px-5 sm:px-8 lg:px-12">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SAFETY.map((line) => (
                <div key={line.en} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <p className="text-base leading-relaxed text-slate-700">
                    {line.en}
                    <span lang="bn" className="mt-1 block text-slate-500">
                      {line.bn}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        <Section id="what" tone="tint">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <SectionHead
              eyebrow="What you get"
              title="A shop’s whole counter, on the phone in your pocket"
              lead="Every plan includes all of it. The plans differ by how many items your shop lists, and by nothing else."
            />
            {/* The shop at its busiest — the counter with people at it, which
                is the state this product is for. An empty shop front is a
                picture of a building; a queue is a picture of a trade. */}
            <SectionArt src={ART.shop.src} alt={ART.shop.alt} className="mx-auto" />
          </div>

          {/* THE CARDS CARRY THEIR OWN COLOUR NOW.
              Twelve identical white boxes with twelve identical green tiles is
              a spreadsheet: the eye finds no way in and reads none of them.
              The tile colour walks down the brand's own ramp, which gives the
              grid a rhythm without introducing a second hue — and the card
              lifts and warms on hover, so a cursor has something to find. */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const tile = ['bg-brand-600', 'bg-brand-500', 'bg-brand-700'][i % 3];
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-brand-100 bg-card p-6 shadow-raised transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-float"
                >
                  <span
                    className={clsx(
                      'inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-raised transition group-hover:scale-105',
                      tile,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p lang="bn" className="mt-0.5 text-sm font-semibold text-brand-700">
                    {feature.bn}
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-slate-600">{feature.body}</p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ================================================================== */}
        {/* THE SCREENS GO ON THE DARK BAND, and this is the one section where
            the ground is doing real work rather than decorating. Every screen
            of this product is a pale card; four pale cards on a pale page are
            four grey rectangles. On the brand panel they are lit objects. */}
        <Section tone="dark">
          <SectionHead
            tone="dark"
            eyebrow="The real screens"
            title="Nothing here is a mock-up"
            lead="These are the screens a shop uses every day, photographed from a working shop."
            align="center"
          />
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            <PhoneShot
              src="/tour/02-items.png"
              alt="The item list, with prices and what is out of stock"
              caption="Your list — spoken, not typed"
            />
            <PhoneShot
              src="/tour/05-orders.png"
              alt="Orders waiting, confirmed and completed"
              caption="Orders, in the order you work them"
            />
            <PhoneShot
              src="/tour/06-khata.png"
              alt="The khata, with each customer’s running balance"
              caption="The khata, always added up"
            />
            <PhoneShot
              src="/tour/07-sell.png"
              alt="The counter till, ringing up a walk-in sale"
              caption="The till for walk-ins"
            />
          </div>
        </Section>

        {/* ================================================================== */}
        <Section id="how">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <SectionHead
              eyebrow="How it works"
              title="Five steps, and we do the first one for you"
              lead="Nobody has to fill in a form, learn a screen, or be talked through a menu on the phone."
            />

            {/* THE PRODUCT'S OWN DRAWING, not a stock photograph, and the file
                it comes from says why: stock photography of grocery shops is
                overwhelmingly Western supermarket aisles, and a shopkeeper in
                Dum Dum can see in one glance that it was not made for them.
                This is the shape they actually stand in front of. It is also
                about a kilobyte of markup that takes the brand's colours and
                has no licence to get wrong — see `components/ui/ShopArt.tsx`. */}
            {/* The owner, doing the one thing this product asks of him. */}
            <SectionArt
              src={ART.owner.src}
              alt={ART.owner.alt}
              className="mx-auto hidden sm:block"
              caption={
                <span lang="bn">“চাল এক কেজি ৬৮ টাকা” — বললেই তালিকায়, দামসহ।</span>
              }
            />
          </div>

          {/* THE READER PICKS THE LANGUAGE; the page does not guess.
              The person who decides is often a son or a nephew who reads
              English, and the person who will stand behind the counter using
              it reads Bengali. Stacking both on every card, which is what this
              did first, doubles the length of the section and leaves each of
              them scanning past half of it. The Bengali is not a translation
              so much as the same point made the way a shopkeeper would say it;
              where the two differ, the Bengali is the one to trust. */}
          <LangTabs
            className="mt-10"
            en={<StepList lang="en" />}
            bn={<StepList lang="bn" />}
          />
        </Section>

        {/* ================================================================== */}
        <Section id="why" tone="tint">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <SectionHead
              eyebrow="Why shops switch"
              title="The complaint first, the answer second"
              lead="A feature list leaves the shopkeeper to translate it into their own day — and mostly they do not bother."
            />
            {/* The other half of the shop: the customer who scans. */}
            <SectionArt
              src={ART.customer.src}
              alt={ART.customer.alt}
              className="mx-auto hidden sm:block"
            />
          </div>

          <LangTabs
            className="mt-10"
            en={<ProblemList lang="en" />}
            bn={<ProblemList lang="bn" />}
          />
        </Section>

        {/* ================================================================== */}
        <Section id="plans" tone="tint">
          <SectionHead
            eyebrow="Pricing"
            title="One price a month. Nothing per order."
            lead={`A new shop starts on ${TRIAL_DAYS} days of the top plan, free, with nothing to pay up front.`}
            align="center"
          />

          {/* THE WHOLE OF THE PRICING IS HERE NOW, not a teaser pointing at a
              second page. A shopkeeper deciding whether to buy should not have
              to leave the page that convinced them, and the numbers below — the
              month, the year, what a year saves, what the plan holds — are the
              only ones there are. `/pricing` still answers and sends whoever
              follows an old link straight back to this section.

              The ladder is read off `PLAN_SPECS`, never retyped. A price that
              lives in two files is a price that will be wrong in one of them
              the first time it changes. */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {plans.map((plan) => {
              // The plan most kiranas land on, marked so the eye has somewhere
              // to start. Five equal cards is five decisions.
              const popular = plan.id === 'PRO';
              return (
                <div
                  key={plan.id}
                  className={clsx(
                    'relative flex flex-col rounded-2xl p-5 transition',
                    popular
                      ? 'bg-brand-600 text-white shadow-float lg:-my-3 lg:py-8'
                      : 'border border-brand-100 bg-card shadow-raised hover:-translate-y-1 hover:shadow-float',
                  )}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-raised">
                      Most kiranas
                    </span>
                  )}
                  <h3 className={clsx('font-bold', popular ? 'text-white' : 'text-slate-900')}>
                    {plan.name}
                  </h3>
                  <p
                    className={clsx(
                      'mt-2 text-4xl font-bold tabular-nums',
                      popular ? 'text-white' : 'text-slate-900',
                    )}
                  >
                    &#8377;{plan.price}
                    <span
                      className={clsx(
                        'text-sm font-normal',
                        popular ? 'text-white/70' : 'text-slate-500',
                      )}
                    >
                      {' '}
                      /mo
                    </span>
                  </p>

                  {/* THE YEARLY PRICE ON THE CARD, NOT BEHIND A TOGGLE. A shop
                      that pays once a year has one chance to leave instead of
                      twelve, which matters more to this business than the two
                      months given away — so the offer has to be read, not
                      discovered. */}
                  <p
                    className={clsx(
                      'mt-2 text-sm font-bold tabular-nums',
                      popular ? 'text-brand-100' : 'text-brand-700',
                    )}
                  >
                    &#8377;{yearPrice(plan.id).toLocaleString('en-IN')} a year
                    <span
                      className={clsx('font-normal', popular ? 'text-white/70' : 'text-slate-500')}
                    >
                      {' '}
                      &mdash; save &#8377;{yearSaving(plan.id).toLocaleString('en-IN')}
                    </span>
                  </p>

                  <p
                    className={clsx(
                      'mt-3 border-t pt-3 text-sm font-bold',
                      popular ? 'border-white/20 text-white' : 'border-brand-100 text-slate-900',
                    )}
                  >
                    {planItems(plan.id)} items
                  </p>
                  <p className={clsx('mt-1 text-base', popular ? 'text-white/75' : 'text-slate-500')}>
                    {plan.tagline}
                  </p>
                </div>
              );
            })}
          </div>

          {/* WHAT EVERY PLAN INCLUDES, IN FULL. The plans differ by item count
              and by nothing else, which is the fairest thing about this pricing
              and the easiest thing to miss — so the list is stated once,
              plainly, under all five cards rather than repeated inside each. */}
          <div className="mt-6 rounded-3xl border border-brand-100 bg-card p-6 shadow-raised sm:p-8">
            <h3 className="text-lg font-bold text-slate-900">Every plan includes all of it</h3>
            <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {EVERY_PLAN_INCLUDES.map((feature) => (
                <li key={feature} className="flex gap-2.5 text-base text-slate-700">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* The two things a shopkeeper asks next, answered where they ask
                them rather than on a page they have to go and find. */}
            <div className="mt-6 grid gap-4 border-t border-brand-100 pt-6 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-900">
                  Do not want to list the items yourself?
                </p>
                <p className="mt-1 text-base text-slate-600">
                  We will catalogue the shop for you at{' '}
                  <strong className="text-brand-700">
                    {formatPaise(LISTING_PAISE_PER_ITEM)} an item
                  </strong>
                  , once &mdash; names, prices and pack sizes, in all three languages.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">If you stop paying</p>
                <p className="mt-1 text-base text-slate-600">
                  Your shop page and QR keep working for {AUTO_PAUSE_DAYS} days and nothing is
                  ever deleted. Pay by UPI, by the month or the year, no contract, stop whenever
                  you like.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-base text-slate-500">
            Customers pay you in cash or straight into your own UPI. {BRAND_NAME} never touches
            the money from an order.
          </p>
        </Section>

        {/* ================================================================== */}
        <Section tone="tint">
          <SectionHead
            eyebrow="Questions"
            title="What shopkeepers actually ask"
            align="center"
          />
          {/* A native accordion: no JavaScript, works with the keyboard, and
              searchable by the browser's own find. */}
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {FAQ.map((entry) => (
              <details
                key={entry.q}
                className="group rounded-2xl border border-brand-100 bg-card px-5 py-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                  {entry.q}
                  <span
                    aria-hidden
                    className="shrink-0 text-xl leading-none text-brand-600 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-base leading-relaxed text-slate-600">{entry.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* ================================================================== */}
        <section className="px-5 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-brand-600 bg-chrome px-6 py-12 text-center text-white">
            <h2 lang="bn" className="relative text-3xl font-bold sm:text-4xl">
              আজই দোকান অনলাইনে আনুন
            </h2>
            {/* ON A DARK PANEL THE BUTTONS INVERT. A brand-600 button on a
                brand-800 ground is two greens a hair apart — the call to
                action stops being the loudest thing on the panel, which is the
                only job it has. The card colour carries brand text instead,
                exactly as the pricing page's hero does. */}
            <p className="relative mx-auto mt-3 max-w-xl text-white/85">
              Tell us your shop’s name, phone number and address. We build the
              shop, print your QR and set it up with you — you start by speaking
              your first item.
            </p>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              {whatsapp && (
                <a
                  href={whatsapp}
                  className="inline-flex items-center gap-2 rounded-xl bg-card px-6 py-3 font-semibold text-brand-700 shadow-raised transition hover:bg-white"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  WhatsApp us
                </a>
              )}
              {support.phone && (
                <a
                  href={`tel:+91${support.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <PhoneIcon className="h-5 w-5" />
                  {support.phone}
                </a>
              )}
            </div>

            {/* The way back for somebody who scanned a QR once and is now at
                home. Renders nothing on a phone that has never ordered, which
                is every visitor to this page except the customers it is for. */}
            <SavedShops />
          </div>
        </section>
      </main>

      {/* Who built it, who to ring, and the four policy pages. It is the only
          thing on every page, which is what makes it the right place for them. */}
      <StickyCta whatsapp={whatsapp} />
      <BackToTop />
      <MobileMenu items={NAV} whatsapp={whatsapp} />
      <SiteFooter />
    </div>
  );
}
