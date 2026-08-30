'use client';

/**
 * Telling regulars what is ready today.
 *
 * For a home kitchen or a tiffin service this is the whole job: four dishes
 * change every morning, and the customers are a fixed list of neighbours.
 *
 * It is a composer, not a sender, and that is a deliberate limit rather than a
 * shortcut. WhatsApp will not let a web page message many people at once —
 * only the Business API does that, and it costs per message and needs template
 * approval. What WhatsApp *does* have is Broadcast Lists, which the shopkeeper
 * already knows how to use. So this writes the message and hands it over: copy
 * it into a broadcast list, or tap a name to send it to one person.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { useToast } from '@/components/ui/Toast';
import { WhatsAppIcon } from '@/components/ui/Icon';
import { formatPaise } from '@/lib/money';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export type MenuItem = { id: string; name: string; nameBn: string; nameHi: string; pricePaise: number; unit: string };

function label(item: MenuItem, locale: Locale): string {
  const name = locale === 'bn' ? item.nameBn || item.name : locale === 'hi' ? item.nameHi || item.name : item.name;
  return item.unit ? `${name} (${item.unit})` : name;
}

export function MenuBroadcast({
  shopName,
  shopUrl,
  items,
  customers,
  locale,
}: {
  shopName: string;
  shopUrl: string;
  items: MenuItem[];
  customers: { id: string; name: string; phone: string }[];
  locale: Locale;
}) {
  const t = ownerDict(locale);
  const { push } = useToast();
  const [picked, setPicked] = useState<Set<string>>(new Set(items.slice(0, 6).map((i) => i.id)));

  const chosen = items.filter((item) => picked.has(item.id));

  const message = [
    `${shopName} — ${t.menuToday}:`,
    '',
    ...chosen.map((item) => `• ${label(item, locale)} — ${formatPaise(item.pricePaise)}`),
    '',
    shopUrl,
  ].join('\n');

  function toggle(id: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="font-semibold text-slate-900">{t.menuTitle}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{t.menuHint}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {items.map((item) => {
          const on = picked.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              aria-pressed={on}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                on
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              {label(item, locale)}
            </button>
          );
        })}
      </div>

      <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-sans text-sm text-slate-700">
        {message}
      </pre>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={chosen.length === 0}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message);
              push(t.menuCopied, 'success');
            } catch {
              push(t.networkError, 'error');
            }
          }}
          className="h-11 rounded-xl bg-brand-600 px-4 font-semibold text-white disabled:opacity-50"
        >
          {t.menuCopy}
        </button>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.menuSendTo}
        </p>
        {customers.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">{t.menuNoCustomers}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {customers.map((customer) => (
              <a
                key={customer.id}
                href={`https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
                {customer.name || customer.phone}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
