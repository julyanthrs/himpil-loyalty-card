// Generates brand assets that are derived from code:
//   public/brand/bean-pattern.svg   — engraved coffee-bean card texture (seamless tile)
//   public/favicon.svg, public/apple-touch-icon.png, public/icons/*.png — app icons from the logo mark
// Run with: npm run brand
import fs from 'node:fs';
import sharp from 'sharp';

// Official mark traced by scripts/extract-logo.mjs (run that first if the logo changes).
const { mark } = JSON.parse(fs.readFileSync('src/brand/logo-official.json', 'utf8')).parts;
fs.mkdirSync('public/brand', { recursive: true });
fs.mkdirSync('public/icons', { recursive: true });

// ---------- Bean pattern ----------
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const T = 240;
const BG = '#4A2B1B';

function bean(x, y, rot, s) {
  const rx = 15 * s, ry = 22 * s;
  const hatch = [];
  for (let i = 1; i <= 5; i++) {
    const k = i / 6;
    const hx = -rx * (0.25 + 0.6 * k);
    hatch.push(`M${(hx).toFixed(1)} ${(-ry * 0.62 * (1 - k * 0.35)).toFixed(1)}Q${(hx - rx * 0.12).toFixed(1)} 0 ${(hx).toFixed(1)} ${(ry * 0.62 * (1 - k * 0.35)).toFixed(1)}`);
  }
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})">
<ellipse rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="#5C3824" stroke="#2C170D" stroke-width="1.4"/>
<path d="${hatch.join('')}" fill="none" stroke="#3A2214" stroke-width="0.9" opacity="0.9"/>
<path d="M${(rx * 0.55).toFixed(1)} ${(-ry * 0.55).toFixed(1)}Q${(rx * 0.85).toFixed(1)} 0 ${(rx * 0.55).toFixed(1)} ${(ry * 0.55).toFixed(1)}" fill="none" stroke="#8A5E40" stroke-width="1.1" opacity="0.55"/>
<path d="M0 ${(-ry * 0.92).toFixed(1)}C${(rx * 0.42).toFixed(1)} ${(-ry * 0.38).toFixed(1)} ${(-rx * 0.42).toFixed(1)} ${(ry * 0.38).toFixed(1)} 0 ${(ry * 0.92).toFixed(1)}" fill="none" stroke="#2C170D" stroke-width="${(2.4 * s).toFixed(1)}" stroke-linecap="round"/>
</g>`;
}

const beans = [];
const n = 5;
for (let r = 0; r < n; r++) {
  for (let c = 0; c < n; c++) {
    const x = (c + 0.5 + (rand() - 0.5) * 0.7) * (T / n);
    const y = (r + 0.5 + (rand() - 0.5) * 0.7) * (T / n);
    beans.push([x, y, rand() * 360, 0.85 + rand() * 0.45]);
  }
}
// Draw each bean plus wrapped copies so the tile repeats seamlessly.
let body = '';
for (const [x, y, rot, s] of beans) {
  for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) {
    const nx = x + dx, ny = y + dy;
    if (nx > -40 && nx < T + 40 && ny > -40 && ny < T + 40) body += bean(nx, ny, rot, s);
  }
}
let specks = '';
for (let i = 0; i < 60; i++) specks += `<circle cx="${(rand() * T).toFixed(1)}" cy="${(rand() * T).toFixed(1)}" r="${(0.5 + rand()).toFixed(1)}" fill="#6E4630" opacity="0.6"/>`;

fs.writeFileSync('public/brand/bean-pattern.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}" viewBox="0 0 ${T} ${T}"><rect width="${T}" height="${T}" fill="${BG}"/>${specks}${body}</svg>`);

// ---------- Icons ----------
function markSvg({ size, bg, fg, pad }) {
  // The mark's leaves are cut-outs, so the background shows through them.
  const inner = size * (1 - pad * 2);
  const scale = inner / Math.max(mark.width, mark.height);
  const tx = (size - mark.width * scale) / 2 - mark.x * scale;
  const ty = (size - mark.height * scale) / 2 - mark.y * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
<g transform="translate(${tx} ${ty}) scale(${scale})"><path transform="translate(0 ${mark.y})" d="${mark.d}" fill="${fg}" fill-rule="evenodd"/></g></svg>`;
}

fs.writeFileSync('public/favicon.svg', markSvg({ size: 64, bg: '#F6EFE4', fg: '#3E2416', pad: 0.1 }));
const png = (svg, out) => sharp(Buffer.from(svg)).png().toFile(out);
await png(markSvg({ size: 192, bg: '#F6EFE4', fg: '#3E2416', pad: 0.16 }), 'public/icons/icon-192.png');
await png(markSvg({ size: 512, bg: '#F6EFE4', fg: '#3E2416', pad: 0.16 }), 'public/icons/icon-512.png');
await png(markSvg({ size: 512, bg: '#3E2416', fg: '#F6EFE4', pad: 0.26 }), 'public/icons/icon-maskable-512.png');
await png(markSvg({ size: 180, bg: '#F6EFE4', fg: '#3E2416', pad: 0.16 }), 'public/apple-touch-icon.png');
console.log('Brand assets generated.');
