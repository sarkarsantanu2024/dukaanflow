import { prisma } from '@/lib/prisma';
import { requireShopWrite } from '@/lib/guard';
import { fail } from '@/lib/http';
import { khataFilename, khataToCsv, type KhataExportEntry } from '@/lib/khata-csv';

export const runtime = 'nodejs';

type Context = { params: Promise<{ slug: string }> };

/**
 * GET — the whole credit book as a spreadsheet.
 *
 * A GET rather than a POST because a download has to be a link: `fetch` into a
 * blob into an anchor works on a laptop and is a coin-toss inside an Android
 * WebView, which is where this will actually be tapped. A plain link with a
 * `Content-Disposition` is what every phone browser already knows how to do.
 *
 * `?customerId=` narrows it to one person, which is the version that gets sent
 * to somebody who is arguing about what they owe.
 *
 * Behind `requireShopWrite`, so the Super Admin and this shop's owner can
 * download it and nobody else can. It is the shop's money.
 */
export async function GET(request: Request, { params }: Context) {
  const { slug } = await params;
  if (!(await requireShopWrite(slug))) return fail('Not authenticated', 401);

  const shop = await prisma.shop.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!shop) return fail('Shop not found', 404);

  const customerId = new URL(request.url).searchParams.get('customerId') ?? '';
  const one = /^[0-9a-f-]{36}$/i.test(customerId) ? customerId : null;

  const entries = await prisma.ledgerEntry.findMany({
    where: { shopId: shop.id, ...(one ? { customerId: one } : {}) },
    // Oldest first: the running balance in the export only means something if
    // the rows above each one are what came before it.
    orderBy: { createdAt: 'asc' },
    select: {
      createdAt: true,
      kind: true,
      amountPaise: true,
      note: true,
      customer: { select: { name: true, phone: true, area: true } },
    },
  });

  const rows: KhataExportEntry[] = entries.map((entry) => ({
    date: entry.createdAt,
    customerName: entry.customer.name,
    customerPhone: entry.customer.phone,
    customerArea: entry.customer.area,
    kind: entry.kind,
    amountPaise: entry.amountPaise,
    note: entry.note,
  }));

  const now = new Date();
  const csv = khataToCsv({ shopName: shop.name, generatedAt: now, entries: rows });

  return new Response(
    // A UTF-8 BOM, and it is not decoration: Excel on Windows reads a CSV
    // without one in the system codepage, so every Bengali and Devanagari name
    // in the shop's own book opens as mojibake. Three bytes fixes it.
    `﻿${csv}`,
    {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${khataFilename(shop.name, now)}"`,
        // Somebody's outstanding balance is not something to leave in a proxy.
        'Cache-Control': 'no-store',
      },
    },
  );
}
