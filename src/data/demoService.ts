import { STAMPS_PER_REWARD } from '../lib/loyalty';
import { MENU } from '../lib/drinks';
import type { ActivityItem, LoyaltyAccount, Profile, ProfilePatch, SessionUser, StaffCustomerView } from '../lib/types';
import { LoyaltyError } from '../lib/types';
import type { LoyaltyService } from './service';

/**
 * DEMO MODE — sample data stored only in this browser. Nothing here is permanent or secure;
 * the UI shows a banner whenever this service is active. Open /staff in a second tab to play
 * the barista: changes sync between tabs through the `storage` event.
 */

// v2: sample member now has three completed cards for the Rewards stack.
const KEY = 'himpil-demo-v2';
const CHANGE_EVENT = 'himpil-demo-change';
const COOLDOWN_MS = 4000;

interface DemoState {
  signedIn: boolean;
  profile: Profile;
  account: LoyaltyAccount;
  activity: ActivityItem[];
  processedRequests: string[];
  lastStampAt: number;
}

const DEMO_CODE = 'HMP-7Q4K-2MXD';

function at(daysAgo: number, hour: number, minute: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function seed(fullName = 'Alex Rivera', email = 'alex@example.com', empty = false): DemoState {
  const activity: ActivityItem[] = [];
  if (!empty) {
    // Three completed cards (nine stamps, then the free drink), then the current card with seven stamps.
    const drinks = MENU;
    const cycles: { start: number; free?: [number, string] }[] = [
      { start: 155, free: [119, 'Cappuccino'] },
      { start: 112, free: [72, 'Iced Coffee'] },
      { start: 61, free: [27, 'Spanish Latte'] },
      { start: 24 },
    ];
    cycles.forEach(({ start, free }, c) => {
      const cycle = c + 1;
      const count = free ? STAMPS_PER_REWARD : 7;
      for (let i = 0; i < count; i++) {
        const daysAgo = Math.round(start - (i * (start - (free ? free[0] + 4 : 0))) / (count - 1));
        const drink = drinks[(c * 3 + i * 5) % drinks.length]!;
        activity.push({ id: `c${cycle}-${i}`, kind: 'stamp', drink, stamps: 1, cycle, createdAt: at(daysAgo, 8 + ((i * 3 + c) % 8), (i * 17 + c * 11) % 60) });
      }
      if (free) activity.push({ id: `r${cycle}`, kind: 'redemption', drink: free[1], stamps: 0, cycle, createdAt: at(free[0], 9, 18) });
    });
    activity.reverse();
  }
  return {
    signedIn: true,
    profile: {
      id: 'demo-user',
      fullName,
      email,
      avatarUrl: null,
      memberSince: empty ? new Date().toISOString() : at(158, 9, 0),
      notifyStamps: true,
      notifyOffers: false,
    },
    account: empty
      ? { memberCode: DEMO_CODE, stamps: 0, cycle: 1, totalStamps: 0, totalRedeemed: 0 }
      : { memberCode: DEMO_CODE, stamps: 7, cycle: 4, totalStamps: 34, totalRedeemed: 3 },
    activity,
    processedRequests: [],
    lastStampAt: 0,
  };
}

function read(): DemoState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoState) : null;
  } catch {
    return null;
  }
}

// Fallback for browsers where storage is blocked (private mode etc.).
let memory: DemoState | null = null;

function load(): DemoState {
  return read() ?? memory ?? (memory = seed());
}

