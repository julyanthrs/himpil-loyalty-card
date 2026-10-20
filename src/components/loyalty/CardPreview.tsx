import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLoyalty } from '../../context/LoyaltyContext';
import { cupsLabel, progressMessage, STAMPS_PER_REWARD } from '../../lib/loyalty';
import { Logo } from '../brand/Logo';
import { ProgressSegments, Skeleton } from '../ui/primitives';
import { StampGrid } from './StampGrid';

/**
 * Home-screen loyalty card. Sits in a cream frame that overlaps the dark hero, as in the app mockup.
 */
export function CardPreview() {
  const { account, lastEvent } = useLoyalty();
  const popIndex = lastEvent && Date.now() - lastEvent.at < 4000 ? lastEvent.stampIndex : undefined;

  return (
    <div className="rounded-[2rem] bg-cream p-2.5">
      {!account ? (
        <Skeleton className="h-[236px] rounded-[1.6rem]" />
      ) : (
        <Link
          to="/card"
          className="bean-surface group relative block overflow-hidden rounded-[1.6rem] px-5 pt-4 pb-4 text-cream shadow-card transition duration-200 hover:-translate-y-0.5 md:px-7 md:pt-6 md:pb-5"
          aria-label={`My loyalty card: ${account.stamps} of ${STAMPS_PER_REWARD} stamps. ${progressMessage(account.stamps)} Open card.`}
        >
          <div className="flex items-start justify-between">
            <p className="font-serif text-[1.02rem] tracking-[0.04em] text-cream uppercase md:text-[1.1rem]">My Loyalty Card</p>
            <p className="font-serif text-[1.15rem] text-cream">{cupsLabel(account.stamps)}</p>
          </div>
          <div className="mb-3 flex justify-center md:mb-4">
            <Logo tone="light" size={28} />
          </div>
          <StampGrid stamps={account.stamps} layout="row" onDark popIndex={popIndex} />
          <ProgressSegments value={account.stamps} onDark className="mt-4" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="font-serif text-[1rem] text-cream md:text-[1.06rem]">{progressMessage(account.stamps)}</p>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream/15 transition group-hover:bg-cream/25">
              <ChevronRight className="size-4" />
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
