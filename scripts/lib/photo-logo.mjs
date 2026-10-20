// Shared by build-hero.mjs and extract-logo.mjs: finds the Himpil logo printed on the hero photo
// and reconstructs the background behind it.
import sharp from 'sharp';

export const SRC = 'design/photo-source/hero-himpil.webp';
export const REGION = { x0: 150, y0: 290, x1: 640, y1: 680 }; // around the printed logo

export async function loadPhoto() {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
}

const lum = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

/** Mask of the cream logo inside REGION (bright, warm, low-saturation), grown over its soft edges. */
export function logoMask({ data, W }, dilate = 4) {
  const rw = REGION.x1 - REGION.x0, rh = REGION.y1 - REGION.y0;
  let mask = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const i = ((y + REGION.y0) * W + (x + REGION.x0)) * 3;
    if (lum(data, i) > 92 && data[i] - data[i + 2] < 80) mask[y * rw + x] = 1;
  }
  for (let d = 0; d < dilate; d++) {
    const next = mask.slice();
    for (let y = 1; y < rh - 1; y++) for (let x = 1; x < rw - 1; x++) {
      if (mask[y * rw + x]) continue;
      if (mask[y * rw + x - 1] || mask[y * rw + x + 1] || mask[(y - 1) * rw + x] || mask[(y + 1) * rw + x]) next[y * rw + x] = 1;
    }
    mask = next;
  }
  return { mask, rw, rh };
}

/** Push-pull fill: average known pixels down a pyramid, then fill holes from the coarser level. */
function pushPull(img, known, w, h) {
  if (w <= 2 || h <= 2) return img;
  const w2 = Math.ceil(w / 2), h2 = Math.ceil(h / 2);
  const small = new Float32Array(w2 * h2 * 3), sKnown = new Float32Array(w2 * h2);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = known[y * w + x];
    if (!k) continue;
    const j = (y >> 1) * w2 + (x >> 1);
    for (let c = 0; c < 3; c++) small[j * 3 + c] += img[(y * w + x) * 3 + c] * k;
    sKnown[j] += k;
  }
  for (let j = 0; j < w2 * h2; j++) if (sKnown[j] > 0) { for (let c = 0; c < 3; c++) small[j * 3 + c] /= sKnown[j]; sKnown[j] = 1; }
  const filled = pushPull(small, sKnown, w2, h2);
  const out = img.slice();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (known[y * w + x]) continue;
    const fx = Math.min(w2 - 1, Math.max(0, x / 2 - 0.25)), fy = Math.min(h2 - 1, Math.max(0, y / 2 - 0.25));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(w2 - 1, x0 + 1), y1 = Math.min(h2 - 1, y0 + 1);
    const tx = fx - x0, ty = fy - y0;
    for (let c = 0; c < 3; c++) {
      const a = filled[(y0 * w2 + x0) * 3 + c] * (1 - tx) + filled[(y0 * w2 + x1) * 3 + c] * tx;
      const b = filled[(y1 * w2 + x0) * 3 + c] * (1 - tx) + filled[(y1 * w2 + x1) * 3 + c] * tx;
      out[(y * w + x) * 3 + c] = a * (1 - ty) + b * ty;
    }
  }
  return out;
}

/** Background behind the logo for every pixel in REGION (Float32 RGB, rw × rh). */
export function backgroundBehindLogo(photo, { mask, rw, rh }) {
  const region = new Float32Array(rw * rh * 3);
  const known = new Float32Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const i = ((y + REGION.y0) * photo.W + (x + REGION.x0)) * 3;
    for (let c = 0; c < 3; c++) region[(y * rw + x) * 3 + c] = photo.data[i + c];
    known[y * rw + x] = mask[y * rw + x] ? 0 : 1;
  }
  return pushPull(region, known, rw, rh);
}
