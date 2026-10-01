import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
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

/**
 * `src` with a short hash of the file's contents as `?v=`, for <Image>.
 *
 * next/image keeps its resized copy under the URL, so a screenshot retaken at
 * the same path kept showing the old picture. A new hash means a new URL.
 */
export function versionedSrc(src: string): string {
  try {
    const hash = createHash('sha1').update(readFileSync(path.join(process.cwd(), 'public', src))).digest('hex');
    return `${src}?v=${hash.slice(0, 8)}`;
  } catch {
    return src;
  }
}

/** The first of these that exists, or null. */
export function firstExisting(...candidates: string[]): string | null {
  return candidates.find((src) => publicFileExists(src)) ?? null;
}
