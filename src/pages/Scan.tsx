import { ChevronRight, Gift } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActivityList } from '../components/loyalty/ActivityList';
import { QrPanel } from '../components/loyalty/QrPanel';
import { PageHeader, Panel, SectionTitle, Skeleton, TextLink } from '../components/ui/primitives';
import { useLoyalty } from '../context/LoyaltyContext';
import { cupsLabel, STAMPS_PER_REWARD } from '../lib/loyalty';

/** Keep the phone screen awake while the code is on display at the counter. */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        if (document.visibilityState === 'visible' && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
      } catch {
        /* not supported or denied — fine */
      }
    };
    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      document.removeEventListener('visibilitychange', acquire);
      void lock?.release().catch(() => undefined);
    };
  }, []);
}

export default function Scan() {
  const { account, activity, loading } = useLoyalty();
  useWakeLock();
  const ready = account && account.stamps >= STAMPS_PER_REWARD;

  return (
    <div className="animate-fade-in relative">
      {/* Dark espresso band behind the header and the top of the QR panel. */}
      <div className="absolute -inset-x-4 -top-[max(1rem,env(safe-area-inset-top))] h-[19rem] bg-espresso md:inset-x-0 md:top-0 md:h-[22rem] md:rounded-[2rem]" aria-hidden />

      <div className="relative md:px-10 md:pt-8">
        <PageHeader title="Scan to Collect" back={false} dark />
      </div>

      <div className="relative grid items-start gap-6 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="mx-auto w-full max-w-md">
          {account ? <QrPanel memberCode={account.memberCode} /> : <Skeleton className="h-[28rem] rounded-[1.6rem]" />}
          {account && (
            <p className="mt-3 text-center text-xs text-subtle">
              Camera not working? Member code <span className="font-mono tracking-wider text-mocha">{account.memberCode}</span>
            </p>
          )}
        </div>

        <div className="space-y-6 lg:pt-[16rem]">
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-3 text-[1.35rem] font-medium md:text-2xl">
                <Gift className="size-7 text-espresso" strokeWidth={1.4} aria-hidden /> Your Rewards
              </h2>
              <p className="font-serif text-[1.05rem] text-espresso">{account ? `${cupsLabel(account.stamps)} cups` : '–'}</p>
            </div>
            <Link to="/rewards" className="block transition hover:-translate-y-0.5">
              <Panel className="flex items-center gap-4 p-3 pr-5">
                <img src="/images/drinks/latte-art.webp" alt="" className="size-[4.25rem] rounded-xl object-cover" loading="lazy" />
                <div className="flex-1">
                  <p className="font-serif text-[1.15rem] text-espresso">1 Free Drink</p>
                  <p className="text-sm text-subtle">{ready ? 'Ready — ask our barista to redeem' : `Available after ${STAMPS_PER_REWARD} cups`}</p>
                </div>
                <ChevronRight className="size-6 text-espresso" strokeWidth={1.6} aria-hidden />
              </Panel>
            </Link>
          </section>

          <section>
            <SectionTitle className="px-1" title="Recent Activity" action={<TextLink to="/activity">See All</TextLink>} />
            {loading ? <Skeleton className="h-60" /> : <ActivityList items={activity.slice(0, 3)} compact />}
          </section>
        </div>
      </div>
    </div>
  );
}
