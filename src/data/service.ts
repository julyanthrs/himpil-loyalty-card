import type {
  ActivityItem,
  DataMode,
  LoyaltyAccount,
  Profile,
  ProfilePatch,
  SessionUser,
  StaffCustomerView,
} from '../lib/types';

/**
 * Everything the UI needs from a backend. Two implementations:
 *  - SupabaseService: real auth + Postgres with RLS; stamps only change through staff-only RPCs.
 *  - DemoService: sample data kept in this browser's localStorage, clearly labeled in the UI.
 */
export interface LoyaltyService {
  readonly mode: DataMode;

  getSession(): Promise<SessionUser | null>;
  onAuthChange(cb: (user: SessionUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(fullName: string, email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;

  getProfile(): Promise<Profile>;
  updateProfile(patch: ProfilePatch): Promise<Profile>;
  getAccount(): Promise<LoyaltyAccount>;
  getActivity(limit?: number): Promise<ActivityItem[]>;
  /** Fires whenever the signed-in customer's loyalty data changes (e.g. a barista adds a stamp). */
  subscribe(cb: () => void): () => void;

  isStaff(): Promise<boolean>;
  staffLookup(memberCode: string): Promise<StaffCustomerView>;
  staffAwardStamps(memberCode: string, drink: string, quantity: number, requestId: string): Promise<StaffCustomerView>;
  staffRedeemReward(memberCode: string, drink: string, requestId: string): Promise<StaffCustomerView>;
}
