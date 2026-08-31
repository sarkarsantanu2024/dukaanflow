import { AdminHeader } from '@/components/admin/AdminHeader';
import { ShopForm } from '@/components/admin/ShopForm';
import { ShopArt } from '@/components/ui/ShopArt';
import { TRIAL_DAYS } from '@/lib/plans';
import { BRAND_NAME } from '@/lib/brand';

export const metadata = { title: `${BRAND_NAME} — New shop` };

const STEPS = [
  'Fill this in — only the name and WhatsApp number are required.',
  'Print the QR poster and stick it on the counter.',
  'Send the owner their app link on WhatsApp, from the shop page.',
  'They add items by speaking, in their own language.',
];

export default function NewShopPage() {
  return (
    <>
      <AdminHeader title="Add shop" backHref="/admin" />

      {/* The form keeps a readable measure; the width left over carries what
          happens next, rather than sitting empty either side of it. */}
      <main className="grid items-start gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-6">
        <div className="min-w-0">
          <ShopForm />
        </div>

        <aside className="space-y-4 rounded-2xl bg-white p-5 shadow-card lg:sticky lg:top-[4.25rem]">
          <ShopArt className="h-28 w-full" />
          <h2 className="font-semibold text-slate-900">What happens after this</h2>
          <ol className="space-y-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-slate-600">
                <span
                  aria-hidden
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700"
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
            Every new shop starts on {TRIAL_DAYS} days of Pro. Nothing is charged until you record a
            payment against it.
          </p>
        </aside>
      </main>
    </>
  );
}
