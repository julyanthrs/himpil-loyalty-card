// One-off: downloads Unsplash photos (Unsplash License) and writes optimized WebP into public/images.
import sharp from 'sharp';
const big = {
  // [photo id, width, mirror horizontally]
  'promo-iced': ['1461023058943-07fcbe16d735', 1200, false],
  'reward-pour': ['1541167760496-1628856ab772', 1200, false],
  'together': ['1495474472287-4d71bcdd2085', 1400, false],
};
const drinks = {
  'caffe-latte': '1578314675249-a6910f80cc4e',
  'iced-americano': '1521302080334-4bebac2763a6',
  'spanish-latte': '1517701604599-bb29b565090c',
  'cappuccino': '1534778101976-62847782c213',
  'iced-coffee': '1461023058943-07fcbe16d735',
  'americano': '1514432324607-a09d9b4aefdd',
  'flat-white': '1570968915860-54d5c301fa9f',
  'espresso': '1559496417-e7f25cb247f3',
  'latte-art': '1506372023823-741c83b836fe',
};
async function get(id, w) {
  const r = await fetch(`https://images.unsplash.com/photo-${id}?w=${w}&q=80&fm=jpg`);
  if (!r.ok) throw new Error(`${id}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
for (const [name, [id, w, mirror]] of Object.entries(big)) {
  const flip = (img) => (mirror ? img.flop() : img);
  await flip(sharp(await get(id, w))).webp({ quality: 72 }).toFile(`public/images/${name}.webp`);
  await flip(sharp(await get(id, 800))).webp({ quality: 70 }).toFile(`public/images/${name}-sm.webp`);
}
for (const [name, id] of Object.entries(drinks)) {
  await sharp(await get(id, 400)).resize(160, 160, { fit: 'cover' }).webp({ quality: 72 }).toFile(`public/images/drinks/${name}.webp`);
}
console.log('done');
