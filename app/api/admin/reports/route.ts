import { requireAdmin } from '@/lib/guard';
import { fail } from '@/lib/http';
import { buildPeriod, loadReport } from '@/lib/analytics';
import { reportFilename, reportToCsv } from '@/lib/report-csv';
import { parseReportQuery } from '@/lib/report-query';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reports?type=…&granularity=…&year=…&month=…&day=…
 *
 * The same report the console renders, as a CSV attachment. Super Admin only:
 * this is every shop's takings in one file, which no shop owner should be able
 * to pull for the shop next door.
 *
 * A download, not a mutation, so there is no origin check — `sameOrigin` exists
 * to stop a foreign page *writing*, and applying it here would only break the
 * ordinary case of somebody opening the link in a new tab.
 */
export async function GET(request: Request) {
  if (!(await requireAdmin())) return fail('Not authenticated', 401);

  const query = parseReportQuery(new URL(request.url).searchParams);
  const report = await loadReport(
    query,
    buildPeriod(query.granularity, query.year, query.month, query.day),
  );
  const csv = reportToCsv(report);

  return new Response(`﻿${csv}`, {
    headers: {
      // The BOM is what makes Excel open a UTF-8 CSV as UTF-8. Without it,
      // every Bengali and Hindi item name arrives as mojibake.
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${reportFilename(report)}"`,
      'Cache-Control': 'no-store',
    },
  });
}
