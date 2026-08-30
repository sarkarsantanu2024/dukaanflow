import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { formatPaise } from '@/lib/money';
import { formatDayTime } from '@/lib/time';
import { ownerDict } from '@/lib/owner-i18n';
import { PrintButton } from '@/components/owner/PrintButton';

/**
 * The khata as a piece of paper.
 *
 * A PRINTABLE PAGE RATHER THAN A GENERATED PDF, and that is the right call
 * rather than a shortcut. Every PDF library in JavaScript ships with Latin
 * fonts only: a statement for "রেখা দাস" or "रेखा दास" comes out as boxes
 * unless a Bengali and a Devanagari font are embedded in the bundle, which is
 * megabytes of download on a phone, per shop, for a page that gets printed
 * once. The browser already has those fonts and already has "Save as PDF" in
 * its print dialogue.
 *
 * So: one clean page, print styles, and a button that opens the print
 * dialogue. The shopkeeper gets paper or a PDF, whichever they wanted, and the
 * names are right in both.
 *
 * The spreadsheet is next door at `/api/owner/<slug>/khata/export`, for
 * anything that needs adding up rather than handing over.
 */
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ customerId?: string }>;
};

export const metadata: Metadata = {
  title: 'DukaanFlow — Khata statement',
  robots: { index: false, follow: false },
};

export default async function StatementPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { customerId } = await searchParams;
  // Redirects to the login when the session is not this shop's — the same gate
  // every other owner page runs through.
  const { shop, locale } = await loadOwnerShop(slug);
  const t = ownerDict(locale);

  const one = customerId && /^[0-9a-f-]{36}$/i.test(customerId) ? customerId : null;

  const entries = await prisma.ledgerEntry.findMany({
    where: { shopId: shop.id, ...(one ? { customerId: one } : {}) },
    // Oldest first. A statement is read forwards, and the running balance is
    // only meaningful in that order.
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      createdAt: true,
      kind: true,
      amountPaise: true,
      note: true,
      customer: { select: { name: true, phone: true, area: true } },
    },
  });

  // Computed as the rows are laid out, so the number at the foot is provably
  // the sum of the column above it rather than a second opinion about it.
  let balancePaise = 0;
  const rows = entries.map((entry) => {
    balancePaise += entry.kind === 'DEBIT' ? entry.amountPaise : -entry.amountPaise;
    return { ...entry, runningPaise: balancePaise };
  });

  const who = one ? entries[0]?.customer : null;

  return (
    <div className="min-h-dvh bg-white p-6 print:p-0">
      <div className="mx-auto max-w-3xl">
        {/* Gone from the printout: nobody wants a Back link on their paper. */}
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link
            href={`/owner/${slug}/khata`}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold leading-10 text-slate-700"
          >
            ← {t.tabKhata}
          </Link>
          <a
            href={`/api/owner/${slug}/khata/export${one ? `?customerId=${one}` : ''}`}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold leading-10 text-slate-700"
          >
            {t.khataExportCsv}
          </a>
          <PrintButton label={t.khataExportPdf} />
        </div>

        <header className="border-b border-slate-300 pb-3">
          <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
          <p className="text-sm text-slate-600">
            {t.khataTitle} · {t.khataStatement}
          </p>
          {who && (
            <p className="mt-1 text-base font-semibold text-slate-900">
              {who.name || '—'} · {who.phone}
              {who.area ? ` · ${who.area}` : ''}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">{formatDayTime(new Date().toISOString())}</p>
        </header>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-slate-600">
              <th className="py-1.5 pr-2 font-semibold">{t.khataHistory}</th>
              {!one && <th className="py-1.5 pr-2 font-semibold">{t.khataCustomer}</th>}
              <th className="py-1.5 pr-2 font-semibold">{t.khataGave}</th>
              <th className="py-1.5 pr-2 font-semibold">{t.khataGot}</th>
              <th className="py-1.5 text-right font-semibold">{t.khataTotal}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-100 align-top">
                <td className="py-1.5 pr-2 text-slate-600">
                  {formatDayTime(entry.createdAt.toISOString())}
                  {entry.note && <span className="block text-xs text-slate-400">{entry.note}</span>}
                </td>
                {!one && (
                  <td className="py-1.5 pr-2 text-slate-700">
                    {entry.customer.name || '—'}
                    <span className="block text-xs text-slate-400">{entry.customer.phone}</span>
                  </td>
                )}
                <td className="py-1.5 pr-2 tabular-nums text-slate-800">
                  {entry.kind === 'DEBIT' ? formatPaise(entry.amountPaise) : ''}
                </td>
                <td className="py-1.5 pr-2 tabular-nums text-slate-800">
                  {entry.kind === 'CREDIT' ? formatPaise(entry.amountPaise) : ''}
                </td>
                <td className="py-1.5 text-right font-semibold tabular-nums text-slate-900">
                  {formatPaise(entry.runningPaise)}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  {t.khataNobody}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <p className="mt-4 flex justify-between border-t-2 border-slate-800 pt-2 text-lg font-bold text-slate-900">
          <span>{t.khataTotal}</span>
          <span className="tabular-nums">{formatPaise(balancePaise)}</span>
        </p>
      </div>
    </div>
  );
}

