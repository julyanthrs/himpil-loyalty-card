import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2.5 font-medium transition duration-200 ease-out select-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px';
const variants: Record<Variant, string> = {
  primary: 'bg-espresso text-ivory shadow-soft hover:-translate-y-0.5 hover:shadow-lift hover:bg-[#4a2c1b]',
  secondary: 'bg-ivory text-espresso border border-mocha/25 shadow-soft hover:-translate-y-0.5 hover:shadow-lift hover:border-mocha/40',
  ghost: 'text-mocha hover:bg-latte/40',
  danger: 'bg-ivory text-danger border border-danger/25 hover:bg-danger/5',
};
const sizes: Record<Size, string> = {
  md: 'h-11 px-5 rounded-full text-sm',
  lg: 'h-14 px-6 rounded-2xl text-[0.97rem]',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  loading,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ to, variant = 'primary', size = 'md', className = '', children }: CommonProps & { to: string }) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}
