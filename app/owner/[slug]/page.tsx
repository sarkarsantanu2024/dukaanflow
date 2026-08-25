import { redirect } from 'next/navigation';

type PageProps = { params: Promise<{ slug: string }> };

/** The till is the daily screen, so it is where the app opens. */
export default async function OwnerHome({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/owner/${slug}/sell`);
}
