import { Bell, Gift, Stamp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoyalty } from '../../context/LoyaltyContext';
import { formatDateTimeShort } from '../../lib/format';

const SEEN_KEY = 'himpil-notifications-seen';

function readSeen() {
  try {
    return Number(localStorage.getItem(SEEN_KEY) ?? 0);
  } catch {
    return 0;
  }
}

/** Recent card events shown as notifications. "Seen" is a per-device convenience only. */
export function NotificationsMenu({ align = 'right' }: { align?: 'left' | 'right' }) {
  const { activity } = useLoyalty();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(readSeen);
  const ref = useRef<HTMLDivElement>(null);
  const recent = activity.slice(0, 5);
  const unread = recent.some((a) => new Date(a.createdAt).getTime() > seen);

  useEffect(() => {
    if (!open) return;
    const now = Date.now();
    setSeen(now);
    try {
      localStorage.setItem(SEEN_KEY, String(now));
    } catch {
      /* ignore */
    }
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-10 items-center justify-center rounded-full text-espresso transition hover:bg-latte/40"
        aria-label={unread ? 'Notifications, new activity' : 'Notifications'}
        aria-expanded={open}
      >
        <Bell className="size-[22px]" strokeWidth={1.6} />
        {unread && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-mocha ring-2 ring-cream" />}
      </button>
      {open && (
        <div
          className={`animate-fade-in absolute top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-latte/70 bg-ivory shadow-lift ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <p className="border-b border-latte/60 px-4 py-3 font-serif text-lg text-espresso">Notifications</p>
          {recent.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-subtle">Nothing yet — your first stamp is waiting.</p>
          ) : (
            <ul className="divide-y divide-latte/50">
              {recent.map((a) => (
                <li key={a.id} className="flex gap-3 px-4 py-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-cream text-mocha">
                    {a.kind === 'redemption' ? <Gift className="size-4" /> : <Stamp className="size-4" />}
                  </span>
                  <div className="text-sm">
                    <p className="text-ink">
                      {a.kind === 'redemption' ? `Free ${a.drink} redeemed` : `Stamp collected for your ${a.drink}`}
                    </p>
                    <p className="mt-0.5 text-xs text-subtle">{formatDateTimeShort(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/activity" onClick={() => setOpen(false)} className="block border-t border-latte/60 px-4 py-3 text-center text-sm font-medium text-mocha hover:bg-cream">
            View all activity
          </Link>
        </div>
      )}
    </div>
  );
}
