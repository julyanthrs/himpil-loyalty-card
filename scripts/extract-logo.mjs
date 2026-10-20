// Extracts the official Himpil logo printed on the hero photo and traces it into vector paths.
//   1. Matte: alpha = how far each pixel moved from the reconstructed background toward the logo cream.
//   2. Upscale the alpha 4× and trace it with potrace.
//   3. Split into mark / wordmark / Baybayin line by the empty rows between them.
// Writes src/brand/logo-official.json (SVG paths in one shared coordinate space).
// Run with: node scripts/extract-logo.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import { REGION, backgroundBehindLogo, loadPhoto, logoMask } from './lib/photo-logo.mjs';

const potrace = createRequire(import.meta.url)('potrace');
const SCALE = 4;

const photo = await loadPhoto();
const m = logoMask(photo, 6);
const bg = backgroundBehindLogo(photo, m);
const { rw, rh } = m;

// Logo color: average of clearly-inside pixels.
const F = [0, 0, 0];
let n = 0;
for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
  const i = ((y + REGION.y0) * photo.W + (x + REGION.x0)) * 3;
  const L = 0.299 * photo.data[i] + 0.587 * photo.data[i + 1] + 0.114 * photo.data[i + 2];
  if (L > 185) { for (let c = 0; c < 3; c++) F[c] += photo.data[i + c]; n++; }
}
for (let c = 0; c < 3; c++) F[c] /= n;

// Alpha matte (0 = background, 255 = logo), drawn as dark-on-white for potrace.
const ink = Buffer.alloc(rw * rh);
const alpha = new Float32Array(rw * rh);
for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
  const k = y * rw + x;
  if (!m.mask[k]) { ink[k] = 255; continue; }
  const i = ((y + REGION.y0) * photo.W + (x + REGION.x0)) * 3;
  let num = 0, den = 0;
  for (let c = 0; c < 3; c++) {
    const d = F[c] - bg[k * 3 + c];
    num += (photo.data[i + c] - bg[k * 3 + c]) * d;
    den += d * d;
  }
  const a = Math.max(0, Math.min(1, num / den));
  alpha[k] = a;
  ink[k] = Math.round(255 * (1 - a));
}

// Bounding rows of each part (gaps of empty rows separate them).
const rowHas = [];
let minX = rw, maxX = 0;
for (let y = 0; y < rh; y++) {
  let any = false;
  for (let x = 0; x < rw; x++) if (alpha[y * rw + x] > 0.5) { any = true; minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
  rowHas.push(any);
}
const bands = [];
let start = -1;
rowHas.forEach((on, y) => {
  if (on && start < 0) start = y;
  if (!on && start >= 0) { if (y - start > 3) bands.push([start, y - 1]); start = -1; }
});
if (start >= 0) bands.push([start, rh - 1]);
// The Baybayin vowel marks sit just above their letters; merge bands separated by a hairline gap.
for (let b = bands.length - 1; b > 0; b--) {
  if (bands[b][0] - bands[b - 1][1] <= 3) bands.splice(b - 1, 2, [bands[b - 1][0], bands[b][1]]);
}
console.log('logo color', F.map(Math.round), 'bands', bands, 'x', minX, maxX);
if (bands.length !== 3) throw new Error(`Expected 3 logo parts (mark, wordmark, script), found ${bands.length}`);

const PAD = 3;
const x0 = Math.max(0, minX - PAD), x1 = Math.min(rw - 1, maxX + PAD);
const big = await sharp(ink, { raw: { width: rw, height: rh, channels: 1 } })
  .extract({ left: x0, top: 0, width: x1 - x0 + 1, height: rh })
  .resize((x1 - x0 + 1) * SCALE, rh * SCALE, { kernel: 'lanczos3' })
  .png()
  .toBuffer();

function trace(buf) {
  return new Promise((resolve, reject) => {
    const p = new potrace.Potrace();
    p.setParameters({ threshold: 128, turdSize: 40, optTolerance: 0.25, alphaMax: 1 });
    p.loadImage(buf, (err) => (err ? reject(err) : resolve(p.getPathTag())));
  });
}

const parts = {};
const names = ['mark', 'wordmark', 'script'];
for (let b = 0; b < 3; b++) {
  const [top, bottom] = bands[b];
  const t = Math.max(0, top - PAD) * SCALE, h = (Math.min(rh - 1, bottom + PAD) - Math.max(0, top - PAD) + 1) * SCALE;
  const slice = await sharp(big).extract({ left: 0, top: t, width: (x1 - x0 + 1) * SCALE, height: h }).png().toBuffer();
  // Tight horizontal bounds for this part.
  const { data, info } = await sharp(slice).raw().toBuffer({ resolveWithObject: true });
  let lx = info.width, hx = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * info.channels] < 128) { lx = Math.min(lx, x); hx = Math.max(hx, x); }
  const tag = await trace(slice);
  const d = tag.match(/ d="([^"]+)"/)[1];
  parts[names[b]] = { x: lx, y: t, width: hx - lx + 1, height: h, d };
}

// Shared coordinate space = the full upscaled crop; each part keeps its own offset.
const out = {
  _comment: 'Official Himpil logo, traced from design/photo-source/hero-himpil.webp by scripts/extract-logo.mjs. Do not edit by hand.',
  width: (x1 - x0 + 1) * SCALE,
  height: rh * SCALE,
  // Where the logo sits on the source photo (logo units = photo px × scale), and its printed color,
  // so the hero can draw it back in exactly the same place.
  photo: { width: photo.W, height: photo.H, x: REGION.x0 + x0, y: REGION.y0, scale: SCALE },
  color: '#' + F.map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''),
  parts,
};
fs.writeFileSync('src/brand/logo-official.json', JSON.stringify(out));
console.log('Logo traced:', Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, `${v.width}x${v.height}, ${v.d.length} chars`])));
