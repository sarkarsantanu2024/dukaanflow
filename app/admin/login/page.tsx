import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata = { title: 'DukaanFlow — Admin sign in' };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">DukaanFlow</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Super Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          One password. Shop owners never sign in here.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
