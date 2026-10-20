import { Camera, CameraOff, Gift, KeyRound, LogOut, Minus, Plus, ShieldAlert, Stamp, UserRound } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Logo } from '../components/brand/Logo';
import { DemoBanner } from '../components/layout/AppShell';
import { StampGrid } from '../components/loyalty/StampGrid';
import { Button } from '../components/ui/Button';
import { Panel, Skeleton } from '../components/ui/primitives';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isDemo, service } from '../data';
import { MENU } from '../lib/drinks';
import { errorMessage, parseMemberCode, STAMPS_PER_REWARD, stampsRemaining } from '../lib/loyalty';
import type { StaffCustomerView } from '../lib/types';

const newRequestId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0]! & (15 >> (Number(c) / 4)))).toString(16),
      );

function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<QrScanner | null>(null);
  const [active, setActive] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  const stop = useCallback(() => {
    scanner.current?.stop();
    setActive(false);
  }, []);

  const start = async () => {
    setProblem(null);
    if (!video.current) return;
    try {
      if (!(await QrScanner.hasCamera())) throw new Error('No camera found on this device.');
      scanner.current ??= new QrScanner(
        video.current,
        (result) => {
          const code = parseMemberCode(result.data);
          if (code) {
            scanner.current?.stop();
            setActive(false);
            onCodeRef.current(code);
          }
        },
        { preferredCamera: 'environment', highlightScanRegion: true, highlightCodeOutline: true, maxScansPerSecond: 6 },
      );
      await scanner.current.start();
      setActive(true);
    } catch (e) {
      setProblem(e instanceof Error && e.message ? e.message : 'Camera unavailable. Enter the code manually instead.');
      setActive(false);
    }
  };

  useEffect(() => () => scanner.current?.destroy(), []);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-espresso">
        <video ref={video} className={`size-full object-cover ${active ? '' : 'invisible'}`} muted playsInline />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-cream/80">
            <Camera className="size-10" strokeWidth={1.3} aria-hidden />
            <p className="text-sm">Point the camera at the customer’s Himpil QR code.</p>
            {problem && <p className="text-xs text-latte">{problem}</p>}
          </div>
        )}
      </div>
      <div className="mt-3">
        {active ? (
          <Button variant="secondary" className="w-full" onClick={stop}>
            <CameraOff className="size-4" aria-hidden /> Stop camera
          </Button>
        ) : (
          <Button className="w-full" onClick={() => void start()}>
            <Camera className="size-4" aria-hidden /> Start scanning
          </Button>
        )}
      </div>
    </div>
  );
}

