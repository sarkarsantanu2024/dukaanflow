/**
 * What the subscription rules must get right, as a runnable list.
 *
 *   npm run subscription:check
 *
 * No database: every rule here is a pure function (`entitlement`, `periodFor`,
 * the pricing, the request schema), so it runs safely even though `.env` points
 * at production. Prints each failure and exits non-zero if there is one.
 *
 * Run it after touching `lib/plans.ts`, `lib/period.ts`, `lib/subscription.ts`
 * or the subscription schema in `lib/validators.ts`.
 */
import {
  AUTO_PAUSE_DAYS,
  GRACE_DAYS,
  PLAN_SPECS,
  TRIAL_PLAN,
  amountForMonthsPaise,
  entitlement,
  listingChargePaise,
  priceForMonths,
  standingLabel,
  type ShopBilling,
} from '../lib/plans';
import { addMonths, periodFor } from '../lib/period';
import { subscriptionSchema } from '../lib/validators';

const DAY = 86_400_000;
const NOW = new Date(2026, 8, 17, 12, 0, 0); // 17 Sep 2026, noon local
const daysFromNow = (days: number) => new Date(NOW.getTime() + days * DAY);

let failures = 0;
let passes = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passes += 1;
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}\n        expected ${e}\n        got      ${a}`);
  }
}

function shop(overrides: Partial<ShopBilling>): ShopBilling {
  return {
    plan: 'PRO',
    subscriptionStatus: 'TRIALING',
    trialEndsAt: null,
    currentPeriodEnd: null,
    customPricePaise: null,
    customItemLimit: null,
    customPlanName: '',
    ...overrides,
  };
}

/* ---------------- Where a shop stands ---------------- */

{
  const e = entitlement(shop({ trialEndsAt: daysFromNow(5) }), NOW);
  check('trial: standing', e.standing, 'trial');
  check('trial: grants the trial plan', e.plan.id, TRIAL_PLAN);
  check('trial: days left', e.trialDaysLeft, 5);
  check('trial: can edit', e.canEdit, true);
}

{
  // The screenshot: a new shop (stored PRO, TRIALING) whose trial ended yesterday.
  const e = entitlement(shop({ trialEndsAt: daysFromNow(-1) }), NOW);
  check('trial ended yesterday: not trial any more', e.standing, 'overdue');
  check('trial ended yesterday: back on stored plan', e.plan.name, 'Pro');
  check('trial ended yesterday: stored plan limit', e.itemLimit, 300);
  check('trial ended yesterday: still in grace', e.inGrace, true);
  check('trial ended yesterday: can still edit', e.canEdit, true);
  check('trial ended yesterday: shop page still up', e.autoPaused, false);
  check('trial ended yesterday: label', standingLabel(e.standing, true), 'Trial ended · grace');
}

{
  const e = entitlement(shop({ trialEndsAt: daysFromNow(-(GRACE_DAYS + 1)) }), NOW);
  check('past grace: editing stops', e.canEdit, false);
  check('past grace: standing', e.standing, 'blocked');
  check('past grace: page still up', e.autoPaused, false);
}

{
  const e = entitlement(shop({ trialEndsAt: daysFromNow(-(AUTO_PAUSE_DAYS + 1)) }), NOW);
  check('past auto-pause: offline', e.autoPaused, true);
  check('past auto-pause: standing', e.standing, 'paused');
}

{
  const e = entitlement(
    shop({ subscriptionStatus: 'ACTIVE', plan: 'FREE', currentPeriodEnd: daysFromNow(20) }),
    NOW,
  );
  check('paid: standing', e.standing, 'active');
  check('paid: plan', e.plan.name, 'Basic');
  check('paid: limit', e.itemLimit, 20);
  check('paid: label', standingLabel(e.standing, false), 'Paid');
}

{
  const e = entitlement(
    shop({ subscriptionStatus: 'ACTIVE', plan: 'STARTER', currentPeriodEnd: daysFromNow(-3) }),
    NOW,
  );
  check('paid period lapsed: overdue', e.standing, 'overdue');
  check('paid period lapsed: label', standingLabel(e.standing, false), 'Payment overdue · grace');
}

{
  const e = entitlement(
    shop({ subscriptionStatus: 'PAST_DUE', currentPeriodEnd: daysFromNow(10) }),
    NOW,
  );
  check('marked past due with time left: overdue', e.standing, 'overdue');
  check('marked past due with time left: still edits', e.canEdit, true);
}

{
  const e = entitlement(
    shop({ subscriptionStatus: 'CANCELLED', currentPeriodEnd: daysFromNow(10) }),
    NOW,
  );
  check('cancelled: standing', e.standing, 'cancelled');
  check('cancelled: cannot edit', e.canEdit, false);
  check('cancelled: page offline today', e.autoPaused, true);
}

{
  const deal = { customPricePaise: 15000, customItemLimit: 60, customPlanName: 'Kirana deal' };
  const during = entitlement(shop({ ...deal, trialEndsAt: daysFromNow(3) }), NOW);
  check('custom deal during trial: trial plan wins', during.plan.id, TRIAL_PLAN);
  const after = entitlement(
    shop({ ...deal, subscriptionStatus: 'ACTIVE', currentPeriodEnd: daysFromNow(3) }),
    NOW,
  );
  check('custom deal: name', after.plan.name, 'Kirana deal');
  check('custom deal: limit', after.itemLimit, 60);
  check('custom deal: price', after.plan.price, 150);
}

/* ---------------- Dates a payment runs to ---------------- */

{
  const { periodEnd } = periodFor({ currentPeriodEnd: null }, 1, NOW);
  check('never paid: a month from today', periodEnd.toDateString(), new Date(2026, 9, 17, 12).toDateString());
}

{
  const paidTo = new Date(2026, 9, 1, 12);
  const { periodEnd } = periodFor({ currentPeriodEnd: paidTo }, 1, NOW);
  check('renew early: added to paid time', periodEnd.toDateString(), new Date(2026, 10, 1).toDateString());
}

{
  const { periodEnd } = periodFor({ currentPeriodEnd: daysFromNow(-10) }, 12, NOW);
  check('lapsed: a year from today', periodEnd.toDateString(), new Date(2027, 8, 17).toDateString());
}

check('31 Jan + 1 month = 28 Feb', addMonths(new Date(2027, 0, 31), 1).toDateString(), new Date(2027, 1, 28).toDateString());
check('31 Jan + 1 month in a leap year = 29 Feb', addMonths(new Date(2028, 0, 31), 1).toDateString(), new Date(2028, 1, 29).toDateString());
check('31 Aug + 1 month = 30 Sep', addMonths(new Date(2026, 7, 31), 1).toDateString(), new Date(2026, 8, 30).toDateString());
check('31 Dec + 2 months = 28 Feb', addMonths(new Date(2026, 11, 31), 2).toDateString(), new Date(2027, 1, 28).toDateString());
check('15 Nov + 3 months crosses the year', addMonths(new Date(2026, 10, 15), 3).toDateString(), new Date(2027, 1, 15).toDateString());

/* ---------------- Prices ---------------- */

check('Basic 1 month', priceForMonths('FREE', 1), 99);
check('Basic 1 year = 10 months', priceForMonths('FREE', 12), 990);
check('Pro 18 months = year + 6', priceForMonths('PRO', 18), 399 * 10 + 399 * 6);
check('Business 24 months = two years', priceForMonths('EX', 24), 599 * 20);
check('ladder paise match rupees', amountForMonthsPaise('STARTER', 1, null), 29900);
check('custom price: 1 month', amountForMonthsPaise('FREE', 1, 15000), 15000);
check('custom price: 1 year = 10 months', amountForMonthsPaise('FREE', 12, 15000), 150000);
check('custom price of zero is free', amountForMonthsPaise('PRO', 3, 0), 0);
check('listing 37 items', listingChargePaise(37), 3700);
check('listing negative items', listingChargePaise(-4), 0);
for (const spec of Object.values(PLAN_SPECS)) {
  check(`${spec.name}: price is positive`, spec.price > 0, true);
}

/* ---------------- What the console may send ---------------- */

const parse = (body: unknown) => subscriptionSchema.safeParse(body);
check('status change needs no plan', parse({ status: 'PAST_DUE' }).success, true);
check('trial days need no plan', parse({ trialDays: 7 }).success, true);
check('listing needs no plan', parse({ listedItems: 12 }).success, true);
check('payment with plan', parse({ plan: 'FREE', months: 1 }).success, true);
check('months default to 1', parse({ plan: 'FREE' }).data?.months, 1);
check('0 trial days refused', parse({ trialDays: 0 }).success, false);
check('91 trial days refused', parse({ trialDays: 91 }).success, false);
check('fractional trial days refused', parse({ trialDays: 1.5 }).success, false);
check('25 months refused', parse({ plan: 'PRO', months: 25 }).success, false);
check('5001 listed items refused', parse({ listedItems: 5001 }).success, false);
check('unknown plan refused', parse({ plan: 'GOLD' }).success, false);
check('unknown status refused', parse({ status: 'PAUSED' }).success, false);

console.log(`\n  ${passes} passed, ${failures} failed\n`);
if (failures > 0) process.exit(1);
