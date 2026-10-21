import { useId } from 'react';
import { Botanical } from './Botanical';

/**
 * Page backdrops in the Himpil kit's palette, drawn from Filipino culture.
 * "Himpil" comes from himpilan, a stopping place: each page is a stop, named in Baybayin.
 * Script uses the modern krus-kudlit (U+1714) to mark final consonants; strings are escaped
 * so editors can't mangle the combining marks.
 */

export interface PageWord {
  /** Baybayin spelling. */
  script: string;
  /** Tagalog word in Latin letters. */
  roman: string;
  meaning: string;
}

const WORDS = {
  himpilan: { script: 'ᜑᜒᜋ᜔ᜉᜒᜎᜈ᜔', roman: 'himpilan', meaning: 'a stopping place, where you pause along the way' },
  kape: { script: 'ᜃᜉᜒ', roman: 'kape', meaning: 'coffee, the reason to stop' },
  gantimpala: { script: 'ᜄᜈ᜔ᜆᜒᜋ᜔ᜉᜎ', roman: 'gantimpala', meaning: 'reward, a gift for coming back' },
  alaala: { script: 'ᜀᜎᜀᜎ', roman: 'alaala', meaning: 'memory, every cup kept' },
  kaibigan: { script: 'ᜃᜁᜊᜒᜄᜈ᜔', roman: 'kaibigan', meaning: 'friend, that’s you at Himpil' },
  salamat: { script: 'ᜐᜎᜋᜆ᜔', roman: 'salamat', meaning: 'thank you, for stopping by' },
  mabuhay: { script: 'ᜋᜊᜓᜑᜌ᜔', roman: 'mabuhay', meaning: 'welcome, long may you thrive' },
  timpla: { script: 'ᜆᜒᜋ᜔ᜉ᜔ᜎ', roman: 'timpla', meaning: 'the brew, how each cup is made' },
} satisfies Record<string, PageWord>;

export type WordKey = keyof typeof WORDS;

const ROUTE_WORDS: Record<string, WordKey> = {
  '/': 'himpilan',
  '/card': 'kape',
  '/rewards': 'gantimpala',
  '/activity': 'alaala',
  '/profile': 'kaibigan',
  '/scan': 'salamat',
  '/login': 'mabuhay',
  '/register': 'mabuhay',
  '/staff': 'timpla',
};

export function wordForPath(pathname: string): PageWord {
  return WORDS[ROUTE_WORDS[pathname] ?? 'himpilan'];
}

/**
 * Fixed layer behind a page: engraved coffee branches in the top corners (as in the kit) and the
 * page's word in Baybayin, very large and faint, above the bottom navigation.
 */
export function Backdrop({ word, branches = true }: { word: PageWord; branches?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {branches && (
        <>
          <Botanical className="absolute -top-6 -left-10 w-52 -scale-y-100 text-roasted/25 md:-top-4 md:-left-8 md:w-80" strokeWidth={1.1} />
          <Botanical className="absolute -top-6 -right-10 w-52 rotate-180 text-roasted/25 md:-top-4 md:-right-8 md:w-80" strokeWidth={1.1} />
        </>
      )}
      <p
        lang="tl-Tglg"
        className="absolute -right-[6vw] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] font-baybayin text-[clamp(7rem,34vw,17rem)] leading-none whitespace-nowrap text-roasted/[0.09] md:-bottom-6"
      >
        {word.script}
      </p>
    </div>
  );
}

/** Closing line of a page: the Baybayin word, its reading and what it means. */
export function PageWordNote({ word, className = '' }: { word: PageWord; className?: string }) {
  return (
    <figure className={`mx-auto flex max-w-xs flex-col items-center text-center ${className}`}>
      <span lang="tl-Tglg" className="font-baybayin text-[2.1rem] leading-none text-mocha" aria-hidden>
        {word.script}
      </span>
      <span className="mt-3 flex items-center gap-2 text-roasted/70" aria-hidden>
        <span className="h-px w-8 bg-current" />
        <span className="size-1 rotate-45 bg-current" />
        <span className="h-px w-8 bg-current" />
      </span>
      <figcaption className="mt-2.5 text-[0.8rem] leading-relaxed text-subtle">
        <span className="font-serif text-[0.95rem] text-espresso italic">{word.roman}</span>
        <span className="sr-only"> (written in Baybayin)</span> · {word.meaning}
      </figcaption>
    </figure>
  );
}

/** Baybayin letters laid out like a woven textile band. */
const GLYPHS = ['ᜀ', 'ᜃ', 'ᜄ', 'ᜅ', 'ᜆ', 'ᜇ', 'ᜈ', 'ᜉ', 'ᜊ', 'ᜋ', 'ᜌ', 'ᜎ', 'ᜏ', 'ᜐ', 'ᜑ', 'ᜁ', 'ᜂ'];

/** Repeating field of Baybayin letters for dark surfaces; color comes from `className` (currentColor). */
export function BaybayinPattern({ className = '' }: { className?: string }) {
  const id = `bb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const cols = 6;
  const cell = 36;
  return (
    <svg className={`pointer-events-none absolute inset-0 size-full ${className}`} aria-hidden>
      <defs>
        <pattern id={id} width={cols * cell} height={cell * 3} patternUnits="userSpaceOnUse">
          {Array.from({ length: cols * 3 }, (_, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = col * cell + (row % 2 ? cell / 2 : 0) + cell / 4;
            const y = row * cell + cell * 0.72;
            return (
              <text key={i} x={x} y={y} fontSize={cell * 0.56} fill="currentColor" fontFamily="'Noto Sans Tagalog', sans-serif">
                {GLYPHS[(i * 7) % GLYPHS.length]}
              </text>
            );
          })}
          {/* Small diamonds between rows, like a weave's tie-points. */}
          {Array.from({ length: cols }, (_, i) => (
            <rect key={`d${i}`} x={i * cell + cell * 0.72} y={cell * 1.5 - 2} width={4} height={4} transform={`rotate(45 ${i * cell + cell * 0.72 + 2} ${cell * 1.5})`} fill="currentColor" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
