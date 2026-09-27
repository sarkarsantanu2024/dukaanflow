import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Which landing-page media files actually exist in `public/`.
 *
 * SERVER ONLY. The landing page is prerendered at build time, so this runs
 * once per build against the files in the repository: add a screenshot or a
 * thumbnail, redeploy, and it appears. Kept apart from `landing-media.ts`
 * because that file is also read by client components, which cannot import
 * `node:fs`.
 */
export function publicFileExists(src: string): boolean {
  if (!src || !src.startsWith('/')) return false;
  try {
    return existsSync(path.join(process.cwd(), 'public', src));
  } catch {
    return false;
  }
}

/** The first of these that exists, or null. */
export function firstExisting(...candidates: string[]): string | null {
  return candidates.find((src) => publicFileExists(src)) ?? null;
}
