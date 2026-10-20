import { ChevronLeft } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CARD_SLOTS, STAMPS_PER_REWARD } from '../../lib/loyalty';
import { initials } from '../../lib/format';

export function Panel({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-[var(--radius-panel)] border border-latte/60 bg-ivory shadow-soft ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, action, className = '' }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={`mb-3 flex items-baseline justify-between gap-4 ${className}`}>
      <h2 className="text-[1.35rem] font-medium md:text-2xl">{title}</h2>
      {action}
    </div>
  );
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-sm font-medium text-mocha underline-offset-4 hover:text-espresso hover:underline">
      {children}
    </Link>
  );
}

/** Ten pill segments — one per cup on the card. */
export function ProgressSegments({
  value,
  onDark = false,
  thick = false,
  className = '',
}: {
  value: number;
  onDark?: boolean;
  thick?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex gap-1.5 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={CARD_SLOTS}
      aria-valuenow={value}
      aria-label={`${value} of ${CARD_SLOTS} cups collected; ${STAMPS_PER_REWARD} unlock the free drink`}
    >
      {Array.from({ length: CARD_SLOTS }, (_, i) => (
        <span
          key={i}
          className={`${thick ? 'h-3' : 'h-2'} flex-1 rounded-full transition-colors duration-500 ${
            i < value ? (onDark ? 'bg-cream' : 'bg-espresso') : onDark ? 'bg-cream/25' : 'bg-latte'
          }`}
        />
      ))}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-latte/50 ${className}`} aria-hidden />;
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  return src ? (
    <img src={src} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      className="inline-flex items-center justify-center rounded-full bg-mocha font-serif font-medium text-ivory"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3.5">
      <span>
        <span className="block text-[0.95rem] text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-subtle">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-7 w-12 rounded-full bg-latte transition-colors duration-200 peer-checked:bg-espresso peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-mocha" />
        <span className="absolute top-1 left-1 size-5 rounded-full bg-ivory shadow transition-transform duration-200 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/** Mobile page header ("‹ Loyalty Card"); on desktop shows a quiet serif title. */
export function PageHeader({
  title,
  back = true,
  action,
  dark = false,
}: {
  title: string;
  back?: boolean;
  action?: ReactNode;
  /** Cream title for pages that sit on the dark espresso band. */
  dark?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <header className="relative mb-5 flex h-12 items-center justify-center md:mb-8 md:h-auto md:justify-start">
      {back && (
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className={`absolute left-0 rounded-full p-2 md:hidden ${dark ? 'text-cream hover:bg-cream/10' : 'text-espresso hover:bg-latte/40'}`}
          aria-label="Go back"
        >
          <ChevronLeft className="size-6" strokeWidth={1.75} />
        </button>
      )}
      <h1 className={`text-[1.6rem] font-medium md:text-[2.25rem] ${dark ? 'text-cream!' : ''}`}>{title}</h1>
      {action && <div className="absolute right-0">{action}</div>}
    </header>
  );
}
