import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { BRAND_GREEN, BRAND_LOGO, BRAND_WORDMARK } from './brand';

/**
 * THE LINK PREVIEW CARD for the public pages — what Facebook, WhatsApp, X and
 * Google show when the home page or a business page is shared (1200×630).
 *
 * Replaced the hand-made `public/social/link-preview.png` on 2026-09-28: that
 * picture showed an old version of the app and the old tagline. These are
 * drawn at build time from the same words and screenshots the pages use, so a
 * change of price or headline changes the card with it.
 *
 * English on purpose; the page it opens is in the reader's language. The font
 * is Noto Sans (SIL Open Font License, `assets/fonts/OFL.txt`), shipped with
 * the repo: the renderer's built-in font has no ₹ and no bold, so prices came
 * out as empty boxes.
 */

export const OG_SIZE = { width: 1200, height: 630 };

/** Noto Sans, regular and extra-bold, read from `assets/fonts`. */
async function fonts() {
  const dir = path.join(process.cwd(), 'assets', 'fonts');
  const [regular, bold] = await Promise.all([
    readFile(path.join(dir, 'NotoSans-Regular.ttf')),
    readFile(path.join(dir, 'NotoSans-ExtraBold.ttf')),
  ]);
  return [
    { name: 'Noto Sans', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Noto Sans', data: bold, weight: 800 as const, style: 'normal' as const },
  ];
}

/** A file under `public/` as a data URL, or null if it is not there. */
async function publicDataUrl(src: string): Promise<string | null> {
  try {
    const bytes = await readFile(path.join(process.cwd(), 'public', src));
    return `data:image/png;base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function ogCard({
  eyebrow,
  headline,
  footer,
  screenshot,
}: {
  /** A short label above the headline — the kind of shop, or the product line. */
  eyebrow: string;
  headline: string;
  /** Prices and promises, one line. */
  footer: string;
  /** A phone screenshot under `public/`, shown in a frame on the right. */
  screenshot: string | null;
}) {
  const [logo, shot, font] = await Promise.all([
    publicDataUrl(BRAND_LOGO.master),
    screenshot ? publicDataUrl(screenshot) : Promise.resolve(null),
    fonts(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #faf6ef 0%, #faf6ef 55%, #d9ecdf 100%)',
          fontFamily: 'Noto Sans',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '64px 56px 56px 72px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} width={64} height={64} style={{ borderRadius: 14 }} alt="" />
            )}
            <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, color: '#0f172a' }}>
              {BRAND_WORDMARK.head}
              <span style={{ color: '#c8102e' }}>{BRAND_WORDMARK.tail}</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 40,
              alignSelf: 'flex-start',
              padding: '8px 18px',
              borderRadius: 999,
              background: '#ffffff',
              color: '#b91c1c',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {eyebrow}
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 22,
              fontSize: 58,
              lineHeight: 1.12,
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            {headline}
          </div>

          <div style={{ display: 'flex', marginTop: 'auto', fontSize: 28, color: BRAND_GREEN, fontWeight: 800 }}>
            {footer}
          </div>
        </div>

        {shot && (
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingRight: 64, paddingTop: 56 }}>
            <div
              style={{
                display: 'flex',
                width: 300,
                height: 574,
                borderRadius: '44px 44px 0 0',
                background: '#0f172a',
                padding: '12px 12px 0 12px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot}
                width={276}
                height={562}
                style={{ borderRadius: '34px 34px 0 0', objectFit: 'cover', objectPosition: 'top' }}
                alt=""
              />
            </div>
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: font },
  );
}