function save(state: DemoState) {
  memory = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — keep in memory */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

function staffView(s: DemoState): StaffCustomerView {
  return { memberCode: s.account.memberCode, fullName: s.profile.fullName, stamps: s.account.stamps, cycle: s.account.cycle };
}

function findCustomer(memberCode: string): DemoState {
  const s = load();
  if (s.account.memberCode !== memberCode) throw new LoyaltyError('NOT_FOUND');
  return s;
}

export class DemoService implements LoyaltyService {
  readonly mode = 'demo' as const;

  async getSession(): Promise<SessionUser | null> {
    const s = load();
    return s.signedIn ? { id: s.profile.id, email: s.profile.email } : null;
  }

  onAuthChange(cb: (user: SessionUser | null) => void) {
    const handler = () => void this.getSession().then(cb);
    window.addEventListener(CHANGE_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }

  /** Demo sign-in never checks or stores passwords. An empty email loads the sample member. */
  async signIn(email: string) {
    await delay();
    const s = read() ?? seed();
    s.signedIn = true;
    if (email && email !== s.profile.email) s.profile.email = email;
    save(s);
  }

  async signUp(fullName: string, email: string) {
    await delay();
    save(seed(fullName, email, true));
    return { needsConfirmation: false };
  }

  async signOut() {
    const s = load();
    s.signedIn = false;
    save(s);
  }

  /** Restores the original sample member with 7 stamps. */
  reset() {
    save(seed());
  }

  async getProfile() {
    await delay(120);
    return load().profile;
  }

  async updateProfile(patch: ProfilePatch) {
    const s = load();
    s.profile = { ...s.profile, ...patch };
    save(s);
    return s.profile;
  }

  async getAccount() {
    await delay(120);
    return load().account;
  }

  async getActivity(limit?: number) {
    const all = load().activity;
    return limit ? all.slice(0, limit) : all;
  }

  subscribe(cb: () => void) {
    const onStorage = (e: StorageEvent) => e.key === KEY && cb();
    window.addEventListener(CHANGE_EVENT, cb);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, cb);
      window.removeEventListener('storage', onStorage);
    };
  }

  async isStaff() {
    return true; // Demo only: anyone may try the barista console.
  }

  async staffLookup(memberCode: string) {
    await delay();
    return staffView(findCustomer(memberCode));
  }

  async staffAwardStamps(memberCode: string, drink: string, quantity: number, requestId: string) {
    await delay(400);
    const s = findCustomer(memberCode);
    if (s.processedRequests.includes(requestId)) return staffView(s);
    if (s.account.stamps >= STAMPS_PER_REWARD) throw new LoyaltyError('REWARD_PENDING');
    if (quantity < 1 || s.account.stamps + quantity > STAMPS_PER_REWARD) throw new LoyaltyError('EXCEEDS_CARD');
    if (Date.now() - s.lastStampAt < COOLDOWN_MS) throw new LoyaltyError('COOLDOWN');
    s.account = {
      ...s.account,
      stamps: s.account.stamps + quantity,
      totalStamps: s.account.totalStamps + quantity,
    };
    s.activity.unshift({
      id: requestId,
      kind: 'stamp',
      drink: MENU.includes(drink as (typeof MENU)[number]) ? drink : 'Caffè Latte',
      stamps: quantity,
      cycle: s.account.cycle,
      createdAt: new Date().toISOString(),
    });
    s.processedRequests = [requestId, ...s.processedRequests].slice(0, 50);
    s.lastStampAt = Date.now();
    save(s);
    return staffView(s);
  }

  async staffRedeemReward(memberCode: string, drink: string, requestId: string) {
    await delay(400);
    const s = findCustomer(memberCode);
    if (s.processedRequests.includes(requestId)) return staffView(s);
    if (s.account.stamps < STAMPS_PER_REWARD) throw new LoyaltyError('REWARD_LOCKED');
    s.activity.unshift({
      id: requestId,
      kind: 'redemption',
      drink: MENU.includes(drink as (typeof MENU)[number]) ? drink : 'Caffè Latte',
      stamps: 0,
      cycle: s.account.cycle,
      createdAt: new Date().toISOString(),
    });
    s.account = {
      ...s.account,
      stamps: 0,
      cycle: s.account.cycle + 1,
      totalRedeemed: s.account.totalRedeemed + 1,
    };
    s.processedRequests = [requestId, ...s.processedRequests].slice(0, 50);
    save(s);
    return staffView(s);
  }
}
