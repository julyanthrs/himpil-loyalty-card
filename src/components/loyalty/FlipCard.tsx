import { RotateCw } from 'lucide-react';
import { STAMPS_PER_REWARD } from '../../lib/loyalty';
import { Botanical } from '../brand/Botanical';
import { CardBackArt, CardFrontArt } from './CardArt';
import { StampGrid } from './StampGrid';

interface Props {
  stamps: number;
  flipped: boolean;
  onFlip: () => void;
  popIndex?: number;
}

/**
 * The loyalty card as laid out in the app: the original card front on top (tap to flip to the
 * original card back with your stamps), and the ivory stamp panel overlapping its lower edge.
 */
export function FlipCard({ stamps, flipped, onFlip, popIndex }: Props) {
  return (
    <div className="mx-auto w-full max-w-[600px]">
      <div className="flip-scene relative">
        <button
          type="button"
          onClick={onFlip}
          aria-pressed={flipped}
          aria-label={
            flipped
              ? `Loyalty card back: ${stamps} of ${STAMPS_PER_REWARD} stamps collected. Press to show the front.`
              : 'Himpil loyalty card front. Buy 9, get 1 free. Press to flip to the stamp side.'
          }
          className="group block w-full rounded-[1.5rem] text-left"
        >
          <div className="flip-inner aspect-[1050/600] w-full" data-flipped={flipped}>
            <div className="flip-face flip-front overflow-hidden rounded-[1.5rem] shadow-card">
              <CardFrontArt />
            </div>
            <div className="flip-face flip-back overflow-hidden rounded-[1.5rem] shadow-card">
              <CardBackArt stamps={stamps} popIndex={flipped ? popIndex : undefined} />
            </div>
          </div>
          <span className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-espresso/45 text-cream/90 opacity-80 transition group-hover:opacity-100">
            <RotateCw className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
        </button>
      </div>

      {/* Stamp panel — overlaps the card's lower edge, as in the app; moves clear of the full card back. */}
      <div className={`relative z-10 ${flipped ? 'mt-3' : '-mt-7'} overflow-hidden transition-[margin] duration-500 rounded-[1.5rem] border border-latte/60 bg-ivory px-5 pt-5 pb-4 shadow-soft md:px-8 md:pt-7`}>
        <Botanical className="pointer-events-none absolute -right-16 -bottom-20 w-48 text-roasted/15" />
        <StampGrid stamps={stamps} popIndex={flipped ? undefined : popIndex} className="relative mx-auto max-w-[460px]" />
        <p className="relative mx-auto mt-4 max-w-[34rem] text-center text-[0.8rem] leading-relaxed text-mocha md:text-[0.88rem]">
          Enjoy your favorite brew with our exclusive loyalty program. Buy 9 cups of coffee and get the 10th one absolutely free!
          It’s our way of saying thank you for being part of the Himpil family.
        </p>
      </div>
    </div>
  );
}
