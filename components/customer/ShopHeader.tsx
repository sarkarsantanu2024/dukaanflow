'use client';

import { SHOP_TYPE_LABELS } from '@/lib/validators';
import { upiPayUrl } from '@/lib/qr';
import { LangToggle } from './LangToggle';
import { PinIcon, RupeeIcon, WhatsAppIcon } from '@/components/ui/Icon';
import type { Locale } from '@/lib/i18n';

export type ShopSummary = {
  name: string;
  slug: string;
  type: keyof typeof SHOP_TYPE_LABELS;
  phone: string;
  address: string;
  upiId: string;
  ownerName: string;
  imageData: string;
  ownerImageData: string;
};

export function ShopHeader({
  shop,
  locale,
  onLocaleChange,
  payLabel,
}: {
  shop: ShopSummary;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  payLabel: string;
}) {
  return (
    <header className="bg-gradient-to-br from-brand-700 to-brand-600 px-4 pb-6 pt-4 text-white">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* A shopper scanning a code on a counter should see the shop they
                are standing in front of — it is how they know the QR was the
                right one. */}
            {shop.ownerImageData && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.ownerImageData}
                alt={shop.ownerName || shop.name}
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/40"
              />
            )}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold leading-tight">{shop.name}</h1>
              <p className="mt-0.5 truncate text-sm text-white/80">
                {SHOP_TYPE_LABELS[shop.type]}
                {shop.ownerName && ` · ${shop.ownerName}`}
              </p>
            </div>
          </div>
          <LangToggle value={locale} onChange={onLocaleChange} />
        </div>

        {shop.imageData && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shop.imageData}
            alt={shop.name}
            className="h-36 w-full rounded-2xl object-cover ring-1 ring-white/25"
          />
        )}

        {shop.address && (
          <p className="flex items-start gap-1.5 text-sm text-white/85">
            <PinIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{shop.address}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/91${shop.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur hover:bg-white/25"
          >
            <WhatsAppIcon className="h-4 w-4" />
            +91 {shop.phone}
          </a>
          {shop.upiId && (
            <a
              href={upiPayUrl(shop.upiId, shop.name)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur hover:bg-white/25"
            >
              <RupeeIcon className="h-4 w-4" />
              {payLabel}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
