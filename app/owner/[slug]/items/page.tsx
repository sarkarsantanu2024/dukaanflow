import { redirect } from 'next/navigation';

/**
 * The owner's item list is called Inventory in the app and lives at
 * `/owner/<slug>/inventory` — but the console calls the same screen "Items", so
 * `/owner/<slug>/items` is a URL an owner or an operator will type. It used to
 * 404 into the customer's "shop link may be wrong" page.
 */
export default async function OwnerItemsRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/owner/${slug}/inventory`);
}
