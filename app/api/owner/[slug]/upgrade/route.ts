import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { paymentRequestSchema } from '@/lib/validators';
import { canBePaid, operatorPayment, payeeLabel } from '@/lib/payment-settings';
import { quotePaise } from '@/lib/subscription';
import { STANDARD_PLAN, entitlement, monthlyPaiseFor, type Plan, type SubStatus } from '@/lib/plans';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * What the owner's upgrade modal needs: where to send money, and whether this
 * shop already has a request in flight.
 *
 * The open request is the whole reason this is a GET rather than props baked
 * into the page. An owner submits proof on Tuesday, closes the app, and gets
 * their code on WhatsApp on Wednesday — reopening the modal has to put them
 * straight on the code step rather than asking them to pay a second time.
 */

/** The one request that still matters to the owner, or null. */
const OPEN_STATUSES = ['SUBMITTED', 'CODE_ISSUED'] as const;

/**
 * How long a claim stays "we are checking your payment".
 *
 * IT USED TO BE FOREVER, and that is a quiet way to lose a shop. A request the
 * operator never got to sat open indefinitely, so the owner's plan screen went
 * on saying their money was being checked — weeks later, on a shop that had
 * since paid by another route and was covered until next year. Worse, the guard
 * below then refused to let them start again, so the one screen they could act
 * on was frozen by a row nobody was ever going to action.
 *
 * Seven days is generous for a job that takes an operator a minute. After that
 * the claim stops being shown to the owner, who can submit again, and the row
 * itself is left exactly as it is — the operator's queue is the record of what
 * was claimed, and deleting it would erase a shopkeeper saying they had paid.
 */
const OPEN_FOR_DAYS = 7;

/** The claims still worth showing this shop, by age as well as by status. */
function openRequestWhere(shopId: string) {
  return {
    shopId,
    status: { in: [...OPEN_STATUSES] },
    createdAt: { gte: new Date(Date.now() - OPEN_FOR_DAYS * 86_400_000) },
  };
}

/** The shop columns that decide what it pays and what it is called. */
const SHOP_PRICE_SELECT = {
  id: true,
  plan: true,
  subscriptionStatus: true,
  trialEndsAt: true,
  currentPeriodEnd: true,
  customPricePaise: true,
  customItemLimit: true,
  customPlanName: true,
} as const;

/**
 * The plan name and monthly rate this shop is sold, for the payment dialog.
 *
 * The name comes from a custom deal when there is one — "Food counter" — and is
 * the standard plan's otherwise. The trial is ignored on purpose: during a
 * trial `entitlement()` reports the trial plan, but what the owner is about to
 * BUY is what they get after it.
 */
function priceFor(shop: {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  customPricePaise: number | null;
  customItemLimit: number | null;
  customPlanName: string;
}) {
  const after = entitlement({
    plan: shop.plan as Plan,
    subscriptionStatus: shop.subscriptionStatus === 'TRIALING' ? 'ACTIVE' : (shop.subscriptionStatus as SubStatus),
    trialEndsAt: null,
    currentPeriodEnd: shop.currentPeriodEnd,
    customPricePaise: shop.customPricePaise,
    customItemLimit: shop.customItemLimit,
    customPlanName: shop.customPlanName,
  });
  return {
    planName: after.plan.name,
    monthlyPaise: monthlyPaiseFor(shop.customPricePaise),
    customPricePaise: shop.customPricePaise,
    itemLimit: after.plan.unlimited ? null : after.plan.itemLimit,
  };
}

const REQUEST_SHAPE = {
  id: true,
  plan: true,
  months: true,
  amountPaise: true,
  status: true,
  attempts: true,
  codeExpiresAt: true,
  reviewNote: true,
  createdAt: true,
} as const;

export async function GET(request: Request, { params }: Context) {
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: SHOP_PRICE_SELECT });
  if (!shop) return fail('Shop not found', 404);

  const [settings, open, lastRejected] = await Promise.all([
    operatorPayment(),
    prisma.paymentRequest.findFirst({
      where: openRequestWhere(shop.id),
      orderBy: { createdAt: 'desc' },
      select: REQUEST_SHAPE,
    }),
    // A refusal the owner has not seen yet is worth carrying too: without it,
    // an operator who rejects a blurry screenshot leaves the owner staring at
    // an empty form with no idea why nothing happened.
    prisma.paymentRequest.findFirst({
      where: { shopId: shop.id, status: 'REJECTED' },
      orderBy: { createdAt: 'desc' },
      select: REQUEST_SHAPE,
    }),
  ]);

  return ok({
    // What this shop pays, so the dialog quotes the same number the POST below
    // will price the request at — a custom price when the shop has one.
    price: priceFor(shop),
    payTo: {
      // The QR image and the id, never the whole row — there is nothing secret
      // here, but a client gets what it renders and no more.
      upiId: settings.upiId,
      payeeName: payeeLabel(settings),
      phone: settings.phone,
      qrImageData: settings.qrImageData,
      note: settings.note,
      configured: canBePaid(settings),
    },
    request: open,
    lastRejected: open ? null : lastRejected,
  });
}

/**
 * POST — "I have paid you, for this plan, here is the proof."
 *
 * This grants NOTHING. It records a claim: the shop, the plan, the months, the
 * price the server quotes for them, and whatever the owner sent to help the
 * operator find the money. The subscription does not move until a human has
 * looked at a bank feed and issued a code.
 *
 * That ordering is the entire security model, and it is why the screenshot can
 * be anything at all without it mattering.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  // Generous, but not unlimited: a screenshot is a few hundred KB and a shop
  // with a shaky signal will retry. This is here to stop a loop, not a person.
  const limit = rateLimit(`upgrade:${clientIp(request)}`, 12, 10 * 60 * 1000);
  if (!limit.ok) return fail('Too many attempts. Please wait a few minutes.', 429);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: SHOP_PRICE_SELECT });
  if (!shop) return fail('Shop not found', 404);

  const parsed = paymentRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  // The plan in the body is ignored: there is one plan for sale. Recording the
  // standard plan keeps every new payment row on the same value.
  const { months, payerUpiId, payerPhone, screenshotData } = parsed.data;
  const plan: Plan = STANDARD_PLAN;

  /**
   * ONE OPEN REQUEST PER SHOP.
   *
   * Without this an owner who taps Submit twice — on a slow connection, which
   * is every connection — puts two identical claims in the operator's queue for
   * one payment. The operator then either issues two codes for money that
   * arrived once, or has to work out which of two identical rows is real. The
   * second tap gets the first request handed back instead, which is what the
   * owner wanted to see anyway.
   */
  const existing = await prisma.paymentRequest.findFirst({
    where: openRequestWhere(shop.id),
    orderBy: { createdAt: 'desc' },
    select: REQUEST_SHAPE,
  });
  if (existing) return ok({ request: existing, duplicate: true });

  const created = await prisma.paymentRequest.create({
    data: {
      shopId: shop.id,
      plan,
      months,
      // Priced here, from the plan list — or the shop's own custom price, which
      // is what the console would charge it. Never taken from the request body.
      amountPaise: quotePaise(plan, months, shop.customPricePaise),
      payerUpiId,
      payerPhone,
      screenshotData,
    },
    select: REQUEST_SHAPE,
  });

  return ok({ request: created, duplicate: false }, 201);
}
