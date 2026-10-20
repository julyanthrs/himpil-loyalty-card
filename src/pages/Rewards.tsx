import { CheckCircle2, Gift, Lock, ScanLine } from 'lucide-react';
import { Botanical } from '../components/brand/Botanical';
import { ButtonLink } from '../components/ui/Button';
import { PageHeader, Panel, ProgressSegments, SectionTitle, Skeleton } from '../components/ui/primitives';
import { useLoyalty } from '../context/LoyaltyContext';
import { drinkImage } from '../lib/drinks';
import { formatDateTime } from '../lib/format';
import { rewardStatus, STAMPS_PER_REWARD, stampsRemaining } from '../lib/loyalty';
import type { RewardStatus } from '../lib/types';

const STATUS: Record<RewardStatus, { label: string; icon: typeof Lock; className: string }> = {
  locked: { label: 'Locked', icon: Lock, className: 'bg-latte/60 text-mocha' },
  available: { label: 'Available', icon: Gift, className: 'bg-espresso text-ivory' },
  redeemed: { label: 'Redeemed', icon: CheckCircle2, className: 'bg-success/12 text-success' },
};

export default function Rewards() {
  const { account, activity, loading } = useLoyalty();
  const redemptions = activity.filter((a) => a.kind === 'redemption');

  if (!account) {
    return (
      <div>
        <PageHeader title="Rewards" />
        <Skeleton className="h-80 rounded-[1.5rem]" />
      </div>
    );
  }

  const status = rewardStatus(account, activity);
  const s = STATUS[status];
  const left = stampsRemaining(account.stamps);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Rewards" />
      <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
        <Panel className="overflow-hidden lg:col-span-7">
          <div className="grid sm:grid-cols-[1fr_1.1fr]">
            <div className="relative h-52 sm:h-full sm:min-h-80">
              <img
                src="/images/reward-pour-sm.webp"
                srcSet="/images/reward-pour-sm.webp 640w, /images/reward-pour.webp 1200w"
                sizes="(min-width: 640px) 40vw, 100vw"
                alt="Barista pouring latte art"
                className={`absolute inset-0 size-full object-cover transition duration-500 ${status === 'locked' ? 'saturate-[0.7]' : ''}`}
              />
            </div>
            <div className="relative flex flex-col p-6 md:p-8">
              <Botanical className="pointer-events-none absolute -right-14 -bottom-14 w-44 text-roasted/20" />
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.className}`}>
                <s.icon className="size-3.5" aria-hidden /> {s.label}
              </span>
              <h2 className="mt-4 text-[2rem] leading-tight font-medium">1 Free Drink</h2>
              <p className="mt-1 font-serif text-lg text-mocha">Your next cup is on us.</p>

              <div className="relative mt-6 flex-1">
                {status === 'locked' && (
                  <>
                    <p className="text-sm text-ink">
                      Collect {left} more {left === 1 ? 'stamp' : 'stamps'} to unlock your free drink.
                    </p>
                    <ProgressSegments value={account.stamps} className="mt-3" />
                    <p className="mt-2 text-xs text-subtle">
                      {account.stamps} of {STAMPS_PER_REWARD} stamps
                    </p>
                  </>
                )}
                {status === 'available' && (
                  <>
                    <p className="text-sm leading-relaxed text-ink">
                      Choose any drink from our menu. Show your code at the counter and our barista will confirm the redemption.
                    </p>
                    <ButtonLink to="/scan" size="lg" className="mt-5 w-full">
                      <ScanLine className="size-5" strokeWidth={1.75} aria-hidden /> Show My QR Code
                    </ButtonLink>
                    <p className="mt-3 text-xs text-subtle">For your security, only a Himpil barista can complete a redemption.</p>
                  </>
                )}
                {status === 'redeemed' && (
                  <>
                    <p className="text-sm leading-relaxed text-ink">
                      Enjoy! Your free drink was redeemed and a fresh card has started. Your first new stamp is one coffee away.
                    </p>
                    <ProgressSegments value={0} className="mt-4" />
                  </>
                )}
              </div>
            </div>
          </div>
        </Panel>

        <section className="lg:col-span-5">
          <SectionTitle title="Reward History" />
          {loading ? (
            <Skeleton className="h-40" />
          ) : redemptions.length === 0 ? (
            <Panel className="px-6 py-10 text-center">
              <p className="font-serif text-lg text-espresso">No free drinks yet</p>
              <p className="mt-1 text-sm text-subtle">Your redeemed rewards will be listed here.</p>
            </Panel>
          ) : (
            <Panel className="overflow-hidden">
              <ul className="divide-y divide-latte/60">
                {redemptions.map((r) => (
                  <li key={r.id} className="flex items-center gap-4 px-4 py-3.5">
                    <img src={drinkImage(r.drink)} alt="" loading="lazy" className="size-14 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-[1.05rem] text-espresso">Free {r.drink}</p>
                      <p className="text-[0.82rem] text-subtle">{formatDateTime(r.createdAt)}</p>
                    </div>
                    <span className="text-xs font-medium text-subtle">Card {r.cycle}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <p className="mt-4 text-center text-sm text-subtle">
            {account.totalRedeemed === 0
              ? 'Your first free drink is on its way.'
              : `You’ve enjoyed ${account.totalRedeemed} free ${account.totalRedeemed === 1 ? 'drink' : 'drinks'} with Himpil.`}
          </p>
        </section>
      </div>
    </div>
  );
}
