import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type {
  ActivityItem,
  LoyaltyAccount,
  LoyaltyErrorCode,
  Profile,
  ProfilePatch,
  SessionUser,
  StaffCustomerView,
} from '../lib/types';
import { LoyaltyError } from '../lib/types';
import type { LoyaltyService } from './service';

const KNOWN_CODES: LoyaltyErrorCode[] = ['NOT_STAFF', 'NOT_FOUND', 'REWARD_PENDING', 'REWARD_LOCKED', 'EXCEEDS_CARD', 'COOLDOWN'];

function toError(err: { message?: string } | null | undefined): LoyaltyError {
  const msg = err?.message ?? '';
  const code = KNOWN_CODES.find((c) => msg.includes(c));
  if (code) return new LoyaltyError(code);
  if (/fetch|network/i.test(msg)) return new LoyaltyError('NETWORK');
  if (/jwt|auth/i.test(msg)) return new LoyaltyError('AUTH');
  return new LoyaltyError('UNKNOWN', msg || undefined);
}

const toUser = (u: User | null | undefined): SessionUser | null => (u ? { id: u.id, email: u.email ?? '' } : null);

type StaffRow = { member_code: string; full_name: string; stamps: number; cycle: number };
const toStaffView = (r: StaffRow): StaffCustomerView => ({
  memberCode: r.member_code,
  fullName: r.full_name,
  stamps: r.stamps,
  cycle: r.cycle,
});

export class SupabaseService implements LoyaltyService {
  readonly mode = 'supabase' as const;
  private db: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.db = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  }

  private async uid() {
    const { data } = await this.db.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new LoyaltyError('AUTH');
    return id;
  }

  async getSession() {
    const { data } = await this.db.auth.getSession();
    return toUser(data.session?.user);
  }

  onAuthChange(cb: (user: SessionUser | null) => void) {
    const { data } = this.db.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)));
    return () => data.subscription.unsubscribe();
  }

  async signIn(email: string, password: string) {
    const { error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async signUp(fullName: string, email: string, password: string) {
    const { data, error } = await this.db.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
    return { needsConfirmation: !data.session };
  }

  async signOut() {
    await this.db.auth.signOut();
  }

  async getProfile(): Promise<Profile> {
    const id = await this.uid();
    const { data, error } = await this.db
      .from('profiles')
      .select('id, full_name, email, avatar_url, created_at, notify_stamps, notify_offers')
      .eq('id', id)
      .single();
    if (error) throw toError(error);
    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      avatarUrl: data.avatar_url,
      memberSince: data.created_at,
      notifyStamps: data.notify_stamps,
      notifyOffers: data.notify_offers,
    };
  }

  async updateProfile(patch: ProfilePatch) {
    const id = await this.uid();
    const row: Record<string, unknown> = {};
    if (patch.fullName !== undefined) row.full_name = patch.fullName;
    if (patch.notifyStamps !== undefined) row.notify_stamps = patch.notifyStamps;
    if (patch.notifyOffers !== undefined) row.notify_offers = patch.notifyOffers;
    const { error } = await this.db.from('profiles').update(row).eq('id', id);
    if (error) throw toError(error);
    return this.getProfile();
  }

  async getAccount(): Promise<LoyaltyAccount> {
    const id = await this.uid();
    const { data, error } = await this.db
      .from('loyalty_accounts')
      .select('member_code, stamps, cycle, total_stamps, total_redeemed')
      .eq('user_id', id)
      .single();
    if (error) throw toError(error);
    return {
      memberCode: data.member_code,
      stamps: data.stamps,
      cycle: data.cycle,
      totalStamps: data.total_stamps,
      totalRedeemed: data.total_redeemed,
    };
  }

  async getActivity(limit = 100): Promise<ActivityItem[]> {
    const { data, error } = await this.db
      .from('activity_feed')
      .select('id, kind, drink, stamps, cycle, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw toError(error);
    return data.map((r) => ({
      id: r.id,
      kind: r.kind,
      drink: r.drink,
      stamps: r.stamps,
      cycle: r.cycle,
      createdAt: r.created_at,
    }));
  }

  subscribe(cb: () => void) {
    let channel: ReturnType<SupabaseClient['channel']> | null = null;
    let cancelled = false;
    void this.uid()
      .then((id) => {
        if (cancelled) return;
        channel = this.db
          .channel(`loyalty-${id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_accounts', filter: `user_id=eq.${id}` }, cb)
          .subscribe();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (channel) void this.db.removeChannel(channel);
    };
  }

  async isStaff() {
    const { data, error } = await this.db.rpc('is_staff');
    if (error) return false;
    return data === true;
  }

  private async staffRpc(fn: string, args: Record<string, unknown>) {
    const { data, error } = await this.db.rpc(fn, args);
    if (error) throw toError(error);
    const row = (Array.isArray(data) ? data[0] : data) as StaffRow | undefined;
    if (!row) throw new LoyaltyError('NOT_FOUND');
    return toStaffView(row);
  }

  staffLookup(memberCode: string) {
    return this.staffRpc('staff_lookup', { p_member_code: memberCode });
  }

  staffAwardStamps(memberCode: string, drink: string, quantity: number, requestId: string) {
    return this.staffRpc('staff_award_stamps', {
      p_member_code: memberCode,
      p_drink: drink,
      p_quantity: quantity,
      p_request_id: requestId,
    });
  }

  staffRedeemReward(memberCode: string, drink: string, requestId: string) {
    return this.staffRpc('staff_redeem_reward', { p_member_code: memberCode, p_drink: drink, p_request_id: requestId });
  }
}
