import { CreditCard, FlaskConical, Gift, House, UserRound } from 'lucide-react';
import { Suspense } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLoyalty } from '../../context/LoyaltyContext';
import { isDemo } from '../../data';
import { Logo } from '../brand/Logo';
import { Avatar, Skeleton } from '../ui/primitives';
import { NotificationsMenu } from './NotificationsMenu';

const DESKTOP_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/card', label: 'My Card' },
  { to: '/rewards', label: 'Rewards' },
  { to: '/activity', label: 'Activity' },
  { to: '/profile', label: 'Profile' },
];

// Matches the mockup: the QR screen lives under Rewards.
const MOBILE_TABS = [
  { to: '/', label: 'Home', icon: House, match: (p: string) => p === '/' || p === '/activity' },
  { to: '/card', label: 'Card', icon: CreditCard, match: (p: string) => p.startsWith('/card') },
  { to: '/rewards', label: 'Rewards', icon: Gift, match: (p: string) => p.startsWith('/rewards') || p.startsWith('/scan') },
  { to: '/profile', label: 'Profile', icon: UserRound, match: (p: string) => p.startsWith('/profile') },
];

export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="bg-espresso px-4 py-1.5 text-center text-[0.75rem] text-cream/90">
      <FlaskConical className="mr-1.5 inline size-3.5 -translate-y-px" aria-hidden />
      <strong className="font-medium text-cream">Demo mode</strong> — sample data saved only in this browser. Stamps aren’t real.{' '}
      <Link to="/staff" className="underline underline-offset-2 hover:text-ivory">
        Try the barista console
      </Link>
    </div>
  );
}

function TopNav() {
  const { profile } = useLoyalty();
  return (
    <div className="sticky top-0 z-40 hidden px-6 pt-4 md:block">
      <nav
        className="mx-auto flex h-16 max-w-[1280px] items-center justify-between rounded-full border border-latte/70 bg-ivory px-6 shadow-soft"
        aria-label="Main"
      >
        <Link to="/" className="rounded-full" aria-label="Himpil home">
          <Logo variant="inline" size={26} />
        </Link>
        <ul className="flex items-center gap-1 lg:gap-3">
          {DESKTOP_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center rounded-full px-4 py-2 text-[0.93rem] transition ${
                    isActive ? 'font-medium text-espresso' : 'text-mocha hover:text-espresso'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    <span className={`absolute bottom-0 size-1.5 rounded-full bg-espresso transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <NotificationsMenu />
          <Link to="/profile" className="rounded-full" aria-label="Your profile">
            <Avatar name={profile?.fullName ?? ''} src={profile?.avatarUrl} size={38} />
          </Link>
        </div>
      </nav>
    </div>
  );
}

function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-latte/70 bg-ivory pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto grid h-[4.25rem] max-w-md grid-cols-4">
        {MOBILE_TABS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[0.72rem] transition ${
                  active ? 'font-semibold text-espresso' : 'text-subtle'
                }`}
              >
                {/* Active tab: solid espresso icon with an ivory inner line, as in the app mockup. */}
                <Icon
                  className={`size-6 ${active ? '[&>*:not(:first-child)]:stroke-ivory' : ''}`}
                  strokeWidth={active ? 1.8 : 1.5}
                  fill={active ? 'currentColor' : 'none'}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell() {
  return (
    <div className="min-h-dvh">
      <DemoBanner />
      <TopNav />
      <main className="pb-safe-nav mx-auto max-w-[1280px] px-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-6 md:pt-8 md:pb-16">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
