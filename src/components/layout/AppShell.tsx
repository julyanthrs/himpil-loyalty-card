import { CreditCard, Gift, House, UserRound } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLoyalty } from '../../context/LoyaltyContext';
import { Backdrop, PageWordNote, wordForPath } from '../brand/Backdrop';
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

/** Pages whose top is a dark photo or band that already runs under the phone's status bar. */
const DARK_TOP = ['/', '/scan'];
const DARK_TINT = '#2a1a10';
const LIGHT_TINT = '#F6EFE4';

/**
 * Phone status-bar area. Browsers tint it with theme-color: dark over the Home photo and the Scan band,
 * cream elsewhere. In the installed app the page draws under a translucent status bar with white text,
 * so light pages (and dark-top pages once scrolled past the dark area) get an espresso strip behind it.
 */
function StatusBar() {
  const { pathname } = useLocation();
  const darkTop = DARK_TOP.includes(pathname);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!darkTop) return;
    const onScroll = () => setScrolled(window.scrollY > 260);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [darkTop]);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkTop ? DARK_TINT : LIGHT_TINT);
  }, [darkTop]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-[env(safe-area-inset-top)] bg-espresso transition-opacity duration-300 md:hidden ${
        darkTop && !scrolled ? 'opacity-0' : 'opacity-100'
      }`}
    />
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
      className="fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-full border border-latte/70 bg-ivory/95 shadow-lift backdrop-blur-md md:hidden"
      aria-label="Main"
    >
      <ul className="grid h-16 grid-cols-4 px-2">
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
  const { pathname } = useLocation();
  const word = wordForPath(pathname);
  return (
    <div className="min-h-dvh">
      {/* Home opens on its photo, so the corner branches would only peek out around it. */}
      <Backdrop word={word} branches={pathname !== '/'} />
      <StatusBar />
      <TopNav />
      <main className="pb-safe-nav mx-auto max-w-[1280px] px-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-6 md:pt-8 md:pb-16">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Outlet />
        </Suspense>
        <PageWordNote word={word} className="mt-16" />
      </main>
      <BottomNav />
    </div>
  );
}
