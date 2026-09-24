'use client';

/**
 * THE WHOLE PRODUCT, PLAYING ITSELF, IN ABOUT TWENTY SECONDS.
 *
 * The hero used to be two still screenshots side by side. A still says "there
 * is an app"; it cannot say that the owner SPEAKS an item, that a customer
 * SCANS a QR, that an order ARRIVES with a bell and that the khata ADDS ITSELF
 * UP — which is the whole argument, and is a sequence. A visitor who watches
 * one loop has understood the product without reading a word of English.
 *
 * WHAT IS REAL AND WHAT IS DRAWN. The screens are the product's own
 * screenshots, `public/tour/`, unretouched. Everything laid over them — the
 * spoken line, the chip that lands, the bell, the balance — is drawn here, and
 * drawn to match what those screens actually do. Nothing in this animation
 * claims anything the app does not do; if a screen changes, retake the
 * screenshot and the overlay still tells the truth.
 *
 * IT IS NOT A VIDEO. A video of a phone is a megabyte before it is anything
 * else, on a page whose readers are on rural 4G, and it cannot be read by a
 * screen reader or found by a search engine. This is five PNGs the tour
 * already ships, some CSS, and one index in state.
 *
 * ACCESSIBILITY, AND WHY THE CONTROLS ARE REAL BUTTONS:
 *  - `prefers-reduced-motion` stops the auto-play. The reader still gets the
 *    whole journey; they advance it themselves. This is not a decoration that
 *    can simply be switched off — it is the content.
 *  - Hovering or focusing the panel pauses it, so nobody has to race the
 *    timer to read a caption.
 *  - The step dots are buttons with names, the caption is a live region, and
 *    the sequence is also written out in the steps section further down the
 *    page — so nothing here is the only copy of anything.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { BellIcon, MicIcon, QrIcon, RupeeIcon } from '@/components/ui/Icon';
import { LANDING, type Words } from '@/lib/marketing-copy';
import { useLandingLang } from './LangTabs';
import { Say } from './Say';

/** How long each step holds. Long enough to read the caption aloud. */
const STEP_MS = 4200;

type Step = {
  id: string;
  /** The screen this step happens on. */
  src: string;
  alt: string;
  /** Who is holding the phone. */
  actor: Words;
  title: Words;
  /** What is said aloud, where something is — the one line kept in quotes. */
  quote?: Words;
};

/**
 * The spoken line, in the script it is spoken in. In English it stays the
 * Bengali sentence, as the hero's headline does: nobody lists rice in English.
 */
const SAID = LANDING.hero.headline;

const STEPS: Step[] = [
  {
    id: 'speak',
    src: '/tour/02-items.png',
    alt: 'The owner’s item list, filling up as items are spoken',
    actor: { en: 'The owner', bn: 'মালিক', hi: 'मालिक' },
    title: {
      en: 'Says the item and its price',
      bn: 'জিনিস আর দাম মুখে বলেন',
      hi: 'सामान और दाम बोलकर बताते हैं',
    },
    quote: SAID,
  },
  {
    id: 'scan',
    src: '/tour/04-storefront.png',
    alt: 'The shop’s page as a customer sees it after scanning the QR',
    actor: { en: 'A customer', bn: 'একজন খদ্দের', hi: 'एक ग्राहक' },
    title: {
      en: 'Scans the QR at the counter',
      bn: 'কাউন্টারের QR স্ক্যান করেন',
      hi: 'काउंटर का QR स्कैन करता है',
    },
  },
  {
    id: 'order',
    src: '/tour/05-orders.png',
    alt: 'A new order arriving in the owner’s app',
    actor: { en: 'The order', bn: 'অর্ডার', hi: 'ऑर्डर' },
    title: {
      en: 'Lands in the app, and the phone buzzes',
      bn: 'অ্যাপে আসে, ফোন বেজে ওঠে',
      hi: 'ऐप में आता है, फ़ोन बज उठता है',
    },
  },
  {
    id: 'khata',
    src: '/tour/06-khata.png',
    alt: 'The khata, showing each customer’s running balance',
    actor: { en: 'The khata', bn: 'খাতা', hi: 'खाता' },
    title: {
      en: 'Adds itself up — who owes what',
      bn: 'নিজেই যোগ হয় — কার কত বাকি',
      hi: 'अपने आप जुड़ता है — किस पर कितना उधार',
    },
  },
  {
    id: 'till',
    src: '/tour/07-sell.png',
    alt: 'The counter till ringing up a walk-in sale',
    actor: { en: 'The till', bn: 'কাউন্টার', hi: 'काउंटर' },
    title: {
      en: 'Takes the walk-in sale too',
      bn: 'দোকানে এসে কেনার বিক্রিও এখানেই',
      hi: 'दुकान पर आकर हुई बिक्री भी यहीं',
    },
  },
];

