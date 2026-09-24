import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { phoneSchema } from '@/lib/validators';
import { upsertCustomer } from '@/lib/khata';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * ONE CUSTOMER, BY PHONE — so a known customer is never asked their details
 * again.
 *
 * The till's bill popup asks who a bill is for. When the number typed belongs
 * to somebody this shop already knows, the stored name and para are used as
 * they are and the form is not shown: asking again is how one customer ends up
 * as "Rekha", "Rekha Das" and "রেখা" — three spellings of one person, which
 * the khata and every report then treat as three people.
 *
 * Scoped to the signed-in shop, and only name, phone and area come back.
 */
async function shopIdFor(slug: string): Promise<string | null> {
  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  return shop?.id ?? null;
}

/** GET ?phone= — the stored customer for this number, or null. */
export async function GET(request: Request, { params }: Context) {
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);
  const shopId = await shopIdFor(slug);
  if (!shopId) return fail('Shop not found', 404);

  const parsed = phoneSchema.safeParse(new URL(request.url).searchParams.get('phone') ?? '');
  if (!parsed.success) return invalid(parsed.error);

  const customer = await prisma.customer.findUnique({
    where: { shopId_phone: { shopId, phone: parsed.data } },
    select: { name: true, phone: true, area: true },
  });
  return ok({ customer });
}

const saveSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().max(60).default(''),
  area: z.string().trim().max(60).default(''),
});

/**
 * POST — remember a customer met at the counter, keyed by phone.
 *
 * `upsertCustomer` never overwrites a stored field with a blank, and a stored
 * name is left alone here: the name a regular already has is the one the khata
 * knows them by, and a second spelling typed at the counter must not replace it.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);
  const shopId = await shopIdFor(slug);
  if (!shopId) return fail('Shop not found', 404);

  const parsed = saveSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);
  const { phone, name, area } = parsed.data;

  const existing = await prisma.customer.findUnique({
    where: { shopId_phone: { shopId, phone } },
    select: { name: true, phone: true, area: true },
  });
  if (existing) return ok({ customer: existing, created: false });

  const customer = await upsertCustomer(shopId, phone, name, area);
  return ok({ customer: { name: customer.name, phone: customer.phone, area: customer.area }, created: true }, 201);
}
