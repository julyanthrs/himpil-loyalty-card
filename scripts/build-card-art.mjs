// Builds the digital loyalty card from the original Himpil card artwork in design/card-source/.
//   public/brand/card-front.webp        — the front, unchanged
//   public/brand/card-back.webp         — the back with the printed paragraph removed (re-set as live text)
//   public/brand/card-back-filled.webp  — the back with every cup filled in (shown per cup for collected stamps)
//   src/brand/card-back.json            — each cup's bounding box in % of the card, for positioning stamps
// Run with: node scripts/build-card-art.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const SRC_FRONT = 'design/card-source/card-front.jpg';
const SRC_BACK = 'design/card-source/card-back.jpg';

await sharp(SRC_FRONT).webp({ quality: 82 }).toFile('public/brand/card-front.webp');

// ---- 1. Remove the printed paragraph. The panel is a translucent wash over the bean engraving,
//         so the text band is replaced with the same engraving taken from the card front (below its
//         lettering), color-matched to the back panel, and feathered into the surrounding pixels.
const TEXT = { left: 60, top: 386, width: 930, height: 170 };
const FEATHER = 14;

async function rawOf(input) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
function stats(img, rects) {
  const sum = [0, 0, 0], sq = [0, 0, 0];
  let n = 0;
  for (const [x0, y0, x1, y1] of rects) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * img.w + x) * 3;
    for (let c = 0; c < 3; c++) { sum[c] += img.data[i + c]; sq[c] += img.data[i + c] ** 2; }
    n++;
  }
  const mean = sum.map((s) => s / n);
  return { mean, std: sq.map((s, c) => Math.sqrt(s / n - mean[c] ** 2)) };
}

const back = await rawOf(SRC_BACK);
const front = await rawOf(SRC_FRONT);
// Panel areas on the back free of cups and text; engraving on the front below "LOYALTY CARD".
const target = stats(back, [[70, 45, 180, 380], [875, 45, 985, 380], [300, 212, 760, 230]]);
const srcRect = [60, 425, 60 + TEXT.width, 425 + TEXT.height];
const source = stats(front, [srcRect]);

const cleanRaw = Buffer.from(back.data);
for (let y = 0; y < TEXT.height; y++) for (let x = 0; x < TEXT.width; x++) {
  const bx = TEXT.left + x, by = TEXT.top + y;
  const fi = ((srcRect[1] + y) * front.w + (srcRect[0] + x)) * 3;
  const bi = (by * back.w + bx) * 3;
  const edge = Math.min(x, y, TEXT.width - 1 - x, TEXT.height - 1 - y);
  const t = Math.min(1, edge / FEATHER);
  for (let c = 0; c < 3; c++) {
    const v = ((front.data[fi + c] - source.mean[c]) / source.std[c]) * target.std[c] + target.mean[c];
    cleanRaw[bi + c] = Math.round(back.data[bi + c] * (1 - t) + Math.max(0, Math.min(255, v)) * t);
  }
}
const cleanBuf = await sharp(cleanRaw, { raw: { width: back.w, height: back.h, channels: 3 } }).png().toBuffer();
await sharp(cleanBuf).webp({ quality: 82 }).toFile('public/brand/card-back.webp');

// ---- 2. Find each cup and fill its enclosed regions.
const { data, info } = await sharp(cleanBuf).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const lum = (x, y) => { const i = (y * W + x) * C; return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };
const isLine = (x, y) => lum(x, y) < 122;

const COLS = [[194, 284], [339, 429], [484, 574], [629, 719], [767, 857]];
const ROWS = [[69, 203], [237, 371]];
const PAD = 8;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const FILL = { lid: hex('#EBDCC6'), body: hex('#F3E8D8'), sleeve: hex('#C9A37E'), bean: hex('#6B4A32'), free: hex('#FBF7F0') };

const cups = [];
const out = Buffer.from(data);

ROWS.forEach(([y0, y1], r) => COLS.forEach(([x0, x1], c) => {
  const bx0 = x0 - PAD - 6, bx1 = x1 + PAD + 6, by0 = y0 - PAD, by1 = y1 + PAD;
  const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1;
  const idx = (x, y) => (y - by0) * bw + (x - bx0);
  // Exterior = flood fill from the box edge through non-line pixels.
  const ext = new Uint8Array(bw * bh);
  const stack = [];
  for (let x = bx0; x <= bx1; x++) stack.push([x, by0], [x, by1]);
  for (let y = by0; y <= by1; y++) stack.push([bx0, y], [bx1, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < bx0 || x > bx1 || y < by0 || y > by1) continue;
    const k = idx(x, y);
    if (ext[k] || isLine(x, y)) continue;
    ext[k] = 1;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  // Tight bounds of the drawing (line pixels touching the interior).
  let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) if (!ext[idx(x, y)]) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  // Interior components.
  const comp = new Int32Array(bw * bh).fill(-1);
  const comps = [];
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
    const k = idx(x, y);
    if (ext[k] || isLine(x, y) || comp[k] >= 0) continue;
    const id = comps.length, px = [];
    const st = [[x, y]];
    while (st.length) {
      const [a, b] = st.pop();
      if (a < bx0 || a > bx1 || b < by0 || b > by1) continue;
      const kk = idx(a, b);
      if (ext[kk] || comp[kk] >= 0 || isLine(a, b)) continue;
      comp[kk] = id; px.push([a, b]);
      st.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]);
    }
    comps.push(px);
  }
  const isFree = r === 1 && c === 4;
  const cx = (minX + maxX) / 2, h = maxY - minY;
  // The sleeve is the band that wraps the bean: the largest component in the middle third.
  const stats = comps.map((px) => {
    let sx = 0, sy = 0, lx = 1e9, hx = -1;
    for (const [a, b] of px) { sx += a; sy += b; lx = Math.min(lx, a); hx = Math.max(hx, a); }
    return { n: px.length, mx: sx / px.length, my: (sy / px.length - minY) / h, w: hx - lx };
  });
  for (let i = 0; i < comps.length; i++) {
    const s = stats[i];
    let color;
    if (isFree) color = FILL.free;
    else if (s.w < 26 && Math.abs(s.mx - cx) < 14 && s.my > 0.35 && s.my < 0.75) color = FILL.bean;
    else if (s.my < 0.25) color = FILL.lid;
    else if (s.my > 0.3 && s.my < 0.72 && s.n > 600) color = FILL.sleeve;
    else color = FILL.body;
    for (const [a, b] of comps[i]) {
      const o = (b * W + a) * C;
      out[o] = color[0]; out[o + 1] = color[1]; out[o + 2] = color[2];
    }
  }
  cups.push({
    left: +((minX / W) * 100).toFixed(3),
    top: +((minY / H) * 100).toFixed(3),
    width: +(((maxX - minX + 1) / W) * 100).toFixed(3),
    height: +(((maxY - minY + 1) / H) * 100).toFixed(3),
  });
}));

await sharp(out, { raw: { width: W, height: H, channels: C } }).webp({ quality: 82 }).toFile('public/brand/card-back-filled.webp');
fs.writeFileSync('src/brand/card-back.json', JSON.stringify({ width: W, height: H, text: {
  top: +((TEXT.top / H) * 100).toFixed(2), height: +((TEXT.height / H) * 100).toFixed(2),
}, cups }, null, 2));
console.log('Card art built:', cups.length, 'cups');
