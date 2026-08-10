/** Combining diacritical marks, U+0300–U+036F. */
const COMBINING_MARKS = /[̀-ͯ]/g;

/** URL-safe slug: lowercase, ASCII, hyphen-separated. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

/**
 * Appends -2, -3, … until the slug is free. `exists` is injected so this stays
 * a pure function and can be tested without a database.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'shop';
  if (!(await exists(root))) return root;
  for (let n = 2; n < 100; n++) {
    const candidate = `${root}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
