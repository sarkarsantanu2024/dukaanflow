import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { loadOwnerShop } from '@/lib/owner-page';
import { formatPaise } from '@/lib/money';
import { accountsOf } from '@/lib/khata-csv';
import { formatDayTime } from '@/lib/time';
import { ownerDict } from '@/lib/owner-i18n';
import { PrintButton } from '@/components/owner/PrintButton';
import { BRAND_NAME } from '@/lib/brand';

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
  title: `${BRAND_NAME} — Khata statement`,
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

  /**
   * ONE SECTION PER PERSON, EACH WITH ITS OWN RUNNING BALANCE.
   *
   * This walked a single counter down every entry in date order, so on the
   * whole-shop statement the total beside one customer's row included every
   * other customer's debt incurred before it — the same fault the CSV had.
   * A running balance is a fact about one account and nothing else.
   *
   * Grouping also makes the printed page useful: each person starts a new sheet
   * (`break-before-page`), so "print to PDF" gives the shopkeeper one page per
   * customer to hand over, rather than a ledger they have to point at.
   */
  const accounts = accountsOf(
    entries.map((entry) => ({
      date: entry.createdAt,
      customerName: entry.customer.name,
      customerPhone: entry.customer.phone,
      customerArea: entry.customer.area,
      kind: entry.kind,
      amountPaise: entry.amountPaise,
      note: entry.note,
    })),
  );

  const totalPaise = accounts.reduce((sum, account) => sum + account.balancePaise, 0);
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

        {accounts.length === 0 && (
          <p className="py-10 text-center text-slate-500">{t.khataNobody}</p>
        )}

        {accounts.map((account, index) => {
          // The counter restarts with each person. See the note above.
          let runningPaise = 0;
          return (
            <section
              key={`${account.phone}-${account.name}`}
              // Each customer starts a fresh sheet when this is printed, so the
              // shopkeeper can hand one person their own page. Never before the
              // first — that would print a blank leading sheet every time.
              className={index > 0 ? 'break-before-page pt-6 print:pt-0' : ''}
            >
              {/* On the single-customer statement the name is already in the
                  header above; repeating it here would print it twice. */}
              {!one && (
                <h2 className="mt-6 border-b border-slate-300 pb-1 text-base font-bold text-slate-900">
                  {account.name}
                  <span className="ml-2 font-normal text-slate-500">
                    {account.phone}
                    {account.area ? ` · ${account.area}` : ''}
                  </span>
                </h2>
              )}

              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300 text-left text-slate-600">
                    <th className="py-1.5 pr-2 font-semibold">{t.khataHistory}</th>
                    <th className="py-1.5 pr-2 font-semibold">{t.khataGave}</th>
                    <th className="py-1.5 pr-2 font-semibold">{t.khataGot}</th>
                    <th className="py-1.5 text-right font-semibold">{t.khataTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {account.entries.map((entry, row) => {
                    runningPaise +=
                      entry.kind === 'DEBIT' ? entry.amountPaise : -entry.amountPaise;
                    return (
                      <tr
                        key={`${entry.date.toISOString()}-${row}`}
                        className="border-b border-slate-100 align-top"
                      >
                        <td className="py-1.5 pr-2 text-slate-600">
                          {formatDayTime(entry.date.toISOString())}
                          {entry.note && (
                            <span className="block text-xs text-slate-400">{entry.note}</span>
                          )}
                        </td>
                        <td className="py-1.5 pr-2 tabular-nums text-slate-800">
                          {entry.kind === 'DEBIT' ? formatPaise(entry.amountPaise) : ''}
                        </td>
                        <td className="py-1.5 pr-2 tabular-nums text-slate-800">
                          {entry.kind === 'CREDIT' ? formatPaise(entry.amountPaise) : ''}
                        </td>
                        <td className="py-1.5 text-right font-semibold tabular-nums text-slate-900">
                          {formatPaise(runningPaise)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <p className="mt-2 flex justify-between border-t-2 border-slate-800 pt-2 text-lg font-bold text-slate-900">
                <span>{t.khataTotal}</span>
                <span className="tabular-nums">{formatPaise(account.balancePaise)}</span>
              </p>
            </section>
          );
        })}

        {/* The shop's whole book only, and only when there is more than one
            account in it — under a single customer's total it would be the
            same number printed twice. */}
        {accounts.length > 1 && (
          <p className="mt-6 flex justify-between border-t-4 border-double border-slate-800 pt-2 text-lg font-bold text-slate-900">
            <span>{t.khataTotal}</span>
            <span className="tabular-nums">{formatPaise(totalPaise)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

