import { Link } from 'react-router-dom';
import { LogoOnPhoto, PHOTO_ASPECT } from '../components/brand/Logo';
import { NotificationsMenu } from '../components/layout/NotificationsMenu';
import { ActivityList } from '../components/loyalty/ActivityList';
import { CardPreview } from '../components/loyalty/CardPreview';
import { QrPanel } from '../components/loyalty/QrPanel';
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
      className="relative -mx-4 -mt-[max(1rem,env(safe-area-inset-top))] h-[22rem] overflow-hidden bg-[#2a1a10] [--photo-h:27.5rem] [--photo-w:100%] md:mx-0 md:mt-0 md:h-[26rem] md:rounded-[2rem] md:[--photo-h:100cqh] md:[--photo-w:115%]"
      style={{ containerType: 'size' }}
    >
      <h1 className="sr-only">Himpil</h1>
      {/* Wider screens: photo slightly wider than the hero so the crop can favour the drinks on the right. */}
      <div
        className="absolute top-[80%] left-[28%] -translate-x-[28%] -translate-y-[80%] md:top-[47%] md:left-[70%] md:-translate-x-[70%] md:-translate-y-[47%]"
        style={{ width: `max(var(--photo-w), calc(var(--photo-h) * ${PHOTO_ASPECT}))`, aspectRatio: String(PHOTO_ASPECT) }}
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

/** The member's QR code: the barista scans it in the staff console to add stamps. */
function MemberQr() {
  const { account } = useLoyalty();
  return (
    <section className="px-2.5" aria-label="Your member QR code">
      {account ? <QrPanel memberCode={account.memberCode} showLogo={false} /> : <Skeleton className="h-[22rem] rounded-[1.6rem]" />}
      <p className="mt-3 text-center text-xs text-subtle">
        Scanner not working? Your member code is in{' '}
        <Link to="/profile" className="font-medium text-mocha underline underline-offset-2">
          Profile
        </Link>
        .
      </p>
    </section>
  );
}

export default function Home() {
  const { activity, loading } = useLoyalty();
  return (
    <div className="animate-fade-in">
      <Hero />
      <div className="relative z-10 -mx-1.5 -mt-14 grid gap-4 md:mx-0 lg:-mt-16 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-6">
        <div className="space-y-4 lg:col-span-7 lg:-ml-2.5">
          <CardPreview />
          <MemberQr />
        </div>
        <section className="px-2.5 pt-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mt-20">
          <SectionTitle title="Recent Activity" action={<TextLink to="/activity">See All</TextLink>} />
          {loading ? <Skeleton className="h-60" /> : <ActivityList items={activity.slice(0, 3)} compact />}
        </section>
      </div>
    </div>
  );
}
