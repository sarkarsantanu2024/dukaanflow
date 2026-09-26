'use client';

/**
 * The switch for "say new orders out loud" (`lib/order-announce.ts`).
 *
 * Turning it on says a sample sentence at once. That is not decoration: a
 * browser only lets a page speak after the person has tapped something on it,
 * and this tap is that permission — and the owner hears, there and then, that
 * the phone's voice speaks their language.
 */

import { useEffect, useState } from 'react';
import { speak } from '@/components/voice/useVoice';
import { BellIcon } from '@/components/ui/Icon';
import { ANNOUNCE_LANG, announceOn, setAnnounceOn, spokenNewOrders } from '@/lib/order-announce';
import { ownerDict } from '@/lib/owner-i18n';
import type { Locale } from '@/lib/i18n';

export function AnnounceToggle({ slug, locale }: { slug: string; locale: Locale }) {
  const t = ownerDict(locale);
  const [on, setOn] = useState(true);
  useEffect(() => setOn(announceOn(slug)), [slug]);

  function toggle() {
    const next = !on;
    setOn(next);
    setAnnounceOn(slug, next);
    if (next) speak(spokenNewOrders(locale, [20000]), ANNOUNCE_LANG[locale]);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-brand-50"
    >
      <BellIcon className="h-5 w-5 shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-slate-700">{t.announceLabel}</span>
        <span className="block text-xs text-slate-500">{t.announceHint}</span>
      </span>
      <span
        aria-hidden
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-brand-600' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${on ? 'left-[1.375rem]' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}
