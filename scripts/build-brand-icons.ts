/**
 * Regenerates every rendition of the Halkhata mark from one master image.
 *
 *   npx tsx scripts/build-brand-icons.ts <path-to-source.png>
 *
 * The mark used to be a vector in `lib/brand.ts`, which needed no build step:
 * one shape took `currentColor` and served the header, the favicon and the
 * launcher tile. It is now a supplied full-colour illustration, so each size is
 * a separate file — and files cut by hand drift. This script is the reason they
 * do not: change the artwork, run it, commit what it writes.
 *
 * WHAT IT DOES TO THE SOURCE, AND WHY:
 *
 *   - TRIMS the transparent margin, then re-pads to a square. The supplied art
 *     sits off centre with a soft shadow under the shopfront, so scaling it
 *     directly makes every launcher icon look like it has slipped down inside
 *     its tile.
 *   - PUTS WHITE BEHIND the launcher and Apple sizes. iOS composites a
 *     transparent icon onto black, which would stand this artwork's white
 *     shopfront on a black ground.
 *   - LEAVES the in-page sizes transparent, because they sit on the console's
 *     dark rail as often as on white.
 *
 * `sharp` arrives with Next and is not a declared dependency of this project.
 * That is fine for a tool run by hand a few times a year; if it ever moves into
 * the build, add it to devDependencies first.
 */

import { statSync } from 'node:fs';
import sharp from 'sharp';

const SOURCE = process.argv[2] ?? 'public/brand/halkhata-logo.png';

/** Every rendition, and what each one is for. */
const RENDITIONS = [
  { file: 'public/brand/halkhata-logo.png', size: 468, white: false, inset: 1, use: 'master' },
  { file: 'public/brand/halkhata-logo-96.png', size: 96, white: false, inset: 1, use: 'header, poster' },
  { file: 'public/brand/halkhata-logo-192.png', size: 192, white: true, inset: 1, use: 'manifest any' },
  { file: 'public/brand/halkhata-logo-512.png', size: 512, white: true, inset: 1, use: 'manifest any' },
  // Android crops a maskable icon to a circle or squircle. Holding the art
  // inside the middle 62% guarantees the awning and the arrow survive the crop.
  { file: 'public/brand/halkhata-logo-maskable-512.png', size: 512, white: true, inset: 0.62, use: 'manifest maskable' },
  { file: 'app/icon.png', size: 64, white: false, inset: 1, use: 'favicon' },
  { file: 'app/apple-icon.png', size: 180, white: true, inset: 1, use: 'iOS home screen' },
];

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function main() {
  const trimmed = await sharp(SOURCE).trim({ threshold: 2 }).toBuffer();
  const { width = 0, height = 0 } = await sharp(trimmed).metadata();
  const side = Math.max(width, height);

  const square = await sharp({
    create: { width: side, height: side, channels: 4, background: TRANSPARENT },
  })
    .composite([{ input: trimmed, gravity: 'centre' }])
    .png()
    .toBuffer();

  console.log(`source ${SOURCE} — trimmed to ${width}×${height}, squared to ${side}`);

  for (const { file, size, white, inset, use } of RENDITIONS) {
    const glyph = Math.round(size * inset);
    const layer = await sharp(square)
      .resize(glyph, glyph, { fit: 'contain', background: TRANSPARENT })
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: white ? WHITE : TRANSPARENT },
    })
      .composite([{ input: layer, gravity: 'centre' }])
      .png({ compressionLevel: 9 })
      .toFile(file);

    const kb = (statSync(file).size / 1024).toFixed(1);
    console.log(`  ${file.padEnd(44)} ${String(size).padStart(3)}px  ${kb.padStart(6)} KB  ${use}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