function CustomerPanel({ customer, onUpdate, onClear }: { customer: StaffCustomerView; onUpdate: (c: StaffCustomerView) => void; onClear: () => void }) {
  const toast = useToast();
  const [drink, setDrink] = useState<string>(MENU[0]);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<'stamp' | 'redeem' | null>(null);
  const [confirmRedeem, setConfirmRedeem] = useState(false);
  // One request id per intended action; reused on retry so the server can de-duplicate.
  const requestId = useRef(newRequestId());
  const room = stampsRemaining(customer.stamps);
  const full = room === 0;

  useEffect(() => setQty((q) => Math.min(Math.max(1, q), Math.max(1, room))), [room]);

  const award = async () => {
    setBusy('stamp');
    try {
      const updated = await service.staffAwardStamps(customer.memberCode, drink, qty, requestId.current);
      requestId.current = newRequestId();
      onUpdate(updated);
      setQty(1);
      toast(`${qty === 1 ? 'Stamp' : `${qty} stamps`} added for ${customer.fullName || 'customer'}.`);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const redeem = async () => {
    setBusy('redeem');
    try {
      const updated = await service.staffRedeemReward(customer.memberCode, drink, requestId.current);
      requestId.current = newRequestId();
      onUpdate(updated);
      setConfirmRedeem(false);
      toast('Reward redeemed successfully.');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel className="animate-fade-in p-5 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-cream text-mocha">
            <UserRound className="size-5" strokeWidth={1.6} aria-hidden />
          </span>
          <div>
            <p className="font-serif text-xl text-espresso">{customer.fullName || 'Himpil member'}</p>
            <p className="font-mono text-xs tracking-[0.15em] text-subtle">{customer.memberCode}</p>
          </div>
        </div>
        <button onClick={onClear} className="text-sm text-mocha underline underline-offset-4 hover:text-espresso">
          Next customer
        </button>
      </div>

      <div className="mt-5 rounded-2xl bg-cream p-4">
        <div className="mb-3 flex justify-between text-sm">
          <span className="text-mocha">Card {customer.cycle}</span>
          <span className="font-medium text-espresso">
            {customer.stamps} / {STAMPS_PER_REWARD} stamps
          </span>
        </div>
        <StampGrid stamps={customer.stamps} className="mx-auto max-w-sm" />
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium text-mocha">Drink</legend>
        <div className="flex flex-wrap gap-2">
          {MENU.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDrink(d)}
              aria-pressed={drink === d}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                drink === d ? 'border-espresso bg-espresso text-ivory' : 'border-latte bg-ivory text-mocha hover:border-mocha/50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>

      {full ? (
        <div className="mt-6 rounded-2xl border border-espresso/15 bg-espresso/5 p-4">
          <p className="flex items-center gap-2 font-serif text-lg text-espresso">
            <Gift className="size-5" aria-hidden /> Free drink ready
          </p>
          <p className="mt-1 text-sm text-mocha">Redeem it to start a new card. This can’t be undone.</p>
          {confirmRedeem ? (
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" loading={busy === 'redeem'} onClick={() => void redeem()}>
                Confirm free {drink}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmRedeem(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button className="mt-4 w-full" size="lg" onClick={() => setConfirmRedeem(true)}>
              <Gift className="size-5" aria-hidden /> Redeem free drink
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-latte bg-ivory" role="group" aria-label="Number of stamps">
            <button className="p-3 text-mocha disabled:opacity-40" onClick={() => setQty((q) => q - 1)} disabled={qty <= 1} aria-label="Fewer stamps">
              <Minus className="size-4" />
            </button>
            <span className="w-6 text-center font-medium text-espresso" aria-live="polite">
              {qty}
            </span>
            <button className="p-3 text-mocha disabled:opacity-40" onClick={() => setQty((q) => q + 1)} disabled={qty >= room} aria-label="More stamps">
              <Plus className="size-4" />
            </button>
          </div>
          <Button size="lg" className="flex-1" loading={busy === 'stamp'} onClick={() => void award()}>
            <Stamp className="size-5" aria-hidden /> Add {qty === 1 ? 'stamp' : `${qty} stamps`}
          </Button>
        </div>
      )}
    </Panel>
  );
}

export default function Staff() {
  const { user, ready } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [manual, setManual] = useState('');
  const [customer, setCustomer] = useState<StaffCustomerView | null>(null);
  const [looking, setLooking] = useState(false);

  useEffect(() => {
    if (isDemo || user) void service.isStaff().then(setAllowed);
  }, [user]);

  const lookup = useCallback(
    async (code: string) => {
      setLooking(true);
      try {
        setCustomer(await service.staffLookup(code));
      } catch (e) {
        toast(errorMessage(e), 'error');
      } finally {
        setLooking(false);
      }
    },
    [toast],
  );

  if (!isDemo && ready && !user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  const submitManual = (e: FormEvent) => {
    e.preventDefault();
    const code = parseMemberCode(manual);
    if (!code) return toast('That doesn’t look like a Himpil code (HMP-XXXX-XXXX).', 'error');
    setManual('');
    void lookup(code);
  };

  return (
    <div className="min-h-dvh">
      <DemoBanner />
      <header className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-5 md:px-6">
        <div className="flex items-center gap-4">
          <Logo variant="inline" size={24} />
          <span className="h-6 w-px bg-latte" />
          <p className="font-serif text-lg text-mocha">Barista Console</p>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/" className="rounded-full px-3 py-2 text-sm text-mocha hover:bg-latte/40">
            Customer view
          </Link>
          {!isDemo && (
            <button onClick={() => void service.signOut()} className="rounded-full p-2 text-mocha hover:bg-latte/40" aria-label="Sign out">
              <LogOut className="size-5" />
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 pb-12 md:px-6">
        {allowed === null ? (
          <Skeleton className="h-96" />
        ) : !allowed ? (
          <Panel className="mx-auto mt-10 max-w-md p-8 text-center">
            <ShieldAlert className="mx-auto size-10 text-mocha" strokeWidth={1.4} aria-hidden />
            <h1 className="mt-4 text-2xl font-medium">Staff access only</h1>
            <p className="mt-2 text-sm text-subtle">This account isn’t registered as Himpil staff. Ask a manager to add you in the staff roles table.</p>
            <Link to="/" className="mt-6 inline-block text-sm font-medium text-mocha underline underline-offset-4">
              Back to my card
            </Link>
          </Panel>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr] lg:gap-8">
            <Panel className="p-5">
              <h1 className="mb-4 text-xl font-medium">Scan a card</h1>
              <Scanner onCode={(c) => void lookup(c)} />
              <form onSubmit={submitManual} className="mt-5 border-t border-latte/60 pt-5">
                <label htmlFor="code" className="mb-2 flex items-center gap-2 text-sm font-medium text-mocha">
                  <KeyRound className="size-4" aria-hidden /> Or enter the member code
                </label>
                <div className="flex gap-2">
                  <input
                    id="code"
                    value={manual}
                    onChange={(e) => setManual(e.target.value.toUpperCase())}
                    placeholder="HMP-XXXX-XXXX"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-latte bg-cream px-3 font-mono text-sm tracking-wider text-espresso outline-none focus:border-mocha"
                  />
                  <Button type="submit" variant="secondary" loading={looking}>
                    Find
                  </Button>
                </div>
                {isDemo && (
                  <button type="button" onClick={() => void lookup('HMP-7Q4K-2MXD')} className="mt-3 text-xs text-mocha underline underline-offset-4">
                    Use the demo customer’s code (HMP-7Q4K-2MXD)
                  </button>
                )}
              </form>
            </Panel>

            {customer ? (
              <CustomerPanel key={customer.memberCode} customer={customer} onUpdate={setCustomer} onClear={() => setCustomer(null)} />
            ) : (
              <Panel className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                <Logo size={40} />
                <p className="mt-6 font-serif text-xl text-espresso">Ready for the next customer</p>
                <p className="mt-1 max-w-xs text-sm text-subtle">Scan their QR code to add stamps or redeem a free drink. Every action is verified on the server.</p>
              </Panel>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
