export const MENU = [
  'Caffè Latte',
  'Spanish Latte',
  'Cappuccino',
  'Flat White',
  'Americano',
  'Iced Americano',
  'Iced Coffee',
  'Espresso',
] as const;

const IMAGES: Record<string, string> = {
  'caffè latte': 'caffe-latte',
  'spanish latte': 'spanish-latte',
  cappuccino: 'cappuccino',
  'flat white': 'flat-white',
  americano: 'americano',
  'iced americano': 'iced-americano',
  'iced coffee': 'iced-coffee',
  espresso: 'espresso',
};

export function drinkImage(drink: string) {
  return `/images/drinks/${IMAGES[drink.toLowerCase()] ?? 'caffe-latte'}.webp`;
}
