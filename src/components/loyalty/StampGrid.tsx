import { CARD_SLOTS, STAMPS_PER_REWARD } from '../../lib/loyalty';
import { CupStamp, type CupState } from '../brand/CupStamp';

interface Props {
  stamps: number;
  layout?: 'row' | 'grid';
  onDark?: boolean;
  /** Index of a freshly added stamp to animate. */
  popIndex?: number;
  className?: string;
}

export function StampGrid({ stamps, layout = 'grid', onDark = false, popIndex, className = '' }: Props) {
  const cups: CupState[] = Array.from({ length: CARD_SLOTS }, (_, i) => {
    if (i === STAMPS_PER_REWARD) return stamps >= STAMPS_PER_REWARD ? 'free-ready' : 'free';
    return i < stamps ? 'filled' : 'empty';
  });

  return (
    <ul
      className={`${layout === 'grid' ? 'grid grid-cols-5 gap-x-[6%] gap-y-3' : 'grid grid-cols-10 gap-[2.5%]'} ${className}`}
      aria-label={`${stamps} of ${STAMPS_PER_REWARD} stamps collected. The tenth cup is your free drink.`}
    >
      {cups.map((state, i) => (
        <li key={i} className="flex justify-center">
          <CupStamp
            state={state}
            onDark={onDark}
            animate={i === popIndex || (state === 'free-ready' && popIndex === STAMPS_PER_REWARD - 1)}
            className="h-auto w-full max-w-16"
          />
        </li>
      ))}
    </ul>
  );
}
