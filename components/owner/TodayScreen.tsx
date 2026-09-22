import Link from 'next/link';
import clsx from 'clsx';
import { ownerDict } from '@/lib/owner-i18n';
import { BellIcon, BoxIcon, CheckIcon, RupeeIcon, TruckIcon } from '@/components/ui/Icon';
import { StartDayRow } from './StartDayRow';
import { QuietShopArt } from '@/components/ui/Ornament';
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
  red: 'bg-red-100 text-red-600 ring-1 ring-red-200',
  emerald: 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200',
  amber: 'bg-amber-100 text-amber-600 ring-1 ring-amber-200',
  sky: 'bg-sky-100 text-sky-600 ring-1 ring-sky-200',
  yellow: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200',
};

/**
 * THE CARDS ARE PLAIN WHITE, AND THE PAGE BEHIND THEM IS NOT.
 *
 * They were tinted a moment ago, each card washed with its own hue, which was
 * solving the right problem in the wrong place. The screen read as flat because
 * the GROUND was white — near enough that a white card on it had no edge — and
 * tinting five cards to get that edge back gave the screen five competing
 * colours and a busier surface than it started with.
 *
 * `bg-app` is properly green now, so a white card is an object again with no
 * help at all. Colour stays where it carries meaning — the icon tile — and the
 * card itself is quiet. That is also the honest version for somebody who does
 * not read quickly: one strong colour per row is a signal, five washes is
 * wallpaper.
 */

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
        // `rounded-3xl` and `p-4`: the radius and the air are most of what
        // separates an interface that looks made from one that looks assembled.
        // No border — on a green ground the shadow is the edge, and a hairline
        // as well reads as a box drawn round a card.
        'flex items-center gap-3 rounded-2xl border border-glass-edge bg-glass p-3 shadow-raised transition',
        'hover:shadow-float active:scale-[0.99]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
      )}
    >
      {/* A step larger, and ringed. The icon is the fastest thing on the card
          to recognise and the slowest thing to read, so it gets the size. */}
      <span
        aria-hidden
        className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg', CHIP[tone])}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-900">{label}</span>
      {/* A full pill in the brand colour: the one thing on the card to press,
          and it should look pressable from across a counter.
          BACK TO `text-sm` AND TIGHTER PADDING. At `text-base` with `px-4` the
          pill took enough of a 375px row that "১টি Order অপেক্ষা করছে" broke
          across two lines beside it. The label is the news and the pill is the
          way to act on it, so when the row is tight the pill gives way. */}
      <span className="shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm">
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

      {/* The clock is not here any more: it hangs off the bottom of the shop
          name in the sticky header, so it stays on screen on every owner
          screen rather than only this one. See `ShopClock`. */}

      {/* What needs attention, worst first — or the one quiet line. */}
      {cards.length > 0 ? (
        <div className="space-y-2">
          {cards.map((c) => (
            <ActionCard key={c.key} tone={c.tone} icon={c.icon} label={c.label} action={c.action} href={c.href} />
          ))}
        </div>
      ) : (
        // NOTHING NEEDS YOU, SAID AS A PICTURE FIRST.
        // This was one grey sentence on a white card, which is the single worst
        // thing on the screen for an owner who does not read quickly: the one
        // moment the app has nothing to show them, it said so in words alone.
        // A shuttered shop with bare shelves carries it without being read, and
        // the sentence stays underneath for everyone else.
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-glass-edge bg-glass p-6 text-center shadow-raised">
          <QuietShopArt className="h-16 w-20 text-brand-600" />
          <p className="text-sm font-medium text-slate-600">{t.todayAllQuiet}</p>
        </div>
      )}

      {/* Today's and this month's takings, and the drawer reconciliation once a
          float is set — moved off the khata screen's "হিসাব" tab, which no
          longer exists. Its own today/month switch lives inside it; the opening
          cash it used to ask for is the row at the top of this screen now. */}
      <TakingsPanel slug={slug} today={today} month={month} drawer={drawer} locale={locale} />
    </div>
  );
}
