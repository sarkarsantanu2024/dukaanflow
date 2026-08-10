import { AdminHeader } from '@/components/admin/AdminHeader';
import { ShopForm } from '@/components/admin/ShopForm';

export const metadata = { title: 'DukaanFlow — New shop' };

export default function NewShopPage() {
  return (
    <div className="min-h-dvh bg-slate-100">
      <AdminHeader title="Add shop" backHref="/admin" />
      <main className="mx-auto max-w-lg px-4 py-6">
        <ShopForm />
      </main>
    </div>
  );
}
