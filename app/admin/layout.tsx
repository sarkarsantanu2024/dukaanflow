import type { Metadata } from 'next';

/**
 * Links the manifest on admin pages only. The customer shop page is left
 * install-free on purpose — the whole promise there is scan, order, done.
 */
export const metadata: Metadata = {
  manifest: '/admin.webmanifest',
  appleWebApp: { capable: true, title: 'DukaanFlow', statusBarStyle: 'default' },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
