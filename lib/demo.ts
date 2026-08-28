/**
 * Whether this operator wants to see demonstration shops.
 *
 * Read on the server so the pages that filter on it can do the filtering in the
 * database, and read from one place so the shops list, the reports and anything
 * added later cannot disagree about what is currently visible.
 *
 * Hidden by default. A demo shop counted among the live ones is a wrong number
 * on the dashboard somebody eventually quotes.
 */

import { cookies } from 'next/headers';

export const DEMO_COOKIE = 'df_show_demo';

export async function showingDemoShops(): Promise<boolean> {
  const store = await cookies();
  return store.get(DEMO_COOKIE)?.value === '1';
}

/** A `Shop` where-clause fragment: `{}` when showing, or real shops only. */
export function demoFilter(showing: boolean): { isDemo?: false } {
  return showing ? {} : { isDemo: false };
}