/** The words drawn over the screens. */
const OVERLAY = {
  said: {
    en: SAID.en.replace(/[“”]/g, ''),
    bn: SAID.bn.replace(/[“”]/g, ''),
    hi: SAID.hi.replace(/[“”]/g, ''),
  },
  item: { en: 'চাল', bn: 'চাল', hi: 'चावल' },
  noLogin: { en: 'No app. No login.', bn: 'অ্যাপ নেই। লগইন নেই।', hi: 'न ऐप, न लॉगिन।' },
  paraOwes: { en: 'The para owes you', bn: 'পাড়ার কাছে পাওনা', hi: 'मोहल्ले पर उधार' },
  cashPaid: {
    en: 'Cash, paid — in today’s total',
    bn: 'নগদ পেলেন — আজকের হিসাবে যোগ',
    hi: 'नकद मिला — आज के हिसाब में जुड़ा',
  },
} satisfies Record<string, Words>;

/** The English page's spoken words are Bengali, and are marked so. */
function spoken(words: Words) {
  return <Say t={words} en={<span lang="bn">{words.en}</span>} />;
}

export function HeroJourney({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Null until the browser has been asked — the server has no idea what the
  // reader prefers, and guessing would mean a hydration mismatch.
  const [reduced, setReduced] = useState(false);
  const touched = useRef(false);
  const lang = useLandingLang();

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    // Stopped for a reader who asked for less motion, while they are reading a
    // step, or once they have taken control with the dots — an animation that
    // keeps moving under somebody's finger is worse than one that never moved.
    if (reduced || paused || touched.current) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % STEPS.length), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, reduced]);

  const step = STEPS[index]!;

  return (
    <div
      className="mx-auto w-full max-w-sm lg:max-w-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative mx-auto w-[16.5rem] sm:w-[18rem]">
        {/* The phone. A real bezel rather than a floating screenshot: it is
            what tells a reader at a glance that this is a phone and not a
            picture of a website. */}
        <div className="relative overflow-hidden rounded-[2.25rem] border-[7px] border-slate-800 bg-slate-800 shadow-float">
          <div className="relative aspect-[780/1688] w-full overflow-hidden rounded-[1.6rem] bg-card">
            {/* EVERY SCREEN IS MOUNTED AND CROSS-FADED, not swapped. A step
                that mounts its image on arrival shows a white hole while the
                PNG decodes, which on a slow connection is most of the step. */}
            {STEPS.map((item, i) => (
              <Image
                key={item.id}
                src={item.src}
                alt={i === index ? item.alt : ''}
                aria-hidden={i !== index}
                fill
                sizes="(max-width: 640px) 70vw, 288px"
                priority={i === 0}
                className={clsx(
                  'object-cover object-top transition-opacity duration-700',
                  i === index ? 'opacity-100' : 'opacity-0',
                )}
              />
            ))}

            {/* WHAT IS HAPPENING ON THIS SCREEN, drawn over it. Keyed on the
                step so each one re-runs its entrance. */}
            <div key={step.id} className="pointer-events-none absolute inset-0">
              {step.id === 'speak' && (
                <div className="absolute inset-x-3 bottom-4 animate-chip-in">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-900/90 px-3 py-2 text-white shadow-float">
                    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500">
                      <MicIcon className="h-4 w-4" />
                      <span className="absolute inset-0 animate-ripple rounded-full bg-brand-400" />
                    </span>
                    <span className="text-sm font-semibold">{spoken(OVERLAY.said)}</span>
                  </div>
                  <div
                    className="mt-2 flex items-center justify-between rounded-xl bg-card px-3 py-2 text-sm shadow-raised"
                    style={{ animationDelay: '520ms' }}
                  >
                    <span className="font-medium text-slate-900">{spoken(OVERLAY.item)}</span>
                    <span className="font-semibold tabular-nums text-brand-700">₹100 / kg</span>
                  </div>
                </div>
              )}

              {step.id === 'scan' && (
                <div className="absolute inset-x-3 bottom-4 animate-chip-in">
                  <div className="flex items-center gap-2 rounded-2xl bg-card px-3 py-2 shadow-float">
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
                      <QrIcon className="h-4 w-4" />
                      <span className="absolute inset-0 animate-ripple rounded-xl bg-brand-400" />
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      <Say t={OVERLAY.noLogin} />
                    </span>
                  </div>
                </div>
              )}

              {step.id === 'order' && (
                <div className="absolute right-3 top-3 animate-chip-in">
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-float">
                    <BellIcon className="h-5 w-5" />
                    <span className="absolute inset-0 animate-ripple rounded-full bg-brand-400" />
                    {/* NOT RED, though a notification count almost always is.
                        Red in this product means unpaid or out of stock, and
                        the logotype's red is the logotype's — see the note on
                        the `brand` ramp. A new order is neither a fault nor a
                        debt, so the count is neutral. */}
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold">
                      1
                    </span>
                  </span>
                </div>
              )}

              {step.id === 'khata' && (
                <div className="absolute inset-x-3 bottom-4 animate-chip-in">
                  <div className="rounded-2xl bg-card px-3 py-2 shadow-float">
                    <p className="text-xs text-slate-500">
                      <Say t={OVERLAY.paraOwes} />
                    </p>
                    <p className="text-lg font-bold tabular-nums text-slate-900">₹4,280</p>
                  </div>
                </div>
              )}

              {step.id === 'till' && (
                <div className="absolute inset-x-3 bottom-4 animate-chip-in">
                  <div className="flex items-center gap-2 rounded-2xl bg-card px-3 py-2 shadow-float">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
                      <RupeeIcon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      <Say t={OVERLAY.cashPaid} />
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* THE CAPTION IS UNDER THE PHONE, NOT ON IT. Over the screen it would
          cover the thing it is describing, and on a 360px phone there is no
          room for both. */}
      <div className="mx-auto mt-5 max-w-xs text-center lg:max-w-sm">
        <p aria-live="polite" className="min-h-[3.25rem]">
          <span className={clsx('text-xs font-semibold uppercase tracking-[0.16em]', dark ? 'text-brand-200' : 'text-brand-600')}>
            <Say t={step.actor} />
          </span>
          <span className={clsx('mt-0.5 block font-semibold', dark ? 'text-white' : 'text-slate-900')}>
            <Say t={step.title} />
          </span>
          {step.quote && (
            <span className={clsx('block text-sm', dark ? 'text-white/75' : 'text-slate-600')}>
              {spoken(step.quote)}
            </span>
          )}
        </p>

        <div className="mt-3 flex items-center justify-center gap-2">
          {STEPS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                // Taking control stops the carousel for good. Somebody reading
                // step two does not want to be moved to step three mid-word.
                touched.current = true;
                setIndex(i);
              }}
              aria-label={`${i + 1}. ${item.title[lang]}`}
              aria-current={i === index}
              className={clsx(
                'h-1.5 rounded-full transition-all',
                i === index
                  ? dark ? 'w-8 bg-white' : 'w-8 bg-brand-600'
                  : dark ? 'w-3 bg-white/35 hover:bg-white/60' : 'w-3 bg-slate-300 hover:bg-slate-400',
              )}
            >
              {/* The bar that runs out while the step is on screen: the only
                  thing on the page that says it is going to move on by itself.
                  Restarted per step by the key. */}
              {i === index && !reduced && !paused && !touched.current && (
                <span
                  key={index}
                  className={clsx('block h-full origin-left animate-step-fill rounded-full', dark ? 'bg-brand-300' : 'bg-brand-400')}
                  style={{ '--step-ms': `${STEP_MS}ms` } as React.CSSProperties}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
