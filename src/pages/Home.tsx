import { ChevronRight, Gift, Scan } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Botanical } from '../components/brand/Botanical';
import { Logo } from '../components/brand/Logo';
import { NotificationsMenu } from '../components/layout/NotificationsMenu';
import { ActivityList } from '../components/loyalty/ActivityList';
import { CardPreview } from '../components/loyalty/CardPreview';
import { SectionTitle, Skeleton, TextLink } from '../components/ui/primitives';
import { useLoyalty } from '../context/LoyaltyContext';

/** Photographic hero: Himpil iced latte by the café window, cream logo and serif headline. */
function Hero() {
  return (
    <section className="relative -mx-4 -mt-4 overflow-hidden bg-[#2a1a10] md:mx-0 md:mt-0 md:rounded-[2rem]">
      <img
        src="/images/hero-himpil-sm.webp"
        srcSet="/images/hero-himpil-sm.webp 800w, /images/hero-himpil.webp 1467w"
        sizes="(min-width: 768px) 1280px, 160vw"
        alt="Himpil iced latte and a coconut dessert on a wooden table by the café window"
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover object-[36%_30%] md:object-[50%_38%]"
      />
      {/* Warm shade on the left so the cream text stays legible over the photo. */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(30_18_10/0.82)_0%,rgb(30_18_10/0.6)_38%,rgb(30_18_10/0.08)_68%,transparent_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-[linear-gradient(0deg,rgb(30_18_10/0.45),transparent)]" />

      <div className="relative z-10 px-6 pt-6 pb-28 md:px-14 md:pt-12 md:pb-36 lg:pb-40">
        <div className="flex items-start justify-between">
          <Logo tone="light" size={46} className="ml-6 md:ml-0" />
          <div className="text-cream md:hidden [&_button]:text-cream [&_button:hover]:bg-cream/10">
            <NotificationsMenu />
          </div>
        </div>
        <h1 className="mt-6 max-w-[11ch] text-[2.3rem] leading-[1.02] font-normal text-cream! md:mt-8 md:text-[3.6rem] lg:text-[4rem]">
          Good coffee goes further together.
        </h1>
        <p className="mt-2 font-serif text-[1.05rem] text-cream/90 md:mt-4 md:text-xl">Great coffee. Greater moments.</p>
      </div>
    </section>
  );
}

function QuickActions() {
  const item =
    'group flex h-[4.25rem] items-center gap-5 rounded-2xl px-8 font-serif text-[1.3rem] transition duration-200 hover:-translate-y-0.5 hover:shadow-lift';
  return (
    <div className="grid gap-3 px-2.5 sm:grid-cols-2">
      <Link to="/scan" className={`${item} bg-espresso text-ivory shadow-soft`}>
        <Scan className="size-7" strokeWidth={1.6} aria-hidden />
        <span className="flex-1">Scan to Collect</span>
        <ChevronRight className="size-6 opacity-90 transition group-hover:translate-x-0.5" strokeWidth={1.6} aria-hidden />
      </Link>
      <Link to="/rewards" className={`${item} bg-ivory text-espresso shadow-soft ring-1 ring-latte/50`}>
        <Gift className="size-7" strokeWidth={1.5} aria-hidden />
        <span className="flex-1">View Rewards</span>
        <ChevronRight className="size-6 opacity-90 transition group-hover:translate-x-0.5" strokeWidth={1.6} aria-hidden />
      </Link>
    </div>
  );
}

function PromoBanner() {
  return (
    <section className="relative mx-2.5 h-40 overflow-hidden rounded-[1.5rem] bg-espresso shadow-soft md:h-48" aria-label="Good People Better Coffee">
      <img
        src="/images/promo-iced-sm.webp"
        srcSet="/images/promo-iced-sm.webp 800w, /images/promo-iced.webp 1200w"
        sizes="(min-width: 1024px) 40vw, 90vw"
        alt=""
        loading="lazy"
        className="absolute inset-y-0 right-0 h-full w-[65%] object-cover [mask-image:linear-gradient(to_right,transparent,black_40%)]"
      />
      <Botanical className="pointer-events-none absolute -top-8 left-[30%] w-32 text-cream/15" />
      <div className="relative flex h-full flex-col justify-center px-8">
        <p className="font-serif text-[1.6rem] leading-[1.1] text-cream md:text-[1.8rem]">
          Good
          <br />
          People
          <br />
          Better Coffee
        </p>
        <span className="mt-3 h-0.5 w-8 bg-cream/80" />
      </div>
    </section>
  );
}

export default function Home() {
  const { activity, loading } = useLoyalty();
  return (
    <div className="animate-fade-in">
      <Hero />
      <div className="relative z-10 -mx-1.5 -mt-20 grid gap-4 md:mx-0 lg:-mt-24 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-6">
        <div className="space-y-4 lg:col-span-7 lg:row-span-2 lg:-ml-2.5">
          <CardPreview />
          <QuickActions />
        </div>
        <div className="lg:col-span-5 lg:col-start-8 lg:row-start-2">
          <PromoBanner />
        </div>
        <section className="px-2.5 pt-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mt-28">
          <SectionTitle title="Recent Activity" action={<TextLink to="/activity">See All</TextLink>} />
          {loading ? <Skeleton className="h-60" /> : <ActivityList items={activity.slice(0, 3)} compact />}
        </section>
      </div>
    </div>
  );
}
