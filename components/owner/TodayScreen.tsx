import Link from 'next/link';
import clsx from 'clsx';
import { ownerDict } from '@/lib/owner-i18n';
import { BellIcon, BoxIcon, CheckIcon, RupeeIcon, TruckIcon } from '@/components/ui/Icon';
import { StartDayRow } from './StartDayRow';
import { TakingsPanel } from './TakingsPanel';
import type { Locale } from '@/lib/i18n';
import type { Drawer, Takings } from '@/lib/takings';

/**
 * "আজকের দোকান" — the owner's morning briefing, and the app's landing screen.
 *
 * The app used to open on the till, which answers "what am I selling right now"
 * but not the question an owner actually opens the app with in the morning:
 * "what needs me today?" This screen answers that in one glance — what is
 * waiting, what has run low, who owes, what the day has taken — and every line
 * that matters carries one obvious way to act on it. Nothing is computed on the
 * client: the counts arrive already worked out from the same queries the rest
 * of the app trusts (`takingsBetween`, `needsRestock`, `customerBalances`), so
 * this can never disagree with the screen it links to.
 *
 * THE TILL IS ONE TAP AWAY, not gone: the biggest button here is "বিক্রি করুন".
 * The owner who wants to sell is one tap from where they always were, and the
 * owner who wants to know what is going on no longer has to reconstruct it from
 * four separate screens.
 *
 * CARDS ARE ORDERED BY URGENCY and a card with a zero count is not drawn at all
 * — an empty briefing says "nothing needs you", which is itself the answer, not
 * a blank screen. When every count is zero the one quiet line stands in for all
 * of them.
 */

export type TodayCounts = {
  ordersWaiting: number;
  ordersReady: number;
  lowStock: number;
  deliveries: number;
  owing: number;
};

type Tone = 'red' | 'emerald' | 'amber' | 'sky' | 'yellow';

/**
 * The colour a card carries, on the tinted icon chip rather than a bare dot.
 * Background and foreground are a matched pair from one hue, so the icon reads
 * clearly on its own tint — the same treatment on every card, only the hue and
 * the glyph change.
 */
const CHIP: Record<Tone, string> = {
  red: 'bg-red-50 text-red-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  sky: 'bg-sky-50 text-sky-600',
  yellow: 'bg-yellow-50 text-yellow-700',
};

function fill(template: string, n: number): string {
  return template.replace('{n}', String(n));
}

/** One line of the briefing: an icon in a tinted chip, what it is, the way to act. */
function ActionCard({
  tone,
  icon,
  label,
  action,
  href,
}: {
  tone: Tone;
  icon: React.ReactNode;
  label: string;
  action: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card transition',
        'hover:border-brand-300 hover:shadow-md active:scale-[0.99]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
      )}
    >
      <span
        aria-hidden
        className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl', CHIP[tone])}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-base font-semibold text-slate-900">{label}</span>
      <span className="shrink-0 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700">
        {action}
      </span>
    </Link>
  );
}

export function TodayScreen({
  slug,
  locale,
  counts,
  today,
  month,
  drawer,
}: {
  slug: string;
  locale: Locale;
  counts: TodayCounts;
  /** Today's and this month's takings, and today's cash drawer — the "হিসাব"
   *  that used to live behind a tab on the khata screen, now on the home. */
  today: Takings;
  month: Takings;
  drawer: Drawer | null;
}) {
  const t = ownerDict(locale);

  // Urgency order — §85. Only the ones with something to say are built.
  const cards: { key: string; tone: Tone; icon: React.ReactNode; label: string; action: string; href: string }[] = [];
  if (counts.ordersWaiting > 0)
    cards.push({ key: 'waiting', tone: 'red', icon: <BellIcon />, label: fill(t.todayOrdersWaiting, counts.ordersWaiting), action: t.todaySeeOrders, href: `/owner/${slug}/orders` });
  if (counts.ordersReady > 0)
    cards.push({ key: 'ready', tone: 'emerald', icon: <CheckIcon />, label: fill(t.todayOrdersReady, counts.ordersReady), action: t.todaySeeOrders, href: `/owner/${slug}/orders` });
  if (counts.lowStock > 0)
    cards.push({ key: 'low', tone: 'amber', icon: <BoxIcon />, label: fill(t.todayLowStock, counts.lowStock), action: t.todaySeeStock, href: `/owner/${slug}/inventory` });
  if (counts.deliveries > 0)
    cards.push({ key: 'delivery', tone: 'sky', icon: <TruckIcon />, label: fill(t.todayDelivery, counts.deliveries), action: t.todaySeeOrders, href: `/owner/${slug}/orders` });
  if (counts.owing > 0)
    cards.push({ key: 'khata', tone: 'yellow', icon: <RupeeIcon />, label: fill(t.todayKhataOutstanding, counts.owing), action: t.todaySeeKhata, href: `/owner/${slug}/khata` });

  return (
    <div className="space-y-4">
      {/* The top of the screen and the start of the day: today's cash on the
          left, the way to the till on the right, in one row. */}
      <StartDayRow slug={slug} drawer={drawer} locale={locale} />

      {/* What needs attention, worst first — or the one quiet line. */}
      {cards.length > 0 ? (
        <div className="space-y-2">
          {cards.map((c) => (
            <ActionCard key={c.key} tone={c.tone} icon={c.icon} label={c.label} action={c.action} href={c.href} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 shadow-card">
          {t.todayAllQuiet}
        </p>
      )}

      {/* Today's and this month's takings, and the drawer reconciliation once a
          float is set — moved off the khata screen's "হিসাব" tab, which no
          longer exists. Its own today/month switch lives inside it; the opening
          cash it used to ask for is the row at the top of this screen now. */}
      <TakingsPanel slug={slug} today={today} month={month} drawer={drawer} locale={locale} />
    </div>
  );
}
