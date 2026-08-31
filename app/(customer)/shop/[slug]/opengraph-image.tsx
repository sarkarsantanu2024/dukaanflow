/**
 * The shop's card, as an image.
 *
 * A QR scanner shows a link and nothing else — the customer at the counter sees
 * `dukaanflow.vercel.app/shop/maa-tara-vander` and has to trust it. Every place
 * that link travels afterwards is worse: pasted into WhatsApp, it is a blue
 * line of text among a hundred others.
 *
 * WhatsApp, the scanner apps that preview links, Facebook and Google all ask a
 * page for this image, so the shop's own photo, the owner's face, the phone
 * number and the address arrive with the link. That is the card, and it is the
 * same set of facts the page itself opens with.
 *
 * Drawn on demand rather than stored: the photos live on the shop row as data
 * URLs, so there is nothing to regenerate when an owner changes their picture.
 */

import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { SHOP_TYPE_LABELS } from '@/lib/validators';
import { BRAND_GREEN } from '@/lib/brand';
import { BRAND_NAME } from '@/lib/brand';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default async function ShopCard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      name: true,
      type: true,
      phone: true,
      address: true,
      ownerName: true,
      imageData: true,
      ownerImageData: true,
    },
  });

  // A slug nobody owns still has to answer with an image — a broken preview is
  // worse than a plain one, and this is also what a mistyped link gets.
  const name = shop?.name ?? BRAND_NAME;
  const trade = shop ? SHOP_TYPE_LABELS[shop.type] : 'Scan → Select → Order';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
        }}
      >
        {/* The shopfront across the top, if there is one. It is the half of
            this card that says "yes, this is the shop you are standing in". */}
        {shop?.imageData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shop.imageData}
            alt=""
            width={1200}
            height={300}
            style={{ width: '1200px', height: '300px', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '1200px', height: '300px', background: BRAND_GREEN }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '36px', padding: '40px 56px' }}>
          {shop?.ownerImageData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.ownerImageData}
              alt=""
              width={160}
              height={160}
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '32px',
                objectFit: 'cover',
                border: '6px solid #ffffff',
                marginTop: '-120px',
              }}
            />
          ) : (
            <div
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '32px',
                background: '#d1fae5',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
                fontWeight: 700,
                border: '6px solid #ffffff',
                marginTop: '-120px',
              }}
            >
              {name.trim().charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '62px', fontWeight: 700, color: '#0f172a' }}>{name}</div>
            {/* One string per box, never two children: the renderer behind
                this demands `display: flex` on any element with more than one
                child, and "text" plus "{expression}" counts as two. */}
            <div style={{ fontSize: '30px', color: '#64748b', marginTop: '6px' }}>
              {`${trade}${shop?.ownerName ? ` · ${shop.ownerName}` : ''}`}
            </div>
            {shop?.address ? (
              <div style={{ fontSize: '28px', color: '#64748b', marginTop: '4px' }}>
                {shop.address}
              </div>
            ) : null}
            {shop?.phone ? (
              <div
                style={{
                  fontSize: '34px',
                  fontWeight: 700,
                  color: BRAND_GREEN,
                  marginTop: '10px',
                }}
              >
                {`+91 ${shop.phone}`}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
