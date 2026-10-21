import { Check, Copy, IdCard, LogOut, Pencil, RotateCcw, ScanLine, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonLink } from '../components/ui/Button';
import { Avatar, PageHeader, Panel, Skeleton, Toggle } from '../components/ui/primitives';
import { useLoyalty } from '../context/LoyaltyContext';
import { useToast } from '../context/ToastContext';
import { isDemo, service } from '../data';
import { DemoService } from '../data/demoService';
import { formatMonthYear } from '../lib/format';

export default function Profile() {
  const { profile, account, updateProfile } = useLoyalty();
  const toast = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [staff, setStaff] = useState(false);
  const demo = service instanceof DemoService ? service : null;

  useEffect(() => {
    void service.isStaff().then(setStaff);
  }, []);

  if (!profile || !account) {
    return (
      <div>
        <PageHeader title="Profile" back={false} />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await updateProfile({ fullName: trimmed.slice(0, 80) });
    setEditing(false);
    toast('Name updated.');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(account.memberCode);
      toast('Member code copied.');
    } catch {
      toast('Couldn’t copy. Read the code to the barista instead.', 'info');
    }
  };

  const logout = async () => {
    await service.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Profile" back={false} />
      <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr] lg:gap-8">
        <Panel className="p-6 text-center md:p-8">
          <div className="flex justify-center">
            <Avatar name={profile.fullName} src={profile.avatarUrl} size={88} />
          </div>
          {editing ? (
            <form onSubmit={saveName} className="mt-4 flex items-center gap-2">
              <label htmlFor="name" className="sr-only">
                Your name
              </label>
              <input
                id="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="h-11 min-w-0 flex-1 rounded-xl border border-latte bg-cream px-3 text-center font-serif text-lg text-espresso outline-none focus:border-mocha"
              />
              <button type="submit" className="rounded-full bg-espresso p-2.5 text-ivory" aria-label="Save name">
                <Check className="size-4" />
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-full p-2.5 text-mocha hover:bg-latte/40" aria-label="Cancel">
                <X className="size-4" />
              </button>
            </form>
          ) : (
            <h2 className="mt-4 flex items-center justify-center gap-2 text-2xl font-medium">
              {profile.fullName || 'Himpil friend'}
              <button
                onClick={() => {
                  setName(profile.fullName);
                  setEditing(true);
                }}
                className="rounded-full p-1.5 text-subtle hover:bg-latte/40 hover:text-espresso"
                aria-label="Edit name"
              >
                <Pencil className="size-4" />
              </button>
            </h2>
          )}
          <p className="mt-1 text-sm text-subtle">{profile.email}</p>
          <p className="mt-3 inline-block rounded-full bg-cream px-3 py-1 text-xs text-mocha">
            Member since {formatMonthYear(profile.memberSince)}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-latte/60 pt-6">
            <div>
              <p className="font-serif text-3xl text-espresso">{account.totalStamps}</p>
              <p className="mt-1 text-xs text-subtle">Total stamps earned</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-espresso">{account.totalRedeemed}</p>
              <p className="mt-1 text-xs text-subtle">Free drinks redeemed</p>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="px-6 py-5 md:px-8">
            <h2 className="flex items-center gap-2.5 text-xl font-medium">
              <IdCard className="size-5 text-mocha" strokeWidth={1.6} aria-hidden /> Member code
            </h2>
            <p className="mt-1 text-sm text-subtle">
              Your customer ID. If the scanner isn’t working, tell the barista this code and they can enter it instead.
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-latte/70 bg-cream px-4 py-3">
              <p className="min-w-0 flex-1 font-mono text-[1.25rem] tracking-[0.08em] whitespace-nowrap text-espresso sm:text-2xl sm:tracking-[0.14em]" aria-label={`Member code ${account.memberCode.split('').join(' ')}`}>
                {account.memberCode}
              </p>
              <Button variant="secondary" onClick={() => void copyCode()} className="shrink-0 max-sm:px-3" aria-label="Copy member code">
                <Copy className="size-4" aria-hidden /> <span className="max-sm:sr-only">Copy</span>
              </Button>
            </div>
          </Panel>

          <Panel className="px-6 py-4 md:px-8">
            <h2 className="pt-2 text-xl font-medium">Notifications</h2>
            <div className="divide-y divide-latte/60">
              <Toggle
                label="Stamp & reward updates"
                description="When a stamp is added or your free drink is ready."
                checked={profile.notifyStamps}
                onChange={(v) => void updateProfile({ notifyStamps: v })}
              />
              <Toggle
                label="News from Himpil"
                description="Seasonal drinks and café announcements."
                checked={profile.notifyOffers}
                onChange={(v) => void updateProfile({ notifyOffers: v })}
              />
            </div>
          </Panel>

          {(staff || isDemo) && (
            <Panel className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-8">
              <div>
                <h2 className="text-xl font-medium">Barista console</h2>
                <p className="mt-1 text-sm text-subtle">{isDemo ? 'Play the barista and add stamps to this demo card.' : 'Scan customer codes and redeem rewards.'}</p>
              </div>
              <ButtonLink to="/staff" variant="secondary">
                <ScanLine className="size-4" aria-hidden /> Open console
              </ButtonLink>
            </Panel>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={() => void logout()}>
              <LogOut className="size-4" aria-hidden /> Log out
            </Button>
            {demo && (
              <Button
                variant="ghost"
                onClick={() => {
                  demo.reset();
                  toast('Demo data reset to the sample card.', 'info');
                }}
              >
                <RotateCcw className="size-4" aria-hidden /> Reset demo data
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
