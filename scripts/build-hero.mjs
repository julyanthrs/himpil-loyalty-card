// Builds the Home hero photo from design/photo-source/hero-himpil.webp.
// The source has the Himpil logo printed on it; the hero renders the logo itself, so the printed
// one is removed: logo pixels are masked and filled from the surrounding out-of-focus background,
// then light grain is added so the patch matches the photo.
//   public/images/hero-himpil.webp (1467w) and hero-himpil-sm.webp (800w)
// Run with: node scripts/build-hero.mjs
import sharp from 'sharp';
import { REGION, backgroundBehindLogo, loadPhoto, logoMask } from './lib/photo-logo.mjs';

const photo = await loadPhoto();
const m = logoMask(photo);
const filled = backgroundBehindLogo(photo, m);

let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const out = Buffer.from(photo.data);
for (let y = 0; y < m.rh; y++) for (let x = 0; x < m.rw; x++) {
  if (!m.mask[y * m.rw + x]) continue;
  const i = ((y + REGION.y0) * photo.W + (x + REGION.x0)) * 3;
  const grain = (rand() + rand() + rand() - 1.5) * 4;
  for (let c = 0; c < 3; c++) out[i + c] = Math.max(0, Math.min(255, Math.round(filled[(y * m.rw + x) * 3 + c] + grain)));
}

const img = sharp(out, { raw: { width: photo.W, height: photo.H, channels: 3 } });
await img.clone().webp({ quality: 78 }).toFile('public/images/hero-himpil.webp');
await img.clone().resize(800).webp({ quality: 74 }).toFile('public/images/hero-himpil-sm.webp');
console.log('Hero built.');
