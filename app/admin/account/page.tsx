import { AdminHeader } from '@/components/admin/AdminHeader';
import { AccountForm } from '@/components/admin/AccountForm';
import { currentAdminCredentials } from '@/lib/password';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const metadata = { title: `${BRAND_NAME} — Sign-in` };

export default async function AccountPage() {
  // Whether this deployment is still on the environment pair or has been moved
  // onto a stored credential. Worth saying plainly: the two behave identically
  // at the sign-in screen, and only one of them can be changed from here.
  const stored = await currentAdminCredentials();
  const fromEnv = stored !== null && !(await hasStoredRow());

  return (
    <>
      <AdminHeader title="Sign-in" eyebrow="Super Admin" backHref="/admin" />

      <main className="px-4 py-5 lg:px-6">
        <p className="mb-5 max-w-lg text-sm leading-relaxed text-slate-600">
          This is the one account that can see every shop. Changing it here takes effect
          immediately and needs no redeploy.
          {fromEnv && (
            <>
              {' '}
              It is currently coming from the <code>ADMIN_USERNAME</code> /{' '}
              <code>ADMIN_PASSWORD_HASH</code> environment variables. Saving once moves it into the
              database, and those variables stop being consulted.
            </>
          )}
        </p>

        <AccountForm />
      </main>
    </>
  );
}

/** Is there a stored credential row, or are we still on the env fallback? */
async function hasStoredRow(): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma');
  const { ADMIN_CREDENTIAL_ID } = await import('@/lib/password');
  try {
    return (
      (await prisma.adminCredential.count({ where: { id: ADMIN_CREDENTIAL_ID } })) > 0
    );
  } catch {
    return false;
  }
}
