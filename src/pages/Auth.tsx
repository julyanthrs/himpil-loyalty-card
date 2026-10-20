import { FlaskConical, MailCheck } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Botanical } from '../components/brand/Botanical';
import { Logo } from '../components/brand/Logo';
import { DemoBanner } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { isDemo, service } from '../data';
import { errorMessage } from '../lib/loyalty';

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner />
      <div className="mx-auto grid w-full max-w-[1280px] flex-1 gap-8 p-4 md:p-6 lg:grid-cols-2 lg:gap-12">
        <div className="relative hidden overflow-hidden rounded-[2rem] lg:block">
          <img src="/images/together.webp" alt="Friends sharing coffee" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-espresso/45" />
          <div className="relative flex h-full flex-col justify-between p-12 text-cream">
            <Logo tone="light" size={48} className="self-start" />
            <div>
              <p className="label-caps text-cream/80!">Good people · Better coffee</p>
              <p className="mt-3 max-w-md font-serif text-5xl leading-[1.08] text-cream">Good coffee goes further together.</p>
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-center py-8">
          <Botanical className="pointer-events-none absolute -top-4 -right-16 w-60 text-roasted/25" />
          <div className="relative w-full max-w-sm">
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo size={52} />
            </div>
            <h1 className="text-center text-[2rem] font-medium lg:text-left">{title}</h1>
            <p className="mt-2 text-center text-subtle lg:text-left">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-mocha">{label}</span>
      <input
        {...props}
        className="h-12 w-full rounded-xl border border-latte bg-ivory px-4 text-ink shadow-[inset_0_1px_2px_rgb(62_36_22/0.04)] transition outline-none placeholder:text-roasted/60 focus:border-mocha focus:ring-2 focus:ring-latte/60"
      />
    </label>
  );
}

function DemoNote() {
  return (
    <div className="mb-6 flex gap-3 rounded-2xl border border-latte bg-ivory p-4 text-sm text-mocha">
      <FlaskConical className="mt-0.5 size-5 shrink-0" strokeWidth={1.6} aria-hidden />
      <p>
        <strong className="font-medium text-espresso">Demo mode.</strong> No backend is connected, so everything is sample data stored in this
        browser. No password needed.
      </p>
    </div>
  );
}

function useRedirectTarget() {
  const location = useLocation();
  return (location.state as { from?: string } | null)?.from ?? '/';
}

export function Login() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (ready && user) return <Navigate to={target} replace />;

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await service.signIn(email.trim(), password);
      navigate(target, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to see your Himpil loyalty card.">
      {isDemo && (
        <>
          <DemoNote />
          <Button size="lg" className="w-full" loading={busy} onClick={() => void submit()}>
            Explore the demo card
          </Button>
          <p className="my-6 text-center text-xs tracking-[0.2em] text-subtle uppercase">or sign in as</p>
        </>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" required={!isDemo} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        {!isDemo && (
          <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" variant={isDemo ? 'secondary' : 'primary'} className="w-full" loading={busy}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-subtle">
        New to Himpil?{' '}
        <Link to="/register" className="font-medium text-espresso underline underline-offset-4">
          Create your card
        </Link>
      </p>
    </AuthLayout>
  );
}

export function Register() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  if (ready && user && !confirmSent) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await service.signUp(name.trim(), email.trim(), password);
      if (needsConfirmation) setConfirmSent(true);
      else navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (confirmSent) {
    return (
      <AuthLayout title="Check your inbox" subtitle={`We sent a confirmation link to ${email}.`}>
        <div className="flex flex-col items-center gap-4 text-center text-sm text-mocha">
          <MailCheck className="size-10 text-espresso" strokeWidth={1.4} aria-hidden />
          <p>Open the link to activate your Himpil card, then sign in.</p>
          <Link to="/login" className="font-medium text-espresso underline underline-offset-4">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your card" subtitle="Join Himpil and start collecting stamps.">
      {isDemo && <DemoNote />}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {!isDemo && (
          <Field
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {isDemo ? 'Start a fresh demo card' : 'Create my card'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-subtle">
        Already a member?{' '}
        <Link to="/login" className="font-medium text-espresso underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
