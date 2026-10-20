export type DataMode = 'demo' | 'supabase';

export interface SessionUser {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  memberSince: string;
  notifyStamps: boolean;
  notifyOffers: boolean;
}

export type ProfilePatch = Partial<Pick<Profile, 'fullName' | 'notifyStamps' | 'notifyOffers'>>;

export interface LoyaltyAccount {
  memberCode: string;
  /** Stamps in the current cycle, 0–9. Nine unlocks the free drink. */
  stamps: number;
  cycle: number;
  totalStamps: number;
  totalRedeemed: number;
}

export interface ActivityItem {
  id: string;
  kind: 'stamp' | 'redemption';
  drink: string;
  stamps: number;
  cycle: number;
  createdAt: string;
}

export type RewardStatus = 'locked' | 'available' | 'redeemed';

/** What a barista sees after scanning a customer's code. */
export interface StaffCustomerView {
  memberCode: string;
  fullName: string;
  stamps: number;
  cycle: number;
}

export class LoyaltyError extends Error {
  constructor(public code: LoyaltyErrorCode, message?: string) {
    super(message ?? code);
  }
}

export type LoyaltyErrorCode =
  | 'NOT_STAFF'
  | 'NOT_FOUND'
  | 'REWARD_PENDING'
  | 'REWARD_LOCKED'
  | 'EXCEEDS_CARD'
  | 'COOLDOWN'
  | 'AUTH'
  | 'NETWORK'
  | 'UNKNOWN';
