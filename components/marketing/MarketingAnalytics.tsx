'use client';

/**
 * Meta Pixel and Google Analytics, for the PUBLIC MARKETING PAGES ONLY.
 *
 * Added 2026-09-28 at the owner's request, for advertising. Where it is used
 * is the whole point: the home page, the business pages, contact and the
 * policy pages. NEVER a shop's own page, the order or tracking pages, or the
 * owner and admin apps — a shop's customers are not ours to track, and the
 * privacy page says exactly this. Mount it nowhere else.
 *
 * OFF UNTIL CONFIGURED. Each script loads only when its id is set:
 *   NEXT_PUBLIC_META_PIXEL_ID   — the Meta (Facebook) Pixel id
 *   NEXT_PUBLIC_GA_ID           — a Google Analytics 4 measurement id (G-…)
 * Both are public by nature — they sit in every visitor's page source.
 *
 * Besides the page view, a tap on any WhatsApp button (a wa.me link) is sent
 * as the lead: `Contact` to Meta and `generate_lead` to Google. That is the
 * one action on these pages that means a shopkeeper wants to start.
 */

import Script from 'next/script';
import { useEffect } from 'react';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

/** Ids are digits, or G- plus letters and digits; anything else is refused. */
const safePixel = /^\d{5,20}$/.test(PIXEL_ID) ? PIXEL_ID : '';
const safeGa = /^G-[A-Z0-9]{4,20}$/i.test(GA_ID) ? GA_ID : '';

type Tracker = (...args: unknown[]) => void;

export function MarketingAnalytics() {
  useEffect(() => {
    if (!safePixel && !safeGa) return;
    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      const href = link?.getAttribute('href') ?? '';
      if (!href.startsWith('https://wa.me/')) return;
      const w = window as unknown as { fbq?: Tracker; gtag?: Tracker };
      w.fbq?.('track', 'Contact');
      w.gtag?.('event', 'generate_lead', { method: 'whatsapp' });
    }
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return (
    <>
      {safePixel && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${safePixel}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src={`https://www.facebook.com/tr?id=${safePixel}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
      {safeGa && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${safeGa}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${safeGa}');`}
          </Script>
        </>
      )}
    </>
  );
}
