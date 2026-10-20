import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { service } from '../data';
import { errorMessage, STAMPS_PER_REWARD } from '../lib/loyalty';
import type { ActivityItem, LoyaltyAccount, Profile, ProfilePatch } from '../lib/types';
import { useToast } from './ToastContext';

export interface LoyaltyEvent {
  type: 'stamp' | 'unlocked' | 'redeemed';
  at: number;
  /** Index of the newest stamp, for the pop animation. */
  stampIndex?: number;
}

interface LoyaltyState {
  profile: Profile | null;
  account: LoyaltyAccount | null;
  activity: ActivityItem[];
  loading: boolean;
  error: string | null;
  lastEvent: LoyaltyEvent | null;
  refresh: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
}

const Ctx = createContext<LoyaltyState | null>(null);

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<LoyaltyEvent | null>(null);
  const prev = useRef<LoyaltyAccount | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [p, a, act] = await Promise.all([service.getProfile(), service.getAccount(), service.getActivity()]);
      const before = prev.current;
      if (before) {
        // Compare lifetime totals so a demo reset doesn't look like a new stamp.
        if (a.totalRedeemed > before.totalRedeemed) {
          setLastEvent({ type: 'redeemed', at: Date.now() });
          toast('Reward redeemed successfully. Enjoy your free drink!');
        } else if (a.totalStamps > before.totalStamps) {
          const unlocked = a.stamps >= STAMPS_PER_REWARD;
          setLastEvent({ type: unlocked ? 'unlocked' : 'stamp', at: Date.now(), stampIndex: a.stamps - 1 });
          toast(unlocked ? 'Card complete! Your free drink is ready.' : 'Stamp collected! You’re closer to your free drink.');
        }
      }
      prev.current = a;
      setProfile(p);
      setAccount(a);
      setActivity(act);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
    const off = service.subscribe(() => void refresh());
    // Safety net in case a realtime message is missed (e.g. phone was asleep).
    const onFocus = () => document.visibilityState === 'visible' && void refresh();
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      off();
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refresh]);

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    setProfile((p) => (p ? { ...p, ...patch } : p));
    try {
      setProfile(await service.updateProfile(patch));
    } catch (e) {
      toast(errorMessage(e), 'error');
      void refresh();
    }
  }, [refresh, toast]);

  return (
    <Ctx.Provider value={{ profile, account, activity, loading, error, lastEvent, refresh, updateProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLoyalty() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLoyalty must be used inside LoyaltyProvider');
  return v;
}
