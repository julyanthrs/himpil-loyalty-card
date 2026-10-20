import { ChevronRight, Gift, Scan } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Botanical } from '../components/brand/Botanical';
import { LogoOnPhoto, PHOTO_ASPECT } from '../components/brand/Logo';
import { NotificationsMenu } from '../components/layout/NotificationsMenu';
import { ActivityList } from '../components/loyalty/ActivityList';
import { CardPreview } from '../components/loyalty/CardPreview';
import { SectionTitle, Skeleton, TextLink } from '../components/ui/primitives';
import { useLoyalty } from '../context/LoyaltyContext';

/**
 * Photographic hero: Himpil's own photo with the logo drawn back exactly where it is printed.
 * The photo box is at least as wide as the hero and at least --photo-h tall (like object-fit: cover);
 * left/top + translate of the same percentage reproduce object-position, so the logo tracks the crop.
 * On phones --photo-h is taller than the hero, so the empty top of the photo is cropped away instead
 * of the whole photo shrinking.
 */
function Hero() {
  return (
    <section
      className="relative -mx-4 -mt-[max(1rem,env(safe-area-inset-top))] h-[22rem] overflow-hidden bg-[#2a1a10] [--photo-h:27.5rem] md:mx-0 md:mt-0 md:h-[26rem] md:rounded-[2rem] md:[--photo-h:100cqh]"
      style={{ containerType: 'size' }}
    >
      <h1 className="sr-only">Himpil</h1>
      <div
        className="absolute top-[80%] left-[18%] -translate-x-[18%] -translate-y-[80%] md:top-[47%] md:left-1/2 md:-translate-x-1/2 md:-translate-y-[47%]"
        style={{ width: `max(100%, calc(var(--photo-h) * ${PHOTO_ASPECT}))`, aspectRatio: String(PHOTO_ASPECT) }}
      >
        <img
          src="/images/hero-himpil-sm.webp"
          srcSet="/images/hero-himpil-sm.webp 800w, /images/hero-himpil.webp 1467w"
          sizes="(min-width: 768px) 1280px, 160vw"
          alt="Himpil iced latte and a coconut dessert on a wooden table by the café window"
          fetchPriority="high"
          className="absolute inset-0 size-full"
        />
        <LogoOnPhoto />
      </div>
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 text-cream md:hidden [&_button]:text-cream [&_button:hover]:bg-cream/10">
        <NotificationsMenu />
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
      <div className="relative z-10 -mx-1.5 -mt-14 grid gap-4 md:mx-0 lg:-mt-16 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-6">
        <div className="space-y-4 lg:col-span-7 lg:row-span-2 lg:-ml-2.5">
          <CardPreview />
          <QuickActions />
        </div>
        <div className="lg:col-span-5 lg:col-start-8 lg:row-start-2">
          <PromoBanner />
        </div>
        <section className="px-2.5 pt-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mt-20">
          <SectionTitle title="Recent Activity" action={<TextLink to="/activity">See All</TextLink>} />
          {loading ? <Skeleton className="h-60" /> : <ActivityList items={activity.slice(0, 3)} compact />}
        </section>
      </div>
    </div>
  );
}
