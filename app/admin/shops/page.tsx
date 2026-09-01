import { redirect } from 'next/navigation';

/**
 * `/admin/shops` is what the console's own nav calls "Shops", so it is the URL
 * an operator types — and it 404'd, with the customer-facing "this shop link may
 * be wrong" copy. The shop list lives at `/admin`; send them there rather than
 * teaching them the app's internal routing.
 */
export default function ShopsRedirect() {
  redirect('/admin');
}
