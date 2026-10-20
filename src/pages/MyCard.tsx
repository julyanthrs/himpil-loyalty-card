import { Gift } from 'lucide-react';
import { useState } from 'react';
import { Botanical } from '../components/brand/Botanical';
import { TakeawayCupIcon } from '../components/brand/TakeawayCupIcon';
import { FlipCard } from '../components/loyalty/FlipCard';
import { PageHeader, Panel, ProgressSegments, Skeleton } from '../components/ui/primitives';
import { useLoyalty } from '../context/LoyaltyContext';
import { cupsLabel, progressPercent, STAMPS_PER_REWARD, stampsRemaining } from '../lib/loyalty';

const STEPS = ['Buy any drink from our menu.', 'Collect a stamp for each purchase.', 'Get your 10th drink absolutely free!'];

export default function MyCard() {
  const { account, lastEvent, error, refresh } = useLoyalty();
  const [flipped, setFlipped] = useState(false);
  const recent = lastEvent && Date.now() - lastEvent.at < 4000;

  if (error && !account) {
    return (
      <Panel className="mx-auto max-w-md p-8 text-center">
        <p className="font-serif text-xl text-espresso">We couldn’t load your card</p>
        <p className="mt-2 text-sm text-subtle">{error}</p>
        <button onClick={() => void refresh()} className="mt-5 text-sm font-medium text-mocha underline underline-offset-4">
          Try again
        </button>
      </Panel>
    );
  }

  const left = account ? stampsRemaining(account.stamps) : 0;
  const pct = account ? progressPercent(account.stamps) : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Loyalty Card" />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          {account ? (
            <FlipCard
              stamps={account.stamps}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
              popIndex={recent ? lastEvent?.stampIndex : undefined}
            />
          ) : (
            <Skeleton className="mx-auto aspect-[1050/860] w-full max-w-[600px] rounded-[1.5rem]" />
          )}
        </div>

        <div className="relative space-y-5 lg:pt-2">
          {account ? (
            <div className="px-1">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-serif text-[1.65rem] leading-none text-espresso md:text-[2rem]">{cupsLabel(account.stamps)}</p>
                  <p className="mt-1.5 text-sm text-subtle">Cups collected</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-[1.08rem] text-espresso md:text-lg">
                    {left === 0 ? 'Free drink ready' : `${left} ${left === 1 ? 'cup' : 'cups'} left`}
                  </p>
                  <p className="mt-1 text-sm text-subtle">{left === 0 ? 'show your code to redeem' : 'until your free drink'}</p>
                </div>
              </div>
              <ProgressSegments value={account.stamps} thick className="mt-4" />
            </div>
          ) : (
            <Skeleton className="h-20" />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Panel className="flex items-start gap-3.5 p-4 md:p-5">
              <Gift className="mt-1 size-7 shrink-0 text-espresso" strokeWidth={1.4} aria-hidden />
              <div>
                <p className="font-serif text-[0.85rem] text-espresso">Next Reward</p>
                <p className="font-serif text-[1.1rem] text-espresso">1 Free Drink</p>
                <p className="text-[0.82rem] text-subtle">After {STAMPS_PER_REWARD} cups</p>
              </div>
            </Panel>
            <Panel className="flex items-start gap-3.5 p-4 md:p-5">
              <TakeawayCupIcon className="mt-1 size-7 shrink-0 text-espresso" />
              <div>
                <p className="font-serif text-[0.85rem] text-espresso">Your Progress</p>
                <p className="font-serif text-[1.1rem] text-espresso">{account ? `${pct}%` : '–'}</p>
                <p className="text-[0.82rem] text-subtle">{left === 0 ? 'Free drink ready!' : left <= 3 ? 'Almost there!' : 'Keep sipping!'}</p>
              </div>
            </Panel>
          </div>

          <section className="relative overflow-hidden px-1 pt-2 pb-4">
            <Botanical className="pointer-events-none absolute -right-10 bottom-[-3rem] w-48 text-roasted/25" />
            <div className="flex items-center gap-4">
              <h2 className="shrink-0 text-[1.4rem] font-medium">How It Works</h2>
              <span className="h-px flex-1 bg-latte" />
            </div>
            <ol className="relative mt-4 space-y-3.5">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-5 text-[0.93rem] text-ink">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-latte/70 font-serif text-espresso">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
