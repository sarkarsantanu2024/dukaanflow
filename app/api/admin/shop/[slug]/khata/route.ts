import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { ledgerDeleteSchema, ledgerSchema } from '@/lib/validators';
import { upsertCustomer } from '@/lib/khata';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * POST — write one line of the credit book.
 *
 * Deliberately not gated on the subscription. Udhaar is the shopkeeper's own
 * money, recorded in what is effectively their notebook; locking them out of
 * their own debts over a late payment would be indefensible, and would be the
 * fastest way to lose a shop for good.
 */
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const parsed = ledgerSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { customerPhone, customerName, kind, amount, note } = parsed.data;
  const customer = await upsertCustomer(shop.id, customerPhone, customerName);

  const entry = await prisma.ledgerEntry.create({
    data: { shopId: shop.id, customerId: customer.id, kind, amount, note },
    select: { id: true, createdAt: true },
  });

  return ok({ ...entry, customerId: customer.id }, 201);
}

/** DELETE — remove a mistyped line. The book has to be correctable. */
export async function DELETE(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) return fail('Shop not found', 404);

  const parsed = ledgerDeleteSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  // Scoped by shopId so one shop can never edit another's book.
  const result = await prisma.ledgerEntry.deleteMany({
    where: { id: parsed.data.id, shopId: shop.id },
  });
  if (result.count === 0) return fail('Entry not found', 404);

  return ok({ success: true });
}
