import { ScanLine } from 'lucide-react';
import { CardStack } from '../components/loyalty/CardStack';
import { ButtonLink } from '../components/ui/Button';
import { PageHeader, Panel, SectionTitle, Skeleton } from '../components/ui/primitives';
import { useLoyalty } from '../context/LoyaltyContext';
import { drinkImage } from '../lib/drinks';
import { formatDateTime } from '../lib/format';
import { STAMPS_PER_REWARD, stackedCards } from '../lib/loyalty';

export default function Rewards() {
  const { account, activity, loading } = useLoyalty();
  const redemptions = activity.filter((a) => a.kind === 'redemption');

  if (!account) {
    return (
      <div className="mx-auto max-w-[600px]">
        <PageHeader title="Rewards" />
        <Skeleton className="aspect-[1050/600] rounded-[1.5rem]" />
      </div>
    );
  }

  const cards = stackedCards(account, activity);
  const ready = account.stamps >= STAMPS_PER_REWARD;

  return (
    <div className="animate-fade-in mx-auto max-w-[600px]">
      <PageHeader title="Rewards" />

      {/* Current card on top, completed cards beneath; swipe through them. Cards fly past the edges, so clip sideways only. */}
      <section aria-label="Your loyalty cards" className="-mx-4 overflow-x-clip px-4 pt-1 md:-mx-6 md:px-6">
        {/* Remount when a card is redeemed or the demo is reset, so the stack starts on the current card. */}
        <CardStack key={cards.length} cards={cards} />
        {ready && (
          <ButtonLink to="/scan" size="lg" className="mx-auto mt-5 flex w-full max-w-[560px]">
            <ScanLine className="size-5" strokeWidth={1.75} aria-hidden /> Show My QR Code
          </ButtonLink>
        )}
      </section>

      <section className="mt-10">
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
  );
}
