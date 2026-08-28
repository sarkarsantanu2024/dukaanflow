import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/guard';
import { fail, invalid, ok, readJson, sameOrigin } from '@/lib/http';
import { occasionDateSchema, occasionUpdateSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * When a moving occasion fell, in one year.
 *
 * Separate from the occasion itself because it is a different kind of fact with
 * a different lifetime: the name is entered once and never touched, the dates
 * are a short yearly job for the handful of occasions that move. Fixed-date
 * occasions never come here at all.
 *
 * The year is taken from the start date rather than sent alongside it — two
 * sources for one fact is two chances to disagree.
 */

async function guard(request: Request) {
  if (!sameOrigin(request)) return fail('Bad request', 403);
  if (!(await requireAdmin())) return fail('Not authenticated', 401);
  return null;
}

function toDateOnly(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export async function PUT(request: Request) {
  const refused = await guard(request);
  if (refused) return refused;

  const parsed = occasionDateSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { occasionId, startsOn, endsOn } = parsed.data;
  const year = Number(startsOn.slice(0, 4));

  const occasion = await prisma.occasion.findUnique({
    where: { id: occasionId },
    select: { id: true },
  });
  if (!occasion) return fail('Unknown occasion', 404);

  // Upsert, so correcting a date somebody got wrong is the same action as
  // entering it. Nothing downstream is recomputed here: the numbers move when
  // the rollup next runs, which the console says out loud.
  await prisma.occasionDate.upsert({
    where: { occasionId_year: { occasionId, year } },
    create: { occasionId, year, startsOn: toDateOnly(startsOn), endsOn: toDateOnly(endsOn) },
    update: { startsOn: toDateOnly(startsOn), endsOn: toDateOnly(endsOn) },
  });

  return ok({ occasionId, year });
}

export async function DELETE(request: Request) {
  const refused = await guard(request);
  if (refused) return refused;

  const body = await readJson(request);
  const target = occasionUpdateSchema.safeParse(body);
  if (!target.success) return invalid(target.error);

  const year = Number((body as Record<string, unknown>)?.year);
  if (!Number.isInteger(year)) return fail('Which year?', 422);

  await prisma.occasionDate.deleteMany({ where: { occasionId: target.data.id, year } });

  return ok({ id: target.data.id, year });
}
