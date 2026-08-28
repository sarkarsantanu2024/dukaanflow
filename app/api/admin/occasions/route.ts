import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { occasionSchema, occasionUpdateSchema } from '@/lib/validators';
import { OCCASION_CATALOGUE } from '@/lib/occasion-catalogue';
import { resolveOccasions } from '@/lib/occasions';
import { shopClock } from '@/lib/time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The occasion calendar — Super Admin only.
 *
 * One list for every shop in the country, scoped by state. Deliberately not a
 * per-shop list: Diwali is Diwali for every shop in India, and asking four
 * hundred shopkeepers to each type it in would produce four hundred spellings
 * and no comparable report.
 *
 * An occasion is a NAME. It is entered once and never edited again, which is
 * what lets the name be a reliable key for comparing one year against the next.
 * When it falls is either arithmetic (a fixed Gregorian date) or a separate
 * yearly entry — see `app/api/admin/occasions/dates/route.ts`.
 */

async function guard(request: Request, needsOrigin: boolean) {
  if (needsOrigin && !sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);
  return null;
}

export async function GET(request: Request) {
  const refused = await guard(request, false);
  if (refused) return refused;

  const url = new URL(request.url);
  const year = Number(url.searchParams.get('year')) || shopClock(new Date()).year;

  return ok({ year, occasions: await resolveOccasions(year) });
}

export async function POST(request: Request) {
  const refused = await guard(request, true);
  if (refused) return refused;

  const body = await readJson(request);

  // One click loads the common Indian occasions. Anything already on the
  // calendar is left exactly as it is — including its dates, which is the whole
  // reason this is an upsert and not a wipe-and-reload.
  if (body && typeof body === 'object' && (body as Record<string, unknown>).seed === true) {
    let added = 0;
    for (const entry of OCCASION_CATALOGUE) {
      const existing = await prisma.occasion.findUnique({
        where: { name_state: { name: entry.name, state: entry.state } },
        select: { id: true },
      });
      if (existing) continue;
      await prisma.occasion.create({ data: entry });
      added += 1;
    }
    return ok({ added, total: OCCASION_CATALOGUE.length }, 201);
  }

  const parsed = occasionSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  const clash = await prisma.occasion.findUnique({
    where: { name_state: { name: parsed.data.name, state: parsed.data.state } },
    select: { id: true },
  });
  if (clash) return fail('That occasion is already on the calendar', 409);

  const occasion = await prisma.occasion.create({
    data: parsed.data,
    select: { id: true },
  });

  return ok(occasion, 201);
}

export async function PATCH(request: Request) {
  const refused = await guard(request, true);
  if (refused) return refused;

  const body = await readJson(request);
  const target = occasionUpdateSchema.safeParse(body);
  if (!target.success) return invalid(target.error);

  const parsed = occasionSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  // Rows already rolled up keep the name they were computed under — they store
  // it as a snapshot, so renaming here cannot relabel what past years hold.
  await prisma.occasion.update({ where: { id: target.data.id }, data: parsed.data });

  return ok({ id: target.data.id });
}

export async function DELETE(request: Request) {
  const refused = await guard(request, true);
  if (refused) return refused;

  const parsed = occasionUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  // Its yearly dates cascade away with it. Rolled-up history does not:
  // `ItemPeriodStat` holds the occasion's name, not a foreign key, precisely so
  // removing a mistyped entry cannot erase what a shop sold during it.
  await prisma.occasion.delete({ where: { id: parsed.data.id } });

  return ok({ id: parsed.data.id });
}
